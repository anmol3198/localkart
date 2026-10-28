import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  AppBar, Badge, Box, Chip, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Stack, Toolbar, Typography,
  useMediaQuery, useTheme,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import DashboardIcon from '@mui/icons-material/SpaceDashboard'
import FactCheckIcon from '@mui/icons-material/FactCheck'
import StorefrontIcon from '@mui/icons-material/Storefront'
import HistoryIcon from '@mui/icons-material/History'
import GroupIcon from '@mui/icons-material/Group'
import LogoutIcon from '@mui/icons-material/Logout'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import adminApi from './adminApi.js'
import { useAdminAuth } from './AdminAuth.jsx'

const WIDTH = 248

/** Shell for the staff area: sidebar navigation (drawer on phones) and a top bar. */
export default function AdminLayout() {
  const theme = useTheme()
  const desktop = useMediaQuery(theme.breakpoints.up('md'))
  const { admin, logout, isSuper } = useAdminAuth()
  const { pathname, search } = useLocation()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(0)

  useEffect(() => {
    // Keep the staff area out of search engines.
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])

  useEffect(() => {
    // Refresh the waiting-count badge whenever the page or open review panel changes.
    adminApi.get('/stats').then(({ data }) => setPending(data.shops.pending)).catch(() => {})
  }, [pathname, search])

  const nav = [
    { to: '/admin', label: 'Dashboard', icon: <DashboardIcon />, end: true },
    { to: '/admin/review', label: 'Review queue', icon: <Badge color="secondary" badgeContent={pending} max={99}><FactCheckIcon /></Badge> },
    { to: '/admin/shops', label: 'All shops', icon: <StorefrontIcon /> },
    { to: '/admin/audit', label: 'Audit log', icon: <HistoryIcon /> },
    ...(isSuper ? [{ to: '/admin/admins', label: 'Admins', icon: <GroupIcon /> }] : []),
  ]
  const section = [...nav].reverse().find((n) => pathname === n.to || (!n.end && pathname.startsWith(`${n.to}/`)))?.label
  useEffect(() => {
    document.title = section ? `${section} · LocalKart Admin` : 'LocalKart Admin'
  }, [section])

  const menu = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0b2a22', color: '#dfe9e5' }}>
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', p: 2.5 }}>
        <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'primary.main', display: 'grid', placeItems: 'center', color: '#fff' }}>
          <AdminPanelSettingsIcon fontSize="small" />
        </Box>
        <Typography sx={{ fontWeight: 800, color: '#fff' }}>LocalKart <Box component="span" sx={{ color: 'secondary.light' }}>Admin</Box></Typography>
      </Stack>
      <List sx={{ px: 1.5, flex: 1 }}>
        {nav.map((n) => (
          <ListItemButton
            key={n.to}
            component={NavLink}
            to={n.to}
            end={n.end}
            onClick={() => setOpen(false)}
            sx={{
              borderRadius: '10px', mb: 0.5, color: 'inherit',
              '&.active': { bgcolor: 'rgba(255,255,255,0.12)', color: '#fff', '& .MuiListItemIcon-root': { color: 'secondary.light' } },
            }}
          >
            <ListItemIcon sx={{ color: 'rgba(255,255,255,0.6)', minWidth: 40 }}>{n.icon}</ListItemIcon>
            <ListItemText primary={n.label} slotProps={{ primary: { sx: { fontWeight: 600 } } }} />
          </ListItemButton>
        ))}
      </List>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
      <Box sx={{ p: 2 }}>
        <Typography sx={{ fontWeight: 700, color: '#fff' }} noWrap>{admin?.name}</Typography>
        <Typography variant="caption" sx={{ opacity: 0.7, display: 'block' }} noWrap>{admin?.email}</Typography>
        <Chip size="small" label={admin?.role === 'SUPER_ADMIN' ? 'Super admin' : 'Admin'} sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' }} />
        <ListItemButton onClick={logout} sx={{ borderRadius: '10px', mt: 1.5, color: 'inherit', px: 1 }}>
          <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}><LogoutIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Sign out" />
        </ListItemButton>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {desktop ? (
        <Drawer variant="permanent" sx={{ width: WIDTH, flexShrink: 0, '& .MuiDrawer-paper': { width: WIDTH, border: 'none' } }}>{menu}</Drawer>
      ) : (
        <>
          <AppBar position="fixed" elevation={0} sx={{ bgcolor: '#0b2a22' }}>
            <Toolbar>
              <IconButton color="inherit" edge="start" onClick={() => setOpen(true)} aria-label="Open menu"><MenuIcon /></IconButton>
              <Typography sx={{ fontWeight: 800, ml: 1 }}>LocalKart Admin</Typography>
            </Toolbar>
          </AppBar>
          <Drawer open={open} onClose={() => setOpen(false)} sx={{ '& .MuiDrawer-paper': { width: WIDTH } }}>{menu}</Drawer>
        </>
      )}
      <Box component="main" sx={{ flex: 1, minWidth: 0, p: { xs: 2, sm: 3, md: 4 }, pt: { xs: 10, md: 4 } }}>
        <Outlet />
      </Box>
    </Box>
  )
}
