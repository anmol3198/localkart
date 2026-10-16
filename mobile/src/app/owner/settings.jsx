import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import api from '../../lib/api.js'
import { useToast } from '../../lib/toast.jsx'
import { cleanShop, shopToForm, validateShop } from '../../lib/shop.js'
import { colors } from '../../lib/theme.js'
import { Banner, Button } from '../../components/ui.jsx'
import ShopForm from '../../components/ShopForm.jsx'

export default function SettingsScreen() {
  const insets = useSafeAreaInsets()
  const notify = useToast()
  const [initial, setInitial] = useState(null)
  const [form, setForm] = useState(null)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.get('/vendor/shop').then((s) => { const f = shopToForm(s); setInitial(f); setForm(f) }).catch((e) => setError(e.message))
  }, [])

  const dirty = useMemo(() => form && JSON.stringify(form) !== JSON.stringify(initial), [form, initial])

  const save = async () => {
    const found = validateShop(form)
    setErrors(found)
    if (Object.keys(found).length) return notify('Please fix the highlighted fields', 'error')
    setBusy(true)
    try {
      const saved = shopToForm(await api.put('/vendor/shop', cleanShop(form)))
      setInitial(saved)
      setForm(saved)
      setError('')
      notify('Shop details saved')
      router.back()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (!form) return error ? <View style={{ padding: 16 }}><Banner kind="error">{error}</Banner></View> : <ActivityIndicator style={{ marginTop: 48 }} color={colors.primary} />

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
        {error ? <Banner kind="error">{error}</Banner> : null}
        <ShopForm value={form} onChange={setForm} errors={errors} />
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        {dirty ? (
          <>
            <Button variant="outline" title="Discard" disabled={busy} onPress={() => { setForm(initial); setErrors({}) }} />
            <Button flex size="lg" icon="checkmark" loading={busy} title="Save changes" onPress={save} />
          </>
        ) : (
          <Text style={{ flex: 1, textAlign: 'center', color: colors.textMuted, paddingVertical: 12 }}>All changes saved</Text>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', gap: 10, padding: 12, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
})
