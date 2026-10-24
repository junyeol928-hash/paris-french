/* tools/gen-sw.mjs が生成する。手で編集しない */
const VERSION = "d1e89283d215";
const CORE = "paris-fr-" + VERSION;
const FONTS = "paris-fr-fonts";
const FILES = ["./","index.html","manifest.webmanifest","assets/img/icon/favicon-32.png","assets/img/icon/apple-touch-icon.png","assets/css/style.css","data/phrases.js","data/listen.js","data/pron.js","data/days.js","data/dialogs.js","data/audio.js","data/photos.js","assets/js/srs.js","assets/js/numbers.js","assets/js/store.js","assets/js/core.js","assets/js/speech.js","assets/js/course.js","assets/js/lesson.js","assets/js/home.js","assets/js/phrasebook.js","assets/js/practice.js","assets/js/book.js","assets/js/family.js","assets/js/onboard.js","assets/js/pwa.js","assets/js/main.js","assets/img/icon/icon-192.png","assets/img/icon/icon-512.png","assets/img/icon/maskable-512.png","assets/img/st/a01.webp","assets/img/st/a02.webp","assets/img/st/a03.webp","assets/img/st/a04.webp","assets/img/st/a05.webp","assets/img/st/a06.webp","assets/img/st/a07.webp","assets/img/st/a08.webp","assets/img/st/a10.webp","assets/img/st/a11.webp","assets/img/st/a13.webp","assets/img/st/a14.webp","assets/img/st/a15.webp","assets/img/st/a16.webp","assets/img/st/a17.webp","assets/img/st/a18.webp","assets/img/st/a19.webp","assets/img/st/a20.webp","assets/img/st/a22.webp","assets/img/st/a23.webp","assets/img/st/a24.webp","assets/img/st/a25.webp","assets/img/st/a26.webp","assets/img/st/a27.webp","assets/img/st/a28.webp","assets/img/st/aeroport.webp","assets/img/st/bonjour.webp","assets/img/st/boutique.webp","assets/img/st/cafe.webp","assets/img/st/carte.webp","assets/img/st/comprendre.webp","assets/img/st/hotel.webp","assets/img/st/lire.webp","assets/img/st/metro.webp","assets/img/st/musee.webp","assets/img/st/paris.webp","assets/img/st/resto.webp","assets/img/st/taxi.webp","assets/img/st/urgence.webp","assets/img/st/welcome.webp","assets/img/il/m-aeroport.webp","assets/img/il/m-bonjour.webp","assets/img/il/m-boutique.webp","assets/img/il/m-cafe.webp","assets/img/il/m-carte.webp","assets/img/il/m-comprendre.webp","assets/img/il/m-hotel.webp","assets/img/il/m-lire.webp","assets/img/il/m-metro.webp","assets/img/il/m-musee.webp","assets/img/il/m-paris.webp","assets/img/il/m-resto.webp","assets/img/il/m-taxi.webp","assets/img/il/m-urgence.webp","assets/img/il/map.webp","assets/img/il/paper.webp","assets/img/il/v-carnet.webp","assets/img/il/v-family.webp","assets/img/il/v-phrases.webp","assets/img/il/v-practice.webp"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CORE).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: "reload" })))));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("paris-fr-") && k !== CORE && k !== FONTS).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("message", (e) => { if (e.data === "SKIP_WAITING") self.skipWaiting(); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  /* Google Fonts: 手元にあればそれを使い、裏で新しくする */
  if (u.hostname === "fonts.googleapis.com" || u.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.open(FONTS).then((c) => c.match(e.request).then((hit) => {
      const net = fetch(e.request).then((r) => { if (r.ok || r.type === "opaque") c.put(e.request, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    })));
    return;
  }
  if (u.origin !== location.origin) return;
  /* 同じサイトの物: 保存してある版を使う（版ごと入れ替える）。ページを開くときは index.html */
  e.respondWith(caches.match(e.request, { ignoreSearch: e.request.mode === "navigate" }).then((hit) => hit || (e.request.mode === "navigate" ? caches.match("index.html") : null)).then((hit) => hit || fetch(e.request)));
});
