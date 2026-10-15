import { useEffect, useMemo, useState } from 'react'
import {
  Alert, Box, Button, Card, Chip, CircularProgress, Container, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, InputAdornment, Skeleton, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography, useMediaQuery, useTheme,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import PlaceIcon from '@mui/icons-material/Place'
import CloseIcon from '@mui/icons-material/Close'
import MyLocationIcon from '@mui/icons-material/MyLocation'
import MapIcon from '@mui/icons-material/Map'
import ViewListIcon from '@mui/icons-material/ViewList'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import StorefrontIcon from '@mui/icons-material/Storefront'
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import WhereToVoteIcon from '@mui/icons-material/WhereToVote'
import api, { errorMessage } from '../lib/api.js'
import { formatCoords, useCustomerLocation, usePlaceName } from '../lib/location.js'
import { categoryStyle } from '../lib/categories.jsx'
import useTitle from '../lib/useTitle.js'
import LocationPicker from '../components/LocationPicker.jsx'
import ShopCard from '../components/ShopCard.jsx'
import ShopsMap from '../components/ShopsMap.jsx'
import EmptyState from '../components/EmptyState.jsx'

function useDebounced(value, ms = 350) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

const SUGGESTIONS = ['Milk', 'Bread', 'Eggs', 'Rice', 'Paracetamol', 'Vegetables']

const STEPS = [
  { icon: <WhereToVoteIcon />, title: 'Share your location', text: 'We only show shops within walking or quick-delivery distance.' },
  { icon: <Inventory2Icon />, title: 'Check what is in stock', text: 'Search for an item and see which shops have it, with prices.' },
  { icon: <PhoneInTalkIcon />, title: 'Call or WhatsApp to order', text: 'Talk to the shop directly. Pick up, or get it delivered.' },
]

function ShopCardSkeleton() {
  return (
    <Card sx={{ p: 2 }}>
      <Stack direction="row" spacing={1.5}>
        <Skeleton variant="rounded" width={48} height={48} />
        <Box sx={{ flex: 1 }}>
          <Skeleton width="60%" height={28} />
          <Skeleton width="40%" />
          <Skeleton width="80%" />
        </Box>
      </Stack>
      <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
        <Skeleton variant="rounded" width={120} height={24} />
        <Skeleton variant="rounded" width={90} height={24} />
      </Stack>
      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        <Skeleton variant="rounded" width={130} height={32} />
        <Skeleton variant="rounded" width={110} height={32} />
      </Stack>
    </Card>
  )
}

function FilterChip({ selected, ...props }) {
  return <Chip {...props} color={selected ? 'primary' : 'default'} variant={selected ? 'filled' : 'outlined'} sx={{ bgcolor: selected ? undefined : 'background.paper', flexShrink: 0 }} />
}

export default function Home() {
  useTitle('Shops near you')
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))
  const { location, setLocation, detect, detecting, error: locError } = useCustomerLocation()
  const placeName = usePlaceName(location)
  const [meta, setMeta] = useState({ maxRadiusKm: 5, categories: [] })
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [deliveryOnly, setDeliveryOnly] = useState(false)
  const [openOnly, setOpenOnly] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [draft, setDraft] = useState(null)
  const [view, setView] = useState('list')
  const [activeId, setActiveId] = useState(null)
  const q = useDebounced(search.trim())

  useEffect(() => {
    api.get('/meta').then(({ data }) => setMeta(data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!location) return
    let cancelled = false
    setLoading(true)
    api
      .get('/shops/nearby', { params: { ...location, q: q || undefined, category: category || undefined, delivery: deliveryOnly || undefined } })
      .then(({ data }) => !cancelled && (setResult(data), setError('')))
      .catch((e) => !cancelled && setError(errorMessage(e)))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [location, q, category, deliveryOnly])

  const shops = useMemo(() => (result?.shops ?? []).filter((s) => !openOnly || s.isOpen), [result, openOnly])
  const radiusKm = result?.radiusKm ?? meta.maxRadiusKm
  const hasFilters = Boolean(q || category || deliveryOnly || openOnly)
  const clearFilters = () => { setSearch(''); setCategory(''); setDeliveryOnly(false); setOpenOnly(false) }

  const openPicker = () => { setDraft(location); setPickerOpen(true) }
  const useMyLocation = async () => { if (await detect()) setPickerOpen(false) }

  const showList = isDesktop || view === 'list'
  const showMap = isDesktop || view === 'map'

  return (
    <>
      {/* Hero: where am I + what do I need */}
      <Box sx={{ background: 'linear-gradient(135deg, #053d30 0%, #0b6e55 55%, #14916f 100%)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', right: -80, top: -80, width: 320, height: 320, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
        <Box sx={{ position: 'absolute', right: 120, bottom: -120, width: 220, height: 220, borderRadius: '50%', bgcolor: 'rgba(245,158,11,0.18)' }} />
        <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 }, position: 'relative' }}>
          <Button
            onClick={openPicker}
            startIcon={<PlaceIcon />}
            sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 99, px: 2, mb: 2.5, maxWidth: '100%', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
          >
            <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {location ? placeName || formatCoords(location) : detecting ? 'Finding your location…' : 'Set your location'}
            </Box>
            <Box component="span" sx={{ ml: 1, color: 'secondary.light', fontWeight: 700, flexShrink: 0 }}>{location ? 'Change' : ''}</Box>
          </Button>
          <Typography variant="h3" component="h1" sx={{ fontSize: { xs: '1.9rem', sm: '2.6rem', md: '3rem' }, maxWidth: 680 }}>
            Everything you need, from shops <Box component="span" sx={{ color: 'secondary.light' }}>around the corner</Box>
          </Typography>
          <Typography sx={{ mt: 1.5, opacity: 0.85, maxWidth: 560, fontSize: { sm: '1.1rem' } }}>
            See what local shops within {meta.maxRadiusKm} km have in stock, then call or WhatsApp them to order.
          </Typography>

          <TextField
            fullWidth
            placeholder="Search for milk, rice, medicines or a shop name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={!location}
            sx={{ mt: 3, maxWidth: 720, '& .MuiOutlinedInput-root': { height: 56, borderRadius: '12px', boxShadow: '0 12px 32px rgba(0,0,0,0.18)', fontSize: '1.05rem' }, '& fieldset': { border: 'none' } }}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start"><SearchIcon color="primary" /></InputAdornment>,
                endAdornment: (loading && q) ? <CircularProgress size={20} /> : search && (
                  <IconButton aria-label="Clear search" onClick={() => setSearch('')} edge="end"><CloseIcon /></IconButton>
                ),
              },
            }}
          />
          {location && !search && (
            <Stack direction="row" useFlexGap sx={{ mt: 1.5, flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
              <Typography variant="body2" sx={{ opacity: 0.75 }}>Popular:</Typography>
              {SUGGESTIONS.map((s) => (
                <Chip key={s} label={s} size="small" onClick={() => setSearch(s)} sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.14)', '&:hover': { bgcolor: 'rgba(255,255,255,0.24)' } }} />
              ))}
            </Stack>
          )}
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 2.5, md: 4 } }}>
        {!location ? (
          <Stack spacing={4}>
            <Card sx={{ p: { xs: 1, sm: 3 } }}>
              <EmptyState
                icon={detecting ? <CircularProgress size={32} /> : <MyLocationIcon />}
                title={detecting ? 'Finding your location…' : 'Where should we look for shops?'}
                action={!detecting && (
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 1 }}>
                    <Button variant="contained" size="large" startIcon={<MyLocationIcon />} onClick={detect}>Use my current location</Button>
                    <Button variant="outlined" size="large" startIcon={<MapIcon />} onClick={openPicker}>Search or pick on map</Button>
                  </Stack>
                )}
              >
                {locError
                  ? `${locError} You can also search for your area instead.`
                  : 'Allow location access so we can show shops near you. We never share your location with shops.'}
              </EmptyState>
            </Card>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
              {STEPS.map((s, i) => (
                <Card key={s.title} sx={{ p: 3 }}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: '10px', display: 'grid', placeItems: 'center', bgcolor: 'secondary.main', color: 'secondary.contrastText' }}>{s.icon}</Box>
                    <Typography variant="overline" color="text.secondary">Step {i + 1}</Typography>
                  </Stack>
                  <Typography variant="h6">{s.title}</Typography>
                  <Typography color="text.secondary">{s.text}</Typography>
                </Card>
              ))}
            </Box>
          </Stack>
        ) : (
          <Stack spacing={2.5}>
            {/* Categories: one tap, scrolls sideways on phones */}
            <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 0.5, mx: { xs: -2, sm: 0 }, px: { xs: 2, sm: 0 }, flexWrap: { md: 'wrap' }, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
              <FilterChip label="All shops" icon={<StorefrontIcon />} selected={!category} onClick={() => setCategory('')} />
              {meta.categories.map((c) => {
                const { Icon } = categoryStyle(c)
                return <FilterChip key={c} label={c} icon={<Icon />} selected={category === c} onClick={() => setCategory(category === c ? '' : c)} />
              })}
            </Box>

            <Stack direction="row" useFlexGap sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
              <Box>
                <Typography variant="h5" component="h2">
                  {loading && !result ? 'Looking for shops…' : `${shops.length} ${shops.length === 1 ? 'shop' : 'shops'} near you`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Within {radiusKm} km{q ? ` · matching "${q}"` : ''}{category ? ` · ${category}` : ''} · nearest first
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <FilterChip icon={<LocalShippingIcon />} label="Home delivery" selected={deliveryOnly} onClick={() => setDeliveryOnly((v) => !v)} />
                <FilterChip icon={<AccessTimeIcon />} label="Open now" selected={openOnly} onClick={() => setOpenOnly((v) => !v)} />
                {!isDesktop && (
                  <ToggleButtonGroup size="small" exclusive value={view} onChange={(_e, v) => v && setView(v)} sx={{ bgcolor: 'background.paper' }}>
                    <ToggleButton value="list" aria-label="List view"><ViewListIcon fontSize="small" /></ToggleButton>
                    <ToggleButton value="map" aria-label="Map view"><MapIcon fontSize="small" /></ToggleButton>
                  </ToggleButtonGroup>
                )}
              </Stack>
            </Stack>

            {error && <Alert severity="error" action={<Button color="inherit" onClick={() => setLocation({ ...location })}>Retry</Button>}>{error}</Alert>}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1.1fr) minmax(0, 1fr)' }, gap: 3, alignItems: 'start' }}>
              {showList && (
                <Stack spacing={2} sx={{ opacity: loading && result ? 0.6 : 1, transition: 'opacity .2s' }}>
                  {loading && !result && [0, 1, 2].map((i) => <ShopCardSkeleton key={i} />)}
                  {shops.map((s) => <ShopCard key={s._id} shop={s} active={activeId === s._id} onHover={setActiveId} />)}
                  {result && !shops.length && !loading && (
                    <Card>
                      <EmptyState
                        icon={<SearchIcon />}
                        title={q ? `No ${category ? `${category} ` : ''}shops nearby have "${q}"` : 'No shops match these filters'}
                        action={hasFilters && <Button variant="outlined" onClick={clearFilters}>Clear search & filters</Button>}
                      >
                        Try a different word, remove a filter, or change your location.
                      </EmptyState>
                    </Card>
                  )}
                </Stack>
              )}
              {showMap && (
                <Box sx={{ height: { xs: 'calc(100vh - 260px)', md: 'calc(100vh - 120px)' }, minHeight: 360, maxHeight: 640, position: { md: 'sticky' }, top: { md: 88 }, borderRadius: '16px', boxShadow: '0 4px 20px rgba(20,33,29,0.08)' }}>
                  <ShopsMap center={location} radiusKm={radiusKm} shops={shops} activeId={activeId} onHover={setActiveId} />
                </Box>
              )}
            </Box>
          </Stack>
        )}
      </Container>

      <Dialog open={pickerOpen} onClose={() => setPickerOpen(false)} fullWidth maxWidth="sm" fullScreen={!isDesktop}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Set your location
          <IconButton aria-label="Close" onClick={() => setPickerOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
          {locError && <Alert severity="warning" sx={{ mb: 2 }}>{locError}</Alert>}
          <LocationPicker value={draft} onChange={setDraft} radiusKm={meta.maxRadiusKm} detecting={detecting} onDetect={useMyLocation} height={isDesktop ? 340 : 'calc(100vh - 300px)'} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPickerOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!draft} onClick={() => { setLocation(draft); setPickerOpen(false) }}>Show shops here</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
