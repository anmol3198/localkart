import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Linking, Pressable, ScrollView, Share, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import { Stack, router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Clipboard from 'expo-clipboard'
import Ionicons from '@expo/vector-icons/Ionicons'
import api from '../../lib/api.js'
import { directionsUrl, formatDistance, useCustomerLocation } from '../../lib/location.jsx'
import { categoryStyle } from '../../lib/categories.js'
import { colors, radius, type } from '../../lib/theme.js'
import { useToast } from '../../lib/toast.jsx'
import { track } from '../../lib/track.js'
import { formatPhone } from '../../lib/validation.js'
import { useCart } from '../../lib/cart.js'
import { addItem, money, setQty } from '../../lib/order.js'
import OrderSheet, { CartBar } from '../../components/OrderSheet.jsx'
import QtyStepper from '../../components/QtyStepper.jsx'
import { Banner, Button, Card, Chip, EmptyState, IconButton } from '../../components/ui.jsx'
import { CallButtons, CategoryIcon, DeliveryTag, OpenBadge } from '../../components/shopBits.jsx'

function InfoRow({ icon, children, action, last }) {
  return (
    <View style={[styles.info, !last && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <Ionicons name={icon} size={20} color={colors.textMuted} />
      <View style={{ flex: 1 }}>{children}</View>
      {action}
    </View>
  )
}

export default function ShopScreen() {
  const { id } = useLocalSearchParams()
  const insets = useSafeAreaInsets()
  const notify = useToast()
  const { location } = useCustomerLocation()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [cart, setCart, clearCart] = useCart(id)
  const [cartOpen, setCartOpen] = useState(false)
  const inCart = Object.keys(cart.items).length > 0

  useEffect(() => { track(id, 'VIEW') }, [id])

  useEffect(() => {
    api.get(`/shops/${id}`, location || {}).then(setData).catch((e) => setError(e.message))
  }, [id, location])

  const grouped = useMemo(() => {
    const f = filter.trim().toLowerCase()
    const groups = {}
    for (const p of data?.products ?? []) {
      if (f && !p.name.toLowerCase().includes(f) && !p.category.toLowerCase().includes(f)) continue
      if (inStockOnly && !p.inStock) continue
      ;(groups[p.category] ||= []).push(p)
    }
    return Object.entries(groups).map(([c, items]) => [c, items.sort((a, b) => Number(b.inStock) - Number(a.inStock))])
  }, [data, filter, inStockOnly])

  if (error) {
    return <EmptyState icon="storefront-outline" title="We couldn't open this shop" message={error} action={<Button title="Back to shops" onPress={() => router.back()} />} />
  }
  if (!data) return <ActivityIndicator style={{ marginTop: 48 }} size="large" color={colors.primary} />

  const { shop, products } = data
  const { color } = categoryStyle(shop.category)
  const [lng, lat] = shop.location.coordinates
  const inStock = products.filter((p) => p.inStock).length

  const share = () => Share.share({ message: `${shop.shopName} on LocalKart — ${shop.address}. Call ${shop.phone} to order.` }).catch(() => {})
  const copyPhone = async () => { await Clipboard.setStringAsync(shop.phone); notify('Phone number copied') }

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: shop.shopName, headerRight: () => <IconButton icon="share-outline" label="Share shop" color={colors.primary} onPress={share} /> }} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <View style={{ height: 70, backgroundColor: color, opacity: 0.85 }} />
          <View style={{ padding: 16, paddingTop: 0, marginTop: -30, gap: 6 }}>
            <View style={{ alignSelf: 'flex-start', backgroundColor: colors.card, borderRadius: 18, padding: 4 }}>
              <CategoryIcon category={shop.category} size={60} />
            </View>
            <Text style={type.h1}>{shop.shopName}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <OpenBadge open={shop.isOpen} />
              <Text style={type.muted}>· {shop.category}{shop.distanceKm != null ? ` · ${formatDistance(shop.distanceKm)} away` : ''}</Text>
            </View>
            {shop.description ? <Text style={[type.muted, { marginTop: 4 }]}>{shop.description}</Text> : null}
            {!shop.isOpen && <Banner kind="warning">Closed right now. You can still call to ask when they open.</Banner>}
          </View>
        </Card>

        <Card style={{ paddingVertical: 4 }}>
          <InfoRow icon="call-outline" action={<IconButton icon="copy-outline" label="Copy phone number" color={colors.primary} onPress={copyPhone} />}>
            <Text style={{ fontWeight: '700', fontSize: 16, color: colors.text }}>{formatPhone(shop.phone)}</Text>
            {shop.alternatePhone ? <Text style={type.small}>Alt: {formatPhone(shop.alternatePhone)}</Text> : null}
          </InfoRow>
          <InfoRow icon="location-outline" action={<Button size="sm" variant="ghost" icon="navigate" title="Directions" onPress={() => { track(shop._id, 'DIRECTIONS'); Linking.openURL(directionsUrl(lat, lng)) }} />}>
            <Text style={type.body}>{shop.address}</Text>
          </InfoRow>
          <InfoRow icon="time-outline"><Text style={type.body}>{shop.openingHours || 'Hours not listed'}</Text></InfoRow>
          <InfoRow icon="bicycle-outline" last>
            <View style={{ alignItems: 'flex-start', gap: 4 }}>
              <DeliveryTag shop={shop} />
              {shop.homeDelivery && (
                <Text style={type.small}>
                  Up to {shop.deliveryRadiusKm} km · {shop.minOrderAmount ? `Min ₹${shop.minOrderAmount}` : 'No minimum'} · {shop.deliveryCharge ? `₹${shop.deliveryCharge} charge` : 'Free delivery'}
                </Text>
              )}
            </View>
          </InfoRow>
        </Card>

        <Card style={{ gap: 12 }}>
          <View>
            <Text style={type.h2}>{"What's available"}</Text>
            <Text style={type.muted}>{inStock} of {products.length} items in stock · tap Add to build an order for WhatsApp</Text>
          </View>
          <View style={styles.search}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput style={{ flex: 1, fontSize: 15, color: colors.text, outlineStyle: 'none' }} placeholder="Search this shop" placeholderTextColor={colors.textFaint} value={filter} onChangeText={setFilter} />
            {filter ? <Pressable onPress={() => setFilter('')} hitSlop={8}><Ionicons name="close-circle" size={18} color={colors.textFaint} /></Pressable> : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: '600', color: colors.text }}>Only show items in stock</Text>
            <Switch value={inStockOnly} onValueChange={setInStockOnly} trackColor={{ true: colors.primary, false: '#cfd8d5' }} thumbColor="#fff" />
          </View>

          {products.length === 0 && <EmptyState icon="cube-outline" title="No items listed yet" message="Call the shop to ask what they have." />}
          {products.length > 0 && grouped.length === 0 && (
            <EmptyState title="No matching items" message="The shop might still have it — give them a call." action={<Chip label="Show all items" onPress={() => { setFilter(''); setInStockOnly(false) }} />} />
          )}
          {grouped.map(([cat, items]) => (
            <View key={cat} style={{ gap: 8 }}>
              <Text style={[type.label, { color: colors.primary, marginTop: 6 }]}>{cat}</Text>
              {items.map((p) => (
                <View key={p._id} style={[styles.item, !p.inStock && { backgroundColor: '#f1f4f3' }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '600', fontSize: 15, color: p.inStock ? colors.text : colors.textMuted }} numberOfLines={1}>{p.name}</Text>
                    {p.description ? <Text style={type.small} numberOfLines={1}>{p.description}</Text> : null}
                    {!p.inStock && <Text style={{ color: colors.danger, fontSize: 12, fontWeight: '700' }}>Out of stock</Text>}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontWeight: '800', fontSize: 16, color: p.inStock ? colors.text : colors.textMuted }}>{money(p.price)}</Text>
                    <Text style={type.small}>per {p.unit}</Text>
                  </View>
                  {p.inStock && (cart.items[p._id]
                    ? <QtyStepper qty={cart.items[p._id].qty} label={p.name} onChange={(q) => setCart(setQty(cart, p._id, q))} />
                    : <Button size="sm" variant="outline" icon="add" title="Add" onPress={() => setCart(addItem(cart, p))} />)}
                </View>
              ))}
            </View>
          ))}
        </Card>
      </ScrollView>
      {inCart ? (
        <CartBar cart={cart} shop={shop} bottom={insets.bottom} onOpen={() => setCartOpen(true)} />
      ) : (
        <View style={[styles.bottom, { paddingBottom: insets.bottom + 12 }]}>
          <CallButtons shop={shop} size="lg" />
        </View>
      )}
      <OrderSheet visible={cartOpen} onClose={() => setCartOpen(false)} cart={cart} setCart={setCart} clear={clearCart} shop={shop} location={location} onFresh={setData} />
    </View>
  )
}

const styles = StyleSheet.create({
  info: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, height: 46 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12 },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border, padding: 12 },
})
