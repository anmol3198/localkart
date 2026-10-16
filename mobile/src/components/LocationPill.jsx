import { Pressable, StyleSheet, Text } from 'react-native'
import { router } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useCustomerLocation, formatCoords } from '../lib/location.jsx'
import { colors, radius } from '../lib/theme.js'

/** Shows the customer's area ("Koramangala, Bengaluru · Change") and opens the location picker. */
export default function LocationPill({ light }) {
  const { location, name, detecting } = useCustomerLocation()
  const fg = light ? '#fff' : colors.text
  return (
    <Pressable onPress={() => router.push('/location')} accessibilityRole="button" accessibilityLabel="Change location"
      style={[styles.pill, { backgroundColor: light ? 'rgba(255,255,255,0.14)' : colors.card, borderColor: light ? 'transparent' : colors.border }]}>
      <Ionicons name="location" size={16} color={light ? '#fff' : colors.primary} />
      <Text style={{ color: fg, fontWeight: '700', flexShrink: 1 }} numberOfLines={1}>
        {location ? name || formatCoords(location) : detecting ? 'Finding your location…' : 'Set your location'}
      </Text>
      <Text style={{ color: light ? colors.accentLight : colors.primary, fontWeight: '800' }}>{location ? 'Change' : ''}</Text>
      <Ionicons name="chevron-down" size={14} color={fg} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', maxWidth: '100%', paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1 },
})
