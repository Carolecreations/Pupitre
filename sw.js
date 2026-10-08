const CACHE = 'pupitre-v4';
const ASSETS = [
  './',
  './manifest.json',
  './pupitre-icone-192.png',
  './pupitre-icone-512.png',
  './mode-emploi.html'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(()=>{})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => {
  if(e.data && e.data.type === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Ne pas toucher aux externes ni aux non-GET
  if(url.origin !== location.origin) return;
  if(e.request.method !== 'GET') return;

  // index.html et la racine : TOUJOURS prendre le réseau
  // (avec repli sur cache uniquement si hors ligne)
  const isHtml = url.pathname.endsWith('/') ||
                 url.pathname.endsWith('index.html') ||
                 url.pathname.endsWith('.html');

  if(isHtml){
    e.respondWith(
      fetch(e.request, {cache: 'no-store'})
        .then(r => {
          const copy = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy)).catch(()=>{});
          return r;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Ressources statiques : cache d'abord, réseau en repli
  e.respondWith(
    caches.match(e.request).then(cached => {
      if(cached) return cached;
      return fetch(e.request).then(r => {
        if(r.ok){
          const copy = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy)).catch(()=>{});
        }
        return r;
      });
    })
  );
});