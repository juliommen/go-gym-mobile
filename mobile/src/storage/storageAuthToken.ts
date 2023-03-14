import AsyncStorage from '@react-native-async-storage/async-storage'

import { TOKEN_STORAGE_KEY } from '@storage/storageConfig'

type StorageAuthTokenProps = {
  token: string
  refresh_token: string
}

export async function storageSaveAuthToken({
  token,
  refresh_token,
}: StorageAuthTokenProps) {
  await AsyncStorage.setItem(
    TOKEN_STORAGE_KEY,
    JSON.stringify({ token, refresh_token }),
  )
}

export async function storageGetAuthToken() {
  const response = await AsyncStorage.getItem(TOKEN_STORAGE_KEY)

  const { token, refresh_token }: StorageAuthTokenProps = response
    ? JSON.parse(response)
    : {}

  return { token, refresh_token }
}

export async function storageRemoveAuthToken() {
  await AsyncStorage.removeItem(TOKEN_STORAGE_KEY)
}
