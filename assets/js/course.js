/* コース（わたしの路線）: 駅＝場面。駅の中にレッスン（新しい表現 5〜6 個ずつ）と、最後に会話ロールプレイ。
   全部終えた駅にはスタンプが押される。終点は PARIS。
   記録（人ごと）: prog = {lessonId: 時刻}, stamps = {stationId: 時刻}, speak = {文の id: 最高点}, dlg = {会話 id: 時刻} */
(function () {
  const { LS } = Store;

  /* 旅の順に並べる。最初はあいさつと読み方、次に「わからないとき」、そのあと空港から旅の流れどおり */
  const DEF = [
    { id: "bonjour", fr: "BONJOUR", ja: "あいさつ", ph: (p) => p.s === "base" && p.id <= "b13" },
    { id: "lire", fr: "LIRE", ja: "読み方のきまり", rules: true },
    { id: "comprendre", fr: "COMPRENDRE", ja: "わからないとき", ph: (p) => p.s === "base" && p.id > "b13" },
    { id: "aeroport", fr: "AÉROPORT", ja: "空港・入国", ph: (p) => p.s === "air" },
    { id: "taxi", fr: "TAXI", ja: "タクシー", ph: (p) => p.s === "taxi", dlg: "g05" },
    { id: "hotel", fr: "HÔTEL", ja: "ホテル", ph: (p) => p.s === "hotel", dlg: "g04" },
    { id: "cafe", fr: "CAFÉ", ja: "カフェ・パン屋", ph: (p) => p.s === "cafe", dlg: "g01", dlg2: "g02" },
    { id: "metro", fr: "MÉTRO", ja: "メトロ・RER", ph: (p) => p.s === "metro", dlg: "g06" },
    { id: "musee", fr: "MUSÉE", ja: "美術館・観光", ph: (p) => p.s === "visite", dlg: "g07" },
    { id: "resto", fr: "RESTAURANT", ja: "レストラン", ph: (p) => p.s === "resto", dlg: "g03" },
    { id: "carte", fr: "LA CARTE", ja: "メニューの読み方", ph: (p) => p.s === "menu" },
    { id: "boutique", fr: "BOUTIQUE", ja: "買い物", ph: (p) => p.s === "shop" },
    { id: "urgence", fr: "URGENCE", ja: "困ったとき", ph: (p) => p.s === "urgence", dlg: "g08" },
  ];

  /* n 個を 5〜6 個ずつに分ける（最後が 3 個未満なら前に混ぜる） */
  function chunks(list, size) {
    const out = [];
    for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
    if (out.length > 1 && out[out.length - 1].length < 3) { const last = out.pop(); out[out.length - 1] = out[out.length - 1].concat(last); }
    return out;
  }

  let cache = null;
  function stations() {
    if (cache) return cache;
    cache = DEF.map((d, si) => {
      const lessons = [];
      if (d.rules) chunks(DATA.pron.map((r) => r.id), 6).forEach((ids, i) => lessons.push({ id: d.id + "-" + (i + 1), kind: "rules", ids }));
      else chunks(DATA.phrases.filter(d.ph).map((p) => p.id), 6).forEach((ids, i) => lessons.push({ id: d.id + "-" + (i + 1), kind: "learn", ids }));
      if (d.dlg) lessons.push({ id: d.id + "-dlg", kind: "dlg", dlg: d.dlg });
      const all = d.rules ? [] : DATA.phrases.filter(d.ph).map((p) => p.id);
      return Object.assign({}, d, { idx: si, num: si + 1, lessons, phraseIds: all });
    });
    cache.push({ id: "paris", fr: "PARIS", ja: "到着！", terminus: true, idx: cache.length, num: cache.length + 1, lessons: [], phraseIds: [] });
    return cache;
  }
  const station = (id) => stations().find((s) => s.id === id) || null;
  const stationOfLesson = (lid) => stations().find((s) => s.lessons.some((l) => l.id === lid)) || null;
  const lesson = (lid) => { const s = stationOfLesson(lid); return s ? s.lessons.find((l) => l.id === lid) : null; };

  /* 人ごとの状態 */
  const progOf = (pid) => (pid ? LS.of(pid, "prog", {}) : LS.get("prog", {}));
  const isDone = (lid, pid) => !!progOf(pid)[lid];
  const stationDone = (s, pid) => s.lessons.length > 0 && s.lessons.every((l) => isDone(l.id, pid));
  function indexFor(pid) {
    const st = stations();
    const i = st.findIndex((s) => !s.terminus && !stationDone(s, pid));
    return i < 0 ? st.length - 1 : i;
  }
  function current(pid) { return stations()[indexFor(pid)]; }
  function nextLesson(pid) {
    const s = current(pid);
    return s.terminus ? null : s.lessons.find((l) => !isDone(l.id, pid)) || null;
  }
  function stationProgress(s, pid) { const n = s.lessons.length; const d = s.lessons.filter((l) => isDone(l.id, pid)).length; return { d, n }; }

  /* レッスンを終えたとき: 記録・スタンプ・SRS へ */
  function completeLesson(lid, results) {
    const prog = LS.get("prog", {}); prog[lid] = Date.now(); LS.set("prog", prog);
    Store.bumpLog("lesson", 1);
    const l = lesson(lid);
    if (l && l.kind === "learn") {
      /* 新しく覚えた表現をカード（言う・聞く）に入れる。間違えたものは早めに出し直す */
      const p = LS.get("srs", {});
      const st = SRS.unpack(p);
      for (const id of l.ids) {
        const g = results && results[id] === false ? 2 : 3;
        for (const k of ["s:" + id, "h:" + id]) if (!st[k] || st[k].st === "new") p[k] = SRS.pack({ [k]: SRS.review(null, g, Date.now()) })[k];
      }
      LS.set("srs", p);
      Store.bumpLog("new", l.ids.length);
      updateWeak(results || {});
    }
    if (l && l.kind === "dlg") { const d = LS.get("dlg", {}); d[l.dlg] = Date.now(); LS.set("dlg", d); }
    const s = stationOfLesson(lid);
    let stamped = false;
    if (s && stationDone(s)) {
      const stamps = LS.get("stamps", {});
      if (!stamps[s.id]) { stamps[s.id] = Date.now(); LS.set("stamps", stamps); stamped = true; }
    }
    document.dispatchEvent(new CustomEvent("progress-changed"));
    return { station: s, stamped };
  }

  /* 苦手な表現: 確認問題で間違えたもの。あとで正解したら外す */
  function updateWeak(results) {
    const w = LS.get("weak", {});
    for (const id in results) { if (results[id] === false) w[id] = Date.now(); else if (results[id] === true && w[id]) delete w[id]; }
    LS.set("weak", w);
  }
  const weakIds = () => Object.keys(LS.get("weak", {})).filter((id) => App.phrase(id));
  function recordDrill(results) { updateWeak(results); Store.bumpLog("drill", 1); document.dispatchEvent(new CustomEvent("progress-changed")); }

  /* 旅の予行演習: 出発の 3 週間前から、しおりの日のうち「まだ予行演習していない日」を順に勧める */
  function rehearsal() {
    const t = Store.trip(); if (!t) return null;
    const left = Store.dayNum(t.start) - Store.dayNum(Store.today());
    if (left > 21 || left < 0) return null;
    const done = LS.get("log", {});
    const rec = Object.values(done).reduce((n, x) => n + (x.rehearse || 0), 0);
    const i = rec % DATA.days.length;
    const d = DATA.days[i];
    return { i, d, left, date: Store.addDays(t.start, i) };
  }

  function recordSpeak(text, pct) {
    const id = App.TTS.textId(text);
    const sp = LS.get("speak", {}); sp[id] = Math.max(sp[id] || 0, pct); LS.set("speak", sp);
    Store.bumpLog("spk", 1);
  }

  /* 今日の切符: 1) レッスン 1 つ 2) 復習カード 3) 聞き取り 5 問 */
  function reviewPlan() {
    const st = SRS.unpack(LS.get("srs", {}));
    const ids = Object.keys(st);
    return SRS.buildQueue(ids, st, { newLimit: 0 });
  }
  /* 今日の 3 つ: 1) レッスン 2) 復習カード 3) 旅が近ければ予行演習、苦手な表現が 3 つ以上あればその練習、どちらも無ければ聞き取り */
  function ticket() {
    const log = LS.get("log", {})[Store.today()] || {};
    const plan = reviewPlan();
    const weak = weakIds();
    const reh = rehearsal();
    const third = reh ? { k: "rehearse", done: (log.rehearse || 0) >= 1, t: `予行演習: ${reh.d.short || reh.d.ja}の日`, s: `出発まで ${reh.left} 日 · ${reh.date.slice(5).replace("-", "/")} に使う表現`, reh }
      : weak.length >= 3 ? { k: "weak", done: (log.drill || 0) >= 1, t: `苦手な表現 ${weak.length} つ`, s: "間違えた表現をもう一度" }
      : { k: "listen", done: (log.q || 0) >= 5, t: "聞き取り 5 問", s: `今日 ${Math.min(log.q || 0, 99)} 問` };
    const legs = [
      { k: "lesson", done: (log.lesson || 0) >= 1, t: "レッスン 1 つ", s: "次の駅へ進む" },
      { k: "review", done: plan.dueTotal === 0 && (log.rev || 0) > 0, none: plan.dueTotal === 0 && !(log.rev || 0), t: plan.dueTotal ? `復習カード ${plan.dueTotal} 枚` : "復習カード", s: plan.dueTotal ? "忘れかけた表現" : (log.rev ? "今日のぶんは済み" : "今日はありません") },
      third,
    ];
    const n = legs.filter((l) => l.done || l.none).length;
    return { legs, done: n, total: legs.length, plan };
  }

  /* 覚えた表現の数（カードで 1 回以上やったもの） */
  function learnedCount(pid) {
    const p = pid ? LS.of(pid, "srs", {}) : LS.get("srs", {});
    return new Set(Object.keys(p).map((k) => k.slice(2))).size;
  }

  window.Course = { weakIds, recordDrill, rehearsal, stations, station, lesson, stationOfLesson, isDone, stationDone, indexFor, current, nextLesson, stationProgress, completeLesson, recordSpeak, ticket, reviewPlan, learnedCount };
})();
