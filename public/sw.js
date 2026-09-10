const CACHE_NAME = 'xactscore-shell-v4'
const PRECACHE_URLS = ['/offline.html', '/icons/icon-192.png', '/icons/icon-512.png', '/apple-touch-icon.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  )
})

function shouldBypass(request, url) {
  if (request.method !== 'GET') return true
  if (url.origin !== self.location.origin) return true
  if (request.headers.get('RSC') === '1') return true
  if (request.headers.has('Next-Router-State-Tree')) return true
  if (request.headers.has('Next-Router-Prefetch')) return true
  if (request.headers.has('Next-Url')) return true
  if (url.searchParams.has('_rsc')) return true
  if (url.pathname.startsWith('/api/')) return true
  if (url.pathname.startsWith('/auth/')) return true
  if (url.pathname.startsWith('/_next/') && !url.pathname.startsWith('/_next/static/')) return true
  return false
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (shouldBypass(request, url)) return

  // Never cache Next.js build assets. Hashed chunks change every deploy; a
  // stale cacheFirst entry (especially on iOS Home Screen PWAs) causes
  // ChunkLoadError when navigating to routes like /predictions.
  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(fetch(request))
    return
  }

  if (url.pathname.startsWith('/icons/')) {
    event.respondWith(cacheFirst(request))
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigate(request))
  }
})

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME)
    cache.put(request, response.clone())
  }
  return response
}

async function networkFirstNavigate(request) {
  try {
    return await fetch(request)
  } catch {
    const offline = await caches.match('/offline.html')
    if (offline) return offline
    throw new Error('offline')
  }
}

self.addEventListener('push', (event) => {
  let payload = { title: 'XactScore', body: 'Time to put your scores in.', url: '/' }
  try {
    payload = { ...payload, ...(event.data ? event.data.json() : {}) }
  } catch {
    if (event.data) payload.body = event.data.text() || payload.body
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: payload.tag || 'xactscore',
      renotify: true,
      data: { url: payload.url || '/' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.focus()
          if ('navigate' in client) client.navigate(url)
          return
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})
