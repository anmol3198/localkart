import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import { Stack, router, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as Haptics from 'expo-haptics'
import Ionicons from '@expo/vector-icons/Ionicons'
import api from '../../lib/api.js'
import { useToast } from '../../lib/toast.jsx'
import { colors, radius, shadow, type } from '../../lib/theme.js'
import { Button, EmptyState } from '../../components/ui.jsx'

const TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'itf14']
// Zoom is a fraction of the lens's maximum. A little zoom lets people hold the phone further away,
// where it can focus: newer iPhones can't focus on a barcode held very close.
const ZOOMS = [{ value: 0, label: '1×' }, { value: 0.04, label: 'Zoom' }, { value: 0.1, label: 'Zoom+' }]
const HINT_AFTER_MS = 8000

const buzz = (kind) => {
  if (Platform.OS === 'web') return
  Haptics.notificationAsync(kind).catch(() => {})
}

/**
 * Point the camera at a product barcode:
 * - already in the shop -> quick card to flip stock or edit
 * - new -> "Add item" opens with the code (and the product name when we can look it up) filled in
 */
export default function ScanScreen() {
  const insets = useSafeAreaInsets()
  const notify = useToast()
  const [permission, requestPermission] = useCameraPermissions()
  const [torch, setTorch] = useState(false)
  const [busy, setBusy] = useState(false)
  const [found, setFound] = useState(null) // existing item for the last scan
  const [manual, setManual] = useState('')
  const [typing, setTyping] = useState(false)
  const [active, setActive] = useState(true)
  const [zoom, setZoom] = useState(0)
  const [focus, setFocus] = useState('off') // iOS: 'off' = keep refocusing, 'on' = lock after focusing once
  const [slow, setSlow] = useState(false) // nothing read for a while: show tips
  const systemScanner = Platform.OS !== 'web' && CameraView.isModernBarcodeScannerAvailable
  const lastCode = useRef({ code: null, at: 0 })

  // Pause the camera while another screen (Add item) is open, resume on return.
  useFocusEffect(useCallback(() => {
    setActive(true)
    return () => setActive(false)
  }, []))

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) requestPermission()
  }, [permission, requestPermission])

  // If nothing has been read for a few seconds, show tips and the other ways to scan.
  useEffect(() => {
    if (!active || found || busy || typing) return
    const t = setTimeout(() => setSlow(true), HINT_AFTER_MS)
    return () => clearTimeout(t)
  }, [active, found, busy, typing, zoom])

  // Results from the phone's own scanner (Apple DataScanner / Google code scanner).
  const handleRef = useRef(null)
  useEffect(() => {
    if (!systemScanner) return
    const sub = CameraView.onModernBarcodeScanned((e) => {
      if (Platform.OS === 'ios') CameraView.dismissScanner().catch(() => {})
      setActive(true)
      handleRef.current?.(e.data)
    })
    return () => sub.remove()
  }, [systemScanner])

  const openSystemScanner = async () => {
    setActive(false) // free the camera for the system scanner
    try {
      await CameraView.launchScanner({ barcodeTypes: TYPES, isGuidanceEnabled: true, isHighlightingEnabled: true })
    } catch {
      notify("Your phone's scanner isn't available. Try zoom, or type the code", 'error')
    } finally {
      // Android returns once the scanner closes; on iOS the scanner closes itself when a code is read.
      if (Platform.OS === 'android') setActive(true)
    }
  }

  const refocus = () => {
    setFocus('on')
    setTimeout(() => setFocus('off'), 400)
  }

  const handle = async (raw) => {
    const code = String(raw || '').trim()
    if (!code || busy || found) return
    // The camera reports the same code many times a second; handle each code once.
    const now = Date.now()
    if (lastCode.current.code === code && now - lastCode.current.at < 2500) return
    lastCode.current = { code, at: now }
    setSlow(false)
    setBusy(true)
    try {
      const item = await api.get(`/vendor/products/barcode/${encodeURIComponent(code)}`)
      buzz(Haptics.NotificationFeedbackType.Success)
      setFound(item)
    } catch (e) {
      if (e.status !== 404) {
        buzz(Haptics.NotificationFeedbackType.Error)
        notify(e.message, 'error')
        return
      }
      buzz(Haptics.NotificationFeedbackType.Warning)
      // Not in the shop yet: try to suggest a name, then open Add item pre-filled.
      let s = null
      try { s = await api.get(`/vendor/barcode-lookup/${encodeURIComponent(code)}`) } catch { s = null }
      router.push({
        pathname: '/owner/item',
        params: { barcode: code, ...(s ? { name: s.name, section: s.section || '', description: s.quantity || '' } : {}), fromScan: '1' },
      })
    } finally {
      setBusy(false)
      setTyping(false)
      setManual('')
    }
  }

  const toggleStock = async () => {
    const next = !found.inStock
    setFound({ ...found, inStock: next })
    try {
      await api.put(`/vendor/products/${found._id}`, { inStock: next })
      notify(`${found.name} marked ${next ? 'in stock' : 'out of stock'}`)
    } catch (e) {
      setFound({ ...found, inStock: !next })
      notify(e.message, 'error')
    }
  }

  // Keep the latest handler for the system-scanner listener (set after render, not during it).
  useEffect(() => { handleRef.current = handle })

  const scanNext = () => { setFound(null); setSlow(false); lastCode.current = { code: null, at: 0 } }

  if (!permission) return <ActivityIndicator style={{ marginTop: 60 }} color={colors.primary} />

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 16 }}>
        <Stack.Screen options={{ title: 'Scan items' }} />
        <EmptyState
          icon="camera-outline"
          title="Allow the camera to scan barcodes"
          message="LocalKart only uses the camera while this screen is open, to read the barcode on a product."
          action={
            <View style={{ gap: 10, alignSelf: 'stretch' }}>
              {permission.canAskAgain
                ? <Button icon="camera" title="Allow camera" onPress={requestPermission} />
                : <Button icon="settings-outline" title="Open settings" onPress={() => Linking.openSettings()} />}
              <Button variant="outline" icon="keypad-outline" title="Type the barcode instead" onPress={() => setTyping(true)} />
            </View>
          }
        />
        {typing && <ManualEntry value={manual} onChange={setManual} onSubmit={() => handle(manual)} busy={busy} />}
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <Stack.Screen options={{ title: 'Scan items', headerStyle: { backgroundColor: '#000' }, headerTintColor: '#fff', headerTitleStyle: { color: '#fff', fontWeight: '700' } }} />
      {active && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={torch}
          zoom={zoom}
          autofocus={focus}
          barcodeScannerSettings={{ barcodeTypes: TYPES }}
          onBarcodeScanned={found || busy ? undefined : ({ data }) => handle(data)}
        />
      )}

      {/* Aiming frame; tap anywhere on the picture to refocus */}
      <Pressable onPress={refocus} style={StyleSheet.absoluteFill} accessibilityLabel="Tap to focus" />
      <View pointerEvents="none" style={styles.overlay}>
        <View style={styles.frame}>
          {[styles.tl, styles.tr, styles.bl, styles.br].map((c, i) => <View key={i} style={[styles.corner, c]} />)}
        </View>
        <Text style={styles.hint}>{busy ? 'Checking…' : 'Fit the barcode inside the box · tap to focus'}</Text>
      </View>

      <View style={[styles.controls, { top: 12 }]}>
        <Pressable onPress={() => setTorch((t) => !t)} style={styles.round} accessibilityRole="button" accessibilityLabel={torch ? 'Turn torch off' : 'Turn torch on'}>
          <Ionicons name={torch ? 'flashlight' : 'flashlight-outline'} size={22} color="#fff" />
        </Pressable>
        <Pressable
          onPress={() => setZoom((z) => ZOOMS[(ZOOMS.findIndex((x) => x.value === z) + 1) % ZOOMS.length].value)}
          style={[styles.round, zoom > 0 && { backgroundColor: colors.primary }]}
          accessibilityRole="button"
          accessibilityLabel="Change zoom"
        >
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>{ZOOMS.find((x) => x.value === zoom)?.label}</Text>
        </Pressable>
      </View>

      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        {busy && <ActivityIndicator color={colors.primary} />}
        {found ? (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="checkmark-circle" size={26} color={colors.success} />
              <View style={{ flex: 1 }}>
                <Text style={type.h3} numberOfLines={1}>{found.name}</Text>
                <Text style={type.muted}>₹{found.price} / {found.unit} · {found.category}</Text>
              </View>
            </View>
            <View style={[styles.stockRow, found.inStock ? { backgroundColor: colors.successSoft } : { backgroundColor: colors.dangerSoft }]}>
              <Text style={{ flex: 1, fontWeight: '700', color: found.inStock ? colors.success : colors.danger }}>{found.inStock ? 'In stock' : 'Out of stock'}</Text>
              <Switch value={found.inStock} onValueChange={toggleStock} trackColor={{ true: colors.success, false: '#cfd8d5' }} thumbColor="#fff" accessibilityLabel="In stock" />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button flex variant="outline" icon="create-outline" title="Edit" onPress={() => { const id = found._id; scanNext(); router.push({ pathname: '/owner/item', params: { id } }) }} />
              <Button flex icon="scan-outline" title="Scan next" onPress={scanNext} />
            </View>
          </View>
        ) : typing ? (
          <ManualEntry value={manual} onChange={setManual} onSubmit={() => handle(manual)} busy={busy} />
        ) : (
          <View style={{ gap: 10 }}>
            {slow ? (
              <View style={styles.tips}>
                <Text style={{ fontWeight: '700', color: colors.text }}>Not reading? Try this:</Text>
                <Text style={type.muted}>• Hold the phone 15–20 cm away and tap <Text style={{ fontWeight: '700' }}>Zoom</Text>, so the camera can focus</Text>
                <Text style={type.muted}>• Keep the barcode flat, straight and well lit (try the torch)</Text>
                <Text style={type.muted}>• Tap the picture to focus again</Text>
              </View>
            ) : (
              <Text style={[type.muted, { textAlign: 'center' }]}>Scan an item to update its stock, or a new product to add it.</Text>
            )}
            {systemScanner && <Button icon="scan-circle-outline" title="Use phone's scanner" onPress={openSystemScanner} />}
            <Button variant="outline" icon="keypad-outline" title="Type the barcode instead" onPress={() => setTyping(true)} />
          </View>
        )}
      </View>
    </View>
  )
}

