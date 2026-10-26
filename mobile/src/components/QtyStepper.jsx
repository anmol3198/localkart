import { Pressable, StyleSheet, Text, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { colors, radius } from '../lib/theme.js'
import { MAX_QTY } from '../lib/order.js'

/** − qty + control; going below 1 removes the item. */
export default function QtyStepper({ qty, onChange, label }) {
  return (
    <View style={styles.box}>
      <Pressable accessibilityRole="button" accessibilityLabel={`One less ${label}`} hitSlop={6} onPress={() => onChange(qty - 1)} style={styles.btn}>
        <Ionicons name="remove" size={18} color={colors.primary} />
      </Pressable>
      <Text style={styles.qty} accessibilityLiveRegion="polite">{qty}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`One more ${label}`} hitSlop={6} disabled={qty >= MAX_QTY} onPress={() => onChange(qty + 1)} style={[styles.btn, qty >= MAX_QTY && { opacity: 0.4 }]}>
        <Ionicons name="add" size={18} color={colors.primary} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.md, backgroundColor: colors.card },
  btn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  qty: { minWidth: 24, textAlign: 'center', fontWeight: '800', color: colors.text, fontSize: 15 },
})
