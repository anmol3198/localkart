import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { Autocomplete, Box, Button, CircularProgress, InputAdornment, Stack, TextField, Typography } from '@mui/material'
import MyLocationIcon from '@mui/icons-material/MyLocation'
import SearchIcon from '@mui/icons-material/Search'
import PlaceIcon from '@mui/icons-material/Place'
import TouchAppIcon from '@mui/icons-material/TouchApp'
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { DEFAULT_CENTER, formatCoords, searchPlaces, usePlaceName } from '../lib/location.js'

const pin = L.divIcon({
  className: 'lk-pin',
  html: '<div style="background:#0b6e55"><span>●</span></div>',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
})

function ClickToSet({ onChange }) {
  useMapEvents({ click: (e) => onChange({ lat: e.latlng.lat, lng: e.latlng.lng }) })
  return null
}

function Recenter({ value }) {
  const map = useMap()
  useEffect(() => {
    if (value) map.setView([value.lat, value.lng], Math.max(map.getZoom(), 15))
  }, [value, map])
  return null
}

function PlaceSearch({ near, onPick }) {
  const [input, setInput] = useState('')
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const timer = useRef()

  useEffect(() => {
    clearTimeout(timer.current)
    if (input.trim().length < 3) { setOptions([]); return }
    const ctrl = new AbortController()
    timer.current = setTimeout(() => {
      setLoading(true)
      searchPlaces(input, near || DEFAULT_CENTER, ctrl.signal)
        .then(setOptions)
        .catch(() => {})
        .finally(() => setLoading(false))
    }, 400)
    return () => { clearTimeout(timer.current); ctrl.abort() }
  }, [input, near])

  return (
    <Autocomplete
      size="small"
      fullWidth
      options={options}
      filterOptions={(x) => x}
      getOptionLabel={(o) => o.label}
      isOptionEqualToValue={(a, b) => a.label === b.label}
      loading={loading}
      noOptionsText={input.trim().length < 3 ? 'Type at least 3 letters' : 'No places found'}
      onInputChange={(_e, v) => setInput(v)}
      onChange={(_e, v) => v && onPick({ lat: v.lat, lng: v.lng })}
      renderOption={({ key, ...props }, o) => (
        <li key={key} {...props}>
          <PlaceIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1, flexShrink: 0 }} />
          <Typography variant="body2" noWrap>{o.label}</Typography>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Search area, street or landmark"
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
              endAdornment: <>{loading && <CircularProgress size={18} />}{params.slotProps.input.endAdornment}</>,
            },
          }}
        />
      )}
    />
  )
}

/** Map where the user searches, taps or drags a pin to choose a point; optional circle shows a radius in km. */
export default function LocationPicker({ value, onChange, onDetect, detecting, radiusKm, height = 300 }) {
  const center = value || DEFAULT_CENTER
  const placeName = usePlaceName(value)
  return (
    <Stack spacing={1.25}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <PlaceSearch near={value} onPick={onChange} />
        {onDetect && (
          <Button variant="outlined" startIcon={detecting ? <CircularProgress size={16} /> : <MyLocationIcon />} onClick={onDetect} disabled={detecting} sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
            {detecting ? 'Detecting…' : 'Use my location'}
          </Button>
        )}
      </Stack>
      <Box sx={{ height, position: 'relative' }}>
        <MapContainer center={[center.lat, center.lng]} zoom={14} scrollWheelZoom>
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickToSet onChange={onChange} />
          <Recenter value={value} />
          {value && (
            <>
              <Marker
                position={[value.lat, value.lng]}
                icon={pin}
                draggable
                eventHandlers={{ dragend: (e) => { const p = e.target.getLatLng(); onChange({ lat: p.lat, lng: p.lng }) } }}
              />
              {radiusKm > 0 && <Circle center={[value.lat, value.lng]} radius={radiusKm * 1000} pathOptions={{ color: '#f59e0b', weight: 2, fillOpacity: 0.08 }} />}
            </>
          )}
        </MapContainer>
      </Box>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: 'text.secondary' }}>
        {value ? <PlaceIcon fontSize="small" color="primary" /> : <TouchAppIcon fontSize="small" />}
        <Typography variant="body2">
          {value
            ? <><b>{placeName || formatCoords(value)}</b> · tap the map or drag the pin to adjust</>
            : 'Search above, or tap on the map to drop a pin'}
        </Typography>
      </Stack>
    </Stack>
  )
}
