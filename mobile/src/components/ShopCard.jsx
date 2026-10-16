import { StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Card } from './ui.jsx'
import { CallButtons, CategoryIcon, DeliveryTag, OpenBadge, Tag } from './shopBits.jsx'
import { colors, radius, type } from '../lib/theme.js'
import { formatDistance } from '../lib/location.jsx'

export default function ShopCard({ shop }) {
  return (
    <Card onPress={() => router.push(`/shop/${shop._id}`)} style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <CategoryIcon category={shop.category} />
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <Text style={[type.h3, { flex: 1 }]} numberOfLines={1}>{shop.shopName}</Text>
            <View style={styles.distance}>
              <Ionicons name="location" size={12} color={colors.textMuted} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>{formatDistance(shop.distanceKm)}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={type.muted}>{shop.category}</Text>
            <Text style={{ color: colors.textFaint }}>·</Text>
            <OpenBadge open={shop.isOpen} />
          </View>
          <Text style={type.muted} numberOfLines={1}>{shop.address}</Text>
        </View>
      </View>

      <View style={styles.tags}>
        <DeliveryTag shop={shop} />
        {shop.homeDelivery && shop.minOrderAmount > 0 && <Tag label={`Min ₹${shop.minOrderAmount}`} />}
        {shop.homeDelivery && <Tag label={shop.deliveryCharge ? `₹${shop.deliveryCharge} delivery` : 'Free delivery'} />}
      </View>

      {shop.matchingProducts?.length > 0 && (
        <View style={styles.matches}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: colors.primaryDark }}>IN STOCK HERE</Text>
          {shop.matchingProducts.slice(0, 3).map((p) => (
            <View key={p._id ?? p.name} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <Text style={{ flex: 1, color: colors.text, fontSize: 14 }} numberOfLines={1}>{p.name}</Text>
              <Text style={{ fontWeight: '700', color: colors.text, fontSize: 14 }}>₹{p.price}<Text style={type.small}>/{p.unit}</Text></Text>
            </View>
          ))}
          {shop.matchingProducts.length > 3 && <Text style={type.small}>+{shop.matchingProducts.length - 3} more</Text>}
        </View>
      )}

      <CallButtons shop={shop} size="sm" />
    </Card>
  )
}

const styles = StyleSheet.create({
  distance: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#eef2f1', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  matches: { backgroundColor: colors.primarySoft, borderRadius: radius.md, padding: 10, gap: 4 },
})
