import { useEffect, useMemo, useState } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'
import {
  Alert, Box, Button, Card, Chip, Divider, FormControlLabel, IconButton, InputAdornment, Paper, Skeleton, Stack, Switch,
  TextField, Tooltip, Typography, alpha,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import PlaceIcon from '@mui/icons-material/Place'
import PhoneIcon from '@mui/icons-material/Phone'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DirectionsIcon from '@mui/icons-material/Directions'
import ShareIcon from '@mui/icons-material/Share'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import StorefrontIcon from '@mui/icons-material/Storefront'
import api, { errorMessage } from '../lib/api.js'
import { directionsUrl, formatDistance, useCustomerLocation } from '../lib/location.js'
import { categoryStyle } from '../lib/categories.jsx'
import { useNotify } from '../lib/notify.jsx'
import useTitle from '../lib/useTitle.js'
import { track } from '../lib/track.js'
import { formatPhone } from '../lib/validation.js'
import DeliveryChip from '../components/DeliveryChip.jsx'
import CallButtons from '../components/CallButtons.jsx'
import CategoryAvatar from '../components/CategoryAvatar.jsx'
import OpenBadge from '../components/OpenBadge.jsx'
import EmptyState from '../components/EmptyState.jsx'
import OrderCart, { CartBar } from '../components/OrderCart.jsx'
import QtyStepper from '../components/QtyStepper.jsx'
import { useCart } from '../lib/cart.js'
import { addItem, money, setQty } from '../lib/order.js'
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart'

const slug = (s) => `cat-${s.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

function InfoRow({ icon, children, action }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', py: 1.25 }}>
      <Box sx={{ color: 'text.secondary', display: 'flex' }}>{icon}</Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
      {action}
    </Stack>
  )
}

function PageSkeleton() {
  return (
    <Stack spacing={2}>
      <Skeleton width={160} />
      <Skeleton variant="rounded" height={220} />
      <Skeleton variant="rounded" height={360} />
    </Stack>
  )
}

export default function ShopPage() {
  const { id } = useParams()
  const notify = useNotify()
  const { location } = useCustomerLocation()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [cart, setCart, clearCart] = useCart(id)
  const [cartOpen, setCartOpen] = useState(false)
  const inCart = Object.keys(cart.items).length > 0
  useTitle(data?.shop.shopName)

  // One view per visit; the API also ignores repeats from the same device for 30 minutes.
  useEffect(() => { track(id, 'VIEW') }, [id])

  useEffect(() => {
    api.get(`/shops/${id}`, { params: location || {} })
      .then(({ data }) => setData(data))
      .catch((e) => setError(errorMessage(e)))
  }, [id, location])

  const grouped = useMemo(() => {
    const f = filter.trim().toLowerCase()
    const groups = {}
    for (const p of data?.products ?? []) {
      if (f && !p.name.toLowerCase().includes(f) && !p.category.toLowerCase().includes(f)) continue
      if (inStockOnly && !p.inStock) continue
      ;(groups[p.category] ||= []).push(p)
    }
    // In-stock items first within each group.
    return Object.entries(groups).map(([c, items]) => [c, items.sort((a, b) => Number(b.inStock) - Number(a.inStock))])
  }, [data, filter, inStockOnly])

  if (error) {
    return (
      <EmptyState icon={<StorefrontIcon />} title="We couldn't open this shop" action={<Button variant="contained" component={RouterLink} to="/">Back to nearby shops</Button>}>
        {error}
      </EmptyState>
    )
  }
  if (!data) return <PageSkeleton />
  const { shop, products } = data
  const { color } = categoryStyle(shop.category)
  const [lng, lat] = shop.location.coordinates
  const inStock = products.filter((p) => p.inStock).length

  const copyPhone = async () => {
    try { await navigator.clipboard.writeText(shop.phone); notify('Phone number copied') } catch { notify('Could not copy', 'error') }
  }
  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: shop.shopName, text: `${shop.shopName} on LocalKart`, url })
      else { await navigator.clipboard.writeText(url); notify('Link copied — share it with anyone') }
    } catch { /* user closed the share sheet */ }
  }
  const jump = (cat) => document.getElementById(slug(cat))?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <Stack spacing={2.5} sx={{ pb: { xs: 10, md: inCart ? 12 : 0 } }}>
      <Button component={RouterLink} to="/" startIcon={<ArrowBackIcon />} sx={{ alignSelf: 'flex-start', ml: -1 }}>All nearby shops</Button>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1fr) 340px' }, gap: 2.5, alignItems: 'start' }}>
        {/* Shop header */}
        <Card sx={{ overflow: 'hidden' }}>
          <Box sx={{ height: 84, background: `linear-gradient(120deg, ${alpha(color, 0.9)}, ${alpha(color, 0.55)})` }} />
          <Box sx={{ px: { xs: 2, sm: 3 }, pb: 3, mt: -4 }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <Box sx={{ p: 0.5, bgcolor: 'background.paper', borderRadius: '16px', display: 'inline-flex' }}>
                <CategoryAvatar category={shop.category} size={68} />
              </Box>
              <Tooltip title="Share this shop">
                <IconButton onClick={share} sx={{ border: 1, borderColor: 'divider' }}><ShareIcon fontSize="small" /></IconButton>
              </Tooltip>
            </Stack>
            <Typography variant="h4" component="h1" sx={{ mt: 1.5, fontSize: { xs: '1.6rem', sm: '2.1rem' } }}>{shop.shopName}</Typography>
            <Stack direction="row" useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
              <OpenBadge open={shop.isOpen} />
              <Typography color="text.disabled">·</Typography>
              <Typography color="text.secondary">{shop.category}</Typography>
              {shop.distanceKm != null && <><Typography color="text.disabled">·</Typography><Typography color="text.secondary">{formatDistance(shop.distanceKm)} away</Typography></>}
            </Stack>
            {shop.description && <Typography sx={{ mt: 1.5, color: 'text.secondary' }}>{shop.description}</Typography>}
            {!shop.isOpen && <Alert severity="warning" sx={{ mt: 2 }}>This shop is closed right now. You can still call to ask when they open.</Alert>}
          </Box>
        </Card>

        {/* Contact & delivery */}
        <Card sx={{ p: 2.5, position: { md: 'sticky' }, top: { md: 88 } }}>
          <Box sx={{ display: { xs: 'none', md: 'block' }, mb: 1 }}>
            <CallButtons shop={shop} fullWidth />
          </Box>
          <InfoRow icon={<PhoneIcon fontSize="small" />} action={<Tooltip title="Copy number"><IconButton size="small" onClick={copyPhone}><ContentCopyIcon fontSize="small" /></IconButton></Tooltip>}>
            <Typography sx={{ fontWeight: 600 }}>{formatPhone(shop.phone)}</Typography>
            {shop.alternatePhone && <Typography variant="body2" color="text.secondary">Alt: {formatPhone(shop.alternatePhone)}</Typography>}
          </InfoRow>
          <Divider />
          <InfoRow icon={<PlaceIcon fontSize="small" />} action={<Button size="small" startIcon={<DirectionsIcon />} href={directionsUrl(lat, lng)} target="_blank" rel="noreferrer" onClick={() => track(shop._id, 'DIRECTIONS')}>Directions</Button>}>
            <Typography variant="body2">{shop.address}</Typography>
          </InfoRow>
          <Divider />
          <InfoRow icon={<AccessTimeIcon fontSize="small" />}>
            <Typography variant="body2">{shop.openingHours || 'Hours not listed'}</Typography>
          </InfoRow>
          <Divider />
          <InfoRow icon={<LocalShippingIcon fontSize="small" />}>
            <DeliveryChip shop={shop} />
            {shop.homeDelivery && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                Up to {shop.deliveryRadiusKm} km · {shop.minOrderAmount ? `Min order ₹${shop.minOrderAmount}` : 'No minimum'} · {shop.deliveryCharge ? `₹${shop.deliveryCharge} charge` : 'Free delivery'}
              </Typography>
            )}
          </InfoRow>
        </Card>
      </Box>

      {/* Inventory */}
      <Card sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
          <Box>
            <Typography variant="h5" component="h2">What's available</Typography>
            <Typography variant="body2" color="text.secondary">{inStock} of {products.length} items in stock · tap <b>Add</b> to build an order and send it on WhatsApp</Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search this shop"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              sx={{ flex: 1, minWidth: { sm: 220 } }}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                  endAdornment: filter && <IconButton size="small" aria-label="Clear" onClick={() => setFilter('')}><CloseIcon fontSize="small" /></IconButton>,
                },
              }}
            />
            <FormControlLabel sx={{ whiteSpace: 'nowrap', mr: 0 }} control={<Switch size="small" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} />} label="In stock" />
          </Stack>
        </Stack>

        {grouped.length > 1 && (
          <Stack direction="row" useFlexGap sx={{ mt: 2, gap: 1, overflowX: 'auto', pb: 0.5 }}>
            {grouped.map(([cat, items]) => <Chip key={cat} label={`${cat} (${items.length})`} onClick={() => jump(cat)} variant="outlined" sx={{ flexShrink: 0 }} />)}
          </Stack>
        )}

        {products.length === 0 && (
          <EmptyState icon={<Inventory2Icon />} title="No items listed yet">This shop hasn't added its inventory. Call them to ask what they have.</EmptyState>
        )}
        {products.length > 0 && grouped.length === 0 && (
          <EmptyState icon={<SearchIcon />} title="No matching items" action={<Button onClick={() => { setFilter(''); setInStockOnly(false) }}>Show all items</Button>}>
            Nothing here matches{filter ? ` "${filter}"` : ''}. The shop might still have it — give them a call.
          </EmptyState>
        )}

        {grouped.map(([cat, items]) => (
          <Box key={cat} id={slug(cat)} sx={{ mt: 3, scrollMarginTop: 88 }}>
            <Typography variant="overline" sx={{ color: 'primary.main' }}>{cat}</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.25, mt: 0.5 }}>
              {items.map((p) => (
                <Paper
                  key={p._id}
                  variant="outlined"
                  sx={{ p: 1.5, borderRadius: '12px', display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: p.inStock ? 'background.paper' : 'action.hover' }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600, color: p.inStock ? 'text.primary' : 'text.secondary' }} noWrap>{p.name}</Typography>
                    {p.description && <Typography variant="body2" color="text.secondary" noWrap>{p.description}</Typography>}
                    {!p.inStock && <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 700 }}>Out of stock</Typography>}
                  </Box>
                  <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: p.inStock ? 'text.primary' : 'text.secondary' }}>{money(p.price)}</Typography>
                    <Typography variant="caption" color="text.secondary">per {p.unit}</Typography>
                  </Box>
                  {p.inStock && (cart.items[p._id]
                    ? <QtyStepper qty={cart.items[p._id].qty} label={p.name} onChange={(q) => setCart(setQty(cart, p._id, q))} />
                    : <Button size="small" variant="outlined" startIcon={<AddShoppingCartIcon fontSize="small" />} onClick={() => setCart(addItem(cart, p))} aria-label={`Add ${p.name} to order`} sx={{ flexShrink: 0 }}>Add</Button>)}
                </Paper>
              ))}
            </Box>
          </Box>
        ))}
      </Card>

      {/* Phones: keep the order buttons within thumb reach */}
      {inCart ? (
        <CartBar cart={cart} shop={shop} onOpen={() => setCartOpen(true)} />
      ) : (
        <Paper elevation={8} sx={{ display: { xs: 'block', md: 'none' }, position: 'fixed', left: 0, right: 0, bottom: 0, p: 1.5, zIndex: 1100, borderRadius: '16px 16px 0 0' }}>
          <CallButtons shop={shop} fullWidth />
        </Paper>
      )}
      <OrderCart open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} setCart={setCart} clear={clearCart} shop={shop} location={location} onFresh={setData} />
    </Stack>
  )
}
