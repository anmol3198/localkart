import { Button, Stack } from '@mui/material'
import PhoneIcon from '@mui/icons-material/Phone'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'

const digits = (phone) => phone.replace(/\D/g, '')
const waNumber = (phone) => (digits(phone).length === 10 ? `91${digits(phone)}` : digits(phone))

export default function CallButtons({ shop, size = 'medium', fullWidth }) {
  const stop = (e) => e.stopPropagation()
  return (
    <Stack direction="row" spacing={1} sx={{ width: fullWidth ? '100%' : 'auto' }}>
      <Button variant="contained" size={size} startIcon={<PhoneIcon />} href={`tel:${shop.phone}`} fullWidth={fullWidth} onClick={stop}>
        Call to order
      </Button>
      <Button
        variant="contained"
        size={size}
        startIcon={<WhatsAppIcon />}
        href={`https://wa.me/${waNumber(shop.phone)}?text=${encodeURIComponent(`Hi ${shop.shopName}, I found you on LocalKart and would like to order.`)}`}
        target="_blank"
        rel="noreferrer"
        fullWidth={fullWidth}
        onClick={stop}
        sx={{ bgcolor: '#25d366', color: '#06301a', '&:hover': { bgcolor: '#1ebe5b' } }}
      >
        WhatsApp
      </Button>
    </Stack>
  )
}
