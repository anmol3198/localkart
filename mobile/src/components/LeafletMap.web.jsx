import { useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import { MAP_HTML } from './mapHtml.js'

/** Web version of LeafletMap: the same page in an iframe, talking over postMessage. */
export default function LeafletMap({ data, onSelect, onPick, style }) {
  const frame = useRef(null)
  const [ready, setReady] = useState(false)
  const handlers = useRef({ onSelect, onPick })
  useEffect(() => { handlers.current = { onSelect, onPick } }, [onSelect, onPick])

  useEffect(() => {
    const onMessage = (e) => {
      if (e.source !== frame.current?.contentWindow) return
      let msg
      try { msg = JSON.parse(e.data) } catch { return }
      if (msg.type === 'ready') setReady(true)
      else if (msg.type === 'select') handlers.current.onSelect?.(msg.id)
      else if (msg.type === 'pick') handlers.current.onPick?.({ lat: msg.lat, lng: msg.lng })
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  useEffect(() => {
    if (ready) frame.current?.contentWindow?.postMessage(JSON.stringify({ ...data, __lk: true }), '*')
  }, [ready, data])

  return (
    <View style={[{ overflow: 'hidden', borderRadius: 16, backgroundColor: '#e8ecea' }, style]}>
      <iframe ref={frame} srcDoc={MAP_HTML} title="Map" style={{ border: 0, width: '100%', height: '100%' }} />
    </View>
  )
}
