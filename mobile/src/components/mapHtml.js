import { categoryStyle } from '../lib/categories.js'
import { formatDistance } from '../lib/location.jsx'

// A small Leaflet + OpenStreetMap page rendered inside a WebView (phones) or iframe (web).
// No API key needed. The app pushes data in with `update(json)`; the page sends back
// { type: 'ready' }, { type: 'select', id } (shop tapped) or { type: 'pick', lat, lng } (map tapped / pin dragged).
export const MAP_HTML = `<!doctype html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { margin: 0; height: 100%; width: 100%; font-family: -apple-system, system-ui, Roboto, sans-serif; }
  .pin { background: none; border: none; }
  .pin > div { width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: grid; place-items: center;
    border: 2px solid #fff; box-shadow: 0 3px 10px rgba(0,0,0,.3); }
  .pin > div > span { transform: rotate(45deg); color: #fff; font: 700 12px/1 sans-serif; }
  .me > div { width: 18px; height: 18px; border-radius: 50%; background: #2563eb; border: 3px solid #fff;
    box-shadow: 0 0 0 6px rgba(37,99,235,.25), 0 2px 6px rgba(0,0,0,.3); }
  .pop b { font-size: 14px; } .pop small { color: #5b6b66; display: block; margin: 2px 0 6px; }
  .pop button { background: #0b6e55; color: #fff; border: 0; border-radius: 8px; padding: 6px 10px; font-weight: 700; }
</style></head>
<body><div id="map"></div>
<script>
  function send(msg) {
    var s = JSON.stringify(msg);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(s); else window.parent.postMessage(s, '*');
  }
  var map = L.map('map', { zoomControl: true, attributionControl: true }).setView([12.9352, 77.6245], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
  var layer = L.layerGroup().addTo(map);
  var picker = false, lastFit = '';
  map.on('click', function (e) { if (picker) send({ type: 'pick', lat: e.latlng.lat, lng: e.latlng.lng }); });

  function pinIcon(color, label) {
    return L.divIcon({ className: 'pin', html: '<div style="background:' + color + '"><span>' + label + '</span></div>', iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -28] });
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  window.update = function (d) {
    picker = !!d.picker;
    layer.clearLayers();
    if (d.center && !picker) {
      if (d.radiusKm) L.circle([d.center.lat, d.center.lng], { radius: d.radiusKm * 1000, color: '#0b6e55', weight: 2, fillOpacity: 0.04, dashArray: '6 6' }).addTo(layer);
      L.marker([d.center.lat, d.center.lng], { icon: L.divIcon({ className: 'me', html: '<div></div>', iconSize: [18, 18], iconAnchor: [9, 9] }), zIndexOffset: 1000 }).addTo(layer);
    }
    (d.shops || []).forEach(function (s, i) {
      var m = L.marker([s.lat, s.lng], { icon: pinIcon(s.color, i + 1) }).addTo(layer);
      var el = document.createElement('div');
      el.className = 'pop';
      el.innerHTML = '<b>' + esc(s.name) + '</b><small>' + esc(s.sub) + '</small><button>View shop</button>';
      el.querySelector('button').onclick = function () { send({ type: 'select', id: s.id }); };
      m.bindPopup(el);
    });
    if (picker && d.pin) {
      if (d.radiusKm) L.circle([d.pin.lat, d.pin.lng], { radius: d.radiusKm * 1000, color: '#f59e0b', weight: 2, fillOpacity: 0.08 }).addTo(layer);
      var pin = L.marker([d.pin.lat, d.pin.lng], { icon: pinIcon('#0b6e55', '●'), draggable: true }).addTo(layer);
      pin.on('dragend', function () { var p = pin.getLatLng(); send({ type: 'pick', lat: p.lat, lng: p.lng }); });
    }
    // Only re-frame the map when the focus point or radius changes, not on every data refresh.
    var focus = picker ? (d.pin || d.center) : d.center;
    var key = focus ? [focus.lat.toFixed(5), focus.lng.toFixed(5), d.radiusKm, picker].join() : '';
    if (focus && key !== lastFit) {
      lastFit = key;
      if (!picker && d.radiusKm) map.fitBounds(L.latLng(focus.lat, focus.lng).toBounds(d.radiusKm * 2000), { padding: [8, 8] });
      else map.setView([focus.lat, focus.lng], Math.max(map.getZoom(), 15));
    }
  };
  window.addEventListener('message', function (e) { try { var d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; if (d && d.__lk) window.update(d); } catch (err) {} });
  send({ type: 'ready' });
</script></body></html>`

/** Shapes API shops into what the map page needs. */
export const toMapShops = (shops) =>
  shops.map((s) => ({
    id: s._id,
    lat: s.location.coordinates[1],
    lng: s.location.coordinates[0],
    name: s.shopName,
    sub: `${s.category} · ${formatDistance(s.distanceKm)}${s.isOpen ? '' : ' · Closed'}`,
    color: s.isOpen ? categoryStyle(s.category).color : '#9ca3af',
  }))
