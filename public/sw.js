// MenuAR Service Worker — pre-cache de modelos 3D
const CACHE_NAME = 'menuAR-models-v1'

// Lista de archivos a pre-cachear al conectarse al WiFi
const MODELS_TO_CACHE = [
  '/models/pizzamodel.usdz',
  '/models/pizzamodel.glb',
]

// ── INSTALL: pre-cachear todos los modelos ────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-cacheando modelos AR...')
      return cache.addAll(MODELS_TO_CACHE)
    })
  )
})

// ── ACTIVATE: limpiar cachés viejos ───────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  )
})

// ── FETCH: servir modelos desde caché si están disponibles ────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Solo interceptar archivos de modelos 3D
  if (url.pathname.endsWith('.usdz') || url.pathname.endsWith('.glb')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request)
        if (cached) {
          console.log('[SW] Sirviendo desde caché:', url.pathname)
          return cached
        }
        // No está en caché — descargar y guardar
        console.log('[SW] Descargando y cacheando:', url.pathname)
        const response = await fetch(event.request)
        cache.put(event.request, response.clone())
        return response
      })
    )
  }
})

// ── MENSAJE: recibir lista de modelos a pre-cachear ───────────────────────
self.addEventListener('message', async (event) => {
  if (event.data?.type === 'PRECACHE_MODELS') {
    const urls = event.data.urls || []
    const cache = await caches.open(CACHE_NAME)

    // Pre-cachear con reporte de progreso
    let done = 0
    for (const url of urls) {
      try {
        const existing = await cache.match(url)
        if (!existing) {
          const response = await fetch(url)
          await cache.put(url, response.clone())
          console.log('[SW] Cacheado:', url)
        } else {
          console.log('[SW] Ya en caché:', url)
        }
      } catch (e) {
        console.error('[SW] Error cacheando:', url, e)
      }
      done++
      // Notificar progreso a todos los clientes
      const clients = await self.clients.matchAll()
      clients.forEach((client) =>
        client.postMessage({ type: 'CACHE_PROGRESS', done, total: urls.length, url })
      )
    }

    const clients = await self.clients.matchAll()
    clients.forEach((client) =>
      client.postMessage({ type: 'CACHE_COMPLETE', total: urls.length })
    )
  }

  if (event.data?.type === 'CHECK_CACHE') {
    const urls = event.data.urls || []
    const cache = await caches.open(CACHE_NAME)
    const results = {}
    for (const url of urls) {
      results[url] = !!(await cache.match(url))
    }
    const clients = await self.clients.matchAll()
    clients.forEach((c) => c.postMessage({ type: 'CACHE_STATUS', results }))
  }
})
