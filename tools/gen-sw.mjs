/* オフライン用の service worker（sw.js）を作る: node tools/gen-sw.mjs [--list]
   index.html が読むローカルの CSS・JS と、index.html・manifest・アイコンを全部先に保存（precache）する。
   版は中身のハッシュ。画面やデータを変えたら必ず作り直す（作り直さないと、家族の端末に古い版が残る） */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export function files() {
  const html = readFileSync(join(ROOT, "index.html"), "utf8");
  const local = (u) => u && !/^(https?:)?\/\//.test(u) && !u.startsWith("data:");
  const refs = [...html.matchAll(/<(?:script[^>]+src|link[^>]+href)="([^"]+)"/g)].map((m) => m[1]).filter(local);
  const icons = existsSync(join(ROOT, "assets/img/icon")) ? readdirSync(join(ROOT, "assets/img/icon")).filter((f) => f.endsWith(".png")).map((f) => "assets/img/icon/" + f) : [];
  return ["./", "index.html", ...new Set(refs), ...icons.filter((f) => !refs.includes(f))].filter((f, i, a) => a.indexOf(f) === i);
}

const list = files();
if (process.argv.includes("--list")) { console.log(list.join("\n")); process.exit(0); }
const missing = list.filter((f) => f !== "./" && !existsSync(join(ROOT, f)));
if (missing.length) { console.error("見つからないファイル: " + missing.join(", ")); process.exit(1); }
const h = createHash("sha256");
for (const f of list) if (f !== "./") h.update(f).update(readFileSync(join(ROOT, f)));
const version = h.digest("hex").slice(0, 12);
/* --check: sw.js が今のファイルの中身で作られているか（作り直し忘れの検出） */
if (process.argv.includes("--check")) {
  const cur = existsSync(join(ROOT, "sw.js")) ? (readFileSync(join(ROOT, "sw.js"), "utf8").match(/const VERSION = "([0-9a-f]+)"/) || [])[1] : null;
  if (cur !== version) { console.error(`sw.js が古い（${cur} → ${version}）。node tools/gen-sw.mjs で作り直す`); process.exit(1); }
  console.log("sw.js は最新"); process.exit(0);
}

const sw = `/* tools/gen-sw.mjs が生成する。手で編集しない */
const VERSION = "${version}";
const CORE = "paris-fr-" + VERSION;
const FONTS = "paris-fr-fonts";
const FILES = ${JSON.stringify(list)};

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
`;
writeFileSync(join(ROOT, "sw.js"), sw);
console.log(`sw.js ${version}（${list.length} ファイル）`);
