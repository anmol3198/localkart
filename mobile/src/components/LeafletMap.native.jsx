import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { MAP_HTML } from './mapHtml.js'
import { colors } from '../lib/theme.js'

/** Leaflet map in a WebView. `data` = { center, radiusKm, shops, picker, pin }. */
export default function LeafletMap({ data, onSelect, onPick, style }) {
  const ref = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (ready) ref.current?.injectJavaScript(`window.update(${JSON.stringify(data)}); true;`)
  }, [ready, data])

  const onMessage = (e) => {
    let msg
    try { msg = JSON.parse(e.nativeEvent.data) } catch { return }
    if (msg.type === 'ready') setReady(true)
    else if (msg.type === 'select') onSelect?.(msg.id)
    else if (msg.type === 'pick') onPick?.({ lat: msg.lat, lng: msg.lng })
  }

  return (
    <View style={[styles.wrap, style]}>
      <WebView
        ref={ref}
        originWhitelist={['*']}
        source={{ html: MAP_HTML, baseUrl: 'https://localkart.app' }}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        nestedScrollEnabled
        setSupportMultipleWindows={false}
        style={{ backgroundColor: '#e8ecea' }}
      />
      {!ready && <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View>}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', borderRadius: 16, backgroundColor: '#e8ecea' },
  loading: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
})
