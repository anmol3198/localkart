import { Box, Stack, Typography } from '@mui/material'

/** Friendly placeholder for "nothing here" situations, with an optional action. */
export default function EmptyState({ icon, title, children, action, sx }) {
  return (
    <Stack spacing={1.5} sx={{ alignItems: 'center', textAlign: 'center', py: 6, px: 2, ...sx }}>
      {icon && (
        <Box sx={{ width: 72, height: 72, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: 'action.hover', color: 'text.secondary', '& svg': { fontSize: 36 } }}>
          {icon}
        </Box>
      )}
      <Typography variant="h6">{title}</Typography>
      {children && <Typography color="text.secondary" sx={{ maxWidth: 420 }}>{children}</Typography>}
      {action}
    </Stack>
  )
}
