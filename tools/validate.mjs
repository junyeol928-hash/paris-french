/* データ検査: node tools/validate.mjs
   id の重複、必須項目、場面・日程の参照先、聞き取りの選択肢、日本語であるべき欄が日本語か（文字化け対策） */
import { readFileSync } from "node:fs";
import vm from "node:vm";

const ctx = { window: {} };
vm.createContext(ctx);
for (const f of ["phrases", "listen", "pron", "days", "dialogs"]) vm.runInContext(readFileSync(new URL(`../data/${f}.js`, import.meta.url), "utf8"), ctx, { filename: f + ".js" });
const D = ctx.window.DATA;
const errs = [];
const err = (m) => errs.push(m);
const JP = /[぀-ヿ一-鿿]/;
const need = (o, keys, where) => { for (const k of keys) if (!o[k] || typeof o[k] !== "string" || !o[k].trim()) err(`${where}: ${k} が空`); };

const sceneIds = new Set(D.scenes.map((s) => s.id));
const pIds = new Set();
for (const p of D.phrases) {
  const w = `phrase ${p.id}`;
  if (pIds.has(p.id)) err(`${w}: id 重複`); pIds.add(p.id);
  need(p, ["id", "s", "fr", "kana", "ja"], w);
  if (!sceneIds.has(p.s)) err(`${w}: 場面 ${p.s} がない`);
  if (p.ja && !JP.test(p.ja)) err(`${w}: ja が日本語でない`);
  if (p.kana && !/^[゠-ヿ\s・ー]+$/.test(p.kana)) err(`${w}: kana にカタカナ以外 (${p.kana})`);
  if (p.fr && JP.test(p.fr)) err(`${w}: fr に日本語`);
}
const frSeen = new Map();
for (const p of D.phrases) { if (frSeen.has(p.fr)) err(`phrase ${p.id}: ${frSeen.get(p.fr)} と同じ文`); frSeen.set(p.fr, p.id); }

const catIds = new Set(D.listenCats.map((c) => c.id));
const lIds = new Set();
for (const q of D.listen) {
  const w = `listen ${q.id}`;
  if (lIds.has(q.id)) err(`${w}: id 重複`); lIds.add(q.id);
  need(q, ["id", "s", "fr"], w);
  if (!catIds.has(q.s)) err(`${w}: 分類 ${q.s} がない`);
  if (!Array.isArray(q.c) || q.c.length !== 4) err(`${w}: 選択肢が 4 つでない`);
  else if (new Set(q.c).size !== 4) err(`${w}: 選択肢が重複`);
  if (!/^l\d{3}$/.test(q.id)) err(`${w}: id は l + 3 桁`);
}

for (const r of D.pron) {
  need(r, ["id", "t", "r"], `pron ${r.id}`);
  if (!r.ex || r.ex.length < 3) err(`pron ${r.id}: 例が 3 つ未満`);
  for (const e of r.ex || []) if (e.length !== 3 || !e[2] || !/^[゠-ヿ\s・ー]+$/.test(e[1])) err(`pron ${r.id}: 例 ${e[0]} の形`);
}

for (const d of D.days) {
  if ("date" in d) err(`day ${d.id}: 公開サイトなので日付は持たない`);
  for (const id of d.ph) if (!pIds.has(id)) err(`day ${d.id}: フレーズ ${id} がない`);
  if (new Set(d.ph).size !== d.ph.length) err(`day ${d.id}: フレーズが重複`);
}

const dIds = new Set();
for (const g of D.dialogs) {
  const w = `dialog ${g.id}`;
  if (dIds.has(g.id)) err(`${w}: id 重複`); dIds.add(g.id);
  if (!sceneIds.has(g.scene)) err(`${w}: 場面 ${g.scene} がない`);
  need(g, ["id", "fr", "ja"], w);
  for (const [k, ln] of g.lines.entries()) {
    if (ln.who === "s") { need(ln, ["fr", "kana", "ja"], `${w} 行 ${k}`); if (JP.test(ln.fr)) err(`${w} 行 ${k}: fr に日本語`); }
    else if (ln.who === "me") {
      if (!Array.isArray(ln.opts) || ln.opts.length !== 2) err(`${w} 行 ${k}: 自分の番の選択肢は 2 つ`);
      for (const o of ln.opts || []) { need(o, ["fr", "kana", "ja"], `${w} 行 ${k}`); if (o.kana && !/^[゠-ヿ\s・ー]+$/.test(o.kana)) err(`${w} 行 ${k}: kana にカタカナ以外 (${o.kana})`); }
    } else err(`${w} 行 ${k}: who は s か me`);
  }
}
/* 公開サイトに個人を特定できる情報を載せない */
/* 公開してはいけない語（名前・便名・予約番号）は公開リポジトリに書けないので、
   git に入れない tools/private-words.txt（1 行 1 つの正規表現）から読む。無ければこの検査は飛ばす */
let PRIVATE = null;
try {
  const words = readFileSync(new URL("./private-words.txt", import.meta.url), "utf8").split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  if (words.length) PRIVATE = new RegExp(words.join("|"));
} catch { console.warn("注意: tools/private-words.txt が無いので、個人情報の検査を飛ばしました"); }
for (const f of ["phrases", "listen", "pron", "days", "dialogs"]) {
  const t = readFileSync(new URL(`../data/${f}.js`, import.meta.url), "utf8");
  if (PRIVATE && PRIVATE.test(t)) err(`${f}.js: 名前・便名・予約番号が入っている`);
}

if (errs.length) { console.error(errs.join("\n")); console.error(`NG: ${errs.length} 件`); process.exit(1); }
console.log(`OK: フレーズ ${D.phrases.length}（場面 ${D.scenes.length}）/ 聞き取り ${D.listen.length} / 発音 ${D.pron.length}（例 ${D.pron.reduce((n, r) => n + r.ex.length, 0)}）/ 旅程 ${D.days.length} 日 / 会話 ${D.dialogs.length}`);
