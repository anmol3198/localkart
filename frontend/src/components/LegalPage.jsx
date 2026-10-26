import { Box, Card, Link, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import useTitle from '../lib/useTitle.js'
import { CONTACT_EMAIL, LAST_UPDATED } from '../lib/legal.js'

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

/** Long-form legal page: title, summary box, contents list and numbered sections. */
export default function LegalPage({ title, summary, sections, other }) {
  useTitle(title)
  return (
    <Box sx={{ maxWidth: 820, mx: 'auto' }}>
      <Typography variant="overline" color="primary">LocalKart</Typography>
      <Typography variant="h3" component="h1" sx={{ fontSize: { xs: 30, sm: 40 }, mb: 1 }}>{title}</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>Last updated {LAST_UPDATED}</Typography>

      <Card sx={{ p: { xs: 2, sm: 3 }, mb: 3, bgcolor: 'rgba(11,110,85,0.05)' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>In short</Typography>
        <Box component="ul" sx={{ m: 0, pl: 2.5, '& li': { mb: 0.75 } }}>
          {summary.map((s) => <Typography component="li" key={s}>{s}</Typography>)}
        </Box>
      </Card>

      <Box component="nav" aria-label="Contents" sx={{ mb: 4 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Contents</Typography>
        <Box component="ol" sx={{ m: 0, pl: 2.5, columns: { sm: 2 }, columnGap: 4 }}>
          {sections.map(([h]) => (
            <Typography component="li" key={h} variant="body2" sx={{ mb: 0.5, breakInside: 'avoid' }}>
              <Link href={`#${slug(h)}`} underline="hover">{h}</Link>
            </Typography>
          ))}
        </Box>
      </Box>

      <Stack spacing={4} sx={{
        '& p, & li': { lineHeight: 1.7 },
        '& ul': { pl: 2.5, my: 1 },
        '& li': { mb: 0.75 },
        '& h3': { fontSize: 16, fontWeight: 700, mt: 2, mb: 0.5 },
      }}>
        {sections.map(([h, body], i) => (
          <Box component="section" key={h} id={slug(h)} sx={{ scrollMarginTop: 90 }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 800, mb: 1.5 }}>{i + 1}. {h}</Typography>
            {body}
          </Box>
        ))}
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 6, pt: 3, borderTop: 1, borderColor: 'divider' }}>
        Questions? Email <Link href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Link>. See also our{' '}
        <Link component={RouterLink} to={other.to}>{other.label}</Link>.
      </Typography>
    </Box>
  )
}
