// EnglishMind Service Worker
// 实现：静态资源缓存 + API 离线队列 + 后台同步

const CACHE_VERSION = 'em-v1'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`
const QUEUE_CACHE = `${CACHE_VERSION}-queue`

// 预缓存核心资源（app shell）
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
]

// 安装阶段：预缓存核心资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  )
})

// 激活阶段：清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== STATIC_CACHE && key !== RUNTIME_CACHE && key !== QUEUE_CACHE)
            .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  )
})

// 请求拦截策略
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // 只处理 GET 请求
  if (request.method !== 'GET') return

  // API 请求（/api/）：网络优先，离线时缓存队列
  if (url.pathname.startsWith('/api/')) {
    return handleApiRequest(event, request)
  }

  // 静态资源（同源）：缓存优先，后台更新
  if (url.origin === self.location.origin) {
    return handleStaticRequest(event, request)
  }
})

// API 请求：网络优先 + 离线队列
function handleApiRequest(event, request) {
  event.respondWith(
    fetch(request)
      .then(response => {
        // 成功响应存入运行时缓存
        const clone = response.clone()
        caches.open(RUNTIME_CACHE).then(cache => {
          cache.put(request, clone)
        })
        return response
      })
      .catch(() => {
        // 网络失败，尝试返回缓存的响应
        return caches.match(request).then(cached => {
          if (cached) return cached
          // 对于 POST 类的 API 调用，这里只是保护，真正的队列在 sync 阶段
          return new Response(
            JSON.stringify({ error: '网络不可用，请稍后重试' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          )
        })
      })
  )
}

// 静态资源：缓存优先 + 后台更新
function handleStaticRequest(event, request) {
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) {
        // 缓存命中，同时后台更新
        updateCache(request)
        return cached
      }
      // 缓存未命中
      return fetch(request).then(response => {
        // 有效响应存入缓存
        if (response.ok && response.type === 'basic') {
          const clone = response.clone()
          caches.open(RUNTIME_CACHE).then(cache => {
            cache.put(request, clone)
          })
        }
        return response
      }).catch(() => {
        // 离线且未缓存：返回离线页面或主页面
        if (request.mode === 'navigate') {
          return caches.match('/index.html')
        }
        return new Response('离线', { status: 503 })
      })
    })
  )
}

// 后台更新缓存
function updateCache(request) {
  fetch(request).then(response => {
    if (response.ok && response.type === 'basic') {
      const clone = response.clone()
      caches.open(RUNTIME_CACHE).then(cache => {
        cache.put(request, clone)
      })
    }
  }).catch(() => {})
}

// 后台同步：重试离线期间失败的 API 请求
self.addEventListener('sync', event => {
  if (event.tag === 'sync-queue') {
    event.waitUntil(processQueue())
  }
})

async function processQueue() {
  const cache = await caches.open(QUEUE_CACHE)
  const requests = await cache.matchAll()

  for (const request of requests) {
    try {
      const response = await fetch(request)
      if (response.ok) {
        await cache.delete(request)
      }
    } catch {
      // 再次失败，保留在队列中
    }
  }
}

// 推送通知（可后续扩展）
self.addEventListener('push', event => {
  if (!event.data) return
  const data = event.data.json()
  const options = {
    body: data.body || '继续你的学习吧！',
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    vibrate: [100, 50, 100],
    data: data.url || '/',
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'EnglishMind', options)
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(
    self.clients.openWindow(event.notification.data || '/')
  )
})

// 消息通道：主页面可以要求 SW 跳过等待等操作
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
