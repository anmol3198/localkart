// Shop form defaults + validation shared by registration and settings (mirrors the API's rules).
export const emptyShop = {
  shopName: '', phone: '', alternatePhone: '', category: 'Grocery', description: '', address: '',
  openingHours: '9:00 AM - 9:00 PM', isOpen: true,
  homeDelivery: false, deliveryRadiusKm: 2, minOrderAmount: 0, deliveryCharge: 0,
  lat: null, lng: null,
}

export const SHOP_SECTIONS = ['details', 'location', 'delivery']
const PHONE = /^\+?[0-9]{10,13}$/
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateShop(v, sections = SHOP_SECTIONS) {
  const e = {}
  if (sections.includes('details')) {
    if (!v.shopName.trim()) e.shopName = 'Shop name is required'
    if (!PHONE.test(v.phone)) e.phone = 'Enter a valid 10-digit phone number'
    if (v.alternatePhone && !PHONE.test(v.alternatePhone)) e.alternatePhone = 'Enter a valid phone number'
  }
  if (sections.includes('location')) {
    if (!v.address.trim()) e.address = 'Address is required'
    if (v.lat == null) e.location = 'Set your shop location on the map'
  }
  if (sections.includes('delivery') && v.homeDelivery) {
    if (Number(v.minOrderAmount) < 0) e.minOrderAmount = 'Cannot be negative'
    if (Number(v.deliveryCharge) < 0) e.deliveryCharge = 'Cannot be negative'
  }
  return e
}

export const phoneOnly = (s) => s.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '')
export const shopToForm = (shop) => ({ ...shop, lat: shop.location.coordinates[1], lng: shop.location.coordinates[0] })

const digits = (phone) => phone.replace(/\D/g, '')
export const whatsappUrl = (shop) => {
  const n = digits(shop.phone).length === 10 ? `91${digits(shop.phone)}` : digits(shop.phone)
  return `https://wa.me/${n}?text=${encodeURIComponent(`Hi ${shop.shopName}, I found you on LocalKart and would like to order.`)}`
}
