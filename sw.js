/**
 * Service Worker for MWS Restaurant page
 *
 * Version: 1.0
 * Author: Kádár Péter <kadar.peter@gmail.com>
 * Project: mws-restaurant-stage-1
 */

const CACHE_NAME = 'mws-restaurant-cache-v1';

// TODO @kp: refactor image caching, into different cache (created: 2018. 04. 05.)
let assetsCache = [
  '/',
  'index.html',
  'restaurant.html',
  'css/styles.css',
  'node_modules/idb/lib/idb.js',
  //'data/restaurants.json',
  'js/dbhelper.js',
  'js/main.js',
  'js/restaurant_info.js',
  'img/1.jpg',
  'img/1@2x.jpg',
  'img/2.jpg',
  'img/2@2x.jpg',
  'img/3.jpg',
  'img/3@2x.jpg',
  'img/4.jpg',
  'img/4@2x.jpg',
  'img/5.jpg',
  'img/5@2x.jpg',
  'img/6.jpg',
  'img/6@2x.jpg',
  'img/7.jpg',
  'img/7@2x.jpg',
  'img/8.jpg',
  'img/8@2x.jpg',
  'img/9.jpg',
  'img/9@2x.jpg',
  'img/10.jpg',
  'img/10@2x.jpg',
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
