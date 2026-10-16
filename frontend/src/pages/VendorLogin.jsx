import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { Alert, Box, Button, CircularProgress, Divider, Link, Stack, TextField, Typography } from '@mui/material'
import LoginIcon from '@mui/icons-material/Login'
import api, { errorMessage } from '../lib/api.js'
import { useAuth } from '../lib/auth.jsx'
import { useNotify } from '../lib/notify.jsx'
import useTitle from '../lib/useTitle.js'
import AuthLayout from '../components/AuthLayout.jsx'
import { isValidEmail } from '../lib/validation.js'
import PasswordField from '../components/PasswordField.jsx'

export default function VendorLogin() {
  useTitle('Shop owner login')
  const { login } = useAuth()
  const notify = useNotify()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (key) => (e) => { setForm({ ...form, [key]: e.target.value }); setError('') }

  const submit = async (e) => {
    e.preventDefault()
    if (!isValidEmail(form.email.trim())) return setError('Enter a valid email, like name@gmail.com')
    if (!form.password) return setError('Enter your password')
    setBusy(true)
    try {
      const { data } = await api.post('/auth/login', { email: form.email.trim(), password: form.password })
      login(data.token)
      notify('Welcome back!')
      navigate('/vendor')
    } catch (err) {
      setError(err.response?.status === 401 ? 'Wrong email or password. Please try again.' : errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout maxWidth={880}>
      <Box component="form" onSubmit={submit} noValidate={false} sx={{ maxWidth: 400, mx: 'auto', py: { md: 4 } }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h4" component="h1">Welcome back</Typography>
            <Typography color="text.secondary">Log in to update your stock and shop details.</Typography>
          </Box>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Email" type="email" autoComplete="email" autoFocus required fullWidth value={form.email} onChange={set('email')} />
          <PasswordField label="Password" autoComplete="current-password" required fullWidth value={form.password} onChange={set('password')} />
          <Button type="submit" variant="contained" size="large" disabled={busy} startIcon={busy ? <CircularProgress size={18} color="inherit" /> : <LoginIcon />}>
            {busy ? 'Logging in…' : 'Log in'}
          </Button>
          {import.meta.env.DEV && (
            <Alert severity="info" variant="outlined">
              Demo account: <b>shop1@demo.local</b> / <b>demo1234</b>{' '}
              <Link component="button" type="button" onClick={() => setForm({ email: 'shop1@demo.local', password: 'demo1234' })}>Fill in</Link>
            </Alert>
          )}
          <Divider>New to LocalKart?</Divider>
          <Button variant="outlined" size="large" component={RouterLink} to="/vendor/register">Register your shop — it's free</Button>
        </Stack>
      </Box>
    </AuthLayout>
  )
}
