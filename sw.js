// sw.js — Service Worker do Locanda Pizzeria
const CACHE_NAME = 'locanda-v2';
const ASSETS_TO_CACHE = [
    '/index.html',
    '/style.css',
    '/app.js',
    '/supabaseClient.js',
    '/manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;700&display=swap'
];

// Instala e faz cache dos assets estáticos
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE).catch(() => {
                // Silencia erros de CORS em recursos externos
            });
        })
    );
    self.skipWaiting();
});

// Ativa e limpa caches antigos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Estratégia: Network First, fallback para cache
self.addEventListener('fetch', (event) => {
    // Não intercepta chamadas ao Supabase (sempre online)
    if (event.request.url.includes('supabase.co')) return;

    event.respondWith(
        fetch(event.request)
            .then((res) => {
                // Atualiza cache com versão nova
                const resClone = res.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
                return res;
            })
            .catch(() => caches.match(event.request))
    );
});

// Recebe notificações push
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : { title: 'Locanda Pizzeria', body: 'Novidade!' };
    event.waitUntil(
        self.registration.showNotification(data.title || 'Locanda Pizzeria 🍕', {
            body: data.body,
            icon: 'https://instagram.fasu6-2.fna.fbcdn.net/v/t51.82787-15/573374451_17842149696611574_8991774026443342090_n.jpg?stp=dst-jpg_s150x150_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby4xMDgwLmMyIn0&_nc_ht=instagram.fasu6-2.fna.fbcdn.net&_nc_cat=106&_nc_oc=Q6cZ2QGF-zpjA8cPijPd5RSpqKxETK5rnkkDDh2p9_6yqpej9zo5GRLUgm0d3tqaeu4Q0J4&_nc_ohc=RupM1OUrZJ4Q7kNvwGnum_W&_nc_gid=FbdfUjQDJpnDTLdsOu7bcA&edm=AP4sbd4BAAAA&ccb=7-5&oh=00_AfzONtO62cnJCGwHroepfIxL3OcBuhtF6AcdRJWoRqm39Q&oe=69ABD045&_nc_sid=7a9f4b',
            badge: 'https://instagram.fasu6-2.fna.fbcdn.net/v/t51.82787-15/573374451_17842149696611574_8991774026443342090_n.jpg?stp=dst-jpg_s150x150_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby4xMDgwLmMyIn0&_nc_ht=instagram.fasu6-2.fna.fbcdn.net&_nc_cat=106&_nc_oc=Q6cZ2QGF-zpjA8cPijPd5RSpqKxETK5rnkkDDh2p9_6yqpej9zo5GRLUgm0d3tqaeu4Q0J4&_nc_ohc=RupM1OUrZJ4Q7kNvwGnum_W&_nc_gid=FbdfUjQDJpnDTLdsOu7bcA&edm=AP4sbd4BAAAA&ccb=7-5&oh=00_AfzONtO62cnJCGwHroepfIxL3OcBuhtF6AcdRJWoRqm39Q&oe=69ABD045&_nc_sid=7a9f4b',
            vibrate: [200, 100, 200],
            tag: 'pedido-update',
            renotify: true
        })
    );
});

// Click na notificação abre o app
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            if (clientList.length > 0) return clientList[0].focus();
            return clients.openWindow('/index.html');
        })
    );
});