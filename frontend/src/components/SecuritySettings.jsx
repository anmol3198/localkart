import { useState } from 'react'
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, Stack, Typography } from '@mui/material'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import { useNavigate } from 'react-router-dom'
import LockIcon from '@mui/icons-material/Lock'
import DevicesIcon from '@mui/icons-material/Devices'
import api, { errorMessage } from '../lib/api.js'
import { useAuth } from '../lib/auth.jsx'
import { useNotify } from '../lib/notify.jsx'
import { PASSWORD_MSG, isValidPassword, passwordStrength } from '../lib/validation.js'
import FormSection from './FormSection.jsx'
import PasswordField from './PasswordField.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'

const STRENGTH_COLOR = ['error', 'error', 'warning', 'success', 'success']
const empty = { currentPassword: '', newPassword: '', confirm: '' }

/** Change password, sign out other devices, or delete the shop. The first two replace this device's token with a fresh one. */
export default function SecuritySettings() {
  const { login } = useAuth()
  const notify = useNotify()
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const set = (key) => (e) => { setForm({ ...form, [key]: e.target.value }); setErrors({ ...errors, [key]: undefined }); setError('') }
  const strength = passwordStrength(form.newPassword)

  const changePassword = async (e) => {
    e.preventDefault()
    const found = {}
    if (!form.currentPassword) found.currentPassword = 'Enter your current password'
    if (!isValidPassword(form.newPassword)) found.newPassword = PASSWORD_MSG
    else if (form.newPassword === form.currentPassword) found.newPassword = 'New password must be different from the current one'
    if (form.confirm !== form.newPassword) found.confirm = "Passwords don't match"
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy('password')
    try {
      const { data } = await api.put('/vendor/password', { currentPassword: form.currentPassword, newPassword: form.newPassword })
      login(data.token)
      setForm(empty)
      notify('Password changed. Other devices have been logged out')
    } catch (err) {
      const msg = errorMessage(err)
      if (/current password/i.test(msg)) setErrors({ currentPassword: msg })
      else setError(msg)
    } finally {
      setBusy('')
    }
  }

  const logoutOthers = async () => {
    setConfirmOpen(false)
    setBusy('logout')
    try {
      const { data } = await api.post('/vendor/logout-all')
      login(data.token)
      notify('Logged out of all other devices')
    } catch (err) {
      notify(errorMessage(err), 'error')
    } finally {
      setBusy('')
    }
  }

  return (
    <FormSection icon={<LockIcon />} title="Password & security" subtitle="Keep your shop account safe">
      <Stack spacing={3}>
        <Box component="form" onSubmit={changePassword} noValidate>
          <Stack spacing={2} sx={{ maxWidth: 420 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Change password</Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <PasswordField label="Current password" autoComplete="current-password" value={form.currentPassword} onChange={set('currentPassword')}
              error={Boolean(errors.currentPassword)} helperText={errors.currentPassword} />
            <Box>
              <PasswordField label="New password" fullWidth autoComplete="new-password" value={form.newPassword} onChange={set('newPassword')}
                error={Boolean(errors.newPassword)} helperText={errors.newPassword || 'At least 8 characters, with letters and numbers'} />
              {form.newPassword && (
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mt: 1, px: 0.5 }}>
                  <LinearProgress variant="determinate" value={(strength.score / 4) * 100} color={STRENGTH_COLOR[strength.score]} sx={{ flex: 1, height: 6, borderRadius: 3 }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 64, color: `${STRENGTH_COLOR[strength.score]}.main` }}>{strength.label}</Typography>
                </Stack>
              )}
            </Box>
            <PasswordField label="Confirm new password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')}
              error={Boolean(errors.confirm)} helperText={errors.confirm} />
            <Button type="submit" variant="contained" disabled={busy === 'password'} startIcon={busy === 'password' ? <CircularProgress size={16} color="inherit" /> : <LockIcon />} sx={{ alignSelf: 'flex-start' }}>
              Change password
            </Button>
          </Stack>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, pt: 2.5, borderTop: 1, borderColor: 'divider' }}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Lost a phone or logged in somewhere else?</Typography>
            <Typography variant="body2" color="text.secondary">Log out everywhere except this device. You stay logged in here.</Typography>
          </Box>
          <Button variant="outlined" color="error" startIcon={busy === 'logout' ? <CircularProgress size={16} color="inherit" /> : <DevicesIcon />} disabled={busy === 'logout'} onClick={() => setConfirmOpen(true)} sx={{ flexShrink: 0 }}>
            Log out other devices
          </Button>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, pt: 2.5, borderTop: 1, borderColor: 'divider' }}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Delete my shop</Typography>
            <Typography variant="body2" color="text.secondary">Permanently removes your shop, all items and activity numbers. This can’t be undone.</Typography>
          </Box>
          <DeleteShopButton />
        </Stack>
      </Stack>
      <ConfirmDialog open={confirmOpen} title="Log out of all other devices?" danger confirmLabel="Log them out" onConfirm={logoutOthers} onClose={() => setConfirmOpen(false)}>
        Every other phone, tablet or browser will need to log in again with your password.
      </ConfirmDialog>
    </FormSection>
  )
}

/** Deletes the shop after the owner re-enters their password. */
function DeleteShopButton() {
  const { logout } = useAuth()
  const notify = useNotify()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const close = () => { if (!busy) { setOpen(false); setPassword(''); setError('') } }

  const remove = async (e) => {
    e.preventDefault()
    if (!password) return setError('Enter your password to confirm')
    setBusy(true)
    try {
      await api.post('/vendor/account/delete', { password })
      // Leave the owner-only page first, so its login guard doesn't redirect to the login form.
      navigate('/', { replace: true })
      logout()
      notify('Your shop has been deleted')
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <>
      <Button variant="contained" color="error" startIcon={<DeleteForeverIcon />} onClick={() => setOpen(true)} sx={{ flexShrink: 0 }}>Delete my shop</Button>
      <Dialog open={open} onClose={close} maxWidth="xs" fullWidth>
        <Box component="form" onSubmit={remove} noValidate>
          <DialogTitle>Delete your shop for good?</DialogTitle>
          <DialogContent>
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                Your shop disappears from LocalKart straight away, and your account, items and activity numbers are deleted. You can’t undo this. To list the shop again you’d need to register again.
              </Typography>
              <PasswordField label="Your password" autoFocus autoComplete="current-password" value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }} error={Boolean(error)} helperText={error} />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={close} disabled={busy}>Keep my shop</Button>
            <Button type="submit" variant="contained" color="error" disabled={busy} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <DeleteForeverIcon />}>Delete shop</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  )
}
