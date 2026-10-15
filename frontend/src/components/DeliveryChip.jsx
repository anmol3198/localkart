import { Chip } from '@mui/material'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import StoreIcon from '@mui/icons-material/Store'

/** Shows whether the shop delivers, and whether the customer is inside its delivery area. */
export default function DeliveryChip({ shop, size = 'small' }) {
  if (!shop.homeDelivery) return <Chip size={size} icon={<StoreIcon />} label="Pickup only" variant="outlined" />
  if (shop.deliversToYou === false) {
    return <Chip size={size} icon={<LocalShippingIcon />} color="warning" variant="outlined" label={`Delivers within ${shop.deliveryRadiusKm} km, not to you`} />
  }
  return <Chip size={size} icon={<LocalShippingIcon />} color="success" variant="outlined" label={shop.deliversToYou ? 'Delivers to you' : 'Home delivery'} />
}
