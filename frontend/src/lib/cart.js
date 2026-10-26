import { useCallback, useEffect, useState } from 'react'
import { emptyCart } from './order.js'

const cartKey = (shopId) => `localkart_cart_${shopId}`
const PROFILE_KEY = 'localkart_customer' // name + address, remembered on this device only

function load(shopId) {
  try {
    const saved = JSON.parse(localStorage.getItem(cartKey(shopId)))
    const profile = JSON.parse(localStorage.getItem(PROFILE_KEY)) || {}
    return { ...emptyCart(), name: profile.name || '', address: profile.address || '', ...(saved || {}) }
  } catch {
    return emptyCart()
  }
}

/** One cart per shop, kept in this browser so a refresh doesn't lose it. */
export function useCart(shopId) {
  const [cart, setCart] = useState(() => load(shopId))
  const [loadedFor, setLoadedFor] = useState(shopId)
  if (loadedFor !== shopId) { setLoadedFor(shopId); setCart(load(shopId)) }

  useEffect(() => {
    try {
      if (Object.keys(cart.items).length) localStorage.setItem(cartKey(shopId), JSON.stringify(cart))
      else localStorage.removeItem(cartKey(shopId))
      localStorage.setItem(PROFILE_KEY, JSON.stringify({ name: cart.name, address: cart.address }))
    } catch { /* storage unavailable: cart still works for this visit */ }
  }, [cart, shopId])

  const clear = useCallback(() => setCart((c) => ({ ...emptyCart(), name: c.name, address: c.address })), [])
  return [cart, setCart, clear]
}
