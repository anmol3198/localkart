import { useEffect, useState } from 'react'
import {
  Alert, Button, Card, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, Switch,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip,
} from '@mui/material'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import adminApi from './adminApi.js'
import { useAdminAuth } from './AdminAuth.jsx'
import { errorMessage } from '../lib/api.js'
import { useNotify } from '../lib/notify.jsx'
import { EMAIL_MSG, isValidEmail } from '../lib/validation.js'
import PasswordField from '../components/PasswordField.jsx'
import { PageHeader, fmtDate } from './bits.jsx'

const PASSWORD = /^(?=.*[A-Za-z])(?=.*\d)\S.{8,70}\S$/
const empty = { name: '', email: '', password: '', role: 'ADMIN' }

/** Super admins add and deactivate staff accounts. */
export default function AdminUsers() {
  const { admin: me } = useAdminAuth()
  const notify = useNotify()
  const [list, setList] = useState(null)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const load = () => adminApi.get('/admins').then(({ data }) => setList(data)).catch((e) => setError(errorMessage(e)))
  useEffect(() => { load() }, [])

  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setErrors({ ...errors, [k]: undefined }) }

  const create = async () => {
    const found = {}
    if (form.name.trim().length < 2) found.name = 'Enter their name'
    if (!isValidEmail(form.email.trim())) found.email = EMAIL_MSG
    if (!PASSWORD.test(form.password)) found.password = '10-72 characters with letters and numbers'
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy(true)
    try {
      await adminApi.post('/admins', { ...form, email: form.email.trim(), name: form.name.trim() })
      notify(`${form.name.trim()} can now sign in`)
      setOpen(false)
      setForm(empty)
      load()
    } catch (e) {
      const msg = errorMessage(e)
      if (/email/i.test(msg)) setErrors({ email: msg })
      else notify(msg, 'error')
    } finally {
      setBusy(false)
    }
  }

  const toggle = async (a) => {
    try {
      await adminApi.put(`/admins/${a.id}/active`, { active: !a.active })
      notify(a.active ? `${a.name} is deactivated and signed out` : `${a.name} can sign in again`)
      load()
    } catch (e) {
      notify(errorMessage(e), 'error')
    }
  }

  return (
    <>
      <PageHeader title="Admins" subtitle="Staff who can review and manage shops. Only super admins see this page."
        action={<Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => setOpen(true)}>Add admin</Button>} />
      {error && <Alert severity="error">{error}</Alert>}
      {!list && !error && <CircularProgress />}
      {list && (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, color: 'text.secondary', bgcolor: 'action.hover' } }}>
                  <TableCell>Name</TableCell><TableCell>Email</TableCell><TableCell>Role</TableCell><TableCell>Last sign-in</TableCell><TableCell align="center">Active</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {list.map((a) => (
                  <TableRow key={a.id} sx={{ opacity: a.active ? 1 : 0.55 }}>
                    <TableCell sx={{ fontWeight: 600 }}>{a.name}{a.id === me?.id && <Chip size="small" label="You" sx={{ ml: 1 }} />}</TableCell>
                    <TableCell>{a.email}</TableCell>
                    <TableCell><Chip size="small" variant="outlined" color={a.role === 'SUPER_ADMIN' ? 'secondary' : 'default'} label={a.role === 'SUPER_ADMIN' ? 'Super admin' : 'Admin'} /></TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(a.lastLoginAt)}</TableCell>
                    <TableCell align="center">
                      <Tooltip title={a.id === me?.id ? "You can't deactivate yourself" : a.active ? 'Deactivate (signs them out now)' : 'Reactivate'}>
                        <span><Switch checked={a.active} disabled={a.id === me?.id} onChange={() => toggle(a)} slotProps={{ input: { 'aria-label': `${a.name} active` } }} /></span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Add an admin</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Name" value={form.name} onChange={set('name')} error={Boolean(errors.name)} helperText={errors.name} />
            <TextField label="Email" type="email" value={form.email} onChange={set('email')} error={Boolean(errors.email)} helperText={errors.email} />
            <PasswordField label="Temporary password" autoComplete="new-password" value={form.password} onChange={set('password')}
              error={Boolean(errors.password)} helperText={errors.password || 'Share it privately; they can change it after signing in'} />
            <TextField select label="Role" value={form.role} onChange={set('role')}
              helperText={form.role === 'SUPER_ADMIN' ? 'Can also add and remove admins' : 'Can review shops and see the dashboard'}>
              <MenuItem value="ADMIN">Admin</MenuItem>
              <MenuItem value="SUPER_ADMIN">Super admin</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={create} disabled={busy}>Add admin</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
