import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert, Box, Button, Card, Chip, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  ToggleButton, ToggleButtonGroup, Typography, alpha,
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import PhoneIcon from '@mui/icons-material/Phone'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import DirectionsIcon from '@mui/icons-material/Directions'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat'
import InsightsIcon from '@mui/icons-material/Insights'
import ShareIcon from '@mui/icons-material/Share'
import TableChartIcon from '@mui/icons-material/TableChart'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import LightbulbIcon from '@mui/icons-material/Lightbulb'
import api, { errorMessage } from '../lib/api.js'
import { useNotify } from '../lib/notify.jsx'
import ActivityChart from './ActivityChart.jsx'
import { SERIES } from '../lib/chartColors.js'
import EmptyState from './EmptyState.jsx'

const nf = new Intl.NumberFormat('en-IN')
const PERIODS = [7, 30, 90]
const periodLabel = (d) => (d === 7 ? 'this week' : `in the last ${d} days`)
const fmtDay = (iso, opts) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', opts)

/** Change vs the previous period, shown with an arrow + words so it never relies on colour alone. */
function Delta({ now, before, days }) {
  if (!before && !now) return <Typography variant="caption" color="text.secondary">No activity yet</Typography>
  if (!before) return <Chip size="small" icon={<TrendingUpIcon />} color="success" variant="outlined" label="New" />
  const pct = Math.round(((now - before) / before) * 100)
  const tone = pct > 0 ? 'success' : pct < 0 ? 'error' : 'default'
  const Icon = pct > 0 ? TrendingUpIcon : pct < 0 ? TrendingDownIcon : TrendingFlatIcon
  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
      <Chip size="small" icon={<Icon />} color={tone} variant="outlined" label={`${pct > 0 ? '+' : ''}${pct}%`} />
      <Typography variant="caption" color="text.secondary">vs previous {days} days</Typography>
    </Stack>
  )
}

function Kpi({ icon, label, value, before, days, highlight }) {
  return (
    <Card
      sx={(t) => ({
        p: 2.25,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        borderColor: highlight ? alpha(t.palette.primary.main, 0.4) : 'divider',
        background: highlight ? `linear-gradient(160deg, ${alpha(t.palette.primary.main, 0.08)}, transparent 70%)` : undefined,
      })}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: 'text.secondary' }}>
        <Box sx={{ width: 32, height: 32, borderRadius: '10px', display: 'grid', placeItems: 'center', bgcolor: 'action.hover', color: 'text.primary' }}>{icon}</Box>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>{label}</Typography>
      </Stack>
      <Typography sx={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em' }}>{nf.format(value)}</Typography>
      <Delta now={value} before={before} days={days} />
    </Card>
  )
}

function SourceBars({ sources }) {
  const rows = [['Website', sources.web], ['Android app', sources.android], ['iPhone app', sources.ios]]
  const total = rows.reduce((s, [, n]) => s + n, 0)
  return (
    <Stack spacing={1.5}>
      {rows.map(([label, n]) => {
        const pct = total ? Math.round((n / total) * 100) : 0
        return (
          <Box key={label}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{label}</Typography>
              <Typography variant="body2" color="text.secondary">{nf.format(n)} · {pct}%</Typography>
            </Stack>
            <Box sx={{ height: 8, borderRadius: 4, bgcolor: 'action.hover', overflow: 'hidden' }}>
              <Box sx={{ width: `${pct}%`, height: '100%', borderRadius: 4, bgcolor: SERIES.views.color, transition: 'width .4s' }} />
            </Box>
          </Box>
        )
      })}
    </Stack>
  )
}

function Legend() {
  return (
    <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
      {Object.values(SERIES).map((s) => (
        <Stack key={s.label} direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
          <Box sx={{ width: 12, height: 3, borderRadius: 2, bgcolor: s.color }} />
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>{s.label}</Typography>
        </Stack>
      ))}
    </Stack>
  )
}

