/**
 * NeoAbs Service Worker
 * Caches static assets + CDN resources for faster repeat loads.
 * Skips search/ paths to avoid interfering with MkDocs search worker.
 */
;(function () {
  "use strict"

  var CACHE_STATIC = "neoabs-static-v1"
  var CACHE_CDN = "neoabs-cdn-v1"

  self.addEventListener("install", function (e) {
    e.waitUntil(self.skipWaiting())
  })

  self.addEventListener("activate", function (e) {
    e.waitUntil(
      caches.keys().then(function (names) {
        return Promise.all(
          names.filter(function (n) {
            return n !== CACHE_STATIC && n !== CACHE_CDN
          }).map(function (n) { return caches.delete(n) })
        )
      }).then(function () { return self.clients.claim() })
    )
  })

  self.addEventListener("fetch", function (e) {
    var url = new URL(e.request.url)
    if (e.request.method !== "GET") return

    // Never intercept search worker requests
    var path = url.pathname
    if (path.indexOf("/search/") !== -1) return

    // External: fonts + CDN → cache-first
    if (url.origin !== self.location.origin) {
      if (isCDNOrFont(url.hostname)) {
        e.respondWith(cacheFirst(e.request, CACHE_CDN))
      }
      return
    }

    // Same-origin: static assets → stale-while-revalidate
    if (isStaticAsset(path)) {
      e.respondWith(staleWhileRevalidate(e.request, CACHE_STATIC))
    }
    // Everything else on same-origin: pass through to browser
  })

  function isCDNOrFont(host) {
    return host === "fonts.googleapis.com" ||
           host === "fonts.gstatic.com" ||
           host === "cdnjs.cloudflare.com" ||
           host === "cdn.jsdelivr.net"
  }

  function isStaticAsset(path) {
    if (path.indexOf("/assets/") === 0 && /\.(css|js|svg|png|jpg|woff2?)$/.test(path)) return true
    if (path.indexOf("neoabs.css") !== -1) return true
    if (path.indexOf("neoabs.js") !== -1) return true
    return false
  }

  function staleWhileRevalidate(request, cacheName) {
    return caches.open(cacheName).then(function (cache) {
      return cache.match(request).then(function (cached) {
        var fetchPromise = fetch(request).then(function (response) {
          if (response.ok) cache.put(request, response.clone())
          return response
        }).catch(function () { return cached })
        return cached || fetchPromise
      })
    })
  }

  function cacheFirst(request, cacheName) {
    return caches.open(cacheName).then(function (cache) {
      return cache.match(request).then(function (cached) {
        if (cached) return cached
        return fetch(request).then(function (response) {
          if (response.ok) cache.put(request, response.clone())
          return response
        })
      })
    })
  }
})()
