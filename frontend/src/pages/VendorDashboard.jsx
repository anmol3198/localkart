import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Alert, Autocomplete, Box, Button, Card, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, InputAdornment, Paper, Skeleton, Slide, Stack, Switch, Tab, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Tabs, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography, alpha, useMediaQuery, useTheme,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/DeleteOutlined'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import VisibilityIcon from '@mui/icons-material/Visibility'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RemoveShoppingCartIcon from '@mui/icons-material/RemoveShoppingCart'
import CategoryIcon from '@mui/icons-material/Category'
import StorefrontIcon from '@mui/icons-material/Storefront'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import SettingsIcon from '@mui/icons-material/Settings'
import QrCode2Icon from '@mui/icons-material/QrCode2'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import TravelExploreIcon from '@mui/icons-material/TravelExplore'
import InsightsIcon from '@mui/icons-material/Insights'
import api, { errorMessage } from '../lib/api.js'
import { useAuth } from '../lib/auth.jsx'
import { useNotify } from '../lib/notify.jsx'
import useTitle from '../lib/useTitle.js'
import ShopForm, { cleanShop, validateShop } from '../components/ShopForm.jsx'
import { hasRealText, moneyError } from '../lib/validation.js'
import CategoryAvatar from '../components/CategoryAvatar.jsx'
import OpenBadge from '../components/OpenBadge.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import Insights from '../components/Insights.jsx'
import SecuritySettings from '../components/SecuritySettings.jsx'
import ShopStatusBanner from '../components/ShopStatusBanner.jsx'

const emptyProduct = { name: '', category: '', price: '', unit: 'piece', inStock: true, description: '', barcode: '' }
const CODE = /^[0-9A-Za-z-]{4,32}$/
const cleanCode = (s) => (s || '').replace(/\s/g, '')
const isRetailCode = (s) => /^\d{8}$|^\d{12,14}$/.test(s)
const UNITS = ['piece', 'kg', '500 g', '250 g', '100 g', 'litre', '500 ml', 'pack', 'dozen', 'box', 'strip', 'bottle', 'packet']

