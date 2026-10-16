import { Linking, StyleSheet, Text, View } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import Ionicons from '@expo/vector-icons/Ionicons'
import { categoryStyle, tint } from '../lib/categories.js'
import { colors, radius } from '../lib/theme.js'
import { whatsappUrl } from '../lib/shop.js'
import { Button } from './ui.jsx'

export function CategoryIcon({ category, size = 48 }) {
  const { color, icon } = categoryStyle(category)
  return (
    <View style={{ width: size, height: size, borderRadius: size / 4, backgroundColor: tint(color, 0.12), alignItems: 'center', justifyContent: 'center' }}>
      <MaterialCommunityIcons name={icon} size={size * 0.52} color={color} />
    </View>
  )
}

export function OpenBadge({ open }) {
  const c = open ? colors.success : colors.danger
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c }} />
      <Text style={{ color: c, fontWeight: '700', fontSize: 13 }}>{open ? 'Open now' : 'Closed'}</Text>
    </View>
  )
}

export function Tag({ icon, label, tone = 'neutral' }) {
  const t = {
    neutral: [colors.card, colors.textMuted, colors.border],
    success: [colors.successSoft, colors.success, colors.successSoft],
    warning: [colors.warningSoft, colors.warning, colors.warningSoft],
  }[tone]
  return (
    <View style={[styles.tag, { backgroundColor: t[0], borderColor: t[2] }]}>
      {icon && <Ionicons name={icon} size={13} color={t[1]} />}
      <Text style={{ color: t[1], fontSize: 12, fontWeight: '700' }}>{label}</Text>
    </View>
  )
}

/** Whether the shop delivers, and whether the customer is inside its delivery area. */
export function DeliveryTag({ shop }) {
  if (!shop.homeDelivery) return <Tag icon="storefront-outline" label="Pickup only" />
  if (shop.deliversToYou === false) return <Tag icon="bicycle" tone="warning" label={`Delivers within ${shop.deliveryRadiusKm} km, not to you`} />
  return <Tag icon="bicycle" tone="success" label={shop.deliversToYou ? 'Delivers to you' : 'Home delivery'} />
}

export function CallButtons({ shop, size = 'md' }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Button flex size={size} icon="call" title="Call to order" onPress={() => Linking.openURL(`tel:${shop.phone}`)} />
      <Button flex size={size} variant="whatsapp" icon="logo-whatsapp" title="WhatsApp" onPress={() => Linking.openURL(whatsappUrl(shop))} />
    </View>
  )
}

const styles = StyleSheet.create({
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1 },
})
