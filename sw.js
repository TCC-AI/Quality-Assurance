const CACHE_NAME = 'gai-system-v1.0.1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&display=swap'
];

// 安裝 Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache).catch(error => {
          console.error('Failed to cache resources:', error);
          // 即使某些資源無法緩存，也不要讓安裝失敗
          return Promise.resolve();
        });
      })
  );
  // 強制等待中的 Service Worker 變為活動狀態
  self.skipWaiting();
});

// 攔截請求
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果在緩存中找到，返回緩存版本
        if (response) {
          return response;
        }
        
        // 否則從網路獲取
        return fetch(event.request).catch(error => {
          console.error('Fetch failed:', error);
          // 如果是導航請求且網路失敗，返回離線頁面
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          throw error;
        });
      })
  );
});

// 更新 Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // 立即控制所有
