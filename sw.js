/* Offer Poster Studio – service worker (makes the site installable and gives an offline fallback).
   Network-first for the site's own files, so a new script.js / style.css always wins as soon as you upload it.
   Supabase, Razorpay, Google sign-in and fonts are NOT touched (cross-origin requests pass straight through). */
const CACHE = 'ops-shell-v1';
const SHELL = ['/', '/index.html', '/style.css', '/script.js', '/manifest.webmanifest', '/icon-192.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => { })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || r.headers.has('range')) return;
  if (u.pathname.startsWith('/admin')) return; // admin panel always live
  e.respondWith(
    fetch(r).then(res => {
      if (res && res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)).catch(() => { }); }
      return res;
    }).catch(() => caches.match(r).then(m => m || (r.mode === 'navigate' ? caches.match('/index.html') : undefined)))
  );
});