import { useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Clipboard from 'expo-clipboard'
import Ionicons from '@expo/vector-icons/Ionicons'
import api from '../lib/api.js'
import { track } from '../lib/track.js'
import { useToast } from '../lib/toast.jsx'
import { cartTotals, deliveryAllowed, money, orderMessage, reconcile, setQty, shopTakesWhatsapp, validateOrder, whatsappOrderUrl } from '../lib/order.js'
import { colors, radius, shadow, type } from '../lib/theme.js'
import { Banner, Button, Field, IconButton } from './ui.jsx'
import QtyStepper from './QtyStepper.jsx'

/** Floating "N items · ₹X  View order" bar. */
export function CartBar({ cart, shop, onOpen, bottom }) {
  const t = cartTotals(cart, shop)
  if (!t.lines) return null
  return (
    <View style={[styles.barWrap, { paddingBottom: bottom + 12 }]}>
      <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`View order, ${t.count} items, ${money(t.itemsTotal)}`} style={({ pressed }) => [styles.bar, pressed && { opacity: 0.9 }]}>
        <Ionicons name="bag-handle" size={22} color="#fff" />
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{t.count} {t.count === 1 ? 'item' : 'items'} · {money(t.itemsTotal)}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>Order on WhatsApp, pay the shop directly</Text>
        </View>
        <Text style={{ color: '#fff', fontWeight: '800' }}>View order</Text>
        <Ionicons name="chevron-forward" size={18} color="#fff" />
      </Pressable>
    </View>
  )
}

