import { useState } from 'react'
import { Alert, AlertTitle, Button, CircularProgress } from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import api, { errorMessage } from '../lib/api.js'
import { useNotify } from '../lib/notify.jsx'
import { formatPhone } from '../lib/validation.js'

const sentence = (s) => (/[.!?]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`)

/** Tells the owner where their shop is in review, and lets them resubmit after a rejection. */
export default function ShopStatusBanner({ shop, onChange, onFix }) {
  const notify = useNotify()
  const [busy, setBusy] = useState(false)

  const resubmit = async () => {
    setBusy(true)
    try {
      const { data } = await api.post('/vendor/shop/resubmit')
      onChange(data)
      notify('Sent for review again. We usually check within a day.')
    } catch (e) {
      notify(errorMessage(e), 'error')
    } finally {
      setBusy(false)
    }
  }

  if (shop.status === 'PENDING') {
    return (
      <Alert severity="warning" variant="outlined" sx={{ bgcolor: 'background.paper' }}>
        <AlertTitle sx={{ fontWeight: 700 }}>Your shop is waiting for review</AlertTitle>
        LocalKart checks every new shop so customers only see real ones. We may call {formatPhone(shop.phone)} to confirm. Meanwhile, add your items:
        they'll be ready the moment your shop goes live.
      </Alert>
    )
  }
  if (shop.status === 'REJECTED') {
    return (
      <Alert
        severity="error" variant="outlined" sx={{ bgcolor: 'background.paper' }}
        action={
          <>
            {onFix && <Button color="inherit" size="small" onClick={onFix}>Edit details</Button>}
            <Button color="inherit" size="small" variant="outlined" disabled={busy} onClick={resubmit} startIcon={busy ? <CircularProgress size={14} color="inherit" /> : <SendIcon />}>
              Send for review
            </Button>
          </>
        }
      >
        <AlertTitle sx={{ fontWeight: 700 }}>Your shop wasn't approved yet</AlertTitle>
        {shop.reviewNote ? <><b>What to fix:</b> {sentence(shop.reviewNote)}</> : 'Please check your shop details.'} Update your details, then send it for review again.
      </Alert>
    )
  }
  if (shop.status === 'SUSPENDED') {
    return (
      <Alert severity="error" sx={{ alignItems: 'center' }}>
        <AlertTitle sx={{ fontWeight: 700 }}>Your shop is suspended and hidden from customers</AlertTitle>
        {shop.reviewNote && <><b>Reason:</b> {sentence(shop.reviewNote)} </>}Changes are paused. Contact LocalKart support to sort it out.
      </Alert>
    )
  }
  return null
}
