import { useState } from 'react'
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material'
import KeyIcon from '@mui/icons-material/Key'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import PhoneIcon from '@mui/icons-material/Phone'
import adminApi from './adminApi.js'
import { errorMessage } from '../lib/api.js'
import { formatPhone, isMobile } from '../lib/validation.js'
import { useNotify } from '../lib/notify.jsx'

/**
 * Forgotten shop password: issues a one-time temporary password for the admin to pass on by phone or WhatsApp.
 * The owner is logged out everywhere and must choose their own password at the next login.
 */
export default function ResetShopPassword({ shop }) {
  const notify = useNotify()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const close = () => { if (!busy) { setOpen(false); setResult(null); setError('') } }

  const reset = async () => {
    setBusy(true)
    setError('')
    try {
      const { data } = await adminApi.post(`/shops/${shop.id}/reset-password`)
      setResult(data)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.temporaryPassword)
      notify('Temporary password copied')
    } catch {
      notify('Could not copy. Select the password and copy it', 'error')
    }
  }

  const message = result && `Hi ${result.ownerName}, your temporary LocalKart password is: ${result.temporaryPassword}\n\nLog in at https://localkart.pages.dev/vendor/login (or in the app) with your email and this password. You'll then be asked to choose your own password.`

  return (
    <>
      <Button variant="outlined" startIcon={<KeyIcon />} onClick={() => setOpen(true)}>Reset password</Button>
      <Dialog open={open} onClose={close} maxWidth="xs" fullWidth>
        {!result ? (
          <>
            <DialogTitle>Reset this shop’s password?</DialogTitle>
            <DialogContent>
              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  Use this when <b>{shop.ownerName}</b> has forgotten their password. You’ll get a one-time temporary password to give them.
                  They’re logged out on every device and must choose a new password when they log in.
                </Typography>
                <Alert severity="warning" icon={false}>
                  First make sure it’s really the owner: call them on the shop’s number, <b>{formatPhone(shop.phone)}</b>, rather than trusting a message from another number.
                </Alert>
                {error && <Alert severity="error">{error}</Alert>}
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={close} disabled={busy}>Cancel</Button>
              <Button variant="contained" onClick={reset} disabled={busy} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <KeyIcon />}>Create temporary password</Button>
            </DialogActions>
          </>
        ) : (
          <>
            <DialogTitle>Temporary password for {result.shopName}</DialogTitle>
            <DialogContent>
              <Stack spacing={2}>
                <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(11,110,85,0.08)', textAlign: 'center' }}>
                  <Typography component="p" aria-label="Temporary password" sx={{ fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontSize: 30, fontWeight: 700, letterSpacing: 3, userSelect: 'all' }}>
                    {result.temporaryPassword}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  This is shown only once. Give it to {result.ownerName} on a call or WhatsApp; they’ll choose their own password when they log in.
                </Typography>
                <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 1 }}>
                  <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={copy}>Copy</Button>
                  {isMobile(result.phone) && (
                    <Button variant="contained" color="success" startIcon={<WhatsAppIcon />} href={`https://wa.me/91${result.phone}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener">
                      Send on WhatsApp
                    </Button>
                  )}
                  <Button variant="outlined" startIcon={<PhoneIcon />} href={`tel:${result.phone}`}>Call {formatPhone(result.phone)}</Button>
                </Stack>
                <Typography variant="caption" color="text.secondary">Recorded in the audit log, without the password.</Typography>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button variant="contained" onClick={close}>Done</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  )
}
