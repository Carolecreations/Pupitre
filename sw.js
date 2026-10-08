const CACHE = 'pupitre-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './pupitre-icone-192.png',
  './pupitre-icone-512.png',
  './mode-emploi.html'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS).catch(()=>{}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('message', e => {
  if(e.data && e.data.type === 'skipWaiting'){
    self.skipWaiting();
  }
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Ne JAMAIS intercepter les appels Firebase, Supabase, ou autres externes
  if(url.origin !== location.origin) return;
  // Ni les requêtes non-GET
  if(e.request.method !== 'GET') return;
  // Ni l'auth
  if(url.pathname.includes('identitytoolkit')) return;

  e.respondWith(
    fetch(e.request)
      .then(r => {
        if(r.ok) {
          const copy = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy)).catch(()=>{});
        }
        return r;
      })
      .catch(() => caches.match(e.request))
  );
});