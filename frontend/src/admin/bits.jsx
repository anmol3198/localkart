import { useState } from 'react'
import { Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Stack, TextField, Typography } from '@mui/material'
import HourglassTopIcon from '@mui/icons-material/HourglassTop'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import BlockIcon from '@mui/icons-material/Block'

const STATUS = {
  PENDING: { label: 'Waiting for review', color: 'warning', icon: <HourglassTopIcon /> },
  APPROVED: { label: 'Live', color: 'success', icon: <CheckCircleIcon /> },
  REJECTED: { label: 'Rejected', color: 'error', icon: <CancelIcon /> },
  SUSPENDED: { label: 'Suspended', color: 'error', icon: <BlockIcon /> },
}

/** Status with icon + words, never colour alone. */
export function StatusChip({ status, size = 'small' }) {
  const s = STATUS[status] || STATUS.PENDING
  return <Chip size={size} icon={s.icon} color={s.color} variant="outlined" label={s.label} />
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-end' }, mb: 3 }}>
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontSize: { xs: '1.6rem', sm: '2rem' } }}>{title}</Typography>
        {subtitle && <Typography color="text.secondary">{subtitle}</Typography>}
      </Box>
      {action}
    </Stack>
  )
}

export function Tile({ label, value, hint, icon, tone = '#0e8c66', onClick }) {
  return (
    <Card onClick={onClick} sx={{ p: 2.25, cursor: onClick ? 'pointer' : 'default', transition: 'border-color .2s', '&:hover': onClick ? { borderColor: tone } : undefined }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Box sx={{ width: 44, height: 44, borderRadius: '12px', display: 'grid', placeItems: 'center', color: tone, bgcolor: `${tone}1f`, flexShrink: 0 }}>{icon}</Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: '1.7rem', fontWeight: 800, lineHeight: 1.1 }}>{new Intl.NumberFormat('en-IN').format(value ?? 0)}</Typography>
          <Typography variant="body2" color="text.secondary" noWrap>{label}</Typography>
        </Box>
      </Stack>
      {hint && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>{hint}</Typography>}
    </Card>
  )
}

/**
 * Asks for the note the shop owner will see. `required` actions (reject, suspend) need 5+ characters.
 */
export function ReasonDialog({ open, title, message, label, confirmLabel, danger, required, suggestions = [], onConfirm, onClose }) {
  const [reason, setReason] = useState('')
  const [touched, setTouched] = useState(false)
  const invalid = required && reason.trim().length < 5
  const close = () => { setReason(''); setTouched(false); onClose() }
  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>{message}</DialogContentText>
        {suggestions.length > 0 && (
          <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {suggestions.map((s) => <Chip key={s} label={s} size="small" variant="outlined" onClick={() => setReason(s)} />)}
          </Stack>
        )}
        <TextField
          autoFocus fullWidth multiline minRows={3} label={label} value={reason}
          onChange={(e) => setReason(e.target.value)} onBlur={() => setTouched(true)}
          slotProps={{ htmlInput: { maxLength: 500 } }}
          error={touched && invalid}
          helperText={touched && invalid ? 'Write at least 5 characters so the owner knows what to fix' : `The shop owner sees this. ${reason.length}/500`}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={close}>Cancel</Button>
        <Button variant="contained" color={danger ? 'error' : 'primary'} disabled={invalid} onClick={() => { onConfirm(reason.trim()); close() }}>{confirmLabel}</Button>
      </DialogActions>
    </Dialog>
  )
}

export const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—')
export const fmtDay = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
