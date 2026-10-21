import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Alert, Box, Card, IconButton, InputAdornment, Skeleton, Tab, Table, TableBody, TableCell, TableContainer, TableHead,
  TablePagination, TableRow, Tabs, TextField, Typography, useMediaQuery, useTheme,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import FactCheckIcon from '@mui/icons-material/FactCheck'
import adminApi from './adminApi.js'
import { errorMessage } from '../lib/api.js'
import { formatPhone } from '../lib/validation.js'
import EmptyState from '../components/EmptyState.jsx'
import ShopReviewDrawer from './ShopReviewDrawer.jsx'
import { PageHeader, StatusChip, fmtDate } from './bits.jsx'

const TABS = [['all', 'All'], ['pending', 'Waiting'], ['approved', 'Live'], ['rejected', 'Rejected'], ['suspended', 'Suspended']]

/** Review queue (`queue` = pending only, oldest first) or the full searchable shop list. */
export default function AdminShops({ queue }) {
  const theme = useTheme()
  const narrow = useMediaQuery(theme.breakpoints.down('md'))
  const [params, setParams] = useSearchParams()
  const [status, setStatus] = useState(queue ? 'pending' : 'all')
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const openId = params.get('open')

  useEffect(() => {
    const t = setTimeout(() => { setQ(search.trim()); setPage(0) }, 300)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(() => {
    adminApi.get('/shops', { params: { status: queue ? 'pending' : status, q: q || undefined, page, size } })
      .then(({ data }) => { setData(data); setError('') })
      .catch((e) => setError(errorMessage(e)))
  }, [queue, status, q, page, size])
  useEffect(() => { load() }, [load])

  const open = (id) => setParams(id ? { open: id } : {})

  return (
    <>
      <PageHeader
        title={queue ? 'Review queue' : 'All shops'}
        subtitle={queue ? 'New shops, oldest first. Customers see a shop only after you approve it.' : 'Search every shop and change its status.'}
      />
      <Card sx={{ mb: 2 }}>
        {!queue && (
          <Tabs value={status} onChange={(_e, v) => { setStatus(v); setPage(0) }} variant="scrollable" allowScrollButtonsMobile sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}>
            {TABS.map(([v, l]) => <Tab key={v} value={v} label={l} />)}
          </Tabs>
        )}
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth size="small" placeholder="Search by shop, owner, email or phone" value={search} onChange={(e) => setSearch(e.target.value)}
            slotProps={{ input: {
              startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
              endAdornment: search && <IconButton size="small" aria-label="Clear search" onClick={() => setSearch('')}><CloseIcon fontSize="small" /></IconButton>,
            } }}
          />
        </Box>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {!data && !error && <Skeleton variant="rounded" height={300} sx={{ borderRadius: '16px' }} />}
      {data && data.total === 0 && (
        <Card>
          <EmptyState icon={<FactCheckIcon />} title={queue ? 'All caught up' : 'No shops found'}>
            {queue ? 'No shops are waiting for review right now.' : 'Try a different search or status.'}
          </EmptyState>
        </Card>
      )}
      {data && data.total > 0 && (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, color: 'text.secondary', bgcolor: 'action.hover' } }}>
                  <TableCell>Shop</TableCell>
                  {!narrow && <TableCell>Owner</TableCell>}
                  {!narrow && <TableCell>Phone</TableCell>}
                  <TableCell>Status</TableCell>
                  {!narrow && <TableCell>{queue ? 'Waiting since' : 'Registered'}</TableCell>}
                  <TableCell padding="checkbox" />
                </TableRow>
              </TableHead>
              <TableBody>
                {data.items.map((s) => (
                  <TableRow key={s.id} hover sx={{ cursor: 'pointer' }} onClick={() => open(s.id)}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700 }}>{s.shopName}</Typography>
                      <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 280 }}>{s.category} · {s.address}</Typography>
                    </TableCell>
                    {!narrow && <TableCell><Typography variant="body2">{s.ownerName}</Typography><Typography variant="caption" color="text.secondary">{s.email}</Typography></TableCell>}
                    {!narrow && <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatPhone(s.phone)}</TableCell>}
                    <TableCell><StatusChip status={s.status} /></TableCell>
                    {!narrow && <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(queue ? s.submittedAt : s.createdAt)}</TableCell>}
                    <TableCell padding="checkbox"><ChevronRightIcon color="action" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div" count={data.total} page={page} rowsPerPage={size} rowsPerPageOptions={[10, 20, 50]}
            onPageChange={(_e, p) => setPage(p)} onRowsPerPageChange={(e) => { setSize(Number(e.target.value)); setPage(0) }}
          />
        </Card>
      )}
      <ShopReviewDrawer shopId={openId} onClose={() => open(null)} onChanged={load} />
    </>
  )
}
