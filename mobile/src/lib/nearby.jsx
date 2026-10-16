import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api from './api.js'
import { useCustomerLocation } from './location.jsx'
import { DEFAULT_CATEGORIES } from './categories.js'

const NearbyContext = createContext(null)

function useDebounced(value, ms = 350) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

/** Search + filters + results for nearby shops, shared by the list and map tabs. */
export function NearbyProvider({ children }) {
  const { location } = useCustomerLocation()
  const [meta, setMeta] = useState({ maxRadiusKm: 5, categories: DEFAULT_CATEGORIES })
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [deliveryOnly, setDeliveryOnly] = useState(false)
  const [openOnly, setOpenOnly] = useState(false)
  const [result, setResult] = useState(null)
  const [doneKey, setDoneKey] = useState(null)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const q = useDebounced(search.trim())

  useEffect(() => {
    api.get('/meta').then(setMeta).catch(() => {})
  }, [])

  // A search is "loading" until the response for exactly these inputs has arrived.
  const requestKey = location ? JSON.stringify([location.lat, location.lng, q, category, deliveryOnly, reloadKey]) : null
  const loading = requestKey !== null && requestKey !== doneKey

  useEffect(() => {
    if (!location) return
    let cancelled = false
    const key = JSON.stringify([location.lat, location.lng, q, category, deliveryOnly, reloadKey])
    api.get('/shops/nearby', { lat: location.lat, lng: location.lng, q, category, delivery: deliveryOnly || undefined })
      .then((data) => { if (!cancelled) { setResult(data); setError('') } })
      .catch((e) => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setDoneKey(key) })
    return () => { cancelled = true }
  }, [location, q, category, deliveryOnly, reloadKey])

  const refresh = useCallback(() => setReloadKey((k) => k + 1), [])
  const clearFilters = useCallback(() => { setSearch(''); setCategory(''); setDeliveryOnly(false); setOpenOnly(false) }, [])
  const shops = useMemo(() => (result?.shops ?? []).filter((s) => !openOnly || s.isOpen), [result, openOnly])

  const value = {
    meta, search, setSearch, q, category, setCategory, deliveryOnly, setDeliveryOnly, openOnly, setOpenOnly,
    result, shops, loading, error, refresh, clearFilters,
    radiusKm: result?.radiusKm ?? meta.maxRadiusKm,
    hasFilters: Boolean(q || category || deliveryOnly || openOnly),
  }
  return <NearbyContext.Provider value={value}>{children}</NearbyContext.Provider>
}

export const useNearby = () => useContext(NearbyContext)
