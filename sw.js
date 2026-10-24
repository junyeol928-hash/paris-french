/* tools/gen-sw.mjs が生成する。手で編集しない */
const VERSION = "4ff8ac6d03a9";
const CORE = "paris-fr-" + VERSION;
const FONTS = "paris-fr-fonts";
const FILES = ["./","index.html","manifest.webmanifest","assets/img/icon/favicon-32.png","assets/img/icon/apple-touch-icon.png","assets/css/style.css","data/phrases.js","data/listen.js","data/pron.js","data/days.js","data/dialogs.js","data/audio.js","assets/js/srs.js","assets/js/numbers.js","assets/js/store.js","assets/js/core.js","assets/js/speech.js","assets/js/course.js","assets/js/lesson.js","assets/js/home.js","assets/js/phrasebook.js","assets/js/practice.js","assets/js/book.js","assets/js/family.js","assets/js/onboard.js","assets/js/pwa.js","assets/js/main.js","assets/img/icon/icon-192.png","assets/img/icon/icon-512.png","assets/img/icon/maskable-512.png"];

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