function ProductDialog({ open, initial, categories, onClose, onSave }) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const [form, setForm] = useState(emptyProduct)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [nameError, setNameError] = useState('')
  const [codeError, setCodeError] = useState('')
  const [lookup, setLookup] = useState({ busy: false, note: '' })
  const isNew = !initial?._id
  useEffect(() => {
    if (!open) return
    setForm({ ...emptyProduct, ...initial, barcode: initial?.barcode || '' })
    setError(''); setNameError(''); setCodeError(''); setLookup({ busy: false, note: '' })
  }, [open, initial])

  /** Fill name/section/size from the product database (Open Food Facts) for a retail barcode. */
  const runLookup = useCallback(async (code) => {
    setLookup({ busy: true, note: '' })
    try {
      const { data } = await api.get(`/vendor/barcode-lookup/${encodeURIComponent(code)}`)
      setForm((f) => ({ ...f, name: f.name || data.name, category: f.category || data.section || '', description: f.description || data.quantity || '' }))
      setLookup({ busy: false, note: `Found "${data.name}". Check it and add your price.` })
    } catch (e) {
      setLookup({ busy: false, note: e.response?.status === 404 ? errorMessage(e) : 'Could not look this barcode up right now. Type the name instead.' })
    }
  }, [])

  // Opened from a barcode search for a new product: look the name up straight away.
  useEffect(() => {
    if (open && isNew && initial?.barcode && initial?.autoLookup) runLookup(initial.barcode)
  }, [open, isNew, initial, runLookup])
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const save = async (addAnother) => {
    if (!form.name.trim()) return setNameError('Item name is required')
    if (!hasRealText(form.name, 2, 150)) return setNameError('Item name must be 2-150 characters')
    if (form.price === '') return setError('Enter a price (₹0 or more)')
    const priceError = moneyError(form.price, 'Price', 1000000)
    if (priceError) return setError(priceError)
    const code = cleanCode(form.barcode)
    if (code && !CODE.test(code)) return setCodeError('Use 4-32 letters, numbers or dashes')
    setBusy(true)
    try {
      const { autoLookup: _ignored, ...rest } = form
      await onSave({ ...rest, barcode: cleanCode(form.barcode), name: form.name.trim(), price: Number(form.price), category: form.category.trim() || 'General', unit: form.unit.trim() || 'piece' })
      if (addAnother) setForm({ ...emptyProduct, category: form.category, unit: form.unit })
      else onClose()
      setError('')
    } catch (err) {
      const msg = errorMessage(err)
      if (/barcode/i.test(msg)) setCodeError(msg)
      else setError(msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={fullScreen}>
      <form onSubmit={(e) => { e.preventDefault(); save(false) }} noValidate>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {isNew ? 'Add an item' : 'Edit item'}
          <IconButton aria-label="Close" onClick={onClose}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Item name" required autoFocus value={form.name} placeholder="e.g. Amul Toned Milk"
              onChange={(e) => { set('name')(e); setNameError('') }} error={Boolean(nameError)} helperText={nameError}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Price" type="number" required value={form.price} onChange={set('price')}
                slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> }, htmlInput: { min: 0, step: '0.01', inputMode: 'decimal' } }}
              />
              <Autocomplete
                freeSolo options={UNITS} value={form.unit} onInputChange={(_e, v) => setForm((f) => ({ ...f, unit: v }))}
                renderInput={(params) => <TextField {...params} label="Per (unit)" />}
              />
            </Box>
            <Autocomplete
              freeSolo options={categories} value={form.category} onInputChange={(_e, v) => setForm((f) => ({ ...f, category: v }))}
              renderInput={(params) => <TextField {...params} label="Section" helperText="Groups items on your shop page, e.g. Dairy, Staples, Snacks" />}
            />
            <TextField label="Short description (optional)" value={form.description || ''} onChange={set('description')} placeholder="Brand, size, variety…" slotProps={{ htmlInput: { maxLength: 300 } }} />
            <TextField
              label="Barcode (optional)"
              value={form.barcode}
              onChange={(e) => { setForm({ ...form, barcode: e.target.value.replace(/[^0-9A-Za-z\- ]/g, '') }); setCodeError(''); setLookup({ busy: false, note: '' }) }}
              placeholder="Scan or type the code on the pack"
              error={Boolean(codeError)}
              helperText={codeError || lookup.note || 'Lets you find this item by scanning it. USB barcode scanners work here.'}
              slotProps={{
                htmlInput: { maxLength: 40, inputMode: 'numeric' },
                input: {
                  startAdornment: <InputAdornment position="start"><QrCodeScannerIcon fontSize="small" /></InputAdornment>,
                  endAdornment: isRetailCode(cleanCode(form.barcode)) && (
                    <Button size="small" startIcon={lookup.busy ? <CircularProgress size={14} /> : <TravelExploreIcon />} disabled={lookup.busy} onClick={() => runLookup(cleanCode(form.barcode))} sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                      Look up
                    </Button>
                  ),
                },
              }}
            />
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography sx={{ fontWeight: 600 }}>{form.inStock ? 'In stock' : 'Out of stock'}</Typography>
                <Typography variant="body2" color="text.secondary">Customers see this on your shop page</Typography>
              </Box>
              <Switch checked={form.inStock} color="success" onChange={(e) => setForm({ ...form, inStock: e.target.checked })} />
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1, flexWrap: 'wrap' }}>
          <Button onClick={onClose}>Cancel</Button>
          {isNew && <Button variant="outlined" disabled={busy} onClick={() => save(true)}>Save & add another</Button>}
          <Button type="submit" variant="contained" disabled={busy}>{isNew ? 'Add item' : 'Save changes'}</Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

