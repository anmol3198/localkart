import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from '../lib/auth.jsx'
import { LocationProvider } from '../lib/location.jsx'
import { NearbyProvider } from '../lib/nearby.jsx'
import { ToastProvider } from '../lib/toast.jsx'
import { colors } from '../lib/theme.js'

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LocationProvider>
          <NearbyProvider>
            <ToastProvider>
              <StatusBar style="dark" />
              <Stack
                screenOptions={{
                  headerTintColor: colors.primary,
                  headerTitleStyle: { fontWeight: '700', color: colors.text },
                  headerStyle: { backgroundColor: colors.bg },
                  headerShadowVisible: false,
                  headerBackButtonDisplayMode: 'minimal',
                  contentStyle: { backgroundColor: colors.bg },
                }}
              >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="shop/[id]" options={{ title: '' }} />
                <Stack.Screen name="location" options={{ title: 'Set your location', presentation: 'modal' }} />
                <Stack.Screen name="owner/login" options={{ title: 'Shop owner login' }} />
                <Stack.Screen name="owner/register" options={{ title: 'Register your shop' }} />
                <Stack.Screen name="owner/item" options={{ title: 'Item', presentation: 'modal' }} />
                <Stack.Screen name="owner/settings" options={{ title: 'Shop settings' }} />
              </Stack>
            </ToastProvider>
          </NearbyProvider>
        </LocationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
