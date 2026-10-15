import { Box, Container, Link, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { Logo } from './Header.jsx'

export default function Footer() {
  return (
    <Box component="footer" sx={{ mt: 8, bgcolor: 'primary.dark', color: 'rgba(255,255,255,0.8)' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
          <Box sx={{ color: '#fff' }}><Logo light /></Box>
          <Stack direction="row" spacing={3}>
            <Link component={RouterLink} to="/" color="inherit" underline="hover">Find shops</Link>
            <Link component={RouterLink} to="/vendor/register" color="inherit" underline="hover">Register your shop</Link>
            <Link component={RouterLink} to="/vendor/login" color="inherit" underline="hover">Shop owner login</Link>
          </Stack>
        </Stack>
        <Typography variant="caption" sx={{ display: 'block', mt: 2, opacity: 0.7 }}>
          Support the shops in your neighbourhood. Maps © OpenStreetMap contributors.
        </Typography>
      </Container>
    </Box>
  )
}
