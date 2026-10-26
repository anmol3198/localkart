import { IconButton, Stack, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import { MAX_QTY } from '../lib/order.js'

/** − qty + control; going below 1 removes the item. */
export default function QtyStepper({ qty, onChange, label, size = 'small' }) {
  return (
    <Stack direction="row" sx={{ alignItems: 'center', border: 1, borderColor: 'primary.main', borderRadius: '10px', bgcolor: 'background.paper' }}>
      <IconButton size={size} color="primary" aria-label={`One less ${label}`} onClick={() => onChange(qty - 1)}><RemoveIcon fontSize="small" /></IconButton>
      <Typography aria-live="polite" sx={{ minWidth: 28, textAlign: 'center', fontWeight: 800 }}>{qty}</Typography>
      <IconButton size={size} color="primary" aria-label={`One more ${label}`} disabled={qty >= MAX_QTY} onClick={() => onChange(qty + 1)}><AddIcon fontSize="small" /></IconButton>
    </Stack>
  )
}
