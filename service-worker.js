// Sorgt dafür, dass die App auch ohne Internet startet.
//
// Strategie "erst Netz, dann Zwischenspeicher": Solange Internet da ist, wird immer
// die neueste Version geladen (und gleichzeitig gespeichert). Nur ohne Internet
// kommt die zuletzt gespeicherte Version zum Einsatz. So sieht man Änderungen sofort.

const SPEICHER = 'essensplan-v2';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (ereignis) => {
  // Alte Zwischenspeicher aufräumen
  ereignis.waitUntil(
    caches.keys().then((namen) => Promise.all(
      namen.filter((name) => name !== SPEICHER).map((name) => caches.delete(name))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (ereignis) => {
  const anfrage = ereignis.request;
  // Nur eigene Dateien, nur Lesezugriffe
  if (anfrage.method !== 'GET' || new URL(anfrage.url).origin !== self.location.origin) return;

  ereignis.respondWith(
    fetch(anfrage)
      .then((antwort) => {
        if (antwort.ok) {
          const kopie = antwort.clone();
          caches.open(SPEICHER).then((speicher) => speicher.put(anfrage, kopie));
        }
        return antwort;
      })
      .catch(() => caches.match(anfrage, { ignoreSearch: true }))
  );
});
