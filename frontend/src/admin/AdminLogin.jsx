import { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CircularProgress, Stack, TextField, Typography } from '@mui/material'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import adminApi from './adminApi.js'
import { useAdminAuth } from './AdminAuth.jsx'
import { errorMessage } from '../lib/api.js'
import PasswordField from '../components/PasswordField.jsx'

export default function AdminLogin() {
  const { login } = useAdminAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setError('') }

  useEffect(() => {
    document.title = 'Sign in · LocalKart Admin'
    // Keep the staff sign-in out of search engines too.
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (!form.email.trim() || !form.password) return setError('Enter your email and password')
    setBusy(true)
    try {
      const { data } = await adminApi.post('/auth/login', { email: form.email.trim(), password: form.password })
      login(data.token, data.admin)
    } catch (err) {
      setError(err.response?.status === 401 ? 'Wrong email or password' : errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2, background: 'linear-gradient(160deg, #053d30, #0b6e55)' }}>
      <Card component="form" onSubmit={submit} sx={{ width: '100%', maxWidth: 400, p: 4 }}>
        <Stack spacing={2.5}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: 'primary.main', color: '#fff', display: 'grid', placeItems: 'center' }}>
              <AdminPanelSettingsIcon />
            </Box>
            <Box>
              <Typography variant="h5" component="h1">LocalKart Admin</Typography>
              <Typography variant="body2" color="text.secondary">Staff only</Typography>
            </Box>
          </Stack>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Email" type="email" autoComplete="username" autoFocus value={form.email} onChange={set('email')} />
          <PasswordField label="Password" autoComplete="current-password" value={form.password} onChange={set('password')} />
          <Button type="submit" variant="contained" size="large" disabled={busy} startIcon={busy && <CircularProgress size={18} color="inherit" />}>
            Sign in
          </Button>
        </Stack>
      </Card>
    </Box>
  )
}
