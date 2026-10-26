// LocalKart service worker: makes the website installable and quick to reopen.
// Pages: network first, falling back to the saved app when offline. Built files (hashed names): cache first.
// Other sites (the API, maps, fonts) are never touched, so shop data and prices are always live.
const VERSION = 'v1'
const PAGES = `localkart-pages-${VERSION}`
const FILES = `localkart-files-${VERSION}`

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(PAGES).then((c) => c.add('/')).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('localkart-') && k !== PAGES && k !== FILES).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)
  if (req.method !== 'GET' || url.origin !== self.location.origin) return

  if (req.mode === 'navigate') {
    // Every route is the same single-page app, so the saved "/" works offline for all of them.
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) caches.open(PAGES).then((c) => c.put('/', res.clone()))
          return res
        })
        .catch(() => caches.match('/')),
    )
    return
  }

  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone()
          caches.open(FILES).then((c) => c.put(req, copy))
        }
        return res
      })),
    )
  }
})
