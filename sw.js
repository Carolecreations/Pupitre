const CACHE = 'pupitre-v2';   // ✅ incrémenté : force la mise à jour
const ASSETS = [
  './',
  './index.html',
  './mode-emploi.html',
  './manifest.json',
  './pupitre-icone-192.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();   // prend la main immédiatement
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS).catch(()=>{}))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    // Supprime tous les anciens caches (dont pupitre-v1)
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();   // prend le contrôle des onglets ouverts
  })());
});

self.addEventListener('message', (e) => {
  if(e.data && e.data.type === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.origin !== location.origin) return;   // laisse passer Firebase, Supabase, CDN

  // Réseau d'abord, cache en secours (pour toujours avoir la dernière version)
  e.respondWith((async () => {
    try {
      const fresh = await fetch(req, { cache: 'no-store' });
      const cache = await caches.open(CACHE);
      cache.put(req, fresh.clone()).catch(()=>{});
      return fresh;
    } catch(err) {
      const cached = await caches.match(req);
      return cached || Response.error();
    }
  })());
});