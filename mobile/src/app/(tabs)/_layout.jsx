import { Tabs } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { colors } from '../../lib/theme.js'
import { useAuth } from '../../lib/auth.jsx'

export default function TabLayout() {
  const { token } = useAuth()
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarStyle: { borderTopColor: colors.border },
        headerTitleStyle: { fontWeight: '800', color: colors.text },
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Shops', headerShown: false, tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'storefront' : 'storefront-outline'} size={24} color={color} /> }}
      />
      <Tabs.Screen
        name="map"
        options={{ title: 'Map', headerShown: false, tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'map' : 'map-outline'} size={24} color={color} /> }}
      />
      <Tabs.Screen
        name="owner"
        options={{
          title: token ? 'My Shop' : 'Sell',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'briefcase' : 'briefcase-outline'} size={24} color={color} />,
        }}
      />
    </Tabs>
  )
}
