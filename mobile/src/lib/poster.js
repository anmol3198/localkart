import QRCode from 'qrcode'
import { API_URL } from './api.js'

/**
 * Public web address of a shop, for QR codes and sharing. Uses EXPO_PUBLIC_WEB_URL once the website is
 * deployed; in development it points at the website running on this computer (port 5173).
 */
export function shopWebUrl(shopId) {
  const site = process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, '') || API_URL.replace(/\/api$/, '').replace(/:5050$/, ':5173')
  return `${site}/shop/${shopId}?ref=qr`
}

export const isDevUrl = (url) => /localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\.|:5173/.test(url)

export const qrSvg = (text) => QRCode.toString(text, { type: 'svg', errorCorrectionLevel: 'M', margin: 1, color: { dark: '#14211d', light: '#ffffff' } })

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

/** Printable A4 poster (same design as the website's poster). */
export function posterHtml({ shop, url, svg }) {
  const delivery = shop.homeDelivery ? `Home delivery up to ${shop.deliveryRadiusKm} km` : 'Pick up from the shop'
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, Roboto, "Segoe UI", sans-serif; color: #14211d; }
  .page { width: 210mm; min-height: 297mm; padding: 18mm 16mm; display: flex; flex-direction: column; align-items: center; text-align: center; }
  .top { width: 100%; background: #0b6e55; color: #fff; border-radius: 10mm; padding: 10mm 8mm; }
  .brand { font-weight: 800; font-size: 14pt; letter-spacing: .5pt; opacity: .9; }
  .brand b { color: #fbbf24; }
  h1 { font-size: 32pt; margin: 4mm 0 2mm; line-height: 1.1; }
  .cat { font-size: 13pt; opacity: .85; }
  .cta { font-size: 24pt; font-weight: 800; margin: 12mm 0 4mm; }
  .sub { font-size: 13pt; color: #5b6b66; margin: 0 0 8mm; }
  .qr { width: 110mm; height: 110mm; padding: 5mm; border: 2mm solid #0b6e55; border-radius: 8mm; }
  .qr svg { width: 100%; height: 100%; }
  .row { display: flex; gap: 6mm; justify-content: center; margin-top: 10mm; font-size: 13pt; font-weight: 700; }
  .pill { border: .6mm solid #e3e9e7; border-radius: 20mm; padding: 3mm 6mm; }
  .phone { font-size: 18pt; font-weight: 800; margin-top: 8mm; }
  .url { margin-top: auto; padding-top: 8mm; font-size: 10pt; color: #5b6b66; word-break: break-all; }
</style></head><body><div class="page">
  <div class="top"><div class="brand">Local<b>Kart</b></div><h1>${esc(shop.shopName)}</h1><div class="cat">${esc(shop.category)} · ${esc(shop.address)}</div></div>
  <div class="cta">Scan to see what's in stock</div>
  <p class="sub">Check prices, then call or WhatsApp us to order.</p>
  <div class="qr">${svg}</div>
  <div class="row"><span class="pill">📞 Call to order</span><span class="pill">💬 WhatsApp</span><span class="pill">🛵 ${esc(delivery)}</span></div>
  <div class="phone">${esc(shop.phone)}</div>
  <div class="url">${esc(url.replace(/\?.*$/, ''))}</div>
</div></body></html>`
}
