import { useMemo } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import LeafletMap from '../../components/LeafletMap'
import { toMapShops } from '../../components/mapHtml.js'
import { CategoryIcon, OpenBadge } from '../../components/shopBits.jsx'
import { Button, EmptyState } from '../../components/ui.jsx'
import LocationPill from '../../components/LocationPill.jsx'
import { useCustomerLocation, formatDistance } from '../../lib/location.jsx'
import { useNearby } from '../../lib/nearby.jsx'
import { colors, radius, shadow, type } from '../../lib/theme.js'

export default function MapScreen() {
  const insets = useSafeAreaInsets()
  const { location } = useCustomerLocation()
  const { shops, radiusKm, q, category } = useNearby()
  const data = useMemo(() => ({ center: location, radiusKm, shops: toMapShops(shops) }), [location, radiusKm, shops])

  if (!location) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 16, paddingTop: insets.top }}>
        <EmptyState icon="map-outline" title="Set your location to see the map" action={<Button icon="search" title="Set location" onPress={() => router.push('/location')} />} />
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <LeafletMap data={data} onSelect={(id) => router.push(`/shop/${id}`)} style={{ flex: 1, borderRadius: 0 }} />
      <View style={[styles.top, { top: insets.top + 10 }]} pointerEvents="box-none">
        <LocationPill />
        <View style={styles.count}>
          <Text style={{ fontWeight: '700', color: colors.text }}>{shops.length} shops within {radiusKm} km</Text>
          {(q || category) ? <Text style={type.small}>{[q && `"${q}"`, category].filter(Boolean).join(' · ')} · change on Shops tab</Text> : null}
        </View>
      </View>
      {shops.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.strip} contentContainerStyle={{ gap: 10, paddingHorizontal: 12 }}>
          {shops.map((s, i) => (
            <Pressable key={s._id} onPress={() => router.push(`/shop/${s._id}`)} style={({ pressed }) => [styles.mini, pressed && { opacity: 0.9 }]}>
              <CategoryIcon category={s.category} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: colors.text }} numberOfLines={1}>{i + 1}. {s.shopName}</Text>
                <Text style={type.small}>{formatDistance(s.distanceKm)} · {s.category}</Text>
                <OpenBadge open={s.isOpen} />
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  top: { position: 'absolute', left: 12, right: 12, gap: 8 },
  count: { alignSelf: 'flex-start', backgroundColor: colors.card, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 8, ...shadow },
  strip: { position: 'absolute', bottom: 12, left: 0, right: 0 },
  mini: { width: 250, flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, padding: 10, ...shadow },
})
