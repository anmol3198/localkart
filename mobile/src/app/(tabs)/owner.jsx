import { useCallback, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import api from '../../lib/api.js'
import { useAuth } from '../../lib/auth.jsx'
import { useToast } from '../../lib/toast.jsx'
import { confirm } from '../../lib/confirm.js'
import { colors, radius, shadow, type } from '../../lib/theme.js'
import { Banner, Button, Card, Chip, EmptyState, IconButton, SwitchRow } from '../../components/ui.jsx'
import { CategoryIcon, OpenBadge } from '../../components/shopBits.jsx'
import { Delta } from '../../components/InsightsBits.jsx'
import { nf } from '../../lib/insights.js'

const PERKS = [
  ['people-outline', 'Customers within 5 km find your shop'],
  ['pricetags-outline', 'They see your stock and prices before calling'],
  ['flash-outline', 'Update stock and open/closed in one tap'],
  ['wallet-outline', 'Free to list. No commission on orders'],
]

function Welcome() {
  const insets = useSafeAreaInsets()
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={[styles.welcome, { paddingTop: insets.top + 24 }]}>
        <Text style={{ color: colors.accentLight, fontWeight: '800', letterSpacing: 1, fontSize: 12 }}>LOCALKART FOR SHOPS</Text>
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 8, lineHeight: 34 }}>Bring your neighbourhood to your counter</Text>
        <View style={{ gap: 14, marginTop: 20 }}>
          {PERKS.map(([icon, text]) => (
            <View key={text} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <View style={styles.perkIcon}><Ionicons name={icon} size={18} color={colors.accentLight} /></View>
              <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 15, flex: 1 }}>{text}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={{ padding: 16, gap: 12 }}>
        <Button size="lg" icon="add-circle-outline" title="Register your shop — it's free" onPress={() => router.push('/owner/register')} />
        <Button size="lg" variant="outline" icon="log-in-outline" title="I already have an account" onPress={() => router.push('/owner/login')} />
      </View>
    </ScrollView>
  )
}

function Stat({ icon, label, value, color }) {
  return (
    <View style={styles.stat}>
      <View style={[styles.statIcon, { backgroundColor: color + '1f' }]}><Ionicons name={icon} size={20} color={color} /></View>
      <View>
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>{value}</Text>
        <Text style={type.small}>{label}</Text>
      </View>
    </View>
  )
}

