import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'

/** Secrets (the login token) go to the device keychain; SecureStore has no web support, so web falls back to AsyncStorage. */
export const secure = {
  get: (key) => (Platform.OS === 'web' ? AsyncStorage.getItem(key) : SecureStore.getItemAsync(key)),
  set: (key, value) => (Platform.OS === 'web' ? AsyncStorage.setItem(key, value) : SecureStore.setItemAsync(key, value)),
  remove: (key) => (Platform.OS === 'web' ? AsyncStorage.removeItem(key) : SecureStore.deleteItemAsync(key)),
}

export const prefs = {
  async get(key) {
    try { return JSON.parse(await AsyncStorage.getItem(key)) } catch { return null }
  },
  set: (key, value) => AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {}),
}
