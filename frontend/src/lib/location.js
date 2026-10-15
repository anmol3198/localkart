import { useCallback, useEffect, useState } from 'react'

const KEY = 'localkart_location'
// Used to centre maps before the user shares a location.
export const DEFAULT_CENTER = { lat: 12.9352, lng: 77.6245 }
const NOMINATIM = 'https://nominatim.openstreetmap.org'

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Location is not supported by this browser'))
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error('Could not get your location. Please pick it on the map.')),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  })
}

/** Customer's location: remembered in localStorage, auto-detected on first visit. */
export function useCustomerLocation() {
  const [location, setLocationState] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY)) } catch { return null }
  })
  const [error, setError] = useState('')
  const [detecting, setDetecting] = useState(false)

  const setLocation = useCallback((loc) => {
    localStorage.setItem(KEY, JSON.stringify(loc))
    setLocationState(loc)
    setError('')
  }, [])

  const detect = useCallback(async () => {
    setDetecting(true)
    try {
      const loc = await getCurrentPosition()
      setLocation(loc)
      return loc
    } catch (e) {
      setError(e.message)
      return null
    } finally {
      setDetecting(false)
    }
  }, [setLocation])

  useEffect(() => {
    if (!location) detect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { location, setLocation, detect, detecting, error }
}

const placeCache = new Map()

/** Human-readable area name for a point (OpenStreetMap reverse geocoding), or null while loading / on failure. */
export function usePlaceName(point) {
  const key = point ? `${point.lat.toFixed(4)},${point.lng.toFixed(4)}` : null
  const [names, setNames] = useState({})

  useEffect(() => {
    if (!key || placeCache.has(key)) return
    const ctrl = new AbortController()
    const [lat, lng] = key.split(',')
    fetch(`${NOMINATIM}/reverse?format=jsonv2&zoom=16&lat=${lat}&lon=${lng}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => {
        const a = d.address || {}
        const area = a.neighbourhood || a.suburb || a.quarter || a.village || a.road
        const city = a.city || a.town || a.state_district || a.county
        const name = [area, city].filter(Boolean).join(', ') || d.name || null
        placeCache.set(key, name)
        setNames((n) => ({ ...n, [key]: name }))
      })
      .catch(() => {})
    return () => ctrl.abort()
  }, [key])

  return key ? (placeCache.get(key) ?? names[key] ?? null) : null
}

/** Search areas / addresses by name. Returns [{ label, lat, lng }]. */
export async function searchPlaces(query, near = DEFAULT_CENTER, signal) {
  const d = 0.5 // ~50 km box around `near` so local results come first
  const viewbox = [near.lng - d, near.lat + d, near.lng + d, near.lat - d].join(',')
  const res = await fetch(
    `${NOMINATIM}/search?format=jsonv2&limit=6&countrycodes=in&viewbox=${viewbox}&q=${encodeURIComponent(query)}`,
    { signal },
  )
  const list = await res.json()
  return list.map((p) => ({ label: p.display_name, lat: Number(p.lat), lng: Number(p.lon) }))
}

export const formatDistance = (km) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`)
export const formatCoords = (p) => `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`
export const directionsUrl = (lat, lng) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
