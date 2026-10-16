import { TOKEN_KEY } from './api.js'

const VISITOR_KEY = 'localkart_visitor'
const BASE = import.meta.env.VITE_API_URL || '/api'

/** Random id kept in this browser, so repeat taps count once. It identifies a device, not a person. */
function visitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY)
    if (!id) {
      id = crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
      localStorage.setItem(VISITOR_KEY, id)
    }
    return id
  } catch {
    return undefined
  }
}

/** The logged-in owner's shop id (the token's subject), so owners don't inflate their own numbers. */
function ownShopId() {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return null
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(payload)).sub
  } catch {
    return null
  }
}

/**
 * Reports a customer action on a shop: 'VIEW' | 'CALL' | 'WHATSAPP' | 'DIRECTIONS'.
 * Fire-and-forget: it never blocks the call/WhatsApp link and never shows errors.
 */
const recent = new Map()

export function track(shopId, type) {
  if (!shopId || shopId === ownShopId()) return
  // Drop instant repeats (double taps, effects that run twice); the API dedupes longer windows.
  const key = `${shopId}|${type}`
  const now = Date.now()
  if (now - (recent.get(key) || 0) < 3000) return
  recent.set(key, now)
  try {
    fetch(`${BASE}/shops/${encodeURIComponent(shopId)}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, source: 'WEB', visitorId: visitorId() }),
      keepalive: true, // still delivered when the tap navigates away (tel:, wa.me)
    }).catch(() => {})
  } catch {
    // tracking must never break the page
  }
}
