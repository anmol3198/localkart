import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Box, Button, Card, Paper, Skeleton, Stack, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material'
import StorefrontIcon from '@mui/icons-material/Storefront'
import HourglassTopIcon from '@mui/icons-material/HourglassTop'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import BlockIcon from '@mui/icons-material/Block'
import PeopleIcon from '@mui/icons-material/People'
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import VisibilityIcon from '@mui/icons-material/Visibility'
import adminApi from './adminApi.js'
import { errorMessage } from '../lib/api.js'
import { PageHeader, Tile, fmtDay } from './bits.jsx'

const BAR = '#0e8c66' // validated chart green (same as shop insights)
const nf = new Intl.NumberFormat('en-IN')

/** New shop sign-ups per day: one series, so the title names it and there is no legend. */
function SignupBars({ days }) {
  const max = Math.max(1, ...days.map((d) => d.count))
  const step = Math.max(1, Math.ceil(days.length / 6))
  return (
    <Box>
      <Box sx={{ height: 160, display: 'flex', alignItems: 'flex-end', gap: '3px', borderBottom: 1, borderColor: 'divider' }}>
        {days.map((d) => (
          <Tooltip key={d.date} title={`${fmtDay(d.date)}: ${d.count} new ${d.count === 1 ? 'shop' : 'shops'}`} placement="top">
            <Box sx={{ flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end', cursor: 'default', '&:hover > div': { opacity: 1 } }}>
              <Box sx={{ width: '100%', height: `${(d.count / max) * 100}%`, minHeight: d.count ? 3 : 0, bgcolor: BAR, opacity: 0.8, borderRadius: '4px 4px 0 0' }} />
            </Box>
          </Tooltip>
        ))}
      </Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 0.75 }}>
        {days.filter((_, i) => i % step === 0 || i === days.length - 1).map((d) => (
          <Typography key={d.date} variant="caption" color="text.secondary">{fmtDay(d.date)}</Typography>
        ))}
      </Stack>
    </Box>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    adminApi.get('/stats').then(({ data }) => setStats(data)).catch((e) => setError(errorMessage(e)))
  }, [])

  if (error) return <Alert severity="error">{error}</Alert>
  if (!stats) {
    return (
      <Stack spacing={2}>
        <Skeleton width={260} height={48} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
          {[...Array(8)].map((_, i) => <Skeleton key={i} variant="rounded" height={90} sx={{ borderRadius: '16px' }} />)}
        </Box>
      </Stack>
    )
  }

  const s = stats.shops
  const a = stats.activity30d
  const catMax = Math.max(1, ...stats.byCategory.map((c) => c.count))
  const signups30 = stats.newShops.reduce((n, d) => n + d.count, 0)

  return (
    <>
      <PageHeader title="Dashboard" subtitle="How LocalKart is doing. Activity covers the last 30 days." />
      {s.pending > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }} action={<Button color="inherit" onClick={() => navigate('/admin/review')}>Review now</Button>}>
          {s.pending} {s.pending === 1 ? 'shop is' : 'shops are'} waiting for review. Customers can't see them until approved.
        </Alert>
      )}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }, gap: 2, mb: 3 }}>
        <Tile icon={<StorefrontIcon />} label="Shops registered" value={s.total} hint={`${signups30} in the last 30 days`} onClick={() => navigate('/admin/shops')} />
        <Tile icon={<HourglassTopIcon />} label="Waiting for review" value={s.pending} tone="#b45309" onClick={() => navigate('/admin/review')} />
        <Tile icon={<CheckCircleIcon />} label="Live shops" value={s.approved} tone="#15803d" />
        <Tile icon={<BlockIcon />} label="Rejected / suspended" value={s.rejected + s.suspended} tone="#dc2626" />
        <Tile icon={<PeopleIcon />} label="Customers reached" value={a.uniqueVisitors} hint="Different devices that used LocalKart" tone="#4338ca" />
        <Tile icon={<VisibilityIcon />} label="Shop views" value={a.views} tone="#0369a1" />
        <Tile icon={<PhoneInTalkIcon />} label="Calls + WhatsApp" value={a.calls + a.whatsapp} tone="#b45309" />
        <Tile icon={<Inventory2Icon />} label="Items listed" value={stats.products.total} hint={`${nf.format(stats.products.inStock)} in stock`} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 3fr) minmax(0, 2fr)' }, gap: 2.5, mb: 2.5 }}>
        <Card sx={{ p: 2.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>New shop sign-ups per day</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Last 30 days · hover a bar for the number</Typography>
          <SignupBars days={stats.newShops} />
        </Card>
        <Card sx={{ p: 2.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Live shops by category</Typography>
          {stats.byCategory.length === 0 && <Typography color="text.secondary">No live shops yet.</Typography>}
          <Stack spacing={1.25}>
            {stats.byCategory.map((c) => (
              <Box key={c.name}>
                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{c.count}</Typography>
                </Stack>
                <Box sx={{ height: 8, bgcolor: 'action.hover', borderRadius: 4, overflow: 'hidden' }}>
                  <Box sx={{ width: `${(c.count / catMax) * 100}%`, height: '100%', bgcolor: BAR, borderRadius: 4 }} />
                </Box>
              </Box>
            ))}
          </Stack>
        </Card>
      </Box>

      <Card sx={{ p: 2.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Most contacted shops</Typography>
        {stats.topShops.length === 0 ? <Typography color="text.secondary">No customer activity yet.</Typography> : (
          <Paper variant="outlined" sx={{ borderRadius: '12px', overflow: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, color: 'text.secondary' } }}>
                  <TableCell>Shop</TableCell><TableCell>Category</TableCell><TableCell align="right">Views</TableCell><TableCell align="right">Calls + WhatsApp</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.topShops.map((t) => (
                  <TableRow key={t.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/shops?open=${t.id}`)}>
                    <TableCell sx={{ fontWeight: 600 }}>{t.shopName}</TableCell>
                    <TableCell>{t.category}</TableCell>
                    <TableCell align="right">{nf.format(t.views)}</TableCell>
                    <TableCell align="right"><b>{nf.format(t.contacts)}</b></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}
      </Card>
    </>
  )
}
