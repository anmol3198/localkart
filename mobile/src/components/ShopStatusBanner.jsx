import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import api from '../lib/api.js'
import { useToast } from '../lib/toast.jsx'
import { formatPhone } from '../lib/validation.js'
import { colors, radius } from '../lib/theme.js'
import { Button } from './ui.jsx'

const sentence = (s) => (/[.!?]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`)

/** Where the shop is in LocalKart's review; lets the owner resubmit after a rejection. */
export default function ShopStatusBanner({ shop, onChange, onFix }) {
  const notify = useToast()
  const [busy, setBusy] = useState(false)

  const resubmit = async () => {
    setBusy(true)
    try {
      onChange(await api.post('/vendor/shop/resubmit'))
      notify('Sent for review again. We usually check within a day.')
    } catch (e) {
      notify(e.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  if (shop.status === 'PENDING') {
    return (
      <View style={[styles.box, { backgroundColor: colors.warningSoft, borderColor: '#f5d9a8' }]}>
        <View style={styles.title}><Ionicons name="hourglass-outline" size={20} color={colors.warning} /><Text style={[styles.titleText, { color: colors.warning }]}>Waiting for review</Text></View>
        <Text style={styles.body}>LocalKart checks every new shop so customers only see real ones. We may call {formatPhone(shop.phone)} to confirm. Add your items meanwhile: they’ll be ready when your shop goes live.</Text>
      </View>
    )
  }
  if (shop.status === 'REJECTED') {
    return (
      <View style={[styles.box, { backgroundColor: colors.dangerSoft, borderColor: '#f6c7c7' }]}>
        <View style={styles.title}><Ionicons name="alert-circle" size={20} color={colors.danger} /><Text style={[styles.titleText, { color: colors.danger }]}>Your shop wasn’t approved yet</Text></View>
        <Text style={styles.body}>
          {shop.reviewNote ? <><Text style={{ fontWeight: '800' }}>What to fix: </Text>{sentence(shop.reviewNote)} </> : 'Please check your shop details. '}
          Update your details, then send it for review again.
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {onFix && <Button flex size="sm" variant="outline" icon="create-outline" title="Edit details" onPress={onFix} />}
          <Button flex size="sm" icon="send" title="Send for review" loading={busy} onPress={resubmit} />
        </View>
      </View>
    )
  }
  if (shop.status === 'SUSPENDED') {
    return (
      <View style={[styles.box, { backgroundColor: colors.dangerSoft, borderColor: '#f6c7c7' }]}>
        <View style={styles.title}><Ionicons name="ban" size={20} color={colors.danger} /><Text style={[styles.titleText, { color: colors.danger }]}>Shop suspended and hidden</Text></View>
        <Text style={styles.body}>{shop.reviewNote ? `Reason: ${sentence(shop.reviewNote)} ` : ''}Changes are paused. Contact LocalKart support to sort it out.</Text>
      </View>
    )
  }
  return null
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: radius.lg, padding: 14, gap: 10 },
  title: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleText: { fontWeight: '800', fontSize: 15 },
  body: { color: colors.text, fontSize: 14, lineHeight: 20 },
})