function ManualEntry({ value, onChange, onSubmit, busy }) {
  return (
    <View style={{ gap: 10, marginTop: 8 }}>
      <View style={styles.input}>
        <Ionicons name="barcode-outline" size={20} color={colors.textMuted} />
        <TextInput
          style={{ flex: 1, fontSize: 17, color: colors.text, letterSpacing: 1, outlineStyle: 'none' }}
          value={value}
          onChangeText={(t) => onChange(t.replace(/[^0-9A-Za-z-]/g, ''))}
          placeholder="e.g. 8901058000290"
          placeholderTextColor={colors.textFaint}
          keyboardType="number-pad"
          autoFocus
          maxLength={32}
          onSubmitEditing={onSubmit}
          returnKeyType="search"
        />
      </View>
      <Button icon="search" title="Find item" loading={busy} disabled={value.trim().length < 4} onPress={onSubmit} />
    </View>
  )
}

const CORNER = 26
const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', paddingBottom: 160 },
  frame: { width: 270, height: 170 },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: '#fff' },
  tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 12 },
  tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 12 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 12 },
  br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 12 },
  hint: { color: '#fff', fontWeight: '700', marginTop: 18, backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, overflow: 'hidden' },
  controls: { position: 'absolute', right: 12, gap: 10 },
  tips: { backgroundColor: colors.warningSoft, borderRadius: radius.md, padding: 12, gap: 4 },
  round: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, gap: 10, ...shadow },
  stockRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: radius.md },
  input: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.md, paddingHorizontal: 12, height: 52 },
})
