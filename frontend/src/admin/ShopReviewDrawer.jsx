import { useEffect, useState } from 'react'
import { Alert, Box, Button, CircularProgress, Divider, Drawer, IconButton, Link, Stack, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import CheckIcon from '@mui/icons-material/Check'
import CloseRoundedIcon from '@mui/icons-material/DoNotDisturbAlt'
import BlockIcon from '@mui/icons-material/Block'
import RestoreIcon from '@mui/icons-material/Restore'
import PhoneIcon from '@mui/icons-material/Phone'
import EmailIcon from '@mui/icons-material/Email'
import PlaceIcon from '@mui/icons-material/Place'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import adminApi from './adminApi.js'
import { errorMessage } from '../lib/api.js'
import { formatPhone } from '../lib/validation.js'
import { useNotify } from '../lib/notify.jsx'
import { ReasonDialog, StatusChip, fmtDate } from './bits.jsx'

const pin = L.divIcon({ className: 'lk-pin', html: '<div style="background:#0b6e55"><span>●</span></div>', iconSize: [30, 30], iconAnchor: [15, 30] })

const REJECT_REASONS = ['Shop name or address looks incomplete', 'Location on the map is not at the shop', 'Phone number did not answer when we called', 'Looks like a duplicate of another shop']
const SUSPEND_REASONS = ['Several customers reported wrong prices or stock', 'Phone number no longer works', 'Shop appears to be permanently closed']

function Row({ label, children }) {
  return (
    <Stack direction="row" spacing={2} sx={{ py: 0.75 }}>
      <Typography variant="body2" color="text.secondary" sx={{ width: 120, flexShrink: 0 }}>{label}</Typography>
      <Box sx={{ flex: 1, minWidth: 0, typography: 'body2', wordBreak: 'break-word' }}>{children}</Box>
    </Stack>
  )
}

/** Everything staff need to decide on a shop, with the actions allowed in its current state. */
export default function ShopReviewDrawer({ shopId, onClose, onChanged }) {
  const notify = useNotify()
  const [shop, setShop] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [dialog, setDialog] = useState(null)

  useEffect(() => {
    if (!shopId) return
    let alive = true
    adminApi.get(`/shops/${shopId}`).then(({ data }) => alive && (setShop(data), setError(''))).catch((e) => alive && setError(errorMessage(e)))
    return () => { alive = false; setShop(null) }
  }, [shopId])

  const act = async (action, reason) => {
    setBusy(action)
    try {
      const { data } = await adminApi.post(`/shops/${shopId}/${action}`, { reason: reason || null })
      setShop(data)
      onChanged?.(data)
      notify({ approve: 'Shop approved: it is now live', reject: 'Shop rejected: the owner will see your note', suspend: 'Shop suspended and hidden from customers', reinstate: 'Shop reinstated: it is live again' }[action])
    } catch (e) {
      notify(errorMessage(e), 'error')
    } finally {
      setBusy('')
    }
  }

  const btn = (action, label, icon, props = {}) => (
    <Button {...props} disabled={Boolean(busy)} startIcon={busy === action ? <CircularProgress size={16} color="inherit" /> : icon}>{label}</Button>
  )

  return (
    <Drawer anchor="right" open={Boolean(shopId)} onClose={onClose} sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 520 } } }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">Shop review</Typography>
        <IconButton aria-label="Close" onClick={onClose}><CloseIcon /></IconButton>
      </Stack>
      {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}
      {!shop && !error && <CircularProgress sx={{ m: 4 }} />}
      {shop && (
        <Box sx={{ p: 2.5, overflowY: 'auto', flex: 1 }}>
          <Stack spacing={1}>
            <StatusChip status={shop.status} size="medium" />
            <Typography variant="h5">{shop.shopName}</Typography>
            <Typography color="text.secondary">{shop.category} · registered {fmtDate(shop.createdAt)}</Typography>
          </Stack>

          {shop.reviewNote && (
            <Alert severity={shop.status === 'APPROVED' ? 'info' : 'warning'} sx={{ mt: 2 }}>
              <b>Note to owner:</b> {shop.reviewNote}
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>{shop.reviewedBy} · {fmtDate(shop.reviewedAt)}</Typography>
            </Alert>
          )}

          <Box sx={{ height: 200, mt: 2.5, borderRadius: '12px', overflow: 'hidden' }}>
            <MapContainer key={shop.id} center={[shop.lat, shop.lng]} zoom={16} scrollWheelZoom={false}>
              <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[shop.lat, shop.lng]} icon={pin} />
            </MapContainer>
          </Box>
          <Link href={`https://www.google.com/maps/search/?api=1&query=${shop.lat},${shop.lng}`} target="_blank" rel="noreferrer" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 1, fontWeight: 600 }}>
            Check on Google Maps (street view) <OpenInNewIcon fontSize="inherit" />
          </Link>

          <Divider sx={{ my: 2 }} />
          <Row label="Owner">{shop.ownerName}</Row>
          <Row label="Phone"><Link href={`tel:${shop.phone}`} sx={{ display: 'inline-flex', gap: 0.5, alignItems: 'center' }}><PhoneIcon fontSize="inherit" />{formatPhone(shop.phone)}</Link>{shop.alternatePhone && ` · ${formatPhone(shop.alternatePhone)}`}</Row>
          <Row label="Email"><Link href={`mailto:${shop.email}`} sx={{ display: 'inline-flex', gap: 0.5, alignItems: 'center' }}><EmailIcon fontSize="inherit" />{shop.email}</Link></Row>
          <Row label="Address"><Stack direction="row" spacing={0.5}><PlaceIcon fontSize="inherit" sx={{ mt: '3px' }} /><span>{shop.address}</span></Stack></Row>
          <Row label="Hours">{shop.openingHours || '—'}</Row>
          <Row label="Delivery">{shop.homeDelivery ? 'Home delivery' : 'Pickup only'}</Row>
          {shop.description && <Row label="About">{shop.description}</Row>}
          <Row label="Items">{shop.products} listed{shop.inStock != null && ` · ${shop.inStock} in stock`}</Row>
          {shop.activity30d && <Row label="Last 30 days">{shop.activity30d.views} views · {shop.activity30d.calls + shop.activity30d.whatsapp} calls/WhatsApp</Row>}
          <Row label="Submitted">{fmtDate(shop.submittedAt)}</Row>

          {shop.status === 'PENDING' && (
            <Alert severity="info" icon={false} sx={{ mt: 2 }}>
              <b>Before approving:</b> call the shop number, check the pin is on the shop (street view helps), and that the name and address match a real shop.
            </Alert>
          )}
        </Box>
      )}
      {shop && (
        <Stack direction="row" spacing={1} sx={{ p: 2, borderTop: 1, borderColor: 'divider', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 1 }}>
          {(shop.status === 'PENDING' || shop.status === 'REJECTED') && btn('approve', 'Approve', <CheckIcon />, { variant: 'contained', color: 'success', onClick: () => act('approve') })}
          {shop.status === 'PENDING' && btn('reject', 'Reject', <CloseRoundedIcon />, { variant: 'outlined', color: 'error', onClick: () => setDialog('reject') })}
          {shop.status === 'APPROVED' && btn('suspend', 'Suspend', <BlockIcon />, { variant: 'outlined', color: 'error', onClick: () => setDialog('suspend') })}
          {shop.status === 'SUSPENDED' && btn('reinstate', 'Reinstate', <RestoreIcon />, { variant: 'contained', onClick: () => act('reinstate') })}
        </Stack>
      )}
      <ReasonDialog
        open={dialog === 'reject'} required danger title="Reject this shop?" confirmLabel="Reject shop" label="What should the owner fix?"
        message="The shop stays hidden. The owner sees your note, can fix their details and send it for review again."
        suggestions={REJECT_REASONS} onConfirm={(r) => act('reject', r)} onClose={() => setDialog(null)}
      />
      <ReasonDialog
        open={dialog === 'suspend'} required danger title="Suspend this shop?" confirmLabel="Suspend shop" label="Reason"
        message="The shop disappears from LocalKart immediately and the owner can't make changes until you reinstate it."
        suggestions={SUSPEND_REASONS} onConfirm={(r) => act('suspend', r)} onClose={() => setDialog(null)}
      />
    </Drawer>
  )
}
