import { useEffect, useState } from 'react'
import { Alert, Box, Collapse, FormControlLabel, InputAdornment, ListItemIcon, MenuItem, Slider, Stack, Switch, TextField, Typography } from '@mui/material'
import StorefrontIcon from '@mui/icons-material/Storefront'
import PlaceIcon from '@mui/icons-material/Place'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import LocationPicker from './LocationPicker.jsx'
import FormSection from './FormSection.jsx'
import { categoryStyle } from '../lib/categories.jsx'
import { getCurrentPosition } from '../lib/location.js'
import api from '../lib/api.js'
import { PHONE_MSG, formatPhone, hasRealText, inIndia, isMobile, isValidPhone, moneyError, normalizePhone } from '../lib/validation.js'

export const emptyShop = {
  shopName: '', phone: '', alternatePhone: '', category: 'Grocery', description: '', address: '',
  openingHours: '9:00 AM - 9:00 PM', isOpen: true,
  homeDelivery: false, deliveryRadiusKm: 2, minOrderAmount: 0, deliveryCharge: 0,
  lat: null, lng: null,
}

export const SHOP_SECTIONS = ['details', 'location', 'delivery']

/** Client-side checks that mirror the API, so people see problems next to the field. */
export function validateShop(v, sections = SHOP_SECTIONS) {
  const e = {}
  if (sections.includes('details')) {
    const phone = normalizePhone(v.phone)
    const alt = normalizePhone(v.alternatePhone)
    if (!v.shopName.trim()) e.shopName = 'Shop name is required'
    else if (!hasRealText(v.shopName, 2, 120)) e.shopName = 'Shop name must be 2-120 characters and include letters or numbers'
    if (!phone) e.phone = 'Phone number is required'
    else if (!isValidPhone(phone)) e.phone = PHONE_MSG
    if (alt && !isValidPhone(alt)) e.alternatePhone = PHONE_MSG
    else if (alt && alt === phone) e.alternatePhone = 'Must be different from the main phone'
  }
  if (sections.includes('location')) {
    const address = v.address.trim()
    if (!address) e.address = 'Address is required'
    else if (address.length < 5 || !/\p{L}/u.test(address)) e.address = 'Enter the full address (shop no., street, area)'
    if (v.lat == null) e.location = 'Set your shop location on the map'
    else if (!inIndia(v.lat, v.lng)) e.location = 'Shop location must be in India'
  }
  if (sections.includes('delivery') && v.homeDelivery) {
    const min = moneyError(v.minOrderAmount, 'Minimum order', 100000)
    const charge = moneyError(v.deliveryCharge, 'Delivery charge', 5000)
    if (min) e.minOrderAmount = min
    if (charge) e.deliveryCharge = charge
  }
  return e
}

/** Values to send to the API: phones in their clean form. */
export const cleanShop = (v) => ({ ...v, phone: normalizePhone(v.phone), alternatePhone: normalizePhone(v.alternatePhone) })

// Let people type spaces, dashes and +91 while typing; the number is cleaned when they leave the field.
const phoneChars = (s) => s.replace(/[^\d+\s\-()]/g, '')

function phoneHint(raw, fallback) {
  const n = normalizePhone(raw)
  if (isMobile(n)) return `Mobile ${formatPhone(n)}: customers can call and WhatsApp`
  if (isValidPhone(n)) return `Landline ${formatPhone(n)}: customers can call (no WhatsApp)`
  return fallback
}
const rupee = { input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> }, htmlInput: { min: 0, inputMode: 'numeric' } }

