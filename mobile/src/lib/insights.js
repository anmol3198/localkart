// Shared helpers for the Insights screens.
export const SERIES = {
  // Validated for colour-blind separation and contrast on white (same as the website).
  views: { label: 'Shop views', color: '#0e8c66' },
  contacts: { label: 'Calls, WhatsApp & orders', color: '#e0700b' },
}
export const PERIODS = [7, 30, 90]
export const nf = new Intl.NumberFormat('en-IN')
export const periodLabel = (d) => (d === 7 ? 'this week' : `in the last ${d} days`)
export const fmtDay = (iso, opts) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', opts)

/** % change vs the previous period, or null when there is nothing to compare with. */
export const change = (now, before) => (before ? Math.round(((now - before) / before) * 100) : null)
export const hasActivity = (t) => t.views + t.calls + t.whatsapp + t.directions + (t.orders || 0) > 0
export const contactsOf = (d) => d.calls + d.whatsapp + (d.orders || 0)
