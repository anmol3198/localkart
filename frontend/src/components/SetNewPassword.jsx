import { useState } from 'react'
import { Alert, Box, Button, Card, CircularProgress, LinearProgress, Stack, Typography } from '@mui/material'
import LockResetIcon from '@mui/icons-material/LockReset'
import api, { errorMessage } from '../lib/api.js'
import { useAuth } from '../lib/auth.jsx'
import { PASSWORD_MSG, isValidPassword, passwordStrength } from '../lib/validation.js'
import PasswordField from './PasswordField.jsx'

const STRENGTH_COLOR = ['error', 'error', 'warning', 'success', 'success']

/** Shown instead of the dashboard after LocalKart staff issued a temporary password: the owner picks their own. */
export default function SetNewPassword({ shop, onDone }) {
  const { login, logout } = useAuth()
  const [form, setForm] = useState({ temp: '', next: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (key) => (e) => { setForm({ ...form, [key]: e.target.value }); setErrors({ ...errors, [key]: undefined }); setError('') }
  const strength = passwordStrength(form.next)

  const submit = async (e) => {
    e.preventDefault()
    const found = {}
    if (!form.temp) found.temp = 'Enter the temporary password you were given'
    if (!isValidPassword(form.next)) found.next = PASSWORD_MSG
    else if (form.next === form.temp) found.next = 'Choose a password different from the temporary one'
    if (form.confirm !== form.next) found.confirm = "Passwords don't match"
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy(true)
    try {
      const { data } = await api.put('/vendor/password', { currentPassword: form.temp, newPassword: form.next })
      login(data.token)
      onDone(data.shop)
    } catch (err) {
      const msg = errorMessage(err)
      if (/current password/i.test(msg)) setErrors({ temp: 'That’s not the temporary password. Check it, or ask LocalKart for a new one' })
      else setError(msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card sx={{ maxWidth: 480, mx: 'auto', p: { xs: 2.5, sm: 4 } }}>
      <Box component="form" onSubmit={submit} noValidate>
        <Stack spacing={2.5}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <LockResetIcon color="primary" sx={{ fontSize: 36 }} />
            <Box>
              <Typography variant="h5" component="h1">Choose your new password</Typography>
              <Typography variant="body2" color="text.secondary">{shop.shopName}</Typography>
            </Box>
          </Stack>
          <Typography color="text.secondary">
            You logged in with a temporary password from LocalKart. Set your own password to open your dashboard.
          </Typography>
          {error && <Alert severity="error">{error}</Alert>}
          <PasswordField label="Temporary password" autoComplete="current-password" value={form.temp} onChange={set('temp')}
            error={Boolean(errors.temp)} helperText={errors.temp} />
          <Box>
            <PasswordField label="New password" fullWidth autoComplete="new-password" value={form.next} onChange={set('next')}
              error={Boolean(errors.next)} helperText={errors.next || 'At least 8 characters, with letters and numbers'} />
            {form.next && (
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mt: 1, px: 0.5 }}>
                <LinearProgress variant="determinate" value={(strength.score / 4) * 100} color={STRENGTH_COLOR[strength.score]} sx={{ flex: 1, height: 6, borderRadius: 3 }} />
                <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 64, color: `${STRENGTH_COLOR[strength.score]}.main` }}>{strength.label}</Typography>
              </Stack>
            )}
          </Box>
          <PasswordField label="Confirm new password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')}
            error={Boolean(errors.confirm)} helperText={errors.confirm} />
          <Button type="submit" variant="contained" size="large" disabled={busy} startIcon={busy ? <CircularProgress size={18} color="inherit" /> : <LockResetIcon />}>
            Save and open dashboard
          </Button>
          <Button onClick={logout} disabled={busy}>Log out</Button>
        </Stack>
      </Box>
    </Card>
  )
}
