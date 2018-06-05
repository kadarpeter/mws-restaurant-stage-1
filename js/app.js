/**
 * Service Worker for MWS Restaurant page
 *
 * Version: 1.0
 * Author: Kádár Péter <kadar.peter@gmail.com>
 * Project: mws-restaurant-stage-1
 */

/**
 * Register Service Worker
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      console.info('ServiceWorker registration successful with scope: ', registration.scope);
    }, (err) => {
      console.info('ServiceWorker registration failed: ', err);
    });
  });
}