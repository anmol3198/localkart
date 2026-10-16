import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import api from '../../lib/api.js'
import { useAuth } from '../../lib/auth.jsx'
import { useToast } from '../../lib/toast.jsx'
import { confirm } from '../../lib/confirm.js'
import { PASSWORD_MSG, isValidPassword, passwordStrength } from '../../lib/validation.js'
import { colors, type } from '../../lib/theme.js'
import { Banner, Button, PasswordField, Section } from '../../components/ui.jsx'

const STRENGTH_COLOR = [colors.danger, colors.danger, colors.warning, colors.success, colors.success]
const empty = { currentPassword: '', newPassword: '', confirm: '' }

/** Change password and sign out other devices. Both give this device a fresh login token. */
export default function SecurityScreen() {
  const { login } = useAuth()
  const notify = useToast()
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const set = (key) => (v) => { setForm({ ...form, [key]: v }); setErrors({ ...errors, [key]: undefined }); setError('') }
  const strength = passwordStrength(form.newPassword)

  const changePassword = async () => {
    const found = {}
    if (!form.currentPassword) found.currentPassword = 'Enter your current password'
    if (!isValidPassword(form.newPassword)) found.newPassword = PASSWORD_MSG
    else if (form.newPassword === form.currentPassword) found.newPassword = 'New password must be different from the current one'
    if (form.confirm !== form.newPassword) found.confirm = "Passwords don't match"
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy('password')
    try {
      const data = await api.put('/vendor/password', { currentPassword: form.currentPassword, newPassword: form.newPassword })
      await login(data.token)
      setForm(empty)
      notify('Password changed. Other devices were logged out')
      router.back()
    } catch (e) {
      if (/current password/i.test(e.message)) setErrors({ currentPassword: e.message })
      else setError(e.message)
    } finally {
      setBusy('')
    }
  }

  const logoutOthers = async () => {
    if (!(await confirm('Log out of all other devices?', 'Every other phone, tablet or browser will need to log in again with your password.', 'Log them out'))) return
    setBusy('logout')
    try {
      const data = await api.post('/vendor/logout-all')
      await login(data.token)
      notify('Logged out of all other devices')
    } catch (e) {
      notify(e.message, 'error')
    } finally {
      setBusy('')
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
        <Section icon="lock-closed-outline" title="Change password" subtitle="Other devices are logged out when you change it">
          {error ? <Banner kind="error">{error}</Banner> : null}
          <PasswordField label="Current password" value={form.currentPassword} onChangeText={set('currentPassword')} autoComplete="current-password" error={errors.currentPassword} />
          <PasswordField label="New password" value={form.newPassword} onChangeText={set('newPassword')} autoComplete="new-password" error={errors.newPassword} hint="At least 8 characters, with letters and numbers" />
          {form.newPassword ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' }}>
                <View style={{ width: `${Math.max(8, (strength.score / 4) * 100)}%`, height: '100%', backgroundColor: STRENGTH_COLOR[strength.score] }} />
              </View>
              <Text style={{ fontSize: 12, fontWeight: '800', color: STRENGTH_COLOR[strength.score], minWidth: 60 }}>{strength.label}</Text>
            </View>
          ) : null}
          <PasswordField label="Confirm new password" value={form.confirm} onChangeText={set('confirm')} autoComplete="new-password" error={errors.confirm} />
          <Button icon="lock-closed" title="Change password" loading={busy === 'password'} onPress={changePassword} />
        </Section>

        <Section icon="phone-portrait-outline" title="Other devices" subtitle="Lost a phone or logged in somewhere else?">
          <Text style={type.muted}>Log out everywhere except this phone. You stay logged in here.</Text>
          <Button variant="outline" icon="log-out-outline" title="Log out other devices" loading={busy === 'logout'} onPress={logoutOthers} />
        </Section>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
