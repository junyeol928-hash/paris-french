/* 保存: 端末の localStorage に、人（プロフィール）ごとに分けて記録する。
   端末共通: fr3:profiles（人の一覧）, fr3:cur（いま使っている人）, fr3:trip（旅の日程）, fr3:family（受け取った家族のカード）
   人ごと:   fr3:p:<id>:<key>  key = srs / log / done / fav / prog / stamps / speak / dlg / prefs
   クラウドには送らない。別の端末へは「書き出し」したファイルか、家族カードのリンクで移す */
(function () {
  const ROOT = "fr3:";
  const raw = {
    get(k, d) { try { const v = localStorage.getItem(ROOT + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    /* 保存できたら true。容量不足・プライベートモードなどで失敗したら画面に知らせる（save-failed） */
    set(k, v) {
      try { if (v == null) localStorage.removeItem(ROOT + k); else localStorage.setItem(ROOT + k, JSON.stringify(v)); return true; }
      catch (e) { console.warn("保存できませんでした", k, e); document.dispatchEvent(new CustomEvent("save-failed", { detail: { key: k } })); return false; }
    },
  };

  /* 人の路線色。RATP の路線色から、互いに明るさも違う 5 色 */
  const LINES = [
    { id: "violet", name: "ヴィオレ", line: "4", c: "#9B2F8F" },
    { id: "jaune", name: "ジョーヌ", line: "1", c: "#E5A800" },
    { id: "bleu", name: "ブルー", line: "2", c: "#1F5FAF" },
    { id: "vert", name: "ヴェール", line: "6", c: "#3F9160" },
    { id: "orange", name: "オランジュ", line: "5", c: "#D9701C" },
  ];
  const lineOf = (id) => LINES.find((l) => l.id === id) || LINES[0];

  const profiles = () => raw.get("profiles", []);
  const curId = () => { const id = raw.get("cur", null); return profiles().some((p) => p.id === id) ? id : null; };
  const cur = () => profiles().find((p) => p.id === curId()) || null;

  function addProfile(name, color) {
    const ps = profiles();
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    ps.push({ id, name: String(name).slice(0, 20), color, created: Date.now() });
    raw.set("profiles", ps);
    raw.set("cur", id);
    return id;
  }
  function updateProfile(id, patch) {
    raw.set("profiles", profiles().map((p) => (p.id === id ? Object.assign({}, p, patch) : p)));
    document.dispatchEvent(new CustomEvent("profile-changed"));
  }
  function removeProfile(id) {
    raw.set("profiles", profiles().filter((p) => p.id !== id));
    for (const k of KEYS) raw.set("p:" + id + ":" + k, null);
    if (raw.get("cur", null) === id) raw.set("cur", (profiles()[0] || {}).id || null);
    document.dispatchEvent(new CustomEvent("profile-changed"));
  }
  function switchTo(id) { raw.set("cur", id); document.dispatchEvent(new CustomEvent("profile-changed")); }

  /* いまの人の記録 */
  const KEYS = ["srs", "log", "done", "fav", "prog", "stamps", "speak", "dlg", "prefs", "weak", "resume", "famSeen"];
  const LS = {
    get(k, d) { const id = curId(); return id ? raw.get("p:" + id + ":" + k, d) : d; },
    set(k, v) { const id = curId(); return id ? raw.set("p:" + id + ":" + k, v) : false; },
    of(pid, k, d) { return raw.get("p:" + pid + ":" + k, d); },
  };

  /* 表示の好み（人ごと） */
  function prefs() {
    const v = LS.get("prefs", {}) || {};
    const num = (x, d, lo, hi) => { x = Number(x); return Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : d; };
    return {
      size: v.size === "lg" ? "lg" : "md",
      motion: v.motion === "less" ? "less" : "full",
      grades: v.grades === "2" ? "2" : "4",
      rate: num(v.rate, 1, 0.6, 1.3),
      newPerDay: num(v.newPerDay, 6, 3, 18),
      sound: v.sound !== false,
      hotelName: typeof v.hotelName === "string" ? v.hotelName.slice(0, 80) : "",
      hotelAddr: typeof v.hotelAddr === "string" ? v.hotelAddr.slice(0, 160) : "",
    };
  }
  function setPrefs(patch) { const ok = LS.set("prefs", Object.assign(prefs(), patch)); document.dispatchEvent(new CustomEvent("prefs-changed")); return ok; }

  /* 旅の日程（端末共通。招待リンクで入る） */
  const trip = () => raw.get("trip", null);
  function setTrip(start, days) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return;
    raw.set("trip", { start, days: 4 });   /* しおりの旅程が 4 日分なので、日数は 4 日で固定 */
  }

  /* ---------- 日付 ---------- */
  const iso = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const today = () => iso(new Date());
  const dayNum = (s) => { const [y, m, d] = s.split("-").map(Number); return Date.UTC(y, m - 1, d) / 864e5; };
  function addDays(s, n) { const [y, m, d] = s.split("-").map(Number); return iso(new Date(y, m - 1, d + n)); }

  function bumpLog(field, n) {
    const log = LS.get("log", {});
    const t = today();
    log[t] = log[t] || {};
    log[t][field] = (log[t][field] || 0) + (n == null ? 1 : n);
    LS.set("log", log);
  }
  function streakOf(pid) {
    const log = pid ? LS.of(pid, "log", {}) : LS.get("log", {});
    const has = (d) => { const x = log[d]; return x && Object.values(x).some((v) => v > 0); };
    let d = today();
    if (!has(d)) d = addDays(d, -1);
    let n = 0;
    while (has(d)) { n++; d = addDays(d, -1); }
    return n;
  }

  /* ---------- 家族カード: 進み具合を小さなコードにして、リンクで送る ---------- */
  const b64e = (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const b64d = (s) => decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))));
  function makeCard(pid) {
    const p = profiles().find((x) => x.id === pid);
    if (!p) return null;
    const stamps = LS.of(pid, "stamps", {});
    const prog = LS.of(pid, "prog", {});
    return { v: 2, id: p.id, n: p.name, c: p.color, s: streakOf(pid), st: Object.keys(stamps), l: Object.keys(prog).length, p: window.Course ? Course.indexFor(pid) : 0, t: Date.now() };
  }
  const encodeCard = (card) => "FR1." + b64e(JSON.stringify(card));
  function decodeCard(code) {
    try {
      if (!/^FR1\.[A-Za-z0-9_-]+$/.test(code)) return null;
      const c = JSON.parse(b64d(code.slice(4)));
      if (!c || typeof c.n !== "string" || !Array.isArray(c.st)) return null;
      /* 時刻は ms。古い形式（YYYY-MM-DD）はその日の始まりとして扱う */
      const t = typeof c.t === "number" ? c.t : Date.parse(String(c.t).slice(0, 10)) || 0;
      return { v: 2, id: String(c.id).slice(0, 40), n: c.n.slice(0, 20), c: lineOf(c.c).id, s: Math.max(0, Math.min(9999, +c.s || 0)), st: c.st.filter((x) => typeof x === "string").slice(0, 40), l: Math.max(0, +c.l || 0), p: Math.max(0, Math.min(40, +c.p || 0)), t, cheer: c.cheer === 1 ? 1 : 0 };
    } catch (e) { return null; }
  }
  const family = () => raw.get("family", {});
  function addFamilyCard(card) {
    if (profiles().some((p) => p.id === card.id)) return "self";   /* 自分の端末にいる人のカードは取り込まない */
    const f = family();
    const tOf = (x) => (typeof x.t === "number" ? x.t : Date.parse(String(x.t)) || 0);
    if (f[card.id] && tOf(f[card.id]) > tOf(card)) return "old";   /* 古いリンクで新しい進み具合を巻き戻さない */
    f[card.id] = card; raw.set("family", f);
    return "ok";
  }
  function restoreFamilyCard(card) { const f = family(); f[card.id] = card; raw.set("family", f); }
  function removeFamilyCard(id) { const f = family(); delete f[id]; raw.set("family", f); }

  /* 同じファイルを 2 回読み込んでも数が倍にならない合わせ方: 回数は大きい方、記録は新しい方、集めた物は両方 */
  function mergeKey(k, a, b) {
    if (!a || typeof a !== "object") return b;
    if (!b || typeof b !== "object") return a;
    const out = Object.assign({}, a);
    for (const id in b) {
      if (k === "prefs") { if (!(id in out)) out[id] = b[id]; continue; }
      if (!(id in out)) { out[id] = b[id]; continue; }
      if (k === "log") { out[id] = Object.assign({}, out[id]); for (const f in b[id]) out[id][f] = Math.max(+out[id][f] || 0, +b[id][f] || 0); }
      else if (k === "srs") { if ((b[id][5] || 0) > (out[id][5] || 0)) out[id] = b[id]; }   /* [iv,ease,due,reps,lapses,last,st] の last で比べる */
      else if (k === "done" || k === "speak" || k === "weak") { if (Math.abs(+b[id]) > Math.abs(+out[id])) out[id] = b[id]; }
    }
    return out;
  }

  /* ---------- 書き出し / 読み込み（機種変更・別の端末へ） ---------- */
  function exportProfile(pid) {
    const p = profiles().find((x) => x.id === pid);
    const data = {};
    for (const k of KEYS) { const v = LS.of(pid, k, null); if (v != null) data[k] = v; }
    return { app: "paris-fr", v: 3, profile: p, trip: trip(), data, at: new Date().toISOString() };
  }
  /* 読み込む記録の形を先に全部確かめる。1 つでもおかしければ、何も書き込まない */
  const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
  const isNum = (v) => typeof v === "number" && Number.isFinite(v);
  const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
  const isTime = (v) => isNum(v) && v >= 0 && v < 8.64e15;
  const known = (kind) => {
    const D = window.DATA || {};
    if (kind === "phrase") return new Set((D.phrases || []).map((p) => p.id));
    if (kind === "listen") return new Set((D.listen || []).map((x) => x.id));
    if (kind === "dialog") return new Set((D.dialogs || []).map((x) => x.id));
    if (kind === "station") return new Set(window.Course ? Course.stations().map((s) => s.id) : []);
    if (kind === "lesson") return new Set(window.Course ? Course.stations().flatMap((s) => s.lessons.map((l) => l.id)) : []);
    return new Set();
  };
  const ids = (v, kind, valOk) => { const k = known(kind); return Object.entries(v).every(([id, x]) => k.has(id) && valOk(x)); };
  const CHECK = {
    srs: (v) => { const k = known("phrase"); return Object.entries(v).every(([id, a]) => /^[sh]:/.test(id) && k.has(id.slice(2)) && Array.isArray(a) && a.length === 7 && isInt(a[0], 0, 36500) && isNum(a[1]) && a[1] >= 1.3 && a[1] <= 5 && isTime(a[2]) && isInt(a[3], 0, 1e6) && isInt(a[4], 0, 1e6) && isTime(a[5]) && isInt(a[6], 0, 2)); },
    log: (v) => Object.entries(v).every(([d, x]) => /^\d{4}-\d{2}-\d{2}$/.test(d) && isObj(x) && Object.values(x).every((n) => isInt(n, 0, 1e6))),
    done: (v) => ids(v, "listen", (x) => isNum(x) && Math.abs(x) < 8.64e15),
    fav: (v) => ids(v, "phrase", isTime), prog: (v) => ids(v, "lesson", isTime), stamps: (v) => ids(v, "station", isTime),
    speak: (v) => Object.entries(v).every(([id, x]) => /^t:[0-9a-f]{8}$/.test(id) && isInt(x, 0, 100)), dlg: (v) => ids(v, "dialog", isTime),
    weak: (v) => ids(v, "phrase", isTime),
    resume: (v) => isObj(v) && Object.keys(v).length <= 8,
    famSeen: (v) => Object.values(v).every((x) => isInt(x, 0, 40)),
    prefs: (v) => Object.values(v).every((x) => ["string", "number", "boolean"].includes(typeof x) && String(x).length <= 200),
  };
  function validImport(obj) {
    if (!obj || obj.app !== "paris-fr" || !isObj(obj.profile) || !isObj(obj.data)) return "このアプリの書き出しファイルではありません";
    if (typeof obj.profile.id !== "string" || !/^[A-Za-z0-9_-]{1,40}$/.test(obj.profile.id)) return "人の情報が壊れています";
    for (const k of Object.keys(obj.data)) {
      if (!KEYS.includes(k)) continue;
      if (!isObj(obj.data[k]) || !CHECK[k](obj.data[k])) return `記録（${k}）の形が正しくありません`;
    }
    return null;
  }
  function importProfile(obj) {
    const bad = validImport(obj);
    if (bad) throw new Error(bad);
    const ps = profiles();
    let p = ps.find((x) => x.id === obj.profile.id);
    let created = false;
    if (!p) { p = { id: String(obj.profile.id), name: String(obj.profile.name || "家族").slice(0, 20), color: lineOf(obj.profile.color).id, created: Date.now() }; ps.push(p); created = true; if (!raw.set("profiles", ps)) throw new Error("端末に保存できませんでした"); }
    const before = {};
    for (const k of KEYS) before[k] = LS.of(p.id, k, null);
    let ok = true;
    for (const k of KEYS) {
      if (!(k in obj.data)) continue;
      const v = before[k] ? mergeKey(k, before[k], obj.data[k]) : obj.data[k];
      ok = raw.set("p:" + p.id + ":" + k, v) && ok;
    }
    if (!ok) {   /* 一部だけ書けた状態を残さない */
      for (const k of KEYS) raw.set("p:" + p.id + ":" + k, before[k]);
      if (created) raw.set("profiles", profiles().filter((x) => x.id !== p.id));   /* 新しく入れた人も取り消す */
      throw new Error("端末に保存できませんでした（空きが足りないかもしれません）");
    }
    if (obj.trip && !trip()) setTrip(obj.trip.start, obj.trip.days);
    removeFamilyCard(p.id);   /* カードで並んでいた人を端末に迎えたら、カードの方は外す（二重に並ばないように） */
    raw.set("cur", p.id);
    document.dispatchEvent(new CustomEvent("profile-changed"));
    return p;
  }

  /* ---------- 招待リンク・カードのリンクを読む（?trip=YYYY-MM-DD&days=4 / ?card=FR1.xxx） ---------- */
  function readLink() {
    const out = {};
    try {
      const q = new URLSearchParams(location.search);
      if (q.get("trip") && /^\d{4}-\d{2}-\d{2}$/.test(q.get("trip"))) { if (!trip()) setTrip(q.get("trip"), q.get("days")); out.trip = true; }
      if (q.get("card")) { const c = decodeCard(q.get("card")); if (c) out.card = c; }
      if (q.toString()) history.replaceState(null, "", location.pathname + location.hash);
    } catch (e) { console.warn("リンクを読めませんでした", e); }
    return out;
  }
  const baseUrl = () => location.origin + location.pathname;
  const inviteUrl = () => { const t = trip(); return baseUrl() + (t ? "?trip=" + t.start + "&days=" + t.days : ""); };
  const cardUrl = (pid, cheer) => { const c = makeCard(pid); if (c && cheer) c.cheer = 1; return c ? baseUrl() + "?card=" + encodeCard(c) : baseUrl(); };

  window.Store = { raw, LINES, lineOf, profiles, curId, cur, addProfile, updateProfile, removeProfile, switchTo, LS, prefs, setPrefs,
    trip, setTrip, today, dayNum, addDays, bumpLog, streakOf, makeCard, encodeCard, decodeCard, family, addFamilyCard, removeFamilyCard, restoreFamilyCard,
    exportProfile, importProfile, validImport, readLink, inviteUrl, cardUrl, KEYS };
})();
