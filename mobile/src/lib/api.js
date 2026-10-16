import { Platform } from 'react-native'
import Constants from 'expo-constants'

/**
 * API base URL. Set EXPO_PUBLIC_API_URL for real deployments (e.g. https://localkart-api.onrender.com/api).
 * In development the app talks to the backend on the same computer that runs `expo start`,
 * so a phone with Expo Go on the same Wi-Fi works without any setup.
 */
function resolveBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '')
  if (Platform.OS === 'web') return 'http://localhost:5050/api'
  const host = Constants.expoConfig?.hostUri?.split(':')[0]
  if (host) return `http://${host}:5050/api`
  return Platform.OS === 'android' ? 'http://10.0.2.2:5050/api' : 'http://localhost:5050/api'
}

export const API_URL = resolveBaseUrl()

let token = null
export const setApiToken = (t) => { token = t }
export const getApiToken = () => token

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

async function request(method, path, { params, body } = {}) {
  const query = params
    ? '?' + Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
    : ''
  let res
  try {
    res = await fetch(`${API_URL}${path}${query}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Cannot reach LocalKart. Check your internet connection.', 0)
  }
  const text = await res.text()
  let data = null
  try { data = text ? JSON.parse(text) : null } catch { data = null }
  if (!res.ok) throw new ApiError(data?.message || `Something went wrong (${res.status})`, res.status)
  return data
}

const api = {
  get: (path, params) => request('GET', path, { params }),
  post: (path, body) => request('POST', path, { body }),
  put: (path, body) => request('PUT', path, { body }),
  del: (path) => request('DELETE', path),
}

export default api
