import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Box, Button, Container } from '@mui/material'
import SearchOffIcon from '@mui/icons-material/SearchOff'
import { Link as RouterLink } from 'react-router-dom'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import EmptyState from './components/EmptyState.jsx'
import Home from './pages/Home.jsx'
import ShopPage from './pages/ShopPage.jsx'
import VendorLogin from './pages/VendorLogin.jsx'
import VendorRegister from './pages/VendorRegister.jsx'
import VendorDashboard from './pages/VendorDashboard.jsx'
import { useAuth } from './lib/auth.jsx'

function VendorOnly({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/vendor/login" replace />
}

function GuestOnly({ children }) {
  const { token } = useAuth()
  return token ? <Navigate to="/vendor" replace /> : children
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function NotFound() {
  return (
    <EmptyState icon={<SearchOffIcon />} title="Page not found" action={<Button variant="contained" component={RouterLink} to="/">Find shops near you</Button>}>
      The page you are looking for doesn't exist or has moved.
    </EmptyState>
  )
}

export default function App() {
  const { pathname } = useLocation()
  // The home page draws its own full-width hero, so it manages its own container.
  const fullBleed = pathname === '/'
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ScrollToTop />
      <Header />
      <Box component="main" sx={{ flex: 1 }}>
        <Container maxWidth="lg" disableGutters={fullBleed} sx={fullBleed ? { maxWidth: 'none !important' } : { py: { xs: 2, sm: 4 } }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop/:id" element={<ShopPage />} />
            <Route path="/vendor/login" element={<GuestOnly><VendorLogin /></GuestOnly>} />
            <Route path="/vendor/register" element={<GuestOnly><VendorRegister /></GuestOnly>} />
            <Route path="/vendor" element={<VendorOnly><VendorDashboard /></VendorOnly>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Container>
      </Box>
      <Footer />
    </Box>
  )
}
