import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import api from '../../lib/api.js'
import { useAuth } from '../../lib/auth.jsx'
import { useToast } from '../../lib/toast.jsx'
import { colors, type } from '../../lib/theme.js'
import { Banner, Button, Field, PasswordField } from '../../components/ui.jsx'

export default function LoginScreen() {
  const { login } = useAuth()
  const notify = useToast()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (key) => (v) => { setForm({ ...form, [key]: v }); setError('') }

  const submit = async () => {
    if (!form.email.trim() || !form.password) return setError('Enter your email and password')
    setBusy(true)
    try {
      const data = await api.post('/auth/login', { email: form.email.trim(), password: form.password })
      await login(data.token)
      notify('Welcome back!')
      router.dismissTo('/owner')
    } catch (e) {
      setError(e.status === 401 ? 'Wrong email or password. Please try again.' : e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
        <View>
          <Text style={type.h1}>Welcome back</Text>
          <Text style={type.muted}>Log in to update your stock and shop details.</Text>
        </View>
        {error ? <Banner kind="error">{error}</Banner> : null}
        <Field label="Email" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" autoFocus />
        <PasswordField label="Password" value={form.password} onChangeText={set('password')} autoComplete="current-password" textContentType="password" onSubmitEditing={submit} returnKeyType="go" />
        <Button size="lg" icon="log-in-outline" title={busy ? 'Logging in…' : 'Log in'} loading={busy} onPress={submit} />
        {__DEV__ && (
          <Banner kind="info" action={<Text style={{ color: colors.primary, fontWeight: '800' }} onPress={() => setForm({ email: 'shop1@demo.local', password: 'demo1234' })}>Fill in</Text>}>
            Demo: shop1@demo.local / demo1234
          </Banner>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          <Text style={type.muted}>New to LocalKart?</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        </View>
        <Button size="lg" variant="outline" title="Register your shop — it's free" onPress={() => router.replace('/owner/register')} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