function Dashboard() {
  const insets = useSafeAreaInsets()
  const { logout } = useAuth()
  const notify = useToast()
  const [shop, setShop] = useState(null)
  const [products, setProducts] = useState(null)
  const [week, setWeek] = useState(null)
  const [error, setError] = useState('')
  const [toggling, setToggling] = useState('')
  const [filter, setFilter] = useState('')
  const [stock, setStock] = useState('all')
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const [s, p] = await Promise.all([api.get('/vendor/shop'), api.get('/vendor/products')])
      setShop(s)
      setProducts(p)
      setError('')
      // Insights are a bonus here: if they fail, the dashboard still works.
      api.get('/vendor/insights', { days: 7 }).then(setWeek).catch(() => {})
    } catch (e) {
      if (e.status === 401) { await logout(); notify('Please log in again', 'info'); return }
      setError(e.message)
    }
  }, [logout, notify])

  // Reload whenever the tab comes back into view (e.g. after adding an item).
  useFocusEffect(useCallback(() => { load() }, [load]))

  const quickToggle = async (key) => {
    setToggling(key)
    try {
      const data = await api.put('/vendor/shop', { [key]: !shop[key] })
      setShop(data)
      if (key === 'isOpen') notify(data.isOpen ? 'Shop is now shown as open' : 'Shop is now shown as closed', data.isOpen ? 'success' : 'info')
      else notify(data.homeDelivery ? 'Home delivery turned on' : 'Home delivery paused', data.homeDelivery ? 'success' : 'info')
    } catch (e) {
      notify(e.message, 'error')
    } finally {
      setToggling('')
    }
  }

  const toggleStock = async (p) => {
    setProducts((list) => list.map((x) => (x._id === p._id ? { ...x, inStock: !p.inStock } : x)))
    try {
      await api.put(`/vendor/products/${p._id}`, { inStock: !p.inStock })
      notify(`${p.name} marked ${p.inStock ? 'out of stock' : 'in stock'}`)
    } catch (e) {
      notify(e.message, 'error')
      load()
    }
  }

  const remove = async (p) => {
    if (!(await confirm('Delete this item?', `"${p.name}" will be removed from your shop. If it has only run out, mark it out of stock instead.`, 'Delete'))) return
    try {
      await api.del(`/vendor/products/${p._id}`)
      setProducts((list) => list.filter((x) => x._id !== p._id))
      notify(`"${p.name}" deleted`)
    } catch (e) {
      notify(e.message, 'error')
    }
  }

  const signOut = async () => {
    if (!(await confirm('Log out?', 'You can log back in any time with your email and password.', 'Log out'))) return
    await logout()
    notify('Logged out', 'info')
  }

  const visible = useMemo(() => {
    const f = filter.trim().toLowerCase()
    return (products || [])
      .filter((p) => !f || p.name.toLowerCase().includes(f) || p.category.toLowerCase().includes(f) || (p.barcode || '').toLowerCase() === f)
      .filter((p) => stock === 'all' || (stock === 'in') === p.inStock)
  }, [products, filter, stock])

  if (error && !shop) {
    return <View style={{ flex: 1, padding: 16, paddingTop: insets.top + 16 }}><Banner kind="error" action={<Text onPress={load} style={{ color: colors.danger, fontWeight: '800' }}>Retry</Text>}>{error}</Banner></View>
  }
  if (!shop || !products) return <ActivityIndicator style={{ marginTop: insets.top + 80 }} size="large" color={colors.primary} />

  const out = products.filter((p) => !p.inStock).length

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, gap: 16, paddingBottom: 110 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={type.h1}>My shop</Text>
          <View style={{ flexDirection: 'row' }}>
            <IconButton icon="qr-code-outline" label="Shop QR poster" color={colors.text} onPress={() => router.push('/owner/poster')} />
            <IconButton icon="settings-outline" label="Shop settings" color={colors.text} onPress={() => router.push('/owner/settings')} />
            <IconButton icon="log-out-outline" label="Log out" color={colors.danger} onPress={signOut} />
          </View>
        </View>

        <Card style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <CategoryIcon category={shop.category} size={56} />
            <View style={{ flex: 1 }}>
              <Text style={type.h3} numberOfLines={1}>{shop.shopName}</Text>
              <OpenBadge open={shop.isOpen} />
              <Text style={type.small} numberOfLines={1}>{shop.address}</Text>
            </View>
          </View>
          <SwitchRow icon="storefront-outline" title="Shop open" subtitle={shop.isOpen ? 'Customers see you as open now' : 'Shown as closed to customers'}
            value={shop.isOpen} busy={toggling === 'isOpen'} onValueChange={() => quickToggle('isOpen')} />
          <SwitchRow icon="bicycle-outline" title="Home delivery" subtitle={shop.homeDelivery ? `Delivering up to ${shop.deliveryRadiusKm} km` : 'Pickup only right now'}
            value={shop.homeDelivery} busy={toggling === 'homeDelivery'} onValueChange={() => quickToggle('homeDelivery')} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button flex variant="outline" icon="eye-outline" title="Customer view" onPress={() => router.push(`/shop/${shop._id}`)} />
            <Button flex variant="outline" icon="qr-code-outline" title="QR poster" onPress={() => router.push('/owner/poster')} />
          </View>
        </Card>

        {week && (
          <Pressable onPress={() => router.push('/owner/insights')} accessibilityRole="button" accessibilityLabel="Open insights"
            style={({ pressed }) => [styles.week, pressed && { opacity: 0.92 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: colors.accentLight, fontWeight: '800', fontSize: 12, letterSpacing: 0.8 }}>THIS WEEK</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>See insights</Text>
                <Ionicons name="chevron-forward" size={16} color="#fff" />
              </View>
            </View>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 6 }}>
              {nf.format(week.totals.contacts)} {week.totals.contacts === 1 ? 'customer' : 'customers'} called or messaged you
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              {[['eye-outline', 'Views', week.totals.views, week.previous.views], ['call-outline', 'Calls', week.totals.calls, week.previous.calls],
                ['logo-whatsapp', 'WhatsApp', week.totals.whatsapp, week.previous.whatsapp]].map(([icon, label, now, before]) => (
                <View key={label} style={styles.weekStat}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name={icon} size={13} color={colors.textMuted} />
                    <Text style={type.small}>{label}</Text>
                  </View>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>{nf.format(now)}</Text>
                  <Delta now={now} before={before} compact />
                </View>
              ))}
            </View>
          </Pressable>
        )}

        <Pressable onPress={() => router.push('/owner/poster')} accessibilityRole="button" accessibilityLabel="Print your shop QR poster"
          style={({ pressed }) => [styles.posterCard, pressed && { opacity: 0.9 }]}>
          <View style={styles.posterIcon}><Ionicons name="qr-code" size={26} color={colors.primary} /></View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '800', fontSize: 15, color: colors.text }}>Print your shop QR poster</Text>
            <Text style={type.small}>Stick it at your counter. Customers scan it to see your items and call you.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>

        <View style={styles.stats}>
          <Stat icon="cube-outline" label="Items listed" value={products.length} color={colors.primary} />
          <Stat icon="checkmark-circle-outline" label="In stock" value={products.length - out} color={colors.success} />
          <Stat icon="close-circle-outline" label="Out of stock" value={out} color={colors.danger} />
          <Stat icon="grid-outline" label="Sections" value={new Set(products.map((p) => p.category)).size} color={colors.warning} />
        </View>

        <View style={{ gap: 10 }}>
          <Text style={type.h2}>Inventory</Text>
          {products.length === 0 ? (
            <Card>
              <EmptyState icon="cube-outline" title="Add the items you sell"
                message={'Customers search for things like "milk" or "rice" and find shops that have them. Shops with a full list get more calls.'}
                action={
                  <View style={{ gap: 10, alignSelf: 'stretch' }}>
                    <Button icon="scan-outline" title="Scan products to add them" onPress={() => router.push('/owner/scan')} />
                    <Button variant="outline" icon="add" title="Add an item by typing" onPress={() => router.push('/owner/item')} />
                  </View>
                } />
            </Card>
          ) : (
            <>
              <View style={styles.search}>
                <Ionicons name="search" size={18} color={colors.textMuted} />
                <TextInput style={{ flex: 1, fontSize: 15, color: colors.text, outlineStyle: 'none' }} placeholder="Search items or sections" placeholderTextColor={colors.textFaint} value={filter} onChangeText={setFilter} />
                {filter ? <Pressable onPress={() => setFilter('')} hitSlop={8}><Ionicons name="close-circle" size={18} color={colors.textFaint} /></Pressable> : null}
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Chip label="All" selected={stock === 'all'} onPress={() => setStock('all')} />
                <Chip label="In stock" selected={stock === 'in'} onPress={() => setStock('in')} />
                <Chip label={`Out of stock${out ? ` (${out})` : ''}`} selected={stock === 'out'} onPress={() => setStock('out')} />
              </View>
              <Text style={type.small}>Flip the switch whenever something runs out — customers see it instantly.</Text>
              {visible.length === 0 && <EmptyState title="No items match" action={<Chip label="Show all items" onPress={() => { setFilter(''); setStock('all') }} />} />}
              {visible.map((p) => (
                <Card key={p._id} style={[styles.row, !p.inStock && { backgroundColor: '#f6f8f7' }]}>
                  <Pressable style={{ flex: 1 }} onPress={() => router.push({ pathname: '/owner/item', params: { id: p._id } })}>
                    <Text style={{ fontWeight: '700', fontSize: 15, color: p.inStock ? colors.text : colors.textMuted }} numberOfLines={1}>{p.name}</Text>
                    <Text style={type.small} numberOfLines={1}>₹{p.price} / {p.unit} · {p.category}</Text>
                  </Pressable>
                  <Switch value={p.inStock} onValueChange={() => toggleStock(p)} trackColor={{ true: colors.success, false: '#cfd8d5' }} thumbColor="#fff" accessibilityLabel={`${p.name} in stock`} />
                  <IconButton icon="create-outline" label={`Edit ${p.name}`} color={colors.textMuted} size={20} onPress={() => router.push({ pathname: '/owner/item', params: { id: p._id } })} />
                  <IconButton icon="trash-outline" label={`Delete ${p.name}`} color={colors.danger} size={20} onPress={() => remove(p)} />
                </Card>
              ))}
            </>
          )}
        </View>
      </ScrollView>
      {products.length > 0 && (
        <View style={styles.fabs}>
          <Pressable accessibilityRole="button" accessibilityLabel="Scan items" onPress={() => router.push('/owner/scan')} style={({ pressed }) => [styles.fab, styles.fabLight, pressed && { opacity: 0.9 }]}>
            <Ionicons name="scan-outline" size={22} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 15 }}>Scan</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Add item" onPress={() => router.push('/owner/item')} style={({ pressed }) => [styles.fab, pressed && { opacity: 0.9 }]}>
            <Ionicons name="add" size={24} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Add item</Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}

export default function OwnerTab() {
  const { token, ready } = useAuth()
  if (!ready) return <ActivityIndicator style={{ marginTop: 80 }} color={colors.primary} />
  return token ? <Dashboard /> : <Welcome />
}

const styles = StyleSheet.create({
  welcome: { backgroundColor: colors.primary, padding: 20, paddingBottom: 28, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  perkIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  posterCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.accent + '66', backgroundColor: colors.warningSoft },
  posterIcon: { width: 46, height: 46, borderRadius: 12, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  week: { backgroundColor: colors.primary, borderRadius: radius.xl, padding: 16 },
  weekStat: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: 10, gap: 2 },
  stat: { flexGrow: 1, flexBasis: '45%', flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 12 },
  statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: radius.md, paddingHorizontal: 12, height: 46 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 14 },
  fabs: { position: 'absolute', right: 16, bottom: 16, flexDirection: 'row', gap: 10 },
  fabLight: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.primary },
  fab: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, paddingHorizontal: 18, height: 52, borderRadius: 26, ...shadow },
})
