/**
 * Service Worker for MWS Restaurant page
 *
 * Version: 1.0
 * Author: Kádár Péter <kadar.peter@gmail.com>
 * Project: mws-restaurant-stage-1
 */
importScripts('js/app.js');

const CACHE_NAME = 'mws-restaurant-cache-v3';

// TODO @kp: refactor image caching, into different cache (created: 2018. 04. 05.)
let assetsCache = [
  '/',
  'index.html',
  'restaurant.html',
  'css/main.css',
  //'data/restaurants.json',
  'js/app.js',
  'js/main.js',
  'js/restaurant_info.js',
  'img/1.webp',
  'img/1@2x.webp',
  'img/2.webp',
  'img/2@2x.webp',
  'img/3.webp',
  'img/3@2x.webp',
  'img/4.webp',
  'img/4@2x.webp',
  'img/5.webp',
  'img/5@2x.webp',
  'img/6.webp',
  'img/6@2x.webp',
  'img/7.webp',
  'img/7@2x.webp',
  'img/8.webp',
  'img/8@2x.webp',
  'img/9.webp',
  'img/9@2x.webp',
  'img/10.webp',
  'img/10@2x.webp',
];

/**
 * Installing a service worker and cache URLsPlauen, Németország
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(assetsCache);
    })
  );
});

/**
 * Activating the service worker
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName.startsWith('mws-restaurant-') && cacheName !== CACHE_NAME;
        }).map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

/**
 * Fetching items from cache
 */
self.addEventListener('fetch', (event) => {
  let requestUrl = new URL(event.request.url);

  if (requestUrl.origin === location.origin) {
    if (requestUrl.pathname === '/') {
      event.respondWith(caches.match('/index.html'));
      return;
    }
  }

  event.respondWith(
    caches.match(event.request, { ignoreSearch:true }).then((response) => {
      if (response) return response;

      return fetch(event.request);
    }).catch((err) => console.log(err, event.request))
  );
});

self.addEventListener('sync', (event) => {
  console.log(event);
  if (event.tag === 'sync-reviews') {
    console.log('SW:sync-reviews');
    event.waitUntil(serverSync());
  }
});

/**
 * Synt to server
 * @returns {Promise}
 */
async function serverSync() {
  return DBHelper.syncReviews()
    .then(savedReviews => {
      if (savedReviews) { // if sync is complete then notify clients to update the reviews status
        self.clients.matchAll().then(function (clients) {
          clients.forEach(function (client) {
            console.log(client);
            client.postMessage({
              action: 'sync-success',
              reviews: savedReviews
            });
          });
        })
      }
    })
    .catch(err => console.log(err));
}