import LocalGroceryStoreIcon from '@mui/icons-material/LocalGroceryStore'
import EcoIcon from '@mui/icons-material/Spa'
import BakeryDiningIcon from '@mui/icons-material/BakeryDining'
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy'
import SetMealIcon from '@mui/icons-material/SetMeal'
import EditNoteIcon from '@mui/icons-material/EditNote'
import DevicesIcon from '@mui/icons-material/Devices'
import HandymanIcon from '@mui/icons-material/Handyman'
import CheckroomIcon from '@mui/icons-material/Checkroom'
import StorefrontIcon from '@mui/icons-material/Storefront'

const STYLES = {
  'Grocery': { color: '#0b6e55', Icon: LocalGroceryStoreIcon },
  'Fruits & Vegetables': { color: '#4d7c0f', Icon: EcoIcon },
  'Dairy & Bakery': { color: '#b45309', Icon: BakeryDiningIcon },
  'Pharmacy': { color: '#be123c', Icon: LocalPharmacyIcon },
  'Meat & Fish': { color: '#b91c1c', Icon: SetMealIcon },
  'Stationery': { color: '#4338ca', Icon: EditNoteIcon },
  'Electronics': { color: '#0369a1', Icon: DevicesIcon },
  'Hardware': { color: '#57534e', Icon: HandymanIcon },
  'Clothing': { color: '#a21caf', Icon: CheckroomIcon },
}
const FALLBACK = { color: '#0f766e', Icon: StorefrontIcon }

/** Colour and icon used for a shop category everywhere in the UI. */
export const categoryStyle = (category) => STYLES[category] || FALLBACK