/** Review items, choose pickup or delivery, then send the order to the shop. */
export default function OrderSheet({ visible, onClose, cart, setCart, clear, shop, location, onFresh }) {
  const insets = useSafeAreaInsets()
  const notify = useToast()
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [changes, setChanges] = useState([])
  const [sent, setSent] = useState(null)

  const t = cartTotals(cart, shop)
  const errors = validateOrder(cart, shop)
  const show = (k) => ((submitted || touched[k]) && errors[k]) || undefined
  const canDeliver = deliveryAllowed(shop)
  const whatsapp = shopTakesWhatsapp(shop)
  const set = (k) => (v) => setCart({ ...cart, [k]: v })
  const touch = (k) => () => setTouched((x) => ({ ...x, [k]: true }))

  const send = async () => {
    setSubmitted(true)
    if (Object.keys(errors).length) return
    setBusy(true)
    try {
      // Check the latest stock and prices first, so the shop gets an accurate order.
      const data = await api.get(`/shops/${shop._id}`, location || {})
      onFresh?.(data) // keep the shop screen behind the sheet showing the same prices
      const fresh = reconcile(cart, data.products)
      if (fresh.changes.length) { setCart(fresh.cart); setChanges(fresh.changes); return }
      setChanges([])
      const text = orderMessage(cart, data.shop)
      track(shop._id, 'ORDER')
      if (whatsapp) {
        await Linking.openURL(whatsappOrderUrl(shop, text))
      } else {
        await Clipboard.setStringAsync(text)
        await Linking.openURL(`tel:${shop.phone}`)
      }
      setSent(text)
    } catch (e) {
      notify(e.message || 'Could not open WhatsApp', 'error')
    } finally {
      setBusy(false)
    }
  }

  const finish = () => { clear(); setSent(null); setSubmitted(false); setTouched({}); onClose() }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={type.h3}>Your order</Text>
            <Text style={type.muted} numberOfLines={1}>{shop.shopName}</Text>
          </View>
          <IconButton icon="close" label="Close" onPress={onClose} />
        </View>

        {sent ? (
          <ScrollView contentContainerStyle={{ padding: 20, gap: 14, alignItems: 'center' }}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
            <Text style={[type.h2, { textAlign: 'center' }]}>{whatsapp ? 'Order ready in WhatsApp' : 'Order copied: now call the shop'}</Text>
            <Text style={[type.muted, { textAlign: 'center' }]}>
              {whatsapp ? 'Press send in WhatsApp. The shop will reply to confirm items, total and timing. You pay the shop directly.'
                : 'This shop takes orders by phone. Your order is copied, so you can read it out or paste it into a message.'}
            </Text>
            <View style={styles.preview}><Text style={{ color: colors.text, fontSize: 13 }}>{sent}</Text></View>
            <Button variant="outline" icon={whatsapp ? 'logo-whatsapp' : 'call'} title={whatsapp ? 'Open WhatsApp again' : 'Call again'}
              onPress={() => Linking.openURL(whatsapp ? whatsappOrderUrl(shop, sent) : `tel:${shop.phone}`)} style={{ alignSelf: 'stretch' }} />
            <Button icon="checkmark" title="Done, start a new order" onPress={finish} style={{ alignSelf: 'stretch' }} />
          </ScrollView>
        ) : (
          <>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
              {changes.length > 0 && <Banner kind="warning">{`The shop just updated its list:\n• ${changes.join('\n• ')}\nCheck your order, then send again.`}</Banner>}
              {!shop.isOpen && <Banner kind="info">The shop is closed right now. You can still send; they’ll see it when they open.</Banner>}
              {t.lines === 0 && <Banner kind="info">Your order is empty. Add items from the shop’s list.</Banner>}

              {Object.values(cart.items).map((l) => (
                <View key={l.id} style={styles.line}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', color: colors.text }} numberOfLines={1}>{l.name}</Text>
                    <Text style={type.small}>{money(l.price)} / {l.unit} · {money(Math.round(l.price * l.qty * 100) / 100)}</Text>
                  </View>
                  <QtyStepper qty={l.qty} label={l.name} onChange={(q) => setCart(setQty(cart, l.id, q))} />
                </View>
              ))}

              <View style={{ gap: 8 }}>
                <Text style={{ fontWeight: '700', color: colors.text }}>How do you want it?</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {[['pickup', 'storefront-outline', 'Pickup', true], ['delivery', 'bicycle-outline', 'Home delivery', canDeliver]].map(([mode, icon, label, enabled]) => (
                    <Pressable key={mode} disabled={!enabled} onPress={() => setCart({ ...cart, mode })} accessibilityRole="radio" accessibilityState={{ checked: cart.mode === mode, disabled: !enabled }}
                      style={[styles.mode, cart.mode === mode && styles.modeOn, !enabled && { opacity: 0.45 }]}>
                      <Ionicons name={icon} size={18} color={cart.mode === mode ? '#fff' : colors.text} />
                      <Text style={{ fontWeight: '700', color: cart.mode === mode ? '#fff' : colors.text }}>{label}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={type.small}>
                  {!shop.homeDelivery ? 'This shop is pickup only.'
                    : !canDeliver ? `Delivers within ${shop.deliveryRadiusKm} km, which doesn’t reach your location.`
                      : `Delivery ${shop.deliveryCharge ? money(shop.deliveryCharge) : 'free'}${t.minOrder ? ` · minimum order ${money(t.minOrder)}` : ''}`}
                </Text>
                {cart.mode === 'delivery' && canDeliver && t.shortBy > 0 && (
                  <View style={{ gap: 4 }}>
                    <View style={styles.track}><View style={[styles.fill, { width: `${Math.min(100, (t.itemsTotal / t.minOrder) * 100)}%` }]} /></View>
                    <Text style={{ color: colors.warning, fontWeight: '700', fontSize: 13 }}>Add {money(t.shortBy)} more for delivery</Text>
                  </View>
                )}
                {show('mode') ? <Banner kind="error">{errors.mode}</Banner> : null}
              </View>

              {cart.mode === 'delivery' && (
                <Field label="Delivery address" required multiline value={cart.address} onChangeText={set('address')} onBlur={touch('address')}
                  placeholder="House no., street, area, landmark" error={show('address')} hint="Sent only to this shop, inside your WhatsApp message" maxLength={300} />
              )}
              <Field label="Your name (optional)" value={cart.name} onChangeText={set('name')} onBlur={touch('name')} autoComplete="name" error={show('name')} maxLength={60} />
              <Field label="Note for the shop (optional)" value={cart.note} onChangeText={set('note')} onBlur={touch('note')} placeholder="e.g. deliver after 6 pm" error={show('note')} hint={`${cart.note.length}/200`} maxLength={200} />
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
              <View style={styles.sumRow}><Text style={type.muted}>Items ({t.count})</Text><Text style={type.body}>{money(t.itemsTotal)}</Text></View>
              {cart.mode === 'delivery' && <View style={styles.sumRow}><Text style={type.muted}>Delivery</Text><Text style={type.body}>{t.delivery ? money(t.delivery) : 'Free'}</Text></View>}
              <View style={styles.sumRow}><Text style={{ fontWeight: '800', fontSize: 16, color: colors.text }}>Total</Text><Text style={{ fontWeight: '800', fontSize: 16, color: colors.text }}>{money(t.total)}</Text></View>
              {submitted && errors.items ? <Banner kind="error">{errors.items}</Banner> : null}
              <Button size="lg" variant={whatsapp ? 'whatsapp' : 'primary'} icon={whatsapp ? 'logo-whatsapp' : 'call'} loading={busy} disabled={!t.lines}
                title={busy ? 'Checking latest prices…' : whatsapp ? 'Send order on WhatsApp' : 'Copy order and call the shop'} onPress={send} />
              <Text style={[type.small, { textAlign: 'center' }]}>You pay the shop directly. The shop confirms availability and the final total.</Text>
              {t.lines > 0 && <Button size="sm" variant="ghost" title="Clear order" onPress={() => { clear(); setChanges([]) }} />}
            </View>
          </>
        )}
        {busy && <View style={styles.busy} pointerEvents="none"><ActivityIndicator color={colors.primary} /></View>}
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  barWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 12, paddingTop: 10, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 12, ...shadow },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.card },
  line: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 12 },
  mode: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card },
  modeOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.primary },
  footer: { padding: 16, gap: 8, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between' },
  preview: { alignSelf: 'stretch', backgroundColor: '#eef2f1', borderRadius: radius.md, padding: 12 },
  busy: { position: 'absolute', top: 12, right: 60 },
})
