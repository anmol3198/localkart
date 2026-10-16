import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Banner, Chip, Field, Section, SwitchRow } from './ui.jsx'
import LocationPicker from './LocationPicker.jsx'
import api from '../lib/api.js'
import { DEFAULT_CATEGORIES, categoryStyle } from '../lib/categories.js'
import { colors, radius, type } from '../lib/theme.js'
import { SHOP_SECTIONS, phoneOnly } from '../lib/shop.js'

function RadiusStepper({ value, onChange }) {
  const step = (d) => onChange(Math.min(5, Math.max(0.5, Math.round((value + d) * 2) / 2)))
  return (
    <View style={styles.stepper}>
      <Pressable accessibilityLabel="Decrease delivery distance" onPress={() => step(-0.5)} style={styles.stepBtn}><Ionicons name="remove" size={22} color={colors.primary} /></Pressable>
      <View style={{ alignItems: 'center', flex: 1 }}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>{value} km</Text>
        <Text style={type.small}>delivery distance (max 5 km)</Text>
      </View>
      <Pressable accessibilityLabel="Increase delivery distance" onPress={() => step(0.5)} style={styles.stepBtn}><Ionicons name="add" size={22} color={colors.primary} /></Pressable>
    </View>
  )
}

/** Shop profile + map location + delivery settings, split into sections. */
export default function ShopForm({ value, onChange, errors = {}, sections = SHOP_SECTIONS }) {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const set = (key) => (v) => onChange({ ...value, [key]: v })

  useEffect(() => {
    api.get('/meta').then((m) => m?.categories?.length && setCategories(m.categories)).catch(() => {})
  }, [])

  return (
    <View style={{ gap: 16 }}>
      {sections.includes('details') && (
        <Section icon="storefront-outline" title="Shop details" subtitle="What customers see when they find you">
          <Field label="Shop name" required value={value.shopName} onChangeText={set('shopName')} placeholder="e.g. Sri Lakshmi Stores" error={errors.shopName} />
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Category</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {categories.map((c) => (
                <Chip key={c} label={c} selected={value.category === c} onPress={() => set('category')(c)} iconSet={MaterialCommunityIcons} icon={categoryStyle(c).icon} />
              ))}
            </View>
          </View>
          <Field label="Phone for customer calls" required value={value.phone} onChangeText={(t) => set('phone')(phoneOnly(t))} placeholder="9876543210"
            keyboardType="phone-pad" maxLength={14} error={errors.phone} hint="Customers will call or WhatsApp this number" />
          <Field label="Alternate phone (optional)" value={value.alternatePhone || ''} onChangeText={(t) => set('alternatePhone')(phoneOnly(t))} keyboardType="phone-pad" maxLength={14} error={errors.alternatePhone} />
          <Field label="Opening hours" value={value.openingHours} onChangeText={set('openingHours')} hint="e.g. 8:00 AM - 10:00 PM, closed Sunday" />
          <SwitchRow icon="time-outline" title={value.isOpen ? 'Open right now' : 'Closed right now'} subtitle="You can change this any time from your dashboard" value={value.isOpen} onValueChange={set('isOpen')} />
          <Field label="About the shop (optional)" multiline value={value.description || ''} onChangeText={set('description')} maxLength={500}
            placeholder="What do you sell? Fresh stock daily, credit for regulars…" hint={`${(value.description || '').length}/500`} />
        </Section>
      )}

      {sections.includes('location') && (
        <Section icon="location-outline" title="Shop location" subtitle="Customers within 5 km of this point can find you">
          <Field label="Full address" required value={value.address} onChangeText={set('address')} placeholder="Shop no., street, area, landmark" error={errors.address} />
          {errors.location && <Banner kind="error">{errors.location}</Banner>}
          <LocationPicker
            value={value.lat != null ? { lat: value.lat, lng: value.lng } : null}
            onChange={(p) => onChange({ ...value, ...p })}
            radiusKm={value.homeDelivery ? Number(value.deliveryRadiusKm) : 0}
            height={260}
          />
        </Section>
      )}

      {sections.includes('delivery') && (
        <Section icon="bicycle-outline" title="Home delivery" subtitle={value.homeDelivery ? `Delivering up to ${value.deliveryRadiusKm} km from your shop` : 'Turn on if you deliver orders'}>
          <SwitchRow tone="primary" title="We deliver to customers' homes" value={value.homeDelivery} onValueChange={set('homeDelivery')} />
          {value.homeDelivery ? (
            <>
              <RadiusStepper value={Number(value.deliveryRadiusKm)} onChange={set('deliveryRadiusKm')} />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Field style={{ flex: 1 }} label="Minimum order" prefix="₹" keyboardType="number-pad" value={String(value.minOrderAmount ?? '')}
                  onChangeText={(t) => set('minOrderAmount')(t.replace(/\D/g, ''))} error={errors.minOrderAmount} hint="0 = no minimum" />
                <Field style={{ flex: 1 }} label="Delivery charge" prefix="₹" keyboardType="number-pad" value={String(value.deliveryCharge ?? '')}
                  onChangeText={(t) => set('deliveryCharge')(t.replace(/\D/g, ''))} error={errors.deliveryCharge} hint="0 = free delivery" />
              </View>
            </>
          ) : (
            <Text style={type.muted}>Customers will see your shop as <Text style={{ fontWeight: '700' }}>pickup only</Text>.</Text>
          )}
        </Section>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  stepBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
})
