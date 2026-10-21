import { CircularProgress, Box } from '@mui/material'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminAuthProvider, useAdminAuth } from './AdminAuth.jsx'
import AdminLogin from './AdminLogin.jsx'
import AdminLayout from './AdminLayout.jsx'
import AdminDashboard from './AdminDashboard.jsx'
import AdminShops from './AdminShops.jsx'
import AdminAudit from './AdminAudit.jsx'
import AdminUsers from './AdminUsers.jsx'

function Gate() {
  const { admin, ready, isSuper } = useAdminAuth()
  if (!ready) return <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}><CircularProgress /></Box>
  if (!admin) return <AdminLogin />
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="review" element={<AdminShops queue />} />
        <Route path="shops" element={<AdminShops />} />
        <Route path="audit" element={<AdminAudit />} />
        {isSuper && <Route path="admins" element={<AdminUsers />} />}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  )
}

/** Staff area at /admin. Not linked from the public site; every action is also checked by the API. */
export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <Gate />
    </AdminAuthProvider>
  )
}
