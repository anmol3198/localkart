import { alpha, createTheme } from '@mui/material'

const brand = { main: '#0b6e55', light: '#3c9a7f', dark: '#064e3c', contrastText: '#fff' }
const accent = { main: '#f59e0b', light: '#fbbf24', dark: '#b45309', contrastText: '#1f1300' }
const ink = '#14211d'

const theme = createTheme({
  palette: {
    primary: brand,
    secondary: accent,
    success: { main: '#15803d' },
    error: { main: '#dc2626' },
    warning: { main: '#d97706' },
    background: { default: '#f5f7f6', paper: '#ffffff' },
    text: { primary: ink, secondary: '#5b6b66' },
    divider: '#e3e9e7',
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontWeight: 800, letterSpacing: '-0.02em' },
    h3: { fontWeight: 800, letterSpacing: '-0.02em' },
    h4: { fontWeight: 800, letterSpacing: '-0.015em' },
    h5: { fontWeight: 700, letterSpacing: '-0.01em' },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: 'none' },
    overline: { fontWeight: 700, letterSpacing: '0.08em' },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 10, paddingInline: 16 },
        sizeLarge: { paddingBlock: 11, fontSize: '1rem' },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: ({ theme: t }) => ({ borderRadius: 16, border: `1px solid ${t.palette.divider}` }),
      },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          backgroundColor: t.palette.background.paper,
          borderRadius: 10,
          '&.Mui-focused': { boxShadow: `0 0 0 4px ${alpha(t.palette.primary.main, 0.12)}` },
        }),
      },
    },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 20 } } },
    MuiTooltip: { defaultProps: { arrow: true } },
    MuiAlert: { styleOverrides: { root: { borderRadius: 12 } } },
    MuiTab: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600, minHeight: 48 } } },
  },
})

export default theme
