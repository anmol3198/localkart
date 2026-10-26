import { Box, Container, Link, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { Logo } from './Header.jsx'
import { openInstall } from '../lib/install.js'

export default function Footer() {
  return (
    <Box component="footer" sx={{ mt: 8, bgcolor: 'primary.dark', color: 'rgba(255,255,255,0.8)' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
          <Box sx={{ color: '#fff' }}><Logo light /></Box>
          <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', columnGap: 3, rowGap: 1 }}>
            <Link component={RouterLink} to="/" color="inherit" underline="hover">Find shops</Link>
            <Link component={RouterLink} to="/vendor/register" color="inherit" underline="hover">Register your shop</Link>
            <Link component={RouterLink} to="/vendor/login" color="inherit" underline="hover">Shop owner login</Link>
            <Link component="button" type="button" onClick={openInstall} color="inherit" underline="hover" sx={{ font: 'inherit', verticalAlign: 'baseline' }}>Get the app</Link>
            <Link component={RouterLink} to="/privacy" color="inherit" underline="hover">Privacy</Link>
            <Link component={RouterLink} to="/terms" color="inherit" underline="hover">Terms</Link>
          </Stack>
        </Stack>
        <Typography variant="caption" sx={{ display: 'block', mt: 2, opacity: 0.7 }}>
          Support the shops in your neighbourhood. Maps © OpenStreetMap contributors.
        </Typography>
      </Container>
    </Box>
  )
}
