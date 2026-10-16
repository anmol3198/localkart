import { Platform } from 'react-native'

export const colors = {
  primary: '#0b6e55',
  primaryDark: '#053d30',
  primaryLight: '#3c9a7f',
  primarySoft: '#e3f1ec',
  accent: '#f59e0b',
  accentLight: '#fbbf24',
  bg: '#f5f7f6',
  card: '#ffffff',
  text: '#14211d',
  textMuted: '#5b6b66',
  textFaint: '#94a3a0',
  border: '#e3e9e7',
  success: '#15803d',
  successSoft: '#e7f5ec',
  danger: '#dc2626',
  dangerSoft: '#fdecec',
  warning: '#b45309',
  warningSoft: '#fdf3e2',
  whatsapp: '#25d366',
  me: '#2563eb',
}

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 }

export const shadow = Platform.select({
  web: { boxShadow: '0 4px 16px rgba(20,33,29,0.08)' },
  default: { shadowColor: '#14211d', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
})

export const type = {
  h1: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '700', color: colors.text },
  body: { fontSize: 15, color: colors.text },
  muted: { fontSize: 14, color: colors.textMuted },
  small: { fontSize: 12, color: colors.textMuted },
  label: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
}
