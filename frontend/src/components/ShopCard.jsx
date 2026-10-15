import { Box, Card, CardActionArea, Chip, Stack, Typography, alpha } from '@mui/material'
import PlaceIcon from '@mui/icons-material/Place'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { useNavigate } from 'react-router-dom'
import DeliveryChip from './DeliveryChip.jsx'
import CallButtons from './CallButtons.jsx'
import CategoryAvatar from './CategoryAvatar.jsx'
import OpenBadge from './OpenBadge.jsx'
import { formatDistance } from '../lib/location.js'

export default function ShopCard({ shop, active, onHover }) {
  const navigate = useNavigate()
  return (
    <Card
      onMouseEnter={() => onHover?.(shop._id)}
      onMouseLeave={() => onHover?.(null)}
      sx={(t) => ({
        transition: 'box-shadow .2s, border-color .2s, transform .2s',
        borderColor: active ? 'primary.main' : 'divider',
        boxShadow: active ? `0 8px 24px ${alpha(t.palette.primary.main, 0.15)}` : 'none',
        '&:hover': { borderColor: 'primary.light', boxShadow: `0 8px 24px ${alpha(t.palette.primary.main, 0.12)}` },
      })}
    >
      <CardActionArea onClick={() => navigate(`/shop/${shop._id}`)} sx={{ p: 2, pb: 1.5 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
          <CategoryAvatar category={shop.category} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Typography variant="h6" sx={{ lineHeight: 1.25, fontSize: '1.1rem' }} noWrap>{shop.shopName}</Typography>
              <Chip size="small" icon={<PlaceIcon />} label={formatDistance(shop.distanceKm)} sx={{ flexShrink: 0, bgcolor: 'action.hover' }} />
            </Stack>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 0.25 }}>
              <Typography variant="body2" color="text.secondary">{shop.category}</Typography>
              <Typography variant="body2" color="text.disabled">·</Typography>
              <OpenBadge open={shop.isOpen} />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }} noWrap>{shop.address}</Typography>
          </Box>
          <ChevronRightIcon sx={{ color: 'text.disabled', alignSelf: 'center', display: { xs: 'none', sm: 'block' } }} />
        </Stack>

        <Stack direction="row" useFlexGap sx={{ mt: 1.5, flexWrap: 'wrap', gap: 1 }}>
          <DeliveryChip shop={shop} />
          {shop.homeDelivery && shop.minOrderAmount > 0 && <Chip size="small" variant="outlined" label={`Min order ₹${shop.minOrderAmount}`} />}
          {shop.homeDelivery && <Chip size="small" variant="outlined" label={shop.deliveryCharge ? `₹${shop.deliveryCharge} delivery` : 'Free delivery'} />}
        </Stack>

        {shop.matchingProducts?.length > 0 && (
          <Box sx={{ mt: 1.5, p: 1.25, borderRadius: '8px', bgcolor: (t) => alpha(t.palette.primary.main, 0.06) }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.dark' }}>In stock here</Typography>
            <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 0.75, mt: 0.5 }}>
              {shop.matchingProducts.slice(0, 4).map((p) => (
                <Chip key={p._id ?? p.name} size="small" sx={{ bgcolor: 'background.paper' }} label={`${p.name} · ₹${p.price}/${p.unit}`} />
              ))}
              {shop.matchingProducts.length > 4 && <Chip size="small" label={`+${shop.matchingProducts.length - 4} more`} />}
            </Stack>
          </Box>
        )}
      </CardActionArea>
      <Box sx={{ px: 2, pb: 2 }}>
        <CallButtons shop={shop} size="small" />
      </Box>
    </Card>
  )
}