function StatCard({ icon, label, value, color }) {
  return (
    <Card sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box sx={{ width: 44, height: 44, borderRadius: '12px', display: 'grid', placeItems: 'center', color, bgcolor: alpha(color, 0.12), flexShrink: 0 }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h5" sx={{ lineHeight: 1.1 }}>{value}</Typography>
        <Typography variant="body2" color="text.secondary" noWrap>{label}</Typography>
      </Box>
    </Card>
  )
}

function QuickToggle({ icon, title, on, onText, offText, onChange, busy }) {
  return (
    <Paper
      variant="outlined"
      sx={(t) => ({ p: 1.5, pl: 2, borderRadius: '12px', display: 'flex', alignItems: 'center', gap: 1.5, borderColor: on ? alpha(t.palette.success.main, 0.4) : 'divider', bgcolor: on ? alpha(t.palette.success.main, 0.05) : 'background.paper', flex: 1, minWidth: 220 })}
    >
      <Box sx={{ color: on ? 'success.main' : 'text.disabled', display: 'flex' }}>{icon}</Box>
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
        <Typography variant="body2" color="text.secondary">{on ? onText : offText}</Typography>
      </Box>
      {busy ? <CircularProgress size={22} sx={{ mx: 1.5 }} /> : <Switch checked={on} onChange={onChange} color="success" slotProps={{ input: { 'aria-label': title } }} />}
    </Paper>
  )
}

function Inventory({ products, setProducts, reload, notify }) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [filter, setFilter] = useState('')
  const [stock, setStock] = useState('all')
  const [editing, setEditing] = useState(null) // null = closed, {} = new
  const [deleting, setDeleting] = useState(null)
  const [missingCode, setMissingCode] = useState(null)

  const categories = useMemo(() => [...new Set(products.map((p) => p.category))].sort(), [products])

  const save = async (form) => {
    if (form._id) await api.put(`/vendor/products/${form._id}`, form)
    else await api.post('/vendor/products', form)
    notify(form._id ? 'Item updated' : `"${form.name}" added`)
    reload()
  }

  const toggleStock = async (p) => {
    setProducts((list) => list.map((x) => (x._id === p._id ? { ...x, inStock: !p.inStock } : x)))
    try {
      await api.put(`/vendor/products/${p._id}`, { inStock: !p.inStock })
      notify(`${p.name} marked ${p.inStock ? 'out of stock' : 'in stock'}`)
    } catch (e) {
      notify(errorMessage(e), 'error')
      reload()
    }
  }

  const remove = async () => {
    const p = deleting
    setDeleting(null)
    try {
      await api.delete(`/vendor/products/${p._id}`)
      notify(`"${p.name}" deleted`)
      reload()
    } catch (e) {
      notify(errorMessage(e), 'error')
    }
  }

  const visible = useMemo(() => {
    const f = filter.trim().toLowerCase()
    return products
      .filter((p) => !f || p.name.toLowerCase().includes(f) || p.category.toLowerCase().includes(f) || (p.barcode || '').toLowerCase().includes(cleanCode(f)))
      .filter((p) => stock === 'all' || (stock === 'in') === p.inStock)
  }, [products, filter, stock])

  const outCount = products.filter((p) => !p.inStock).length

  /** Enter in the search box (what USB barcode scanners send): open the scanned item, or offer to add it. */
  const onSearchKey = (e) => {
    if (e.key !== 'Enter') return
    const code = cleanCode(filter).toUpperCase()
    if (!CODE.test(code) || !/\d/.test(code)) return
    e.preventDefault()
    const hit = products.find((p) => (p.barcode || '').toUpperCase() === code)
    if (hit) {
      setFilter('')
      setMissingCode(null)
      setEditing(hit)
    } else {
      setMissingCode(code)
    }
  }
  const addMissing = () => {
    setEditing({ barcode: missingCode, autoLookup: isRetailCode(missingCode) })
    setMissingCode(null)
    setFilter('')
  }

  if (products.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Inventory2Icon />}
          title="Add the items you sell"
          action={<Button variant="contained" size="large" startIcon={<AddIcon />} onClick={() => setEditing({})}>Add your first item</Button>}
        >
          Shops with a full inventory get more calls — customers search for items like "milk" or "rice" and find shops that have them.
        </EmptyState>
        <ProductDialog open={editing !== null} initial={editing} categories={categories} onClose={() => setEditing(null)} onSave={save} />
      </Card>
    )
  }

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
        <Stack direction="row" spacing={1} sx={{ flex: 1, alignItems: 'center' }}>
          <TextField
            size="small" placeholder="Search, or scan a barcode" value={filter} onChange={(e) => { setFilter(e.target.value); setMissingCode(null) }} onKeyDown={onSearchKey} sx={{ flex: 1, maxWidth: { sm: 320 } }}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                endAdornment: filter && <IconButton size="small" aria-label="Clear" onClick={() => setFilter('')}><CloseIcon fontSize="small" /></IconButton>,
              },
            }}
          />
          <ToggleButtonGroup size="small" exclusive value={stock} onChange={(_e, v) => v && setStock(v)} sx={{ bgcolor: 'background.paper' }}>
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="in">In stock</ToggleButton>
            <ToggleButton value="out">Out{outCount ? ` (${outCount})` : ''}</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing({})}>Add item</Button>
      </Stack>
      {missingCode && (
        <Alert severity="info" icon={<QrCodeScannerIcon />} onClose={() => setMissingCode(null)}
          action={<Button color="inherit" size="small" startIcon={<AddIcon />} onClick={addMissing}>Add it</Button>}>
          No item with barcode <b>{missingCode}</b> in your shop yet.
        </Alert>
      )}
      <Typography variant="body2" color="text.secondary">Tip: flip the stock switch whenever something runs out. With a USB barcode scanner, scan into the search box to jump to an item.</Typography>

      {visible.length === 0 ? (
        <Card><EmptyState icon={<SearchIcon />} title="No items match" action={<Button onClick={() => { setFilter(''); setStock('all') }}>Show all items</Button>} /></Card>
      ) : isMobile ? (
        <Stack spacing={1}>
          {visible.map((p) => (
            <Card key={p._id} sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1, opacity: p.inStock ? 1 : 0.75 }}>
              <Box sx={{ flex: 1, minWidth: 0 }} onClick={() => setEditing(p)}>
                <Typography sx={{ fontWeight: 600 }} noWrap>{p.name}</Typography>
                <Typography variant="body2" color="text.secondary" noWrap>₹{p.price} / {p.unit} · {p.category}</Typography>
              </Box>
              <Switch size="small" color="success" checked={p.inStock} onChange={() => toggleStock(p)} slotProps={{ input: { 'aria-label': `${p.name} in stock` } }} />
              <IconButton size="small" aria-label={`Edit ${p.name}`} onClick={() => setEditing(p)}><EditIcon fontSize="small" /></IconButton>
              <IconButton size="small" aria-label={`Delete ${p.name}`} color="error" onClick={() => setDeleting(p)}><DeleteIcon fontSize="small" /></IconButton>
            </Card>
          ))}
        </Stack>
      ) : (
        <TableContainer component={Card}>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, color: 'text.secondary', bgcolor: 'action.hover' } }}>
                <TableCell>Item</TableCell>
                <TableCell>Section</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="center">In stock</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.map((p) => (
                <TableRow key={p._id} hover sx={{ '& td': { color: p.inStock ? 'text.primary' : 'text.secondary' } }}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600 }}>{p.name}</Typography>
                    {p.barcode && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontFamily: 'ui-monospace, monospace' }}>
                        <QrCodeScannerIcon sx={{ fontSize: 14 }} />{p.barcode}
                      </Typography>
                    )}
                    {p.description && <Typography variant="body2" color="text.secondary">{p.description}</Typography>}
                  </TableCell>
                  <TableCell><Chip size="small" label={p.category} variant="outlined" /></TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}><b>₹{p.price}</b> / {p.unit}</TableCell>
                  <TableCell align="center">
                    <Switch size="small" color="success" checked={p.inStock} onChange={() => toggleStock(p)} slotProps={{ input: { 'aria-label': `${p.name} in stock` } }} />
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => setEditing(p)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleting(p)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <ProductDialog open={editing !== null} initial={editing} categories={categories} onClose={() => setEditing(null)} onSave={save} />
      <ConfirmDialog open={Boolean(deleting)} title="Delete this item?" danger confirmLabel="Delete" onConfirm={remove} onClose={() => setDeleting(null)}>
        "{deleting?.name}" will be removed from your shop. If it has only run out, switch it to <b>out of stock</b> instead.
      </ConfirmDialog>
    </Stack>
  )
}

