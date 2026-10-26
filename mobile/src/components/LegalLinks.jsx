import { Text, View } from 'react-native'
import { openPrivacy, openTerms } from '../lib/legal.js'
import { colors } from '../lib/theme.js'

/** "Privacy Policy · Terms of Use" links, opened on the website. */
export default function LegalLinks({ style }) {
  const link = { color: colors.textMuted, fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' }
  return (
    <View style={[{ flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 8 }, style]}>
      <Text style={link} onPress={openPrivacy} accessibilityRole="link">Privacy Policy</Text>
      <Text style={{ color: colors.textMuted }}>·</Text>
      <Text style={link} onPress={openTerms} accessibilityRole="link">Terms of Use</Text>
    </View>
  )
}
