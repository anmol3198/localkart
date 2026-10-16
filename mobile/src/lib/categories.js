// Colour + MaterialCommunityIcons name per shop category (same palette as the website).
const STYLES = {
  'Grocery': { color: '#0b6e55', icon: 'cart-outline' },
  'Fruits & Vegetables': { color: '#4d7c0f', icon: 'food-apple-outline' },
  'Dairy & Bakery': { color: '#b45309', icon: 'bread-slice-outline' },
  'Pharmacy': { color: '#be123c', icon: 'pill' },
  'Meat & Fish': { color: '#b91c1c', icon: 'fish' },
  'Stationery': { color: '#4338ca', icon: 'pencil-outline' },
  'Electronics': { color: '#0369a1', icon: 'cellphone' },
  'Hardware': { color: '#57534e', icon: 'hammer-wrench' },
  'Clothing': { color: '#a21caf', icon: 'tshirt-crew-outline' },
}
const FALLBACK = { color: '#0f766e', icon: 'storefront-outline' }

export const categoryStyle = (category) => STYLES[category] || FALLBACK
export const DEFAULT_CATEGORIES = [...Object.keys(STYLES), 'Other']

/** Adds alpha to a #rrggbb colour. */
export const tint = (hex, alpha) => `${hex}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`