const toForm = (shop) => ({ ...shop, lat: shop.location.coordinates[1], lng: shop.location.coordinates[0] })

function Settings({ shop, onSaved, notify }) {
  const initial = useMemo(() => toForm(shop), [shop])
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const dirty = JSON.stringify(form) !== JSON.stringify(initial)

  const save = async () => {
    const found = validateShop(form)
    setErrors(found)
    if (Object.keys(found).length) return notify('Please fix the highlighted fields', 'error')
    setBusy(true)
    try {
      const { data } = await api.put('/vendor/shop', cleanShop(form))
      onSaved(data)
      setError('')
      notify('Shop details saved')
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Stack spacing={2} sx={{ pb: 10 }}>
      {error && <Alert severity="error">{error}</Alert>}
      <ShopForm value={form} onChange={setForm} errors={errors} />
      <SecuritySettings />
      <Slide direction="up" in={dirty} mountOnEnter unmountOnExit>
        <Paper elevation={12} sx={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%) !important', zIndex: 1200, px: 2, py: 1.25, borderRadius: '12px', display: 'flex', alignItems: 'center', gap: 1.5, width: 'calc(100% - 32px)', maxWidth: 560 }}>
          <Typography sx={{ flex: 1, fontWeight: 600 }}>You have unsaved changes</Typography>
          <Button onClick={() => { setForm(initial); setErrors({}) }} disabled={busy}>Discard</Button>
          <Button variant="contained" onClick={save} disabled={busy} startIcon={busy && <CircularProgress size={16} color="inherit" />}>Save</Button>
        </Paper>
      </Slide>
    </Stack>
  )
}

export default function VendorDashboard() {
  const { logout } = useAuth()
  const notify = useNotify()
  const [shop, setShop] = useState(null)
  const [products, setProducts] = useState(null)
  const [tab, setTab] = useState(0)
  const [toggling, setToggling] = useState('')
  const [error, setError] = useState('')
  useTitle(shop ? `${shop.shopName} dashboard` : 'Dashboard')

  useEffect(() => {
    api.get('/vendor/shop').then(({ data }) => setShop(data)).catch((e) => {
      if (e.response?.status === 401) logout()
      setError(errorMessage(e))
    })
  }, [logout])

  const loadProducts = useCallback(
    () => api.get('/vendor/products').then(({ data }) => setProducts(data)).catch((e) => setError(errorMessage(e))),
    [],
  )
  useEffect(() => { loadProducts() }, [loadProducts])

  const quickToggle = async (key) => {
    setToggling(key)
    try {
      const { data } = await api.put('/vendor/shop', { [key]: !shop[key] })
      setShop(data)
      if (key === 'isOpen') notify(data.isOpen ? 'Your shop is now shown as open' : 'Your shop is now shown as closed', data.isOpen ? 'success' : 'info')
      else notify(data.homeDelivery ? 'Home delivery turned on' : 'Home delivery paused', data.homeDelivery ? 'success' : 'info')
    } catch (e) {
      notify(errorMessage(e), 'error')
    } finally {
      setToggling('')
    }
  }

  if (error) return <Alert severity="error" action={<Button color="inherit" onClick={() => window.location.reload()}>Retry</Button>}>{error}</Alert>
  if (!shop) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={160} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={76} />)}
        </Box>
        <Skeleton variant="rounded" height={300} />
      </Stack>
    )
  }

  const total = products?.length ?? 0
  const out = products?.filter((p) => !p.inStock).length ?? 0
  const sections = new Set(products?.map((p) => p.category)).size

  const live = shop.status === 'APPROVED' || !shop.status

  return (
    <Stack spacing={2.5}>
      <ShopStatusBanner shop={shop} onChange={setShop} onFix={() => setTab(2)} />
      <Card sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', minWidth: 0 }}>
            <CategoryAvatar category={shop.category} size={60} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="overline" color="text.secondary">Your shop</Typography>
              <Typography variant="h5" component="h1" sx={{ lineHeight: 1.2 }}>{shop.shopName}</Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 0.5 }}>
                <OpenBadge open={shop.isOpen} />
                <Typography variant="body2" color="text.secondary" noWrap>· {shop.address}</Typography>
              </Stack>
            </Box>
          </Stack>
          {live && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignSelf: { xs: 'stretch', md: 'center' }, flexShrink: 0 }}>
              <Button variant="outlined" startIcon={<QrCode2Icon />} component={RouterLink} to="/vendor/poster">QR poster</Button>
              <Button variant="outlined" startIcon={<VisibilityIcon />} component={RouterLink} to={`/shop/${shop._id}`}>See what customers see</Button>
            </Stack>
          )}
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2.5 }}>
          <QuickToggle
            icon={<StorefrontIcon />} title="Shop open" on={shop.isOpen} busy={toggling === 'isOpen'} onChange={() => quickToggle('isOpen')}
            onText={live ? 'Customers see you as open now' : 'Will show as open once approved'} offText="Shown as closed to customers"
          />
          <QuickToggle
            icon={<LocalShippingIcon />} title="Home delivery" on={shop.homeDelivery} busy={toggling === 'homeDelivery'} onChange={() => quickToggle('homeDelivery')}
            onText={`Delivering up to ${shop.deliveryRadiusKm} km`} offText="Pickup only right now"
          />
        </Stack>
      </Card>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
        <StatCard icon={<Inventory2Icon />} label="Items listed" value={products ? total : '–'} color="#0b6e55" />
        <StatCard icon={<CheckCircleIcon />} label="In stock" value={products ? total - out : '–'} color="#15803d" />
        <StatCard icon={<RemoveShoppingCartIcon />} label="Out of stock" value={products ? out : '–'} color="#dc2626" />
        <StatCard icon={<CategoryIcon />} label="Sections" value={products ? sections : '–'} color="#b45309" />
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile>
          <Tab icon={<Inventory2Icon fontSize="small" />} iconPosition="start" label="Inventory" />
          <Tab icon={<InsightsIcon fontSize="small" />} iconPosition="start" label="Insights" />
          <Tab icon={<SettingsIcon fontSize="small" />} iconPosition="start" label="Shop settings" />
        </Tabs>
      </Box>
      {tab === 0 && (products ? <Inventory products={products} setProducts={setProducts} reload={loadProducts} notify={notify} /> : <Skeleton variant="rounded" height={300} />)}
      {tab === 1 && <Insights shop={shop} />}
      {tab === 2 && <Settings key={shop.updatedAt} shop={shop} onSaved={setShop} notify={notify} />}
    </Stack>
  )
}
