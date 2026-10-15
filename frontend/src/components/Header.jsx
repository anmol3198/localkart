import { useState } from 'react'
import { AppBar, Box, Button, Container, Divider, IconButton, ListItemIcon, Menu, MenuItem, Toolbar, Typography } from '@mui/material'
import StorefrontIcon from '@mui/icons-material/Storefront'
import DashboardIcon from '@mui/icons-material/SpaceDashboard'
import LogoutIcon from '@mui/icons-material/Logout'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { useNotify } from '../lib/notify.jsx'

export function Logo({ light }) {
  return (
    <Box component={RouterLink} to="/" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'inherit', textDecoration: 'none' }}>
      <Box sx={{ width: 36, height: 36, borderRadius: '10px', display: 'grid', placeItems: 'center', bgcolor: light ? 'rgba(255,255,255,0.15)' : 'primary.main', color: '#fff' }}>
        <StorefrontIcon fontSize="small" />
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
        Local<Box component="span" sx={{ color: light ? 'secondary.light' : 'secondary.dark' }}>Kart</Box>
      </Typography>
    </Box>
  )
}

export default function Header() {
  const { token, logout } = useAuth()
  const navigate = useNavigate()
  const notify = useNotify()
  const [menu, setMenu] = useState(null)

  const signOut = () => {
    setMenu(null)
    logout()
    notify('You have been logged out', 'info')
    navigate('/')
  }

  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="inherit"
      sx={{ bgcolor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderBottom: 1, borderColor: 'divider' }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ gap: 1 }}>
          <Box sx={{ flexGrow: 1 }}><Logo /></Box>
          {token ? (
            <>
              <Button component={RouterLink} to="/vendor" startIcon={<DashboardIcon />} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                My shop
              </Button>
              <IconButton aria-label="Account menu" onClick={(e) => setMenu(e.currentTarget)}>
                <AccountCircleIcon />
              </IconButton>
              <Menu anchorEl={menu} open={Boolean(menu)} onClose={() => setMenu(null)} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }} transformOrigin={{ horizontal: 'right', vertical: 'top' }}>
                <MenuItem component={RouterLink} to="/vendor" onClick={() => setMenu(null)}>
                  <ListItemIcon><DashboardIcon fontSize="small" /></ListItemIcon>Shop dashboard
                </MenuItem>
                <MenuItem component={RouterLink} to="/" onClick={() => setMenu(null)}>
                  <ListItemIcon><StorefrontIcon fontSize="small" /></ListItemIcon>Browse shops
                </MenuItem>
                <Divider />
                <MenuItem onClick={signOut} sx={{ color: 'error.main' }}>
                  <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>Log out
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button variant="outlined" component={RouterLink} to="/vendor/login" startIcon={<StorefrontIcon />}>
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>For shop owners</Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Sell</Box>
            </Button>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  )
}
