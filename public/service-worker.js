// Stub service worker to prevent 404 errors
// This file does nothing but exists to satisfy requests
// Remove this if you add actual PWA functionality later

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  // No-op
});
