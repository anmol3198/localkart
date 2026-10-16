import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, RefreshControl, ScrollView, Share, StyleSheet, Text, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import api from '../../lib/api.js'
import { colors, radius, type } from '../../lib/theme.js'
import { PERIODS, fmtDay, hasActivity, nf, periodLabel } from '../../lib/insights.js'
import { Banner, Button, Card, Chip, EmptyState } from '../../components/ui.jsx'
import { DailyBars, Kpi, Legend, SourceBars } from '../../components/InsightsBits.jsx'

export default function InsightsScreen() {
  const [days, setDays] = useState(7)
  const [data, setData] = useState(null)
  const [shop, setShop] = useState(null)
  const [error, setError] = useState('')
  const [asList, setAsList] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAll = useCallback(() => Promise.all([api.get('/vendor/insights', { days }), api.get('/vendor/shop')]), [days])
  const apply = ([d, s]) => { setData(d); setShop(s); setError('') }
  const load = useCallback(() => fetchAll().then(apply).catch((e) => setError(e.message)), [fetchAll])

  useEffect(() => {
    let alive = true
    fetchAll().then((r) => alive && apply(r)).catch((e) => alive && setError(e.message))
    return () => { alive = false }
  }, [fetchAll])

  const summary = useMemo(() => {
    if (!data) return null
    const t = data.totals
    const busiest = data.daily.reduce((b, d) => (d.views + d.calls + d.whatsapp > b.score ? { d, score: d.views + d.calls + d.whatsapp } : b), { d: null, score: 0 }).d
    return { rate: t.views ? Math.round((t.contacts / t.views) * 100) : 0, busiest }
  }, [data])

  const shareShop = () => {
    if (!shop) return
    // Link to the shop on the website when its address is configured (EXPO_PUBLIC_WEB_URL), else the phone number.
    const site = process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, '')
    const message = site
      ? `Order from ${shop.shopName} on LocalKart: ${site}/shop/${shop._id}`
      : `Order from ${shop.shopName} — find us on LocalKart or call ${shop.phone}`
    Share.share({ message }).catch(() => {})
  }

  const fresh = data && data.days === days
  const t = data?.totals
  const p = data?.previous

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }} tintColor={colors.primary} colors={[colors.primary]} />}
    >
      <View style={{ gap: 4 }}>
        <Text style={type.h2}>How customers found you</Text>
        <Text style={type.muted}>
          {data ? `${fmtDay(data.from, { day: 'numeric', month: 'short' })} – ${fmtDay(data.to, { day: 'numeric', month: 'short' })} · India time` : 'Views of your shop and taps on Call, WhatsApp and Directions'}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {PERIODS.map((d) => <Chip key={d} label={`${d} days`} selected={days === d} onPress={() => setDays(d)} />)}
      </View>

      {error ? <Banner kind="error" action={<Text onPress={load} style={{ color: colors.danger, fontWeight: '800' }}>Retry</Text>}>{error}</Banner> : null}
      {!data && !error && <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.primary} />}

      {data && !hasActivity(t) && (
        <Card>
          <EmptyState icon="stats-chart-outline" title={`No customer activity ${periodLabel(days)} yet`}
            message="Numbers appear as soon as customers open your shop or tap Call or WhatsApp. Sharing your shop in local WhatsApp groups is the fastest way to start."
            action={<Button icon="share-social-outline" title="Share your shop" onPress={shareShop} />} />
        </Card>
      )}

      {data && hasActivity(t) && (
        <View style={{ gap: 16, opacity: fresh ? 1 : 0.55 }}>
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>{nf.format(t.contacts)} {t.contacts === 1 ? 'customer' : 'customers'} reached out</Text>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15 }}>by calling or messaging you {periodLabel(days)}, out of {nf.format(t.views)} who viewed your shop.</Text>
            <View style={{ flexDirection: 'row', gap: 24, marginTop: 10 }}>
              <View>
                <Text style={{ fontSize: 26, fontWeight: '800', color: colors.accentLight }}>{summary.rate}%</Text>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>of viewers contacted you</Text>
              </View>
              {summary.busiest && (
                <View>
                  <Text style={{ fontSize: 26, fontWeight: '800', color: '#fff' }}>{fmtDay(summary.busiest.date, { weekday: 'short' })}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>busiest day ({fmtDay(summary.busiest.date, { day: 'numeric', month: 'short' })})</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.grid}>
            <Kpi icon="eye-outline" label="Shop views" value={t.views} before={p.views} />
            <Kpi icon="call-outline" label="Calls" value={t.calls} before={p.calls} highlight />
            <Kpi icon="logo-whatsapp" label="WhatsApp" value={t.whatsapp} before={p.whatsapp} highlight />
            <Kpi icon="navigate-outline" label="Directions" value={t.directions} before={p.directions} />
          </View>

          <Card style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <View style={{ gap: 4, flex: 1 }}>
                <Text style={type.h3}>Day by day</Text>
                <Legend />
              </View>
              <Button size="sm" variant="ghost" icon={asList ? 'bar-chart-outline' : 'list-outline'} title={asList ? 'Chart' : 'List'} onPress={() => setAsList((v) => !v)} />
            </View>
            {asList ? (
              <View>
                {[...data.daily].reverse().map((d) => (
                  <View key={d.date} style={styles.row}>
                    <Text style={{ flex: 1, color: colors.text, fontWeight: '600' }}>{fmtDay(d.date, { weekday: 'short', day: 'numeric', month: 'short' })}</Text>
                    <Text style={styles.cell}><Ionicons name="eye-outline" size={12} /> {d.views}</Text>
                    <Text style={styles.cell}><Ionicons name="call-outline" size={12} /> {d.calls}</Text>
                    <Text style={styles.cell}><Ionicons name="logo-whatsapp" size={12} /> {d.whatsapp}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <DailyBars key={days} daily={data.daily} />
            )}
          </Card>

          <Card style={{ gap: 12 }}>
            <View>
              <Text style={type.h3}>Where customers came from</Text>
              <Text style={type.muted}>All activity {periodLabel(days)}</Text>
            </View>
            <SourceBars sources={data.sources} />
          </Card>

          <View style={styles.tip}>
            <Ionicons name="bulb" size={22} color={colors.warning} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontWeight: '700', color: colors.text }}>Get more calls</Text>
              <Text style={type.muted}>
                {summary.rate < 15
                  ? 'Many people look but don’t call. Add prices for popular items and keep stock up to date so they know you have what they need.'
                  : 'Customers who see your shop often reach out. Share it in local WhatsApp groups to get more of them.'}
              </Text>
              <Button size="sm" variant="ghost" icon="share-social-outline" title="Share your shop" onPress={shareShop} style={{ alignSelf: 'flex-start', marginLeft: -12 }} />
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.primary, borderRadius: radius.xl, padding: 18, gap: 4 },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '800', letterSpacing: -0.3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  cell: { width: 52, textAlign: 'right', color: colors.text },
  tip: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: radius.lg, backgroundColor: colors.warningSoft, borderWidth: 1, borderColor: '#f5d9a8' },
})