/** Controlled form for shop profile + map location + delivery settings, split into sections. */
export default function ShopForm({ value, onChange, errors = {}, sections = SHOP_SECTIONS }) {
  const [categories, setCategories] = useState([])
  const [detecting, setDetecting] = useState(false)
  const [locError, setLocError] = useState('')
  const [touched, setTouched] = useState({})
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const setPhone = (key) => (e) => onChange({ ...value, [key]: phoneChars(e.target.value) })
  // Errors show once a field has been left (or after a submit attempt, via `errors`).
  const live = validateShop(value, sections)
  const shown = { ...Object.fromEntries(Object.entries(live).filter(([k]) => touched[k])), ...errors }
  const touch = (key) => () => setTouched((t) => ({ ...t, [key]: true }))
  const blurPhone = (key) => () => {
    touch(key)()
    const n = normalizePhone(value[key])
    if (n !== value[key]) onChange({ ...value, [key]: n })
  }
  const err = (key) => ({ error: Boolean(shown[key]), helperText: shown[key], onBlur: touch(key) })

  useEffect(() => {
    api.get('/meta').then(({ data }) => setCategories(data.categories)).catch(() => {})
  }, [])

  const detect = async () => {
    setDetecting(true)
    try {
      onChange({ ...value, ...(await getCurrentPosition()) })
      setLocError('')
    } catch (e) {
      setLocError(e.message)
    } finally {
      setDetecting(false)
    }
  }

  const point = value.lat != null ? { lat: value.lat, lng: value.lng } : null
  const radius = Number(value.deliveryRadiusKm)

  return (
    <Stack spacing={2.5}>
      {sections.includes('details') && (
        <FormSection icon={<StorefrontIcon />} title="Shop details" subtitle="This is what customers see when they find your shop">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField label="Shop name" required value={value.shopName} onChange={set('shopName')} placeholder="e.g. Sri Lakshmi Stores" {...err('shopName')} />
            <TextField select label="Category" value={value.category} onChange={set('category')}>
              {(categories.length ? categories : [value.category]).map((c) => {
                const { Icon, color } = categoryStyle(c)
                return (
                  <MenuItem key={c} value={c}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <ListItemIcon sx={{ minWidth: 0, color }}><Icon fontSize="small" /></ListItemIcon>
                      <span>{c}</span>
                    </Stack>
                  </MenuItem>
                )
              })}
            </TextField>
            <TextField
              label="Phone for customer calls" required value={value.phone} onChange={setPhone('phone')} placeholder="98765 43210"
              slotProps={{ htmlInput: { inputMode: 'tel', maxLength: 18, autoComplete: 'tel' } }}
              {...err('phone')} onBlur={blurPhone('phone')}
              helperText={shown.phone || phoneHint(value.phone, 'Customers will call or WhatsApp this number')}
            />
            <TextField
              label="Alternate phone (optional)" value={value.alternatePhone || ''} onChange={setPhone('alternatePhone')}
              slotProps={{ htmlInput: { inputMode: 'tel', maxLength: 18 } }} {...err('alternatePhone')} onBlur={blurPhone('alternatePhone')}
              helperText={shown.alternatePhone || (value.alternatePhone ? phoneHint(value.alternatePhone, ' ') : ' ')}
            />
            <TextField label="Opening hours" value={value.openingHours} onChange={set('openingHours')} helperText="e.g. 8:00 AM - 10:00 PM, closed Sunday" />
            <Box sx={{ px: 1.5, py: 1, border: 1, borderColor: 'divider', borderRadius: '10px', display: 'flex', alignItems: 'center', alignSelf: 'start', minHeight: 56 }}>
              <FormControlLabel
                sx={{ m: 0, width: '100%', justifyContent: 'space-between' }}
                labelPlacement="start"
                control={<Switch checked={value.isOpen} onChange={set('isOpen')} color="success" />}
                label={<Typography sx={{ fontWeight: 600, color: value.isOpen ? 'success.main' : 'error.main' }}>{value.isOpen ? 'Open right now' : 'Closed right now'}</Typography>}
              />
            </Box>
          </Box>
          <TextField
            label="About the shop (optional)" multiline minRows={2} fullWidth sx={{ mt: 2 }}
            value={value.description || ''} onChange={set('description')}
            placeholder="What do you sell? Anything special — fresh stock daily, credit for regulars…"
            slotProps={{ htmlInput: { maxLength: 500 } }}
            helperText={`${(value.description || '').length}/500`}
          />
        </FormSection>
      )}

      {sections.includes('location') && (
        <FormSection icon={<PlaceIcon />} title="Shop location" subtitle="Customers within 5 km of this point can find you">
          <Stack spacing={2}>
            <TextField label="Full address" required fullWidth value={value.address} onChange={set('address')} placeholder="Shop no., street, area, landmark" {...err('address')} />
            {(locError || errors.location || (value.lat != null && live.location)) && (
              <Alert severity={errors.location || live.location ? 'error' : 'warning'}>{errors.location || live.location || locError}</Alert>
            )}
            <LocationPicker
              value={point}
              onChange={(p) => onChange({ ...value, ...p })}
              onDetect={detect}
              detecting={detecting}
              radiusKm={value.homeDelivery ? radius : 0}
              height={300}
            />
          </Stack>
        </FormSection>
      )}

      {sections.includes('delivery') && (
        <FormSection
          icon={<LocalShippingIcon />}
          title="Home delivery"
          subtitle={value.homeDelivery ? `Delivering up to ${radius} km from your shop` : 'Turn on if you deliver orders to customers'}
          action={<Switch checked={value.homeDelivery} onChange={set('homeDelivery')} slotProps={{ input: { 'aria-label': 'We provide home delivery' } }} />}
        >
          <Collapse in={value.homeDelivery}>
            <Stack spacing={2.5}>
              <Box sx={{ px: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Delivery distance: {radius} km</Typography>
                <Slider
                  value={radius} min={0.5} max={5} step={0.5} valueLabelDisplay="auto" valueLabelFormat={(v) => `${v} km`}
                  marks={[1, 2, 3, 4, 5].map((v) => ({ value: v, label: `${v} km` }))}
                  onChange={(_e, v) => onChange({ ...value, deliveryRadiusKm: v })}
                />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField type="number" label="Minimum order" value={value.minOrderAmount} onChange={set('minOrderAmount')} slotProps={rupee} {...err('minOrderAmount')} helperText={shown.minOrderAmount || 'Use 0 for no minimum'} />
                <TextField type="number" label="Delivery charge" value={value.deliveryCharge} onChange={set('deliveryCharge')} slotProps={rupee} {...err('deliveryCharge')} helperText={shown.deliveryCharge || 'Use 0 for free delivery'} />
              </Box>
            </Stack>
          </Collapse>
          {!value.homeDelivery && (
            <Typography variant="body2" color="text.secondary">Customers will see your shop as <b>pickup only</b>.</Typography>
          )}
        </FormSection>
      )}
    </Stack>
  )
}
