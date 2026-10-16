import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { colors, radius, type } from '../lib/theme.js'
import { SERIES, change, fmtDay, nf } from '../lib/insights.js'

/** Change vs previous period with an arrow + words, so it never relies on colour alone. */
export function Delta({ now, before, compact }) {
  if (!now && !before) return <Text style={type.small}>No activity yet</Text>
  const pct = change(now, before)
  if (pct === null) return <Pill icon="trending-up" color={colors.success} label="New" />
  const up = pct > 0
  const flat = pct === 0
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <Pill icon={flat ? 'remove' : up ? 'trending-up' : 'trending-down'} color={flat ? colors.textMuted : up ? colors.success : colors.danger}
        label={`${up ? '+' : ''}${pct}%`} />
      {!compact && <Text style={type.small}>vs before</Text>}
    </View>
  )
}

function Pill({ icon, color, label }) {
  return (
    <View style={[styles.pill, { borderColor: color + '66' }]}>
      <Ionicons name={icon} size={12} color={color} />
      <Text style={{ color, fontSize: 12, fontWeight: '800' }}>{label}</Text>
    </View>
  )
}

export function Kpi({ icon, label, value, before, highlight }) {
  return (
    <View style={[styles.kpi, highlight && { borderColor: colors.primary + '55', backgroundColor: colors.primarySoft }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={styles.kpiIcon}><Ionicons name={icon} size={16} color={colors.text} /></View>
        <Text style={{ fontWeight: '600', color: colors.textMuted, fontSize: 13 }}>{label}</Text>
      </View>
      <Text style={styles.kpiValue}>{nf.format(value)}</Text>
      <Delta now={value} before={before} />
    </View>
  )
}

export function Legend() {
  return (
    <View style={{ flexDirection: 'row', gap: 14, flexWrap: 'wrap' }}>
      {Object.values(SERIES).map((s) => (
        <View key={s.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 12, height: 8, borderRadius: 2, backgroundColor: s.color }} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted }}>{s.label}</Text>
        </View>
      ))}
    </View>
  )
}

/**
 * Daily bars: views (green) with contacts (amber, narrower, in front) on one count scale.
 * Tap a day to see its numbers; the latest day is selected to start.
 */
export function DailyBars({ daily, height = 150 }) {
  const [selected, setSelected] = useState(daily.length - 1)
  const max = Math.max(1, ...daily.map((d) => d.views), ...daily.map((d) => d.calls + d.whatsapp))
  const sel = daily[Math.min(selected, daily.length - 1)]
  const gap = daily.length > 45 ? 1 : daily.length > 14 ? 2 : 6
  const step = Math.max(1, Math.ceil(daily.length / 6))

  return (
    <View style={{ gap: 10 }}>
      <View style={styles.selected}>
        <Text style={{ fontWeight: '700', color: colors.text }}>{fmtDay(sel.date, { weekday: 'short', day: 'numeric', month: 'short' })}</Text>
        <Text style={type.muted}>
          <Text style={{ fontWeight: '800', color: colors.text }}>{nf.format(sel.views)}</Text> views ·{' '}
          <Text style={{ fontWeight: '800', color: colors.text }}>{nf.format(sel.calls + sel.whatsapp)}</Text> contacts
        </Text>
      </View>
      <View style={{ height, flexDirection: 'row', alignItems: 'flex-end', gap, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        {daily.map((d, i) => {
          const contacts = d.calls + d.whatsapp
          const active = i === selected
          return (
            <Pressable
              key={d.date}
              onPress={() => setSelected(i)}
              accessibilityRole="button"
              accessibilityLabel={`${fmtDay(d.date, { day: 'numeric', month: 'long' })}: ${d.views} views, ${contacts} contacts`}
              style={{ flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center' }}
              hitSlop={{ top: 8, bottom: 8 }}
            >
              <View style={{ width: '100%', height: `${(d.views / max) * 100}%`, minHeight: d.views ? 2 : 0, backgroundColor: SERIES.views.color, opacity: active ? 1 : 0.55, borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />
              <View style={{ position: 'absolute', bottom: 0, width: '55%', height: `${(contacts / max) * 100}%`, minHeight: contacts ? 2 : 0, backgroundColor: SERIES.contacts.color, borderTopLeftRadius: 3, borderTopRightRadius: 3, borderWidth: daily.length <= 31 ? 1 : 0, borderColor: '#fff' }} />
            </Pressable>
          )
        })}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {daily.map((d, i) => (i % step === 0 || i === daily.length - 1) && (i === daily.length - 1 || daily.length - 1 - i >= step / 2) ? (
          <Text key={d.date} style={type.small}>{fmtDay(d.date, { day: 'numeric', month: 'short' })}</Text>
        ) : null)}
      </View>
    </View>
  )
}

export function SourceBars({ sources }) {
  const rows = [['Website', sources.web], ['Android app', sources.android], ['iPhone app', sources.ios]]
  const total = rows.reduce((s, [, n]) => s + n, 0)
  return (
    <View style={{ gap: 12 }}>
      {rows.map(([label, n]) => {
        const pct = total ? Math.round((n / total) * 100) : 0
        return (
          <View key={label} style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '600', color: colors.text }}>{label}</Text>
              <Text style={type.muted}>{nf.format(n)} · {pct}%</Text>
            </View>
            <View style={styles.track}><View style={[styles.fill, { width: `${pct}%` }]} /></View>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 2 },
  kpi: { flexGrow: 1, flexBasis: '45%', gap: 6, padding: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  kpiIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#eef2f1', alignItems: 'center', justifyContent: 'center' },
  kpiValue: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  selected: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6, backgroundColor: '#f1f5f3', borderRadius: radius.md, padding: 10 },
  track: { height: 8, borderRadius: 4, backgroundColor: '#eef2f1', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: SERIES.views.color },
})
