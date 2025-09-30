const CACHE_NAME = 'gai-inspection-system-v1.2';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-16x16.png',
  './icon-32x32.png',
  './icon-72x72.png',
  './icon-96x96.png',
  './icon-128x128.png',
  './icon-144x144.png',
  './icon-152x152.png',
  './icon-180x180.png',
  './icon-192x192.png',
  './icon-384x384.png',
  './icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&display=swap'
];

// 安裝事件
self.addEventListener('install', (event) => {
  console.log('Service Worker 安裝中...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('快取已開啟');
        return cache.addAll(urlsToCache.map(url => {
          return new Request(url, { mode: 'cors' });
        }));
      })
      .catch((error) => {
        console.error('快取失敗:', error);
        // 即使快取失敗也要完成安裝
        return Promise.resolve();
      })
  );
  
  // 強制啟用新的 Service Worker
  self.skipWaiting();
});

// 啟用事件
self.addEventListener('activate', (event) => {
  console.log('Service Worker 啟用中...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('刪除舊快取:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // 立即控制所有頁面
      return self.clients.claim();
    })
  );
});

// 攔截網路請求
self.addEventListener('fetch', (event) => {
  // 跳過非 HTTP/HTTPS 請求
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // 跳過 Google Apps Script 請求（讓它們直接通過網路）
  if (event.request.url.includes('script.google.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 如果在快取中找到，返回快取版本
        if (response) {
          console.log('從快取提供:', event.request.url);
          return response;
        }

        // 否則從網路獲取
        console.log('從網路獲取:', event.request.url);
        return fetch(event.request).then((response) => {
          // 檢查是否為有效響應
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // 複製響應
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch((error) => {
          console.error('網路請求失敗:', error);
          
          // 如果是導航請求且網路失敗，返回離線頁面
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          
          throw error;
        });
      })
  );
});

// 處理推送通知（未來可能用到）
self.addEventListener('push', (event) => {
  console.log('收到推送通知:', event);
  
  const options = {
    body: event.data ? event.data.text() : '您有新的稽查任務',
    icon: './icon-192x192.png',
    badge: './icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '查看詳情',
        icon: './icon-128x128.png'
      },
      {
        action: 'close',
        title: '關閉',
        icon: './icon-128x128.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('GAI稽查系統', options)
  );
});

// 處理通知點擊
self.addEventListener('notificationclick', (event) => {
  console.log('通知被點擊:', event);
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('./')
    );
  }
});

// 處理背景同步（未來可能用到）
self.addEventListener('sync', (event) => {
  console.log('背景同步:', event);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // 執行背景同步任務
      console.log('執行背景同步任務')
    );
  }
});

// 錯誤處理
self.addEventListener('error', (event) => {
  console.error('Service Worker 錯誤:', event.error);
});

// 未處理的 Promise 拒絕
self.addEventListener('unhandledrejection', (event) => {
  console.error('未處理的 Promise 拒絕:', event.reason);
});

// 定期清理舊快取
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_CLEANUP') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    );
  }
});
