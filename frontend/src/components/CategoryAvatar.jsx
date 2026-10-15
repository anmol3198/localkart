import { Avatar, alpha } from '@mui/material'
import { categoryStyle } from '../lib/categories.jsx'

/** Rounded, colour-coded icon for a shop category. */
export default function CategoryAvatar({ category, size = 48 }) {
  const { color, Icon } = categoryStyle(category)
  return (
    <Avatar variant="rounded" sx={{ width: size, height: size, borderRadius: `${size / 4}px`, bgcolor: alpha(color, 0.12), color }}>
      <Icon sx={{ fontSize: size * 0.52 }} />
    </Avatar>
  )
}
