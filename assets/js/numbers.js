/* フランス語の数（0〜100）。純関数。ブラウザと Node（tools/gen-audio.py・テスト）で共用。
   70〜99 は 60+10〜、4×20+〜 と数えるので、聞き間違えやすい相手を選択肢に混ぜる */
(function (root) {
  const U = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix",
    "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
  const UK = ["ゼロ", "アン", "ドゥ", "トロワ", "キャトル", "サンク", "スィス", "セット", "ユイット", "ヌフ", "ディス",
    "オンズ", "ドゥーズ", "トレーズ", "カトルズ", "カンズ", "セーズ", "ディセット", "ディズュイット", "ディズヌフ"];
  const T = { 2: "vingt", 3: "trente", 4: "quarante", 5: "cinquante", 6: "soixante" };
  const TK = { 2: "ヴァン", 3: "トラント", 4: "カラント", 5: "サンカント", 6: "ソワサント" };
  /* 「〜 et un」「〜-deux」の前での読み（vingt の t が出る） */
  const TKL = { 2: "ヴァンテ", 3: "トランテ", 4: "カランテ", 5: "サンカンテ", 6: "ソワサンテ" };
  const TKH = { 2: "ヴァント", 3: "トラント", 4: "カラント", 5: "サンカント", 6: "ソワサント" };

  function fr(n) {
    if (n < 0 || n > 100 || n !== Math.floor(n)) throw new RangeError("0〜100: " + n);
    if (n < 20) return U[n];
    if (n === 100) return "cent";
    if (n === 80) return "quatre-vingts";
    if (n > 80) return "quatre-vingt-" + U[n - 80];
    const t = Math.floor(n / 10), u = n % 10;
    if (t === 7) return n === 71 ? "soixante et onze" : "soixante-" + U[n - 60];
    if (u === 0) return T[t];
    if (u === 1) return T[t] + " et un";
    return T[t] + "-" + U[u];
  }
  function kana(n) {
    if (n < 20) return UK[n];
    if (n === 100) return "サン";
    if (n >= 80) return "キャトルヴァン" + (n === 80 ? "" : n === 81 ? "アン" : UK[n - 80]);
    const t = Math.floor(n / 10), u = n % 10;
    if (t === 7) return n === 71 ? "ソワサンテオンズ" : "ソワサント" + UK[n - 60];
    if (u === 0) return TK[t];
    if (u === 1) return TKL[t] + "アン";
    return TKH[t] + UK[u];
  }
  /* 正解 + 紛らわしい 3 つ。rand は 0〜1 の乱数関数（テストで固定できるように） */
  function choices(n, rand) {
    const r = rand || Math.random;
    const cand = new Set();
    const add = (x) => { if (x >= 0 && x <= 100 && x !== n) cand.add(x); };
    const t = Math.floor(n / 10), u = n % 10;
    add(n + 10); add(n - 10);
    if (n >= 60 && n < 80) { add(n + 20); add(n - 20); add(60 + u); add(10 + u); }   /* soixante-seize ↔ 76 / 66 / 16 */
    if (n >= 80) { add(n - 80); add(n - 20); add(4 * 10 + u); }                        /* quatre-vingt-… ↔ 4… */
    if (n > 10 && n < 20) { add(n + 30); add(n - 10 + 40); }                             /* quatorze ↔ quarante */
    if (t && u) add(u * 10 + t);                                                          /* 数字の入れ替え */
    add(n + 1); add(n - 1); add(n + 2);
    const pool = [...cand];
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    return [n].concat(pool.slice(0, 3));
  }
  const NUM = { fr, kana, choices };
  if (typeof module !== "undefined" && module.exports) module.exports = NUM;
  else root.NUM = NUM;
})(typeof window !== "undefined" ? window : globalThis);
