// Order cart rules shared by the website and the app: totals, checks and the WhatsApp message.
// Orders aren't stored on LocalKart's servers; the customer sends them straight to the shop.
import { isMobile, normalizePhone } from './validation.js'

export const MAX_QTY = 99
export const MAX_LINES = 40

export const emptyCart = () => ({ items: {}, mode: 'pickup', name: '', address: '', note: '' })

export const money = (n) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
const round2 = (n) => Math.round(n * 100) / 100

/** Whether this customer can choose home delivery (the shop delivers, and not "out of range" for them). */
export const deliveryAllowed = (shop) => Boolean(shop.homeDelivery) && shop.deliversToYou !== false

export function cartTotals(cart, shop) {
  const lines = Object.values(cart.items)
  const count = lines.reduce((n, l) => n + l.qty, 0)
  const itemsTotal = round2(lines.reduce((n, l) => n + l.price * l.qty, 0))
  const delivery = cart.mode === 'delivery' && deliveryAllowed(shop) ? Number(shop.deliveryCharge || 0) : 0
  const minOrder = Number(shop.minOrderAmount || 0)
  return { lines: lines.length, count, itemsTotal, delivery, total: round2(itemsTotal + delivery), minOrder, shortBy: Math.max(0, round2(minOrder - itemsTotal)) }
}

export function addItem(cart, p) {
  if (!p.inStock) return cart
  const current = cart.items[p._id]
  if (!current && Object.keys(cart.items).length >= MAX_LINES) return cart
  const qty = Math.min(MAX_QTY, (current?.qty || 0) + 1)
  return { ...cart, items: { ...cart.items, [p._id]: { id: p._id, name: p.name, price: Number(p.price), unit: p.unit, qty } } }
}

export function setQty(cart, id, qty) {
  const items = { ...cart.items }
  const q = Math.floor(Number(qty))
  if (!q || q < 1) delete items[id]
  else items[id] = { ...items[id], qty: Math.min(MAX_QTY, q) }
  return { ...cart, items }
}

/** Problems that stop sending, keyed by field. */
export function validateOrder(cart, shop) {
  const e = {}
  const t = cartTotals(cart, shop)
  if (!t.lines) e.items = 'Add at least one item'
  if (cart.mode === 'delivery') {
    if (!deliveryAllowed(shop)) e.mode = shop.homeDelivery ? `This shop delivers only within ${shop.deliveryRadiusKm} km, which doesn’t reach you. Choose pickup.` : 'This shop doesn’t deliver. Choose pickup.'
    else if (t.shortBy > 0) e.mode = `Add ${money(t.shortBy)} more for home delivery (minimum order ${money(t.minOrder)}), or choose pickup`
    const address = cart.address.trim()
    if (address.length < 10 || !/[A-Za-zऀ-෿]/.test(address)) e.address = 'Enter your full address: house no., street, area'
    else if (address.length > 300) e.address = 'Keep the address under 300 characters'
  }
  const name = cart.name.trim()
  if (name && (name.length < 2 || name.length > 60 || /\d/.test(name))) e.name = 'Enter your name using letters (2-60 characters)'
  if (cart.note.length > 200) e.note = 'Keep the note under 200 characters'
  return e
}

/** Brings the cart in line with the shop's latest stock and prices; lists what changed. */
export function reconcile(cart, products) {
  const byId = new Map(products.map((p) => [p._id, p]))
  const changes = []
  const items = {}
  for (const line of Object.values(cart.items)) {
    const p = byId.get(line.id)
    if (!p) { changes.push(`${line.name} is no longer listed, so it was removed`); continue }
    if (!p.inStock) { changes.push(`${p.name} just went out of stock, so it was removed`); continue }
    if (Number(p.price) !== line.price) changes.push(`${p.name} is now ${money(p.price)}/${p.unit} (was ${money(line.price)})`)
    items[line.id] = { ...line, name: p.name, price: Number(p.price), unit: p.unit }
  }
  return { cart: { ...cart, items }, changes }
}

/** The text that lands in the shop's WhatsApp. */
export function orderMessage(cart, shop) {
  const t = cartTotals(cart, shop)
  const lines = Object.values(cart.items).map((l, i) => `${i + 1}. ${l.name} × ${l.qty} (${money(l.price)}/${l.unit}) = ${money(round2(l.price * l.qty))}`)
  const out = [`🛒 New order from LocalKart`, `Shop: ${shop.shopName}`, '', ...lines, '', `Items: ${money(t.itemsTotal)}`]
  if (cart.mode === 'delivery') {
    out.push(`Delivery: ${t.delivery ? money(t.delivery) : 'Free'}`, `Total: ${money(t.total)}`, '', `🛵 Home delivery to: ${cart.address.trim()}`)
  } else {
    out.push(`Total: ${money(t.total)}`, '', '🏪 I’ll pick it up from the shop')
  }
  if (cart.name.trim()) out.push(`Name: ${cart.name.trim()}`)
  if (cart.note.trim()) out.push(`Note: ${cart.note.trim()}`)
  out.push('', 'Prices as listed on LocalKart. Please confirm availability and total.')
  return out.join('\n')
}

export const shopTakesWhatsapp = (shop) => isMobile(normalizePhone(shop.phone))
export const whatsappOrderUrl = (shop, text) => `https://wa.me/91${normalizePhone(shop.phone)}?text=${encodeURIComponent(text)}`
