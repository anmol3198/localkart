import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import * as Location from 'expo-location'
import { prefs } from './storage.js'

const KEY = 'localkart_location'
const NOMINATIM = 'https://nominatim.openstreetmap.org'
// Used to centre maps before the user shares a location.
export const DEFAULT_CENTER = { lat: 12.9352, lng: 77.6245 }

/** Asks for permission and returns { lat, lng }, or throws a friendly error. */
export async function getDevicePosition() {
  const { status } = await Location.requestForegroundPermissionsAsync()
  if (status !== 'granted') throw new Error('Location permission was not given. You can search for your area instead.')
  try {
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
    return { lat: pos.coords.latitude, lng: pos.coords.longitude }
  } catch {
    const last = await Location.getLastKnownPositionAsync()
    if (last) return { lat: last.coords.latitude, lng: last.coords.longitude }
    throw new Error('Could not get your location. Please search for your area.')
  }
}

const placeCache = new Map()

/** Short area name like "Koramangala, Bengaluru" for a point (OpenStreetMap reverse geocoding). */
export async function placeName(point) {
  const key = `${point.lat.toFixed(4)},${point.lng.toFixed(4)}`
  if (placeCache.has(key)) return placeCache.get(key)
  try {
    const res = await fetch(`${NOMINATIM}/reverse?format=jsonv2&zoom=16&lat=${point.lat}&lon=${point.lng}`, { headers: { 'Accept-Language': 'en' } })
    const d = await res.json()
    const a = d.address || {}
    const area = a.neighbourhood || a.suburb || a.quarter || a.village || a.road
    const city = a.city || a.town || a.state_district || a.county
    const name = [area, city].filter(Boolean).join(', ') || d.name || null
    placeCache.set(key, name)
    return name
  } catch {
    return null
  }
}

/** Search areas / addresses by name. Returns [{ label, lat, lng }]. */
export async function searchPlaces(query, near = DEFAULT_CENTER) {
  const d = 0.5 // ~50 km box around `near` so local results come first
  const viewbox = [near.lng - d, near.lat + d, near.lng + d, near.lat - d].join(',')
  const res = await fetch(`${NOMINATIM}/search?format=jsonv2&limit=6&countrycodes=in&viewbox=${viewbox}&q=${encodeURIComponent(query)}`, { headers: { 'Accept-Language': 'en' } })
  const list = await res.json()
  return list.map((p) => ({ label: p.display_name, lat: Number(p.lat), lng: Number(p.lon) }))
}

const LocationContext = createContext(null)

/** Customer's location: remembered on the device, auto-detected on first launch. */
export function LocationProvider({ children }) {
  const [location, setLocationState] = useState(null)
  const [named, setNamed] = useState({ key: null, name: null })
  const [ready, setReady] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [error, setError] = useState('')

  const setLocation = useCallback((loc) => {
    setLocationState(loc)
    setError('')
    prefs.set(KEY, loc)
  }, [])

  const detect = useCallback(async () => {
    setDetecting(true)
    setError('')
    try {
      const loc = await getDevicePosition()
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
    prefs.get(KEY).then((saved) => {
      if (saved) setLocationState(saved)
      else detect()
    }).finally(() => setReady(true))
  }, [detect])

  const locationKey = location ? `${location.lat},${location.lng}` : null
  useEffect(() => {
    if (!location) return
    let alive = true
    placeName(location).then((n) => alive && setNamed({ key: `${location.lat},${location.lng}`, name: n }))
    return () => { alive = false }
  }, [location])
  const name = named.key === locationKey ? named.name : null

  return (
    <LocationContext.Provider value={{ location, name, ready, detecting, error, setLocation, detect }}>
      {children}
    </LocationContext.Provider>
  )
}

export const useCustomerLocation = () => useContext(LocationContext)

export const formatDistance = (km) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`)
export const formatCoords = (p) => `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`
export const directionsUrl = (lat, lng) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
