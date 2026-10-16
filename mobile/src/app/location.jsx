import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import LocationPicker from '../components/LocationPicker.jsx'
import { Button } from '../components/ui.jsx'
import { useCustomerLocation } from '../lib/location.jsx'
import { useNearby } from '../lib/nearby.jsx'
import { colors } from '../lib/theme.js'

export default function LocationScreen() {
  const insets = useSafeAreaInsets()
  const { location, setLocation } = useCustomerLocation()
  const { meta } = useNearby()
  const [draft, setDraft] = useState(location)

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <LocationPicker value={draft} onChange={setDraft} radiusKm={meta.maxRadiusKm} height={360} />
      </ScrollView>
      <View style={{ padding: 16, paddingBottom: insets.bottom + 16, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card }}>
        <Button size="lg" icon="checkmark" title="Show shops here" disabled={!draft} onPress={() => { setLocation(draft); router.back() }} />
      </View>
    </KeyboardAvoidingView>
  )
}
