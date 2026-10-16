import { useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import api from '../../lib/api.js'
import { useAuth } from '../../lib/auth.jsx'
import { useToast } from '../../lib/toast.jsx'
import { EMAIL, emptyShop, validateShop } from '../../lib/shop.js'
import { colors, type } from '../../lib/theme.js'
import { Banner, Button, Field, PasswordField, Section } from '../../components/ui.jsx'
import ShopForm from '../../components/ShopForm.jsx'

const STEPS = ['Account', 'Shop', 'Location', 'Delivery']
const SECTIONS = [null, ['details'], ['location'], ['delivery']]

function validateAccount(a) {
  const e = {}
  if (!a.ownerName.trim()) e.ownerName = 'Your name is required'
  if (!EMAIL.test(a.email.trim())) e.email = 'Enter a valid email'
  if (a.password.length < 6) e.password = 'Use at least 6 characters'
  return e
}

function Steps({ step }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
      {STEPS.map((label, i) => {
        const done = i < step
        const active = i === step
        return (
          <View key={label} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
              <View style={[styles.line, { opacity: i === 0 ? 0 : 1 }, (done || active) && { backgroundColor: colors.primary }]} />
              <View style={[styles.dot, (done || active) && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                {done ? <Ionicons name="checkmark" size={14} color="#fff" /> : <Text style={{ color: active ? '#fff' : colors.textMuted, fontWeight: '800', fontSize: 12 }}>{i + 1}</Text>}
              </View>
              <View style={[styles.line, { opacity: i === STEPS.length - 1 ? 0 : 1 }, done && { backgroundColor: colors.primary }]} />
            </View>
            <Text style={{ fontSize: 12, fontWeight: active ? '800' : '600', color: active ? colors.text : colors.textMuted }}>{label}</Text>
          </View>
        )
      })}
    </View>
  )
}

export default function RegisterScreen() {
  const insets = useSafeAreaInsets()
  const { login } = useAuth()
  const notify = useToast()
  const scroll = useRef(null)
  const [step, setStep] = useState(0)
  const [account, setAccount] = useState({ ownerName: '', email: '', password: '' })
  const [shop, setShop] = useState(emptyShop)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const last = step === STEPS.length - 1
  const setAcc = (key) => (v) => setAccount({ ...account, [key]: v })
  const toTop = () => scroll.current?.scrollTo({ y: 0, animated: true })

  const next = async () => {
    const found = step === 0 ? validateAccount(account) : validateShop(shop, SECTIONS[step])
    setErrors(found)
    if (Object.keys(found).length) return toTop()
    if (!last) { setStep(step + 1); toTop(); return }
    setBusy(true)
    setError('')
    try {
      const data = await api.post('/auth/register', { ...account, email: account.email.trim(), ...shop })
      await login(data.token)
      notify('Your shop is live! Now add the items you sell.')
      router.dismissTo('/owner')
    } catch (e) {
      setError(e.message)
      // Most sign-up failures (e.g. email already registered) are fixed on the first step.
      if (/email|password|owner/i.test(e.message)) setStep(0)
      toTop()
    } finally {
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView ref={scroll} contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
        <View>
          <Text style={type.h2}>Register your shop</Text>
          <Text style={type.muted}>Takes about 2 minutes. You can change everything later.</Text>
        </View>
        <Steps step={step} />
        {error ? <Banner kind="error">{error}</Banner> : null}
        {step === 0 && (
          <Section icon="person-outline" title="Owner account" subtitle="You'll use this email and password to log in">
            <Field label="Your name" required value={account.ownerName} onChangeText={setAcc('ownerName')} autoComplete="name" error={errors.ownerName} />
            <Field label="Email" required value={account.email} onChangeText={setAcc('email')} keyboardType="email-address" autoCapitalize="none" autoComplete="email" error={errors.email} />
            <PasswordField label="Password" required value={account.password} onChangeText={setAcc('password')} autoComplete="new-password" error={errors.password} hint="At least 6 characters" />
          </Section>
        )}
        {step > 0 && <ShopForm value={shop} onChange={setShop} errors={errors} sections={SECTIONS[step]} />}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        {step > 0 && <Button variant="outline" icon="arrow-back" title="Back" onPress={() => { setErrors({}); setStep(step - 1); toTop() }} />}
        <Button flex size="lg" iconRight={last ? 'checkmark' : 'arrow-forward'} loading={busy} title={last ? (busy ? 'Creating your shop…' : 'Create my shop') : 'Continue'} onPress={next} />
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  dot: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  line: { flex: 1, height: 2, backgroundColor: colors.border },
  footer: { flexDirection: 'row', gap: 10, padding: 12, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
})
