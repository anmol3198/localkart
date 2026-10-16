// Shop form defaults + validation shared by registration and settings (mirrors the API's rules).
import { PHONE_MSG, hasRealText, inIndia, isMobile, isValidPhone, moneyError, normalizePhone } from './validation.js'

export const emptyShop = {
  shopName: '', phone: '', alternatePhone: '', category: 'Grocery', description: '', address: '',
  openingHours: '9:00 AM - 9:00 PM', isOpen: true,
  homeDelivery: false, deliveryRadiusKm: 2, minOrderAmount: 0, deliveryCharge: 0,
  lat: null, lng: null,
}

export const SHOP_SECTIONS = ['details', 'location', 'delivery']

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
    else if (address.length < 5 || !hasRealText(address, 5, 300)) e.address = 'Enter the full address (shop no., street, area)'
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

/** Values to send to the API: phones in their clean form, money as numbers. */
export const cleanShop = (v) => ({
  ...v,
  phone: normalizePhone(v.phone),
  alternatePhone: normalizePhone(v.alternatePhone),
  minOrderAmount: Number(v.minOrderAmount) || 0,
  deliveryCharge: Number(v.deliveryCharge) || 0,
})

// Let people type spaces, dashes and +91; the number is cleaned when they leave the field.
export const phoneChars = (s) => s.replace(/[^\d+\s\-()]/g, '')
export const shopToForm = (shop) => ({ ...shop, lat: shop.location.coordinates[1], lng: shop.location.coordinates[0] })

/** WhatsApp only works with mobile numbers. */
export const hasWhatsapp = (shop) => isMobile(normalizePhone(shop.phone))
export const whatsappUrl = (shop) =>
  `https://wa.me/91${normalizePhone(shop.phone)}?text=${encodeURIComponent(`Hi ${shop.shopName}, I found you on LocalKart and would like to order.`)}`
