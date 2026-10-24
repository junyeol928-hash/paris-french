/* SRS スケジューラ（SM-2 改、Anki 風）。純関数だけ。ブラウザと Node の両方で使う。
   カード状態: {iv:日数, ease:係数, due:ms, reps:回数, lapses:忘却回数, last:ms, st:"new"|"learn"|"rev"} */
(function (root) {
  const DAY = 86400000;
  const MIN = 60000;
  const EASE_MIN = 1.3;
  const EASE_START = 2.5;

  function fresh() {
    return { iv: 0, ease: EASE_START, due: 0, reps: 0, lapses: 0, last: 0, st: "new" };
  }

  /* grade: 1=again 2=hard 3=good 4=easy */
  function review(card, grade, now) {
    const c = Object.assign(fresh(), card || {});
    const t = now == null ? Date.now() : now;
    let ease = c.ease, iv = c.iv, st = c.st, lapses = c.lapses;
    if (st === "new" || st === "learn") {
      if (grade === 1) { iv = 0; st = "learn"; }
      else if (grade === 2) { iv = 0; st = "learn"; }
      else if (grade === 3) { iv = 1; st = "rev"; }
      else { iv = 4; st = "rev"; }
    } else {
      if (grade === 1) { lapses += 1; ease = Math.max(EASE_MIN, ease - 0.2); iv = 1; st = "learn"; }
      else if (grade === 2) { ease = Math.max(EASE_MIN, ease - 0.15); iv = Math.max(1, Math.round(iv * 1.2)); }
      else if (grade === 3) { iv = Math.max(iv + 1, Math.round(iv * ease)); }
      else { const good = Math.max(iv + 1, Math.round(iv * ease)); ease += 0.15; iv = Math.max(good + 1, Math.round(iv * ease * 1.3)); }   /* かんたんは必ず「言えた」より先 */
    }
    /* again / hard(学習中) は 10 分後。学習中の忘却は当日中に再度出す */
    const due = st === "learn" ? t + 10 * MIN : t + iv * DAY;
    return { iv, ease: Math.round(ease * 100) / 100, due, reps: c.reps + 1, lapses, last: t, st };
  }

  function isDue(card, now) {
    if (!card || card.st === "new") return false;
    return card.due <= (now == null ? Date.now() : now);
  }

  /* 次回の間隔を人間向けに（ボタンのラベル用） */
  function preview(card, grade, now) {
    const n = review(card, grade, now == null ? Date.now() : now);
    if (n.st === "learn") return "10分";
    if (n.iv < 30) return n.iv + "日";
    if (n.iv < 365) return (n.iv / 30).toFixed(1).replace(/\.0$/, "") + "か月";
    return (n.iv / 365).toFixed(1).replace(/\.0$/, "") + "年";
  }

  /* 今日の学習キューを組む。due のカード → 期限順、新規は上限まで。
     ids: 対象の語 id 配列（デッキ絞り込み済み）。state: id→card。 */
  function buildQueue(ids, state, opts) {
    const o = Object.assign({ now: Date.now(), newLimit: 20, newToday: 0, maxReview: 200 }, opts || {});
    const due = [], fresh_ = [];
    for (const id of ids) {
      const c = state[id];
      if (!c || c.st === "new") fresh_.push(id);
      else if (c.due <= o.now) due.push(id);
    }
    due.sort((a, b) => state[a].due - state[b].due);
    const room = Math.max(0, o.newLimit - o.newToday);
    return { due: due.slice(0, o.maxReview), fresh: fresh_.slice(0, room), dueTotal: due.length, freshTotal: fresh_.length };
  }

  /* 同期用の圧縮: {id:[iv,ease,due,reps,lapses,last,stIndex]} */
  const ST = ["new", "learn", "rev"];
  function pack(state) {
    const out = {};
    for (const id in state) {
      const c = state[id];
      if (!c || c.st === "new") continue;
      out[id] = [c.iv, c.ease, c.due, c.reps, c.lapses, c.last, ST.indexOf(c.st)];
    }
    return out;
  }
  function unpack(packed) {
    const out = {};
    for (const id in packed || {}) {
      const a = packed[id];
      if (!Array.isArray(a)) continue;
      out[id] = { iv: a[0], ease: a[1], due: a[2], reps: a[3], lapses: a[4], last: a[5], st: ST[a[6]] || "rev" };
    }
    return out;
  }

  const SRS = { fresh, review, isDue, preview, buildQueue, pack, unpack, DAY };
  if (typeof module !== "undefined" && module.exports) module.exports = SRS;
  else root.SRS = SRS;
})(typeof window !== "undefined" ? window : globalThis);
