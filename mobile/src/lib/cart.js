import { useCallback, useEffect, useRef, useState } from 'react'
import { prefs } from './storage.js'
import { emptyCart } from './order.js'

const cartKey = (shopId) => `localkart_cart_${shopId}`
const PROFILE_KEY = 'localkart_customer' // name + address, kept on this phone only

/** One cart per shop, saved on the phone so closing the app doesn't lose it. */
export function useCart(shopId) {
  const [cart, setCart] = useState(emptyCart)
  const loaded = useRef(false)

  useEffect(() => {
    let alive = true
    loaded.current = false
    Promise.all([prefs.get(cartKey(shopId)), prefs.get(PROFILE_KEY)]).then(([saved, profile]) => {
      if (!alive) return
      setCart({ ...emptyCart(), name: profile?.name || '', address: profile?.address || '', ...(saved || {}) })
      loaded.current = true
    })
    return () => { alive = false }
  }, [shopId])

  useEffect(() => {
    if (!loaded.current) return
    prefs.set(cartKey(shopId), Object.keys(cart.items).length ? cart : null)
    prefs.set(PROFILE_KEY, { name: cart.name, address: cart.address })
  }, [cart, shopId])

  const clear = useCallback(() => setCart((c) => ({ ...emptyCart(), name: c.name, address: c.address })), [])
  return [cart, setCart, clear]
}
