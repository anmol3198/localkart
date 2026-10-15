import { Box, Card, Stack, Typography } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

const PERKS = [
  'Customers within 5 km find your shop',
  'They see your stock and prices before calling',
  'Update stock and open/closed status in one tap',
  'Free to list. No commission on orders',
]

/** Two-panel layout for login / register: benefits on the left, the form on the right. */
export default function AuthLayout({ children, maxWidth = 1000 }) {
  return (
    <Card sx={{ maxWidth, mx: 'auto', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '360px 1fr' }, overflow: 'hidden' }}>
      <Box sx={{ display: { xs: 'none', md: 'block' }, p: 4, color: '#fff', background: 'linear-gradient(160deg, #053d30 0%, #0b6e55 70%, #14916f 100%)', position: 'relative' }}>
        <Box sx={{ position: { md: 'sticky' }, top: 100 }}>
          <Typography variant="overline" sx={{ color: 'secondary.light' }}>LocalKart for shops</Typography>
          <Typography variant="h4" sx={{ mt: 1, mb: 3 }}>Bring your neighbourhood to your counter</Typography>
          <Stack spacing={2}>
            {PERKS.map((p) => (
              <Stack key={p} direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                <CheckCircleIcon sx={{ color: 'secondary.light', mt: 0.25 }} fontSize="small" />
                <Typography sx={{ opacity: 0.9 }}>{p}</Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      </Box>
      <Box sx={{ p: { xs: 2.5, sm: 4 } }}>{children}</Box>
    </Card>
  )
}
