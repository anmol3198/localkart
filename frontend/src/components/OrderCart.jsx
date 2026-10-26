import { useState } from 'react'
import {
  Alert, Box, Button, ButtonBase, CircularProgress, Divider, Drawer, IconButton, LinearProgress, Paper, Stack, TextField,
  ToggleButton, ToggleButtonGroup, Typography, useMediaQuery, useTheme,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import PhoneIcon from '@mui/icons-material/Phone'
import DeleteIcon from '@mui/icons-material/DeleteOutlined'
import StorefrontIcon from '@mui/icons-material/Storefront'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import api, { errorMessage } from '../lib/api.js'
import { track } from '../lib/track.js'
import { useNotify } from '../lib/notify.jsx'
import {
  cartTotals, deliveryAllowed, money, orderMessage, reconcile, setQty, shopTakesWhatsapp, validateOrder, whatsappOrderUrl,
} from '../lib/order.js'
import QtyStepper from './QtyStepper.jsx'

/** Sticky "N items · ₹X  View order" bar, shown once something is in the cart. */
export function CartBar({ cart, shop, onOpen }) {
  const t = cartTotals(cart, shop)
  if (!t.lines) return null
  return (
    <Paper elevation={10} sx={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 1200, p: 1.5, borderRadius: '16px 16px 0 0', display: 'flex', justifyContent: 'center' }}>
      <ButtonBase onClick={onOpen} sx={{ width: '100%', maxWidth: 720, bgcolor: 'primary.main', color: '#fff', borderRadius: '12px', px: 2.5, py: 1.5, justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <ShoppingBagIcon />
          <Box sx={{ textAlign: 'left' }}>
            <Typography sx={{ fontWeight: 800 }}>{t.count} {t.count === 1 ? 'item' : 'items'} · {money(t.itemsTotal)}</Typography>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>Order on WhatsApp, pay the shop directly</Typography>
          </Box>
        </Stack>
        <Stack direction="row" sx={{ alignItems: 'center', fontWeight: 800 }}>View order <ChevronRightIcon /></Stack>
      </ButtonBase>
    </Paper>
  )
}

/** The order panel: review items, pickup or delivery, details, then send it to the shop. */
export default function OrderCart({ open, onClose, cart, setCart, clear, shop, location, onFresh }) {
  const theme = useTheme()
  const phone = useMediaQuery(theme.breakpoints.down('sm'))
  const notify = useNotify()
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [changes, setChanges] = useState([])
  const [sent, setSent] = useState(null)

  const t = cartTotals(cart, shop)
  const errors = validateOrder(cart, shop)
  const show = (k) => (submitted || touched[k]) && errors[k]
  const canDeliver = deliveryAllowed(shop)
  const whatsapp = shopTakesWhatsapp(shop)
  const set = (k) => (e) => setCart({ ...cart, [k]: e.target.value })
  const touch = (k) => () => setTouched((x) => ({ ...x, [k]: true }))

  const send = async () => {
    setSubmitted(true)
    if (Object.keys(errors).length) return
    setBusy(true)
    // Open the tab now, while we still have the tap, so pop-up blockers allow it; it's pointed at WhatsApp below.
    const tab = whatsapp ? window.open('about:blank', '_blank') : null
    try {
      // Check the latest stock and prices before sending, so the shop gets an accurate order.
      const { data } = await api.get(`/shops/${shop._id}`, { params: location || {} })
      onFresh?.(data) // keep the shop page behind the panel showing the same prices
      const fresh = reconcile(cart, data.products)
      if (fresh.changes.length) {
        tab?.close()
        setCart(fresh.cart)
        setChanges(fresh.changes)
        return
      }
      setChanges([])
      const text = orderMessage(cart, data.shop)
      track(shop._id, 'ORDER')
      if (whatsapp) {
        const url = whatsappOrderUrl(shop, text)
        if (tab) { tab.opener = null; tab.location.href = url } else window.location.href = url
      } else {
        await navigator.clipboard?.writeText(text).catch(() => {})
        window.location.href = `tel:${shop.phone}`
      }
      setSent(text)
    } catch (e) {
      tab?.close()
      notify(errorMessage(e), 'error')
    } finally {
      setBusy(false)
    }
  }

  const finish = () => { clear(); setSent(null); setSubmitted(false); setTouched({}); onClose() }

  return (
    <Drawer anchor={phone ? 'bottom' : 'right'} open={open} onClose={onClose}
      sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 480 }, height: { xs: '92vh', sm: '100%' }, borderRadius: { xs: '20px 20px 0 0', sm: 0 } } }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box>
          <Typography variant="h6">Your order</Typography>
          <Typography variant="body2" color="text.secondary">{shop.shopName}</Typography>
        </Box>
        <IconButton aria-label="Close" onClick={onClose}><CloseIcon /></IconButton>
      </Stack>

      {sent ? (
        <Stack spacing={2} sx={{ p: 3, flex: 1, alignItems: 'center', textAlign: 'center', justifyContent: 'center' }}>
          <CheckCircleIcon color="success" sx={{ fontSize: 64 }} />
          <Typography variant="h5">{whatsapp ? 'Order ready in WhatsApp' : 'Order copied: now call the shop'}</Typography>
          <Typography color="text.secondary">
            {whatsapp ? 'Press send in WhatsApp. The shop will reply to confirm items, total and timing. You pay the shop directly.'
              : 'This shop takes orders by phone. Your order is copied, so you can read it out or paste it into a message.'}
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, width: '100%', textAlign: 'left', whiteSpace: 'pre-wrap', fontSize: 14, maxHeight: 220, overflow: 'auto', bgcolor: 'action.hover' }}>{sent}</Paper>
          <Stack direction="row" spacing={1}>
            {whatsapp
              ? <Button startIcon={<WhatsAppIcon />} href={whatsappOrderUrl(shop, sent)} target="_blank" rel="noreferrer">Open WhatsApp again</Button>
              : <Button startIcon={<PhoneIcon />} href={`tel:${shop.phone}`}>Call again</Button>}
            <Button variant="contained" onClick={finish}>Done, start a new order</Button>
          </Stack>
        </Stack>
      ) : (
        <>
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>
            <Stack spacing={2.5}>
              {changes.length > 0 && (
                <Alert severity="warning">
                  <b>The shop just updated its list:</b>
                  <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>{changes.map((c) => <li key={c}>{c}</li>)}</ul>
                  Check your order, then send again.
                </Alert>
              )}
              {!shop.isOpen && <Alert severity="info">The shop is closed right now. You can still send; they’ll see it when they open.</Alert>}
              {t.lines === 0 && <Alert severity="info">Your order is empty. Add items from the shop’s list.</Alert>}

              <Stack divider={<Divider flexItem />}>
                {Object.values(cart.items).map((l) => (
                  <Stack key={l.id} direction="row" spacing={1.5} sx={{ alignItems: 'center', py: 1.25 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 600 }} noWrap>{l.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{money(l.price)} / {l.unit}</Typography>
                    </Box>
                    <QtyStepper qty={l.qty} label={l.name} onChange={(q) => setCart(setQty(cart, l.id, q))} />
                    <Typography sx={{ width: 76, textAlign: 'right', fontWeight: 700 }}>{money(Math.round(l.price * l.qty * 100) / 100)}</Typography>
                    <IconButton size="small" aria-label={`Remove ${l.name}`} onClick={() => setCart(setQty(cart, l.id, 0))}><DeleteIcon fontSize="small" /></IconButton>
                  </Stack>
                ))}
              </Stack>

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>How do you want it?</Typography>
                <ToggleButtonGroup exclusive fullWidth value={cart.mode} onChange={(_e, v) => v && setCart({ ...cart, mode: v })}>
                  <ToggleButton value="pickup" sx={{ gap: 1 }}><StorefrontIcon fontSize="small" /> Pickup</ToggleButton>
                  <ToggleButton value="delivery" disabled={!canDeliver} sx={{ gap: 1 }}><LocalShippingIcon fontSize="small" /> Home delivery</ToggleButton>
                </ToggleButtonGroup>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {!shop.homeDelivery ? 'This shop is pickup only.'
                    : !canDeliver ? `Delivers within ${shop.deliveryRadiusKm} km, which doesn’t reach your location.`
                      : `Delivery ${shop.deliveryCharge ? money(shop.deliveryCharge) : 'free'}${t.minOrder ? ` · minimum order ${money(t.minOrder)}` : ''}`}
                </Typography>
                {cart.mode === 'delivery' && canDeliver && t.shortBy > 0 && (
                  <Box sx={{ mt: 1.5 }}>
                    <LinearProgress variant="determinate" value={Math.min(100, (t.itemsTotal / t.minOrder) * 100)} sx={{ height: 6, borderRadius: 3 }} />
                    <Typography variant="body2" sx={{ mt: 0.75, color: 'warning.dark', fontWeight: 600 }}>Add {money(t.shortBy)} more for delivery</Typography>
                  </Box>
                )}
                {show('mode') && <Alert severity="error" sx={{ mt: 1.5 }}>{errors.mode}</Alert>}
              </Box>

              {cart.mode === 'delivery' && (
                <TextField label="Delivery address" required multiline minRows={2} value={cart.address} onChange={set('address')} onBlur={touch('address')}
                  placeholder="House no., street, area, landmark" error={Boolean(show('address'))} helperText={show('address') || 'Sent only to this shop, inside your WhatsApp message'}
                  slotProps={{ htmlInput: { maxLength: 300 } }} />
              )}
              <TextField label="Your name (optional)" value={cart.name} onChange={set('name')} onBlur={touch('name')} autoComplete="name"
                error={Boolean(show('name'))} helperText={show('name')} slotProps={{ htmlInput: { maxLength: 60 } }} />
              <TextField label="Note for the shop (optional)" value={cart.note} onChange={set('note')} onBlur={touch('note')} placeholder="e.g. deliver after 6 pm, no substitutes"
                error={Boolean(show('note'))} helperText={show('note') || `${cart.note.length}/200`} slotProps={{ htmlInput: { maxLength: 200 } }} />
            </Stack>
          </Box>

          <Box sx={{ p: 2.5, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Stack spacing={0.5} sx={{ mb: 1.5 }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between' }}><Typography color="text.secondary">Items ({t.count})</Typography><Typography>{money(t.itemsTotal)}</Typography></Stack>
              {cart.mode === 'delivery' && <Stack direction="row" sx={{ justifyContent: 'space-between' }}><Typography color="text.secondary">Delivery</Typography><Typography>{t.delivery ? money(t.delivery) : 'Free'}</Typography></Stack>}
              <Stack direction="row" sx={{ justifyContent: 'space-between' }}><Typography sx={{ fontWeight: 800 }}>Total</Typography><Typography sx={{ fontWeight: 800 }}>{money(t.total)}</Typography></Stack>
            </Stack>
            {submitted && errors.items && <Alert severity="error" sx={{ mb: 1.5 }}>{errors.items}</Alert>}
            <Button fullWidth size="large" variant="contained" disabled={busy || !t.lines} onClick={send}
              startIcon={busy ? <CircularProgress size={18} color="inherit" /> : whatsapp ? <WhatsAppIcon /> : <PhoneIcon />}
              sx={whatsapp ? { bgcolor: '#25d366', color: '#06301a', '&:hover': { bgcolor: '#1ebe5b' } } : undefined}>
              {busy ? 'Checking latest prices…' : whatsapp ? 'Send order on WhatsApp' : 'Copy order and call the shop'}
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
              You pay the shop directly. The shop confirms availability and the final total.
            </Typography>
            {t.lines > 0 && <Button fullWidth size="small" color="inherit" sx={{ mt: 0.5, color: 'text.secondary' }} onClick={() => { clear(); setChanges([]) }}>Clear order</Button>}
          </Box>
        </>
      )}
    </Drawer>
  )
}
