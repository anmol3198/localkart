import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import QRCode from 'qrcode'
import { Alert, Box, Button, Card, CircularProgress, Stack, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PrintIcon from '@mui/icons-material/Print'
import DownloadIcon from '@mui/icons-material/Download'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import PhoneIcon from '@mui/icons-material/Phone'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import StorefrontIcon from '@mui/icons-material/Storefront'
import api, { errorMessage } from '../lib/api.js'
import { useNotify } from '../lib/notify.jsx'
import useTitle from '../lib/useTitle.js'

const shopUrl = (id) => `${window.location.origin}/shop/${id}`

/** Printable A4 poster with the shop's QR code, for the counter or door. */
export default function VendorPoster() {
  useTitle('QR poster')
  const notify = useNotify()
  const [shop, setShop] = useState(null)
  const [svg, setSvg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    api.get('/vendor/shop')
      .then(async ({ data }) => {
        const code = await QRCode.toString(`${shopUrl(data._id)}?ref=qr`, { type: 'svg', errorCorrectionLevel: 'M', margin: 1, color: { dark: '#14211d', light: '#ffffff' } })
        if (alive) { setShop(data); setSvg(code) }
      })
      .catch((e) => alive && setError(errorMessage(e)))
    return () => { alive = false }
  }, [])

  const downloadQr = async () => {
    const png = await QRCode.toDataURL(`${shopUrl(shop._id)}?ref=qr`, { width: 1024, margin: 2, errorCorrectionLevel: 'M' })
    const a = document.createElement('a')
    a.href = png
    a.download = `${shop.shopName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-qr.png`
    a.click()
  }
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(shopUrl(shop._id)); notify('Shop link copied') } catch { notify('Could not copy', 'error') }
  }

  if (error) return <Alert severity="error">{error}</Alert>
  if (!shop) return <CircularProgress />
  if (shop.status && shop.status !== 'APPROVED') {
    return <Alert severity="info">Your QR poster will be ready once your shop is approved and live.</Alert>
  }
  const local = /localhost|127\.0\.0\.1/.test(window.location.hostname)

  return (
    <Stack spacing={3} sx={{ alignItems: 'center' }}>
      <Stack className="no-print" spacing={2} sx={{ width: '100%', maxWidth: 820 }}>
        <Button component={RouterLink} to="/vendor" startIcon={<ArrowBackIcon />} sx={{ alignSelf: 'flex-start', ml: -1 }}>Back to dashboard</Button>
        <Box>
          <Typography variant="h4" component="h1">Your shop QR poster</Typography>
          <Typography color="text.secondary">Print it and stick it at your counter or door. Customers scan it with their phone camera to see your items and call or WhatsApp you.</Typography>
        </Box>
        {local && (
          <Alert severity="warning">You're on the test website, so this QR opens <b>{window.location.origin}</b>, which only works on this computer. Print posters from the live website once it's deployed.</Alert>
        )}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button variant="contained" size="large" startIcon={<PrintIcon />} onClick={() => window.print()}>Print poster</Button>
          <Button variant="outlined" size="large" startIcon={<DownloadIcon />} onClick={downloadQr}>Download QR image</Button>
          <Button size="large" startIcon={<ContentCopyIcon />} onClick={copyLink}>Copy shop link</Button>
        </Stack>
        <Typography variant="body2" color="text.secondary">Tip: in the print window choose “Save as PDF” to share the poster on WhatsApp or get it printed at a shop.</Typography>
      </Stack>

      <Card className="poster" sx={{ width: '100%', maxWidth: 560, aspectRatio: '210 / 297', p: { xs: 2.5, sm: 4 }, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 12px 40px rgba(20,33,29,0.12)' }}>
        <Box sx={{ alignSelf: 'stretch', bgcolor: 'primary.main', color: '#fff', borderRadius: '20px', p: { xs: 2, sm: 3 } }}>
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'center', alignItems: 'center', opacity: 0.9 }}>
            <StorefrontIcon fontSize="small" />
            <Typography sx={{ fontWeight: 800 }}>Local<Box component="span" sx={{ color: 'secondary.light' }}>Kart</Box></Typography>
          </Stack>
          <Typography sx={{ fontSize: { xs: '1.7rem', sm: '2.2rem' }, fontWeight: 800, lineHeight: 1.15, mt: 1 }}>{shop.shopName}</Typography>
          <Typography sx={{ opacity: 0.85 }}>{shop.category} · {shop.address}</Typography>
        </Box>
        <Typography sx={{ fontSize: { xs: '1.4rem', sm: '1.75rem' }, fontWeight: 800, mt: 3 }}>Scan to see what's in stock</Typography>
        <Typography color="text.secondary">Check prices, then call or WhatsApp us to order.</Typography>
        <Box
          aria-label="QR code for this shop"
          role="img"
          sx={{ width: '62%', aspectRatio: '1', mt: 2.5, p: 1.5, border: 6, borderColor: 'primary.main', borderRadius: '24px', '& svg': { width: '100%', height: '100%', display: 'block' } }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <Stack direction="row" useFlexGap sx={{ mt: 3, gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[[<PhoneIcon key="p" fontSize="small" />, 'Call to order'], [<WhatsAppIcon key="w" fontSize="small" />, 'WhatsApp'],
            [<LocalShippingIcon key="d" fontSize="small" />, shop.homeDelivery ? `Delivery up to ${shop.deliveryRadiusKm} km` : 'Pick up from shop']].map(([icon, label]) => (
            <Stack key={label} direction="row" spacing={0.75} sx={{ alignItems: 'center', border: 1, borderColor: 'divider', borderRadius: 99, px: 1.5, py: 0.5, fontWeight: 700 }}>
              {icon}<Typography variant="body2" sx={{ fontWeight: 700 }}>{label}</Typography>
            </Stack>
          ))}
        </Stack>
        <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, mt: 2 }}>{shop.phone}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 'auto', pt: 2, wordBreak: 'break-all' }}>{shopUrl(shop._id)}</Typography>
      </Card>
    </Stack>
  )
}
