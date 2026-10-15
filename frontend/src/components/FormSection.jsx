import { Box, Card, Stack, Typography, alpha } from '@mui/material'

/** Titled card used to break long forms into easy-to-scan sections. */
export default function FormSection({ icon, title, subtitle, children, action }) {
  return (
    <Card sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2.5 }}>
        {icon && (
          <Box sx={{ width: 40, height: 40, borderRadius: '10px', display: 'grid', placeItems: 'center', color: 'primary.main', bgcolor: (t) => alpha(t.palette.primary.main, 0.1), flexShrink: 0 }}>
            {icon}
          </Box>
        )}
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }}>{title}</Typography>
          {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
        </Box>
        {action}
      </Stack>
      {children}
    </Card>
  )
}
