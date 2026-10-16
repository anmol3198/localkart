import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { colors, radius, shadow } from './theme.js'

const ToastContext = createContext(() => {})
const ICON = { success: 'checkmark-circle', error: 'alert-circle', info: 'information-circle' }
const BG = { success: colors.success, error: colors.danger, info: colors.text }

/** App-wide toast: `notify('Saved')` or `notify('Failed', 'error')`. */
export function ToastProvider({ children }) {
  const insets = useSafeAreaInsets()
  const [toast, setToast] = useState(null)
  const [anim] = useState(() => new Animated.Value(0))
  const timer = useRef()

  const notify = useCallback((message, kind = 'success') => {
    clearTimeout(timer.current)
    setToast({ message, kind })
    Animated.timing(anim, { toValue: 1, duration: 180, useNativeDriver: true }).start()
    timer.current = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setToast(null))
    }, 2600)
  }, [anim])

  return (
    <ToastContext.Provider value={notify}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="none"
          style={[styles.wrap, { top: insets.top + 10, opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}
        >
          <View style={[styles.toast, { backgroundColor: BG[toast.kind] }]}>
            <Ionicons name={ICON[toast.kind]} size={20} color="#fff" />
            <Text style={styles.text}>{toast.message}</Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderRadius: radius.md, maxWidth: 480, ...shadow },
  text: { color: '#fff', fontWeight: '600', fontSize: 15, flexShrink: 1 },
})
