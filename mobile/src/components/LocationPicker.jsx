import { useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import LeafletMap from './LeafletMap'
import { Button, Field } from './ui.jsx'
import { colors, radius, type } from '../lib/theme.js'
import { DEFAULT_CENTER, formatCoords, getDevicePosition, placeName, searchPlaces } from '../lib/location.jsx'

/** Search box + "use my location" + tappable map with a draggable pin. */
export default function LocationPicker({ value, onChange, radiusKm = 0, height = 300 }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [error, setError] = useState('')
  const [named, setNamed] = useState({ key: null, name: null })
  const timer = useRef()

  useEffect(() => {
    clearTimeout(timer.current)
    if (query.trim().length < 3) return
    timer.current = setTimeout(() => {
      setSearching(true)
      searchPlaces(query, value || DEFAULT_CENTER).then(setResults).catch(() => setResults([])).finally(() => setSearching(false))
    }, 450)
    return () => clearTimeout(timer.current)
  }, [query, value])

  const valueKey = value ? `${value.lat},${value.lng}` : null
  useEffect(() => {
    if (!value) return
    let alive = true
    placeName(value).then((n) => alive && setNamed({ key: `${value.lat},${value.lng}`, name: n }))
    return () => { alive = false }
  }, [value])
  const name = named.key === valueKey ? named.name : null
  const visibleResults = query.trim().length >= 3 ? results : []

  const detect = async () => {
    setDetecting(true)
    setError('')
    try { onChange(await getDevicePosition()) } catch (e) { setError(e.message) } finally { setDetecting(false) }
  }

  const mapData = useMemo(() => ({ picker: true, pin: value, center: value || DEFAULT_CENTER, radiusKm }), [value, radiusKm])

  return (
    <View style={{ gap: 10 }}>
      <Field
        placeholder="Search area, street or landmark"
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        returnKeyType="search"
        right={searching ? <ActivityIndicator color={colors.primary} /> : query ? <Ionicons name="close-circle" size={20} color={colors.textFaint} onPress={() => setQuery('')} /> : <Ionicons name="search" size={20} color={colors.textFaint} />}
      />
      {visibleResults.length > 0 && (
        <View style={styles.results}>
          {visibleResults.map((r, i) => (
            <Pressable key={`${r.lat},${r.lng},${i}`} style={({ pressed }) => [styles.result, pressed && { backgroundColor: colors.primarySoft }]}
              onPress={() => { onChange({ lat: r.lat, lng: r.lng }); setQuery(''); setResults([]) }}>
              <Ionicons name="location-outline" size={18} color={colors.textMuted} />
              <Text style={{ flex: 1, color: colors.text }} numberOfLines={2}>{r.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
      <Button variant="outline" icon="locate" title={detecting ? 'Finding you…' : 'Use my current location'} loading={detecting} onPress={detect} />
      {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
      <LeafletMap data={mapData} onPick={onChange} style={{ height }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name={value ? 'location' : 'hand-left-outline'} size={16} color={value ? colors.primary : colors.textMuted} />
        <Text style={[type.muted, { flex: 1 }]}>
          {value ? <><Text style={{ fontWeight: '700', color: colors.text }}>{name || formatCoords(value)}</Text> · tap the map or drag the pin to adjust</> : 'Search above, or tap the map to drop a pin'}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  results: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.card, overflow: 'hidden' },
  result: { flexDirection: 'row', gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border, alignItems: 'center' },
})
