import { useEffect, useState } from 'react'
import { ActivityIndicator, Platform, ScrollView, Share, StyleSheet, Text, View } from 'react-native'
import { SvgXml } from 'react-native-svg'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import api from '../../lib/api.js'
import { useToast } from '../../lib/toast.jsx'
import { isDevUrl, posterHtml, qrSvg, shopWebUrl } from '../../lib/poster.js'
import { colors, radius, shadow, type } from '../../lib/theme.js'
import { Banner, Button } from '../../components/ui.jsx'

/** A QR poster for the shop counter: customers scan it to open the shop page. */
export default function PosterScreen() {
  const notify = useToast()
  const [shop, setShop] = useState(null)
  const [svg, setSvg] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')

  useEffect(() => {
    let alive = true
    api.get('/vendor/shop')
      .then(async (s) => {
        const code = await qrSvg(shopWebUrl(s._id))
        if (alive) { setShop(s); setSvg(code) }
      })
      .catch((e) => alive && setError(e.message))
    return () => { alive = false }
  }, [])

  if (error) return <View style={{ padding: 16 }}><Banner kind="error">{error}</Banner></View>
  if (!shop || !svg) return <ActivityIndicator style={{ marginTop: 48 }} color={colors.primary} />
  if (shop.status && shop.status !== 'APPROVED') {
    return <View style={{ padding: 16 }}><Banner kind="info">Your QR poster will be ready once your shop is approved and live.</Banner></View>
  }

  const url = shopWebUrl(shop._id)
  const html = posterHtml({ shop, url, svg })

  const print = async () => {
    setBusy('print')
    try { await Print.printAsync({ html }) } catch (e) { if (!/cancel/i.test(String(e?.message))) notify('Could not open printing', 'error') } finally { setBusy('') }
  }

  const sharePdf = async () => {
    setBusy('pdf')
    try {
      const { uri } = await Print.printToFileAsync({ html })
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share shop poster', UTI: 'com.adobe.pdf' })
      else notify('Sharing is not available on this device', 'error')
    } catch {
      notify('Could not create the poster PDF', 'error')
    } finally {
      setBusy('')
    }
  }

  const shareLink = () => Share.share({ message: `See what's in stock at ${shop.shopName} and order on WhatsApp: ${url.replace(/\?.*$/, '')}` }).catch(() => {})

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
      <View style={{ gap: 4 }}>
        <Text style={type.h2}>Your shop QR poster</Text>
        <Text style={type.muted}>Stick it at your counter or door. Customers scan it to see your items and call or WhatsApp you.</Text>
      </View>
      {isDevUrl(url) && (
        <Banner kind="warning">This QR points to the test website on your computer. After the website goes live, set its address (EXPO_PUBLIC_WEB_URL) before printing posters for customers.</Banner>
      )}

      <View style={styles.poster}>
        <View style={styles.top}>
          <Text style={{ color: '#fff', fontWeight: '800', opacity: 0.9 }}>Local<Text style={{ color: colors.accentLight }}>Kart</Text></Text>
          <Text style={styles.name} numberOfLines={2}>{shop.shopName}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.85)' }} numberOfLines={1}>{shop.category} · {shop.address}</Text>
        </View>
        <Text style={styles.cta}>{"Scan to see what's in stock"}</Text>
        <Text style={[type.muted, { textAlign: 'center' }]}>Check prices, then call or WhatsApp to order.</Text>
        <View style={styles.qr}><SvgXml xml={svg} width="100%" height="100%" /></View>
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>{shop.phone}</Text>
        <Text style={[type.small, { textAlign: 'center' }]} numberOfLines={2}>{url.replace(/\?.*$/, '')}</Text>
      </View>

      <Button size="lg" icon="print-outline" title="Print poster" loading={busy === 'print'} onPress={print} />
      {Platform.OS !== 'web' && <Button size="lg" variant="outline" icon="document-outline" title="Save / share as PDF" loading={busy === 'pdf'} onPress={sharePdf} />}
      <Button variant="ghost" icon="share-social-outline" title="Share shop link instead" onPress={shareLink} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  poster: { backgroundColor: '#fff', borderRadius: radius.xl, padding: 16, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.border, ...shadow },
  top: { alignSelf: 'stretch', backgroundColor: colors.primary, borderRadius: radius.lg, padding: 16, alignItems: 'center', gap: 4 },
  name: { color: '#fff', fontSize: 24, fontWeight: '800', textAlign: 'center' },
  cta: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 8, textAlign: 'center' },
  qr: { width: 220, height: 220, padding: 8, borderWidth: 4, borderColor: colors.primary, borderRadius: 20, marginVertical: 8 },
})
