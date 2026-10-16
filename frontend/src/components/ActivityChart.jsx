import { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Paper, Stack, Typography } from '@mui/material'
import { SERIES } from '../lib/chartColors.js'

const PAD = { top: 16, right: 16, bottom: 28, left: 40 }
const fmtDay = (iso, opts) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', opts)
const nf = new Intl.NumberFormat('en-IN')

/** Smallest "round" maximum for 4 gridline steps that fits v (e.g. 43 -> 48, 190 -> 200). */
function niceMax(v) {
  if (v <= 4) return 4
  const raw = v / 4
  const pow = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map((m) => m * pow).find((s) => s >= raw)
  return Math.round(step * 4 * 100) / 100
}

function useWidth() {
  const ref = useRef(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width]
}

/** Daily views (area + line) and contacts (line + dots) on one count axis, with a hover crosshair. */
export default function ActivityChart({ daily, height = 260 }) {
  const [ref, width] = useWidth()
  const [hover, setHover] = useState(null)
  const points = useMemo(() => daily.map((d) => ({ date: d.date, views: d.views, contacts: d.calls + d.whatsapp })), [daily])

  const innerW = Math.max(0, width - PAD.left - PAD.right)
  const innerH = height - PAD.top - PAD.bottom
  const max = niceMax(Math.max(1, ...points.map((p) => p.views), ...points.map((p) => p.contacts)))
  const x = (i) => PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW)
  const y = (v) => PAD.top + innerH - (v / max) * innerH
  const line = (key) => points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join('')
  const area = `${line('views')}L${x(points.length - 1)},${y(0)}L${x(0)},${y(0)}Z`
  const ticks = [0, 1, 2, 3, 4].map((t) => (max / 4) * t)
  const labelEvery = Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(innerW / 70))))
  const showDots = points.length <= 31

  const onMove = (e) => {
    const box = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - box.left
    const i = Math.round(((px - PAD.left) / Math.max(1, innerW)) * (points.length - 1))
    setHover(Math.min(points.length - 1, Math.max(0, i)))
  }

  const h = hover != null ? points[hover] : null
  const tipLeft = h ? Math.min(Math.max(x(hover) - 80, 0), Math.max(0, width - 170)) : 0
  const total = points.reduce((s, p) => s + p.views, 0)

  return (
    <Box ref={ref} sx={{ position: 'relative', width: '100%', height, touchAction: 'pan-y' }}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`Daily shop views and customer contacts. ${nf.format(total)} views over ${points.length} days.`}
          onPointerMove={onMove}
          onPointerDown={onMove}
          onPointerLeave={() => setHover(null)}
          style={{ display: 'block', cursor: 'crosshair' }}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke="#e3e9e7" strokeDasharray={t ? '3 4' : undefined} />
              <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize="11" fill="#5b6b66">{nf.format(t)}</text>
            </g>
          ))}
          {points.map((p, i) => (i % labelEvery === 0 || i === points.length - 1) && (i === points.length - 1 || points.length - 1 - i >= labelEvery / 2) ? (
            <text key={p.date} x={x(i)} y={height - 8} textAnchor="middle" fontSize="11" fill="#5b6b66">
              {fmtDay(p.date, { day: 'numeric', month: 'short' })}
            </text>
          ) : null)}

          <path d={area} fill={SERIES.views.color} opacity="0.12" />
          <path d={line('views')} fill="none" stroke={SERIES.views.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          <path d={line('contacts')} fill="none" stroke={SERIES.contacts.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {showDots && points.map((p, i) => (
            <circle key={p.date} cx={x(i)} cy={y(p.contacts)} r="4" fill={SERIES.contacts.color} stroke="#fff" strokeWidth="2" />
          ))}

          {h && (
            <g pointerEvents="none">
              <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={y(0)} stroke="#94a3a0" strokeWidth="1" />
              <circle cx={x(hover)} cy={y(h.views)} r="5" fill={SERIES.views.color} stroke="#fff" strokeWidth="2" />
              <circle cx={x(hover)} cy={y(h.contacts)} r="5" fill={SERIES.contacts.color} stroke="#fff" strokeWidth="2" />
            </g>
          )}
        </svg>
      )}
      {h && (
        <Paper elevation={6} sx={{ position: 'absolute', top: 0, left: tipLeft, width: 170, p: 1.25, borderRadius: '10px', pointerEvents: 'none' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
            {fmtDay(h.date, { weekday: 'short', day: 'numeric', month: 'short' })}
          </Typography>
          {['views', 'contacts'].map((k) => (
            <Stack key={k} direction="row" spacing={1} sx={{ alignItems: 'center', mt: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: SERIES[k].color, flexShrink: 0 }} />
              <Typography variant="body2" sx={{ flex: 1 }}>{SERIES[k].label}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{nf.format(h[k])}</Typography>
            </Stack>
          ))}
        </Paper>
      )}
    </Box>
  )
}