function LoadingState() {
  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={132} sx={{ borderRadius: '16px' }} />)}
      </Box>
      <Skeleton variant="rounded" height={320} sx={{ borderRadius: '16px' }} />
    </Stack>
  )
}

/** Vendor dashboard tab: how many customers saw and contacted the shop, with trends. */
export default function Insights({ shop }) {
  const notify = useNotify()
  const [days, setDays] = useState(7)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [asTable, setAsTable] = useState(false)

  const load = useCallback(() => {
    api.get('/vendor/insights', { params: { days } })
      .then(({ data }) => { setData(data); setError('') })
      .catch((e) => setError(errorMessage(e)))
  }, [days])
  useEffect(() => { load() }, [load])

  const summary = useMemo(() => {
    if (!data) return null
    const { totals, daily } = data
    const busiest = daily.reduce((best, d) => (d.calls + d.whatsapp + d.views > best.score ? { d, score: d.calls + d.whatsapp + d.views } : best), { d: null, score: 0 }).d
    return { contactRate: totals.views ? Math.round((totals.contacts / totals.views) * 100) : 0, busiest }
  }, [data])

  const shareShop = async () => {
    const url = `${window.location.origin}/shop/${shop._id}`
    try {
      if (navigator.share) await navigator.share({ title: shop.shopName, url })
      else { await navigator.clipboard.writeText(url); notify('Shop link copied — share it on WhatsApp') }
    } catch { /* closed the share sheet */ }
  }

  const fresh = data && data.days === days
  const t = data?.totals
  const p = data?.previous

  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
        <Box>
          <Typography variant="h5" component="h2">How customers found you</Typography>
          <Typography variant="body2" color="text.secondary">
            {data ? `${fmtDay(data.from, { day: 'numeric', month: 'short' })} – ${fmtDay(data.to, { day: 'numeric', month: 'short', year: 'numeric' })} · India time` : 'Views of your shop page and taps on Call, WhatsApp and Directions'}
          </Typography>
        </Box>
        <ToggleButtonGroup size="small" exclusive value={days} onChange={(_e, v) => v && setDays(v)} sx={{ bgcolor: 'background.paper', alignSelf: { xs: 'flex-start', sm: 'center' } }}>
          {PERIODS.map((d) => <ToggleButton key={d} value={d} sx={{ px: 2 }}>{d} days</ToggleButton>)}
        </ToggleButtonGroup>
      </Stack>

      {error && <Alert severity="error" action={<Button color="inherit" onClick={load}>Retry</Button>}>{error}</Alert>}
      {!data && !error && <LoadingState />}

      {data && t.views + t.calls + t.whatsapp + t.directions === 0 && (
        <Card>
          <EmptyState
            icon={<InsightsIcon />}
            title={`No customer activity ${periodLabel(days)} yet`}
            action={<Button variant="contained" startIcon={<ShareIcon />} onClick={shareShop}>Share your shop link</Button>}
          >
            Numbers appear here as soon as customers open your shop or tap Call or WhatsApp. Sharing your link in local WhatsApp groups is the fastest way to get started.
          </EmptyState>
        </Card>
      )}

      {data && t.views + t.calls + t.whatsapp + t.directions > 0 && (
        <Box sx={{ opacity: fresh ? 1 : 0.55, transition: 'opacity .2s' }}>
          <Stack spacing={2.5}>
            <Card sx={(th) => ({ p: { xs: 2, sm: 2.5 }, color: '#fff', border: 'none', background: `linear-gradient(135deg, ${th.palette.primary.dark}, ${th.palette.primary.main})` })}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}>
                <Box>
                  <Typography sx={{ fontSize: { xs: '1.6rem', sm: '2rem' }, fontWeight: 800, lineHeight: 1.15 }}>
                    {nf.format(t.contacts)} {t.contacts === 1 ? 'customer' : 'customers'} reached out
                  </Typography>
                  <Typography sx={{ opacity: 0.85, mt: 0.5 }}>
                    by calling or messaging you {periodLabel(days)}, out of {nf.format(t.views)} who viewed your shop.
                  </Typography>
                </Box>
                <Stack direction="row" spacing={3} sx={{ flexShrink: 0 }}>
                  <Box>
                    <Typography sx={{ fontSize: '1.75rem', fontWeight: 800, color: 'secondary.light' }}>{summary.contactRate}%</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.85 }}>of viewers contacted you</Typography>
                  </Box>
                  {summary.busiest && (
                    <Box>
                      <Typography sx={{ fontSize: '1.75rem', fontWeight: 800 }}>{fmtDay(summary.busiest.date, { weekday: 'short' })}</Typography>
                      <Typography variant="body2" sx={{ opacity: 0.85 }}>busiest day ({fmtDay(summary.busiest.date, { day: 'numeric', month: 'short' })})</Typography>
                    </Box>
                  )}
                </Stack>
              </Stack>
            </Card>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' }, gap: 2 }}>
              <Kpi icon={<VisibilityIcon fontSize="small" />} label="Shop views" value={t.views} before={p.views} days={days} />
              <Kpi icon={<PhoneIcon fontSize="small" />} label="Calls" value={t.calls} before={p.calls} days={days} highlight />
              <Kpi icon={<WhatsAppIcon fontSize="small" />} label="WhatsApp" value={t.whatsapp} before={p.whatsapp} days={days} highlight />
              <Kpi icon={<DirectionsIcon fontSize="small" />} label="Directions" value={t.directions} before={p.directions} days={days} />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 2fr) minmax(0, 1fr)' }, gap: 2.5, alignItems: 'start' }}>
              <Card sx={{ p: { xs: 2, sm: 2.5 } }}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5, gap: 1, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Day by day</Typography>
                    <Legend />
                  </Box>
                  <Button size="small" startIcon={asTable ? <ShowChartIcon /> : <TableChartIcon />} onClick={() => setAsTable((v) => !v)}>
                    {asTable ? 'Show chart' : 'Show table'}
                  </Button>
                </Stack>
                {asTable ? (
                  <TableContainer sx={{ maxHeight: 320 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell align="right">Views</TableCell>
                          <TableCell align="right">Calls</TableCell>
                          <TableCell align="right">WhatsApp</TableCell>
                          <TableCell align="right">Directions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {[...data.daily].reverse().map((d) => (
                          <TableRow key={d.date} hover>
                            <TableCell>{fmtDay(d.date, { weekday: 'short', day: 'numeric', month: 'short' })}</TableCell>
                            <TableCell align="right">{nf.format(d.views)}</TableCell>
                            <TableCell align="right">{nf.format(d.calls)}</TableCell>
                            <TableCell align="right">{nf.format(d.whatsapp)}</TableCell>
                            <TableCell align="right">{nf.format(d.directions)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <ActivityChart daily={data.daily} />
                )}
              </Card>

              <Stack spacing={2.5}>
                <Card sx={{ p: 2.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Where customers came from</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>All activity {periodLabel(days)}</Typography>
                  <SourceBars sources={data.sources} />
                </Card>
                <Card sx={(th) => ({ p: 2.5, bgcolor: alpha(th.palette.secondary.main, 0.08), borderColor: alpha(th.palette.secondary.main, 0.3) })}>
                  <Stack direction="row" spacing={1.5}>
                    <LightbulbIcon sx={{ color: 'secondary.dark' }} />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Get more calls</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {summary.contactRate < 15
                          ? 'Many people look but don’t call. Add prices for your popular items and keep stock up to date so they know you have what they need.'
                          : 'Customers who see your shop often reach out. Share your shop link in local WhatsApp groups to get more of them.'}
                      </Typography>
                      <Button size="small" startIcon={<ShareIcon />} onClick={shareShop} sx={{ mt: 1, ml: -1 }}>Share shop link</Button>
                    </Box>
                  </Stack>
                </Card>
              </Stack>
            </Box>
          </Stack>
        </Box>
      )}
    </Stack>
  )
}
