/* 発音チェック: ブラウザの音声認識（fr-FR）で聞き取り、お手本と単語単位で比べて点数にする。
   Chrome（Android・PC）と iOS の Safari で使える。使えない端末ではボタン自体を出さない（Speech.supported()）。
   点数の付け方（score）は純関数。Node のテストでも使う */
(function (root) {
  const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[’']/g, " ").replace(/[^a-z0-9\s-]/g, " ").replace(/-/g, " ").replace(/\s+/g, " ").trim();
  const words = (s) => (norm(s) ? norm(s).split(" ") : []);

  /* お手本の単語のうち、聞き取れた単語を順番を保って数える（最長共通部分列）。0〜100 */
  function score(target, heard) {
    const a = words(target), b = words(heard);
    if (!a.length) return { pct: 0, hit: [] };
    const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    const hit = new Array(a.length).fill(false);
    for (let i = 0, j = 0; i < a.length && j < b.length;) {
      if (a[i] === b[j]) { hit[i] = true; i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) i++; else j++;
    }
    /* 余計な言葉が多すぎるときは少し下げる */
    const extra = Math.max(0, b.length - a.length - 1);
    const pct = Math.max(0, Math.round((dp[0][0] / a.length) * 100 - extra * 5));
    return { pct, hit, words: a };
  }
  function best(target, alts) { return alts.map((h) => Object.assign(score(target, h), { heard: h })).sort((x, y) => y.pct - x.pct)[0] || { pct: 0, hit: [], heard: "" }; }

  const Rec = typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
  let rec = null;
  function supported() { return !!Rec && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1"); }
  function stop() { if (rec) { try { rec.abort(); } catch (e) {} rec = null; } }

  /* 1 回聞く。onResult({pct, hit, words, heard}) / onError(message) */
  function listen(target, onResult, onError) {
    stop();
    const r = new Rec();
    rec = r;
    r.lang = "fr-FR"; r.interimResults = false; r.maxAlternatives = 5; r.continuous = false;
    let done = false;
    r.onresult = (e) => {
      done = true;
      const alts = []; for (let i = 0; i < e.results[0].length; i++) alts.push(e.results[0][i].transcript);
      onResult(best(target, alts));
    };
    r.onerror = (e) => {
      done = true;
      const m = { "not-allowed": "マイクが許可されていません。ブラウザの設定でマイクを許可してください", "no-speech": "声が聞こえませんでした。もう一度どうぞ", "audio-capture": "マイクが見つかりません", network: "音声認識にはインターネット接続が必要です" }[e.error];
      onError(m || "聞き取れませんでした（" + e.error + "）");
    };
    r.onend = () => { if (!done) onError("声が聞こえませんでした。もう一度どうぞ"); if (rec === r) rec = null; };
    try { r.start(); } catch (e) { onError("音声認識を始められませんでした"); }
  }

  /* 音声認識が聞き取れた単語の割合。「通じる」とは言い切らない（認識の得意・不得意もあるので） */
  const verdict = (pct) => (pct >= 85 ? { k: "great", t: "よく聞き取れました" } : pct >= 60 ? { k: "ok", t: "だいたい聞き取れました" } : { k: "retry", t: "お手本を聞いて、もう一度" });

  /* フレーズの横の「話す」から開く小さなシート */
  function check(target) {
    const { el, esc, button, icon, sheet, sayBtn, sfx, haptic } = window.App;
    sheet("発音チェック", (body) => {
      body.appendChild(el("p", "chk-fr fr", esc(target)));
      if (!navigator.onLine) body.appendChild(el("p", "warn", "発音チェックはインターネットにつながっているときだけ使えます"));
      const row = el("div", "row center"); row.appendChild(sayBtn(target, { label: "お手本" })); row.appendChild(sayBtn(target, { slow: true }));
      body.appendChild(row);
      const out = el("div", "chk-out", '<p class="muted">マイクのボタンを押して、フランス語で言ってみてください。</p>');
      const mic = button("micbig", icon("mic") + "<span>話す</span>", () => {
        mic.classList.add("rec"); mic.querySelector("span").textContent = "聞いています…";
        out.innerHTML = '<p class="muted">どうぞ</p>';
        listen(target, (r) => {
          mic.classList.remove("rec"); mic.querySelector("span").textContent = "もう一度話す";
          const v = verdict(r.pct);
          out.innerHTML = `<div class="chk-score ${v.k}"><b>${r.pct}</b><span>点</span></div><p class="chk-v">${v.t}</p>` +
            `<p class="chk-words">${r.words.map((w, i) => `<span class="${r.hit[i] ? "hit" : "miss"}">${esc(w)}</span>`).join(" ")}</p>` +
            `<p class="muted small">聞き取った言葉: ${esc(r.heard || "（なし）")}</p>`;
          (r.pct >= 60 ? sfx.ok : sfx.ng)(); haptic(r.pct >= 60 ? 12 : 30);
          if (window.Course) Course.recordSpeak(target, r.pct);
        }, (msg) => { mic.classList.remove("rec"); mic.querySelector("span").textContent = "話す"; out.innerHTML = `<p class="warn">${esc(msg)}</p>`; });
      });
      body.appendChild(mic);
      body.appendChild(out);
    }, { cls: "chk", onClose: stop });
  }

  root.Speech = { supported, listen, stop, check, score, best, verdict, norm };
  if (typeof module !== "undefined" && module.exports) module.exports = { score, best, verdict, norm };
})(typeof window !== "undefined" ? window : globalThis);
