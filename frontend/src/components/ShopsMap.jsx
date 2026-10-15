import { useEffect, useMemo } from 'react'
import L from 'leaflet'
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { Link as RouterLink } from 'react-router-dom'
import { Box, Link, Stack, Typography } from '@mui/material'
import { formatDistance } from '../lib/location.js'
import { categoryStyle } from '../lib/categories.jsx'

const meIcon = L.divIcon({ className: 'lk-me', html: '<div></div>', iconSize: [18, 18], iconAnchor: [9, 9] })

const pinIcon = (shop, index, active) =>
  L.divIcon({
    className: `lk-pin${active ? ' active' : ''}`,
    html: `<div style="background:${shop.isOpen ? categoryStyle(shop.category).color : '#9ca3af'}"><span>${index + 1}</span></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -28],
  })

/** Fits the map to the search circle whenever the centre or radius changes. */
function FitCircle({ center, radiusKm }) {
  const map = useMap()
  useEffect(() => {
    map.fitBounds(L.latLng(center.lat, center.lng).toBounds(radiusKm * 2000), { padding: [8, 8] })
  }, [map, center.lat, center.lng, radiusKm])
  return null
}

export default function ShopsMap({ center, radiusKm, shops, activeId, onHover }) {
  const icons = useMemo(() => shops.map((s, i) => pinIcon(s, i, s._id === activeId)), [shops, activeId])
  return (
    <Box sx={{ position: 'relative', height: '100%' }}>
      <MapContainer center={[center.lat, center.lng]} zoom={13} scrollWheelZoom={false}>
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitCircle center={center} radiusKm={radiusKm} />
        <Circle center={[center.lat, center.lng]} radius={radiusKm * 1000} pathOptions={{ color: '#0b6e55', weight: 2, fillOpacity: 0.04, dashArray: '6 6' }} />
        <Marker position={[center.lat, center.lng]} icon={meIcon} zIndexOffset={1000}>
          <Popup>You are here</Popup>
        </Marker>
        {shops.map((s, i) => (
          <Marker
            key={s._id}
            position={[s.location.coordinates[1], s.location.coordinates[0]]}
            icon={icons[i]}
            zIndexOffset={s._id === activeId ? 500 : 0}
            eventHandlers={{ mouseover: () => onHover?.(s._id), mouseout: () => onHover?.(null) }}
          >
            <Popup>
              <Typography variant="subtitle2">{s.shopName}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {s.category} · {formatDistance(s.distanceKm)} away {s.isOpen ? '' : '· Closed'}
              </Typography>
              <Link component={RouterLink} to={`/shop/${s._id}`} sx={{ fontWeight: 700, mt: 0.5, display: 'inline-block' }}>View shop →</Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <Stack
        direction="row"
        spacing={1.5}
        sx={{ position: 'absolute', bottom: 12, left: 12, zIndex: 500, bgcolor: 'rgba(255,255,255,0.92)', px: 1.25, py: 0.75, borderRadius: '8px', boxShadow: 1, fontSize: 12, alignItems: 'center' }}
      >
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#2563eb' }} /><span>You</span>
        </Stack>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#9ca3af' }} /><span>Closed</span>
        </Stack>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <Box sx={{ width: 14, height: 0, borderTop: '2px dashed #0b6e55' }} /><span>{radiusKm} km</span>
        </Stack>
      </Stack>
    </Box>
  )
}
