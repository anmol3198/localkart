import { Box } from '@mui/material'

/** Small "● Open" / "● Closed" status label. */
export default function OpenBadge({ open, sx }) {
  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, fontSize: 13, fontWeight: 700, color: open ? 'success.main' : 'error.main', ...sx }}>
      <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'currentColor', boxShadow: open ? '0 0 0 3px rgba(21,128,61,0.18)' : 'none' }} />
      {open ? 'Open now' : 'Closed'}
    </Box>
  )
}
