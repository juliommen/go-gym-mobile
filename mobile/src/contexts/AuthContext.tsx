import { createContext, ReactNode, useEffect, useState } from 'react'

import {
  storageSaveAuthToken,
  storageGetAuthToken,
  storageRemoveAuthToken,
} from '@storage/storageAuthToken'
import {
  storageGetUser,
  storageRemoveUser,
  storageSaveUser,
} from '@storage/storageUser'

import { api } from '@services/api'
import { UserDTO } from '@dtos/UserDTO'

export type AuthContextDataProps = {
  user: UserDTO
  singIn: (email: string, password: string) => Promise<void>
  updateUserProfile: (userUpdated: UserDTO) => Promise<void>
  signOut: () => Promise<void>
  isUserDataOnStorageLoading: boolean
}

type AuthContextProviderProps = {
  children: ReactNode
}

export const AuthContext = createContext<AuthContextDataProps>(
  {} as AuthContextDataProps,
)

export function AuthContextProvider({ children }: AuthContextProviderProps) {
  const [user, setUser] = useState<UserDTO>({} as UserDTO)
  const [isUserDataOnStorageLoading, setIsUserDataOnStorageLoading] =
    useState(true)

  async function updateUserStateAndTokenOnHttpAuthHeaders(
    userData: UserDTO,
    token: string,
  ) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`

    setUser(userData)
  }

  async function saveUserAndTokenOnStorage(
    userData: UserDTO,
    token: string,
    refresh_token: string,
  ) {
    setIsUserDataOnStorageLoading(true)
    await storageSaveUser(userData)
    await storageSaveAuthToken({ token, refresh_token })

    setIsUserDataOnStorageLoading(false)
  }

  async function singIn(email: string, password: string) {
    const { data } = await api.post('/sessions', { email, password })

    if (data.user && data.token && data.refresh_token) {
      await saveUserAndTokenOnStorage(data.user, data.token, data.refresh_token)
      updateUserStateAndTokenOnHttpAuthHeaders(data.user, data.token)
    }

    setIsUserDataOnStorageLoading(false)
  }

  async function signOut() {
    setIsUserDataOnStorageLoading(true)
    setUser({} as UserDTO)
    await storageRemoveUser()
    await storageRemoveAuthToken()

    setIsUserDataOnStorageLoading(false)
  }

  async function updateUserProfile(userUpdated: UserDTO) {
    setUser(userUpdated)
    await storageSaveUser(userUpdated)
  }

  async function loadUserData() {
    setIsUserDataOnStorageLoading(true)

    const userLogged = await storageGetUser()
    const { token } = await storageGetAuthToken()

    if (token && userLogged) {
      updateUserStateAndTokenOnHttpAuthHeaders(userLogged, token)
    }

    setIsUserDataOnStorageLoading(false)
  }

  useEffect(() => {
    loadUserData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const subscribe = api.registerInterceptTokenManager(signOut)

    return () => {
      subscribe()
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        singIn,
        updateUserProfile,
        signOut,
        isUserDataOnStorageLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
