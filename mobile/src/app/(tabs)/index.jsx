import { useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import ShopCard from '../../components/ShopCard.jsx'
import LocationPill from '../../components/LocationPill.jsx'
import { Banner, Button, Card, Chip, EmptyState } from '../../components/ui.jsx'
import { useCustomerLocation } from '../../lib/location.jsx'
import { useNearby } from '../../lib/nearby.jsx'
import { categoryStyle } from '../../lib/categories.js'
import { colors, radius, type } from '../../lib/theme.js'

const SUGGESTIONS = ['Milk', 'Bread', 'Eggs', 'Rice', 'Paracetamol', 'Vegetables']
const STEPS = [
  ['navigate-circle-outline', 'Share your location', 'We only show shops within 5 km of you.'],
  ['cube-outline', 'See what is in stock', 'Search an item and see which shops have it, with prices.'],
  ['call-outline', 'Call or WhatsApp to order', 'Talk to the shop directly. Pick up, or get it delivered.'],
]

function Hero() {
  const insets = useSafeAreaInsets()
  const { location } = useCustomerLocation()
  const { search, setSearch, meta, loading, q } = useNearby()
  return (
    <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
      <View style={styles.blob} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={styles.logo}><Ionicons name="storefront" size={18} color="#fff" /></View>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>Local<Text style={{ color: colors.accentLight }}>Kart</Text></Text>
        </View>
      </View>
      <LocationPill light />
      <Text style={styles.heroTitle}>Everything you need, from shops <Text style={{ color: colors.accentLight }}>around the corner</Text></Text>
      <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, marginTop: 6 }}>See what shops within {meta.maxRadiusKm} km have in stock, then call to order.</Text>
      <View style={[styles.search, !location && { opacity: 0.6 }]}>
        <Ionicons name="search" size={20} color={colors.primary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search milk, rice, medicines, shops"
          placeholderTextColor={colors.textFaint}
          value={search}
          onChangeText={setSearch}
          editable={Boolean(location)}
          returnKeyType="search"
          autoCorrect={false}
        />
        {loading && q ? <ActivityIndicator color={colors.primary} /> : search ? (
          <Pressable onPress={() => setSearch('')} accessibilityLabel="Clear search" hitSlop={8}><Ionicons name="close-circle" size={20} color={colors.textFaint} /></Pressable>
        ) : null}
      </View>
      {location && !search && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 12 }} keyboardShouldPersistTaps="handled">
          {SUGGESTIONS.map((s) => (
            <Pressable key={s} onPress={() => setSearch(s)} style={styles.suggestion}><Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>{s}</Text></Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  )
}

function Filters() {
  const { meta, category, setCategory, deliveryOnly, setDeliveryOnly, openOnly, setOpenOnly, shops, loading, result, radiusKm, q, error, refresh } = useNearby()
  return (
    <View style={{ gap: 12, paddingTop: 16, paddingBottom: 4 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        <Chip label="All shops" icon="storefront-outline" selected={!category} onPress={() => setCategory('')} />
        {meta.categories.map((c) => (
          <Chip key={c} label={c} iconSet={MaterialCommunityIcons} icon={categoryStyle(c).icon} selected={category === c} onPress={() => setCategory(category === c ? '' : c)} />
        ))}
      </ScrollView>
      <View style={{ paddingHorizontal: 16, gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip label="Home delivery" icon="bicycle" selected={deliveryOnly} onPress={() => setDeliveryOnly(!deliveryOnly)} />
          <Chip label="Open now" icon="time-outline" selected={openOnly} onPress={() => setOpenOnly(!openOnly)} />
        </View>
        <View>
          <Text style={type.h2}>{loading && !result ? 'Looking for shops…' : `${shops.length} ${shops.length === 1 ? 'shop' : 'shops'} near you`}</Text>
          <Text style={type.muted}>Within {radiusKm} km{q ? ` · matching "${q}"` : ''}{category ? ` · ${category}` : ''} · nearest first</Text>
        </View>
        {error ? <Banner kind="error" action={<Text onPress={refresh} style={{ color: colors.danger, fontWeight: '800' }}>Retry</Text>}>{error}</Banner> : null}
      </View>
    </View>
  )
}

function NoLocation() {
  const { detect, detecting, error } = useCustomerLocation()
  return (
    <View style={{ padding: 16, gap: 16 }}>
      <Card>
        <EmptyState
          icon="locate"
          title={detecting ? 'Finding your location…' : 'Where should we look for shops?'}
          message={error || 'Allow location access so we can show shops near you. We never share your location with shops.'}
          action={!detecting && (
            <View style={{ gap: 10, alignSelf: 'stretch', marginTop: 6 }}>
              <Button icon="locate" title="Use my current location" onPress={detect} size="lg" />
              <Button variant="outline" icon="search" title="Search for my area" onPress={() => router.push('/location')} size="lg" />
            </View>
          )}
        />
      </Card>
      {STEPS.map(([icon, title, text], i) => (
        <Card key={title} style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <View style={styles.step}><Ionicons name={icon} size={22} color="#3b2300" /></View>
          <View style={{ flex: 1 }}>
            <Text style={type.small}>STEP {i + 1}</Text>
            <Text style={type.h3}>{title}</Text>
            <Text style={type.muted}>{text}</Text>
          </View>
        </Card>
      ))}
    </View>
  )
}

export default function ExploreScreen() {
  const { location } = useCustomerLocation()
  const { shops, loading, result, refresh, hasFilters, clearFilters, q, category } = useNearby()
  const [pulling, setPulling] = useState(false)

  const onRefresh = () => { setPulling(true); refresh(); setTimeout(() => setPulling(false), 800) }

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.bg }}
      data={location ? shops : []}
      keyExtractor={(s) => s._id}
      renderItem={({ item }) => <View style={{ paddingHorizontal: 16 }}><ShopCard shop={item} /></View>}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      ListHeaderComponent={<><Hero />{location ? <Filters /> : <NoLocation />}<View style={{ height: 12 }} /></>}
      ListEmptyComponent={location && (
        loading && !result ? <ActivityIndicator style={{ marginTop: 32 }} color={colors.primary} size="large" /> : result ? (
          <View style={{ paddingHorizontal: 16 }}>
            <Card>
              <EmptyState
                title={q ? `No ${category ? `${category} ` : ''}shops nearby have "${q}"` : 'No shops match these filters'}
                message="Try a different word, remove a filter, or change your location."
                action={hasFilters && <Button variant="outline" title="Clear search & filters" onPress={clearFilters} />}
              />
            </Card>
          </View>
        ) : null
      )}
      contentContainerStyle={{ paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      refreshControl={location ? <RefreshControl refreshing={pulling} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} /> : undefined}
    />
  )
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingBottom: 22, overflow: 'hidden', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  blob: { position: 'absolute', right: -70, top: -50, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.07)' },
  logo: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginTop: 16, lineHeight: 34 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: radius.md, paddingHorizontal: 14, height: 52, marginTop: 18 },
  searchInput: { flex: 1, fontSize: 16, color: colors.text, outlineStyle: 'none' },
  suggestion: { backgroundColor: 'rgba(255,255,255,0.16)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill },
  step: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
})
