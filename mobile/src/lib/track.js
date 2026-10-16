import { Platform } from 'react-native'
import { API_URL, getApiToken } from './api.js'
import { prefs } from './storage.js'

const VISITOR_KEY = 'localkart_visitor'
const SOURCE = Platform.OS === 'ios' ? 'IOS' : Platform.OS === 'android' ? 'ANDROID' : 'WEB'
let visitor = null

/** Random id kept on this device, so repeat taps count once. It identifies a device, not a person. */
async function visitorId() {
  if (visitor) return visitor
  visitor = await prefs.get(VISITOR_KEY)
  if (!visitor) {
    visitor = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
    })
    prefs.set(VISITOR_KEY, visitor)
  }
  return visitor
}

/** The logged-in owner's shop id (the token's subject), so owners don't inflate their own numbers. */
function ownShopId() {
  try {
    const token = getApiToken()
    if (!token || typeof atob !== 'function') return null
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(payload + '==='.slice((payload.length + 3) % 4))).sub
  } catch {
    return null
  }
}

const recent = new Map()

/**
 * Reports a customer action on a shop: 'VIEW' | 'CALL' | 'WHATSAPP' | 'DIRECTIONS'.
 * Fire-and-forget: never blocks the call/WhatsApp action and never shows errors.
 */
export async function track(shopId, type) {
  if (!shopId || shopId === ownShopId()) return
  const key = `${shopId}|${type}`
  const now = Date.now()
  if (now - (recent.get(key) || 0) < 3000) return // double taps; the API dedupes longer windows
  recent.set(key, now)
  try {
    await fetch(`${API_URL}/shops/${encodeURIComponent(shopId)}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, source: SOURCE, visitorId: await visitorId() }),
    })
  } catch {
    // tracking must never break the app
  }
}
