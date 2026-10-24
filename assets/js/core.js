/* 共通部品: DOM・アイコン・読み上げ・効果音と振動・タブ・下から出るシート・全画面のステージ・見せる画面 */
window.DATA = window.DATA || {};
(function () {
  const { LS, prefs } = Store;

  /* ---------- DOM ---------- */
  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  /* フランス語の約物: ? ! : ; » の前と « の後は、改行されない細い空白（日本語の文にはこの形は出てこない） */
  const frTypo = (s) => s.replace(/ ([?!;:»])/g, " $1").replace(/« /g, "« ").replace(/([A-Za-zÀ-ÿ])'([A-Za-zÀ-ÿ])/g, "$1’$2");
  function esc(s) { return frTypo(String(s == null ? "" : s)).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  /* 路線色の上の文字色: 明るい色（黄・橙）には濃紺、それ以外は白 */
  function onColor(hex) { const n = parseInt(String(hex).replace("#", ""), 16); const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#14213D" : "#FFFFFF"; }
  const avStyle = (c) => `--c:${c};--oc:${onColor(c)}`;
  /* 色の明るさとコントラスト比（WCAG） */
  const rgb = (hex) => { const n = parseInt(String(hex).replace("#", ""), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const lum = (c) => { const v = rgb(c).map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const mix = (a, b, t) => "#" + rgb(a).map((x, i) => Math.round(x + (rgb(b)[i] - x) * t).toString(16).padStart(2, "0")).join("");
  /* 路線色を文字に使うときの色: 地の色に対して 4.5:1 を超えるまで、ライトでは濃紺側へ、ダークでは白側へ寄せる */
  function inkOn(c, ground, toward) { let t = 0, out = c; while (contrast(out, ground) < 4.6 && t < 1) { t += 0.05; out = mix(c, toward, t); } return out; }
  /* 名前の頭文字。家族に同じ頭文字の人がいれば 2 文字（Junyeol と Junha → Jn と Jh） */
  function initials(name, others) {
    const n = String(name || "?").trim();
    /* かな・漢字の名前は 2 字まで（1 字だと「マ」のように何の印か分かりにくい） */
    if (/^[\u3040-\u30ff\u3400-\u9fff]/.test(n)) return n.slice(0, 2);
    const first = n.slice(0, 1);
    const clash = (others || []).some((o) => o !== name && String(o).trim().slice(0, 1).toLowerCase() === first.toLowerCase());
    if (!clash) return first;
    if (/^[A-Za-z]/.test(n)) { const cons = n.slice(1).replace(/[aeiouAEIOU\s]/g, ""); const own = cons.split("").find((ch) => !(others || []).some((o) => o !== name && String(o).slice(1).toLowerCase().replace(/[aeiou\s]/g, "").startsWith(ch.toLowerCase()))); return first.toUpperCase() + (own || cons.slice(0, 1) || n.slice(1, 2)).toLowerCase(); }
    return n.slice(0, 2);
  }
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const $ = (id) => document.getElementById(id);
  function button(cls, html, onClick, label) {
    const b = el("button", cls, html); b.type = "button";
    if (label) b.setAttribute("aria-label", label);
    if (onClick) b.addEventListener("click", onClick);
    return b;
  }
  const reduced = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 線のアイコン（24×24、currentColor） ---------- */
  const IC = {
    say: "M4 9h4l5-4v14l-5-4H4zM16.5 9a4 4 0 010 6M19 6.5a7.5 7.5 0 010 11",
    slow: "M4 9h4l5-4v14l-5-4H4zM17 12h4",
    mic: "M12 15a3 3 0 003-3V6a3 3 0 00-6 0v6a3 3 0 003 3zM5 11a7 7 0 0014 0M12 18v3",
    star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z",
    show: "M7 3h10v18H7zM10.5 18h3M3 9l2 3-2 3M21 9l-2 3 2 3",
    arrow: "M5 12h14M13 6l6 6-6 6",
    back: "M19 12H5M11 6l-6 6 6 6",
    close: "M6 6l12 12M18 6L6 18",
    check: "M5 12.5l4.5 4.5L19 7",
    list: "M5 6h14M5 12h14M5 18h9",
    cards: "M4 7h16v11H4zM4 11h16",
    book: "M8 4h11v16H8zM5 6v14h11",
    family: "M9 11a3 3 0 100-6 3 3 0 000 6zM3 20a6 6 0 0112 0M17 11a3 3 0 100-6M21 20a6 6 0 00-4-5.6",
    chat: "M4 5h16v11H9l-5 4z",
    ear: "M7 10a5 5 0 1110 0c0 3-3 4-3 7a3 3 0 01-6 0M10 10a2 2 0 114 0",
    hash: "M5 9h14M5 15h14M10 4L8 20M16 4l-2 16",
    abc: "M4 18l4-12 4 12M5.5 14h5M14 6h4a3 3 0 010 6h-4zM14 12h4.5a3 3 0 010 6H14z",
    share: "M12 15V3M8 7l4-4 4 4M5 13v6h14v-6",
    plus: "M12 5v14M5 12h14",
    gear: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z",
    sos: "M12 8v5M12 16.5v.5M10.3 3.9L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z",
    pin: "M12 21s7-6.2 7-12a7 7 0 10-14 0c0 5.8 7 12 7 12zM12 11.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
    download: "M12 3v12M8 11l4 4 4-4M5 21h14",
    upload: "M12 15V3M8 7l4-4 4 4M5 21h14",
    swap: "M7 7h13M16 3l4 4-4 4M17 17H4M8 13l-4 4 4 4",
    search: "M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4",
    phone: "M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a1 1 0 01-1 1A16 16 0 014 5a1 1 0 011-1z",
    aa: "M3 18l4-11 4 11M4.5 14h5M14 18l3-7 3 7M15 16h4",
    line: "M3.5 6a2.5 2.5 0 105 0 2.5 2.5 0 10-5 0M15.5 18a2.5 2.5 0 105 0 2.5 2.5 0 10-5 0M6 8.5V10a4 4 0 004 4h4a4 4 0 014 1.5",
    redo: "M4 12a8 8 0 0114-5.3M20 4v4h-4M20 12a8 8 0 01-14 5.3M4 20v-4h4",
  };
  const icon = (n, cls) => `<svg class="ic${cls ? " " + cls : ""}" viewBox="0 0 24 24" aria-hidden="true"><path d="${IC[n]}"/></svg>`;

  /* ---------- トースト ---------- */
  let toastT = null;
  function toast(msg, action) {
    let t = $("toast");
    if (!t) { t = el("div", "toast"); t.id = "toast"; t.setAttribute("role", "status"); t.setAttribute("aria-live", "polite"); document.body.appendChild(t); }
    t.innerHTML = ""; t.appendChild(el("span", null, esc(msg)));
    if (action) t.appendChild(button("toast-act", esc(action.label), () => { clearTimeout(toastT); t.classList.remove("on"); action.run(); }));
    t.classList.add("on");
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), action ? 5500 : 2600);
  }

  /* ---------- 効果音（WebAudio で作る。音源ファイルなし）と振動 ---------- */
  let ac = null;
  function tone(seq) {
    if (!prefs().sound) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const t0 = ac.currentTime + 0.02;
      for (const [f, at, dur, vol] of seq) {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0, t0 + at);
        g.gain.linearRampToValueAtTime(vol || 0.12, t0 + at + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + dur);
        o.connect(g).connect(ac.destination); o.start(t0 + at); o.stop(t0 + at + dur + 0.05);
      }
    } catch (e) { /* 音が出せない端末では鳴らさない */ }
  }
  /* パリのメトロの発車チャイムを思わせる 3 音（上がって下がる） */
  const sfx = {
    ok: () => tone([[880, 0, 0.18], [1318.5, 0.09, 0.28]]),
    ng: () => tone([[330, 0, 0.22, 0.08]]),
    chime: () => tone([[659.3, 0, 0.5], [880, 0.22, 0.5], [740, 0.44, 0.8]]),
    stamp: () => tone([[180, 0, 0.12, 0.25], [90, 0.01, 0.2, 0.2]]),
  };
  /* 振動は、利用者が一度でも画面に触れたあとだけ（触れる前に呼ぶとブラウザが拒否してエラーを出す） */
  function haptic(ms) { try { if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(ms || 12); } catch (e) { /* 対応していない端末 */ } }

  /* ---------- 読み上げ ----------
     生成済みの音声（data/audio.js の DATA.audio: "t:<fnv>" → MP3 の data URI。edge-tts の fr-FR neural）を優先し、
     無い文だけ端末のフランス語の声で読む。日本語の声で読ませるとカタカナ読みになるので、fr-* の声だけを使う */
  const TTS = (function () {
    const synth = window.speechSynthesis;
    let voices = [];
    function load() { if (synth) voices = synth.getVoices().filter((v) => v.lang && /^fr[-_]/i.test(v.lang)); }
    if (synth) { load(); synth.onvoiceschanged = load; setTimeout(load, 400); }
    const quality = (v) => (/online|natural|neural|premium|enhanced/i.test(v.name) ? 3 : /google/i.test(v.name) ? 2 : 1);
    function pickVoice() { if (!voices.length) load(); const fr = voices.filter((v) => /^fr[-_]fr/i.test(v.lang)); return (fr.length ? fr : voices).slice().sort((a, b) => quality(b) - quality(a))[0] || null; }
    function textId(text) { let h = 0x811C9DC5; for (const ch of String(text).trim()) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; } return "t:" + h.toString(16).padStart(8, "0"); }
    const audioOf = (text) => (DATA.audio && DATA.audio[textId(text)]) || null;
    let gen = 0, audioEl = null, onEnd = null, playing = null;
    function finish(c) { playing = null; document.dispatchEvent(new CustomEvent("tts-state")); if (onEnd) { const f = onEnd; onEnd = null; f(c); } }
    function stop() { gen++; if (audioEl) { const a = audioEl; audioEl = null; a.onended = a.onerror = null; try { a.pause(); } catch (e) {} } if (synth) synth.cancel(); finish(true); }
    function speak(texts, opts) {
      stop();
      const o = Object.assign({ rate: prefs().rate }, opts || {});
      const q = (Array.isArray(texts) ? texts : [texts]).filter(Boolean);
      onEnd = o.onEnd || null;
      const my = gen;
      const next = () => {
        if (my !== gen) return;
        if (!q.length) { finish(false); return; }
        const t = q.shift();
        playing = t; document.dispatchEvent(new CustomEvent("tts-state"));
        const src = audioOf(t);
        if (src) {
          const a = new Audio(src); audioEl = a; a.playbackRate = o.rate; a.preservesPitch = true;
          a.onended = () => { if (my === gen) { audioEl = null; setTimeout(next, 220); } };
          a.onerror = () => { if (my === gen) { audioEl = null; utter(t); } };
          const p = a.play(); if (p && p.catch) p.catch(() => { if (my === gen) { audioEl = null; utter(t); } });
          return;
        }
        utter(t);
      };
      const utter = (t) => {
        if (!synth) { setTimeout(next, 50); return; }
        const u = new SpeechSynthesisUtterance(t); const v = pickVoice();
        if (v) u.voice = v; u.lang = v ? v.lang : "fr-FR"; u.rate = o.rate;
        u.onend = () => setTimeout(next, 220); u.onerror = () => setTimeout(next, 50);
        synth.speak(u);
      };
      next();
    }
    return { speak, stop, textId, playing: () => playing, hasAudio: (t) => !!audioOf(t), canSpeak: () => !!(synth || DATA.audio) };
  })();

  /* 読み上げボタン。再生中は波打つ */
  function sayBtn(text, opts) {
    const o = opts || {};
    const slow = !!o.slow;
    const b = button("say" + (slow ? " slow" : o.label ? "" : " round") + (o.cls ? " " + o.cls : ""),
      slow ? icon("slow") + "<span>ゆっくり</span>" : o.label ? icon("say") + "<span>" + esc(o.label) + "</span>" : icon("say"),
      (e) => { e.stopPropagation(); TTS.speak(text, slow ? { rate: 0.7 } : null); }, (slow ? "ゆっくり読む: " : "読む: ") + text);
    b.dataset.text = text;
    return b;
  }
  document.addEventListener("tts-state", () => {
    const t = TTS.playing();
    document.querySelectorAll(".say").forEach((b) => b.classList.toggle("playing", !!t && b.dataset.text === t));
  });

  /* ---------- お気に入り（★。しおりの「自分用」に集まる） ---------- */
  const isFav = (id) => !!LS.get("fav", {})[id];
  function favBtn(id) {
    const b = button("fav", icon("star"), (e) => {
      e.stopPropagation();
      const f = LS.get("fav", {}); if (f[id]) delete f[id]; else f[id] = Date.now(); LS.set("fav", f);
      draw(); haptic(8); toast(f[id] ? "しおりの「保存した表現」に入れました" : "「保存した表現」から外しました");
    });
    const draw = () => { const on = isFav(id); b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); b.setAttribute("aria-label", on ? "自分用から外す" : "自分用に入れる"); };
    draw();
    return b;
  }

  /* ---------- データの引き当て ---------- */
  let byId = null;
  function phrase(id) { if (!byId) { byId = {}; for (const p of DATA.phrases || []) byId[p.id] = p; } return byId[id] || null; }
  const scene = (id) => (DATA.scenes || []).find((s) => s.id === id) || null;

  /* フレーズ 1 枚。opts.show: 「見せる」ボタン、opts.compact: しおり用（右に大きな「見せる」） */
  function phraseRow(p, opts) {
    const o = opts || {};
    const li = el("li", "ph" + (o.compact ? " compact" : ""));
    const body = el("div", "ph-b");
    const top = el("div", "ph-top");
    top.appendChild(el("p", "fr", esc(p.fr)));
    if (!o.compact) top.appendChild(favBtn(p.id));
    body.appendChild(top);
    body.appendChild(el("p", "kana", esc(p.kana)));
    body.appendChild(el("p", "ja", esc(p.ja)));
    if (p.n && !o.compact) body.appendChild(el("p", "note", esc(p.n)));
    li.appendChild(body);
    const act = el("div", "ph-act");
    if (o.compact) { act.appendChild(sayBtn(p.fr)); act.appendChild(button("showtile", icon("show") + "<span>見せる</span>", () => show(p.fr, p.ja, p.kana))); }
    else {
      const tool = (ic, label, fn, aria) => button("tool", icon(ic) + `<span>${label}</span>`, fn, aria);
      const say = tool("say", "聞く", (e) => { e.stopPropagation(); TTS.speak(p.fr); }, "読む: " + p.fr); say.classList.add("say"); say.dataset.text = p.fr;
      act.appendChild(say);
      act.appendChild(tool("slow", "ゆっくり", () => TTS.speak(p.fr, { rate: 0.7 }), "ゆっくり読む: " + p.fr));
      if (window.Speech && Speech.supported()) act.appendChild(tool("mic", "話す", () => Speech.check(p.fr), "発音をチェック: " + p.fr));
      act.appendChild(tool("show", "見せる", () => show(p.fr, p.ja, p.kana), "店員さんに見せる: " + p.fr));
    }
    (o.compact ? li : body).appendChild(act);
    return li;
  }

  /* ---------- タブ ---------- */
  const TAB_HOOKS = {};
  let curTab = null;
  function onTab(id, fn) { TAB_HOOKS[id] = fn; }
  function goTab(id, arg) {
    if (curTab !== id) TTS.stop();
    curTab = id;
    document.querySelectorAll("#tabbar [role=tab]").forEach((b) => {
      const on = b.dataset.tab === id;
      b.setAttribute("aria-selected", on ? "true" : "false");
      b.tabIndex = on ? 0 : -1;
      const p = $("v-" + b.dataset.tab); if (p) p.hidden = !on;
    });
    LS.set("tab", id);
    if (TAB_HOOKS[id]) TAB_HOOKS[id](arg);
    window.scrollTo({ top: 0 });
  }
  const currentTab = () => curTab;
  function initTabs() {
    const tabs = [...document.querySelectorAll("#tabbar [role=tab]")];
    tabs.forEach((b, i) => {
      b.addEventListener("click", () => goTab(b.dataset.tab));
      b.addEventListener("keydown", (e) => {   /* 矢印キーでタブを移動（WAI-ARIA の作法） */
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        const n = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length]; n.focus(); goTab(n.dataset.tab);
      });
    });
    document.addEventListener("click", (e) => { const a = e.target.closest("[data-go]"); if (a) { e.preventDefault(); goTab(a.dataset.go, a.dataset.arg); } });
  }

  /* ---------- モーダル（シート・ステージ共通）: 背景を操作できなくし、フォーカスを中に閉じ込める ---------- */
  const modals = [];
  function setInert() {
    const top = modals[modals.length - 1];
    for (const n of document.body.children) {
      if (n.tagName === "SCRIPT" || n.id === "toast") continue;
      const isTop = top && (n === top.el || (top.extra && top.extra.includes(n)));
      if (top && !isTop) n.setAttribute("inert", ""); else n.removeAttribute("inert");
    }
  }
  function modal(node, onEsc, extra) {
    const prev = document.activeElement;
    const m = { el: node, extra, onEsc };
    modals.push(m); setInert();
    return () => {
      const i = modals.indexOf(m); if (i >= 0) modals.splice(i, 1);
      setInert();
      if (prev && prev.isConnected && prev.focus) prev.focus({ preventScroll: true });
    };
  }
  document.addEventListener("keydown", (e) => {
    const top = modals[modals.length - 1]; if (!top) return;
    if (e.key === "Escape" && top.onEsc) { e.preventDefault(); top.onEsc(); return; }
    if (e.key !== "Tab") return;
    const f = [...top.el.querySelectorAll('button:not([disabled]),[href],input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])')].filter((x) => x.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (!top.el.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ---------- 下から出るシート ---------- */
  function sheet(title, build, opts) {
    const o = opts || {};
    const back = el("div", "sheet-back");
    const s = el("div", "sheet" + (o.cls ? " " + o.cls : ""));
    s.setAttribute("role", "dialog"); s.setAttribute("aria-modal", "true"); s.setAttribute("aria-label", title);
    const hd = el("div", "sheet-hd");
    hd.appendChild(el("h2", null, esc(title)));
    let release = null, closed = false;
    const close = () => { if (closed) return; closed = true; s.classList.remove("on"); back.classList.remove("on"); setTimeout(() => { back.remove(); s.remove(); }, reduced() ? 0 : 260); if (release) release(); if (o.onClose) o.onClose(); };
    hd.appendChild(button("icon-btn", icon("close"), close, "閉じる"));
    s.appendChild(hd);
    const body = el("div", "sheet-b"); s.appendChild(body);
    build(body, close);
    back.addEventListener("click", close);
    document.body.append(back, s);
    release = modal(s, close, [back]);
    /* 開いたらタイトルにフォーカス（読み上げソフトが何のシートか読む。最初のボタンに輪が出ない） */
    requestAnimationFrame(() => { back.classList.add("on"); s.classList.add("on"); const h = hd.querySelector("h2"); h.tabIndex = -1; h.focus({ preventScroll: true }); });
    return close;
  }

  /* ---------- 全画面のステージ（レッスン・会話・復習）。開くときは駅の扉が開く ---------- */
  let stageClose = null, chained = false;
  function stage(build, opts) {
    const o = opts || {};
    /* 開いているステージから続けて開く（結果画面の「次へ」「もう 10 問」）ときは、履歴を戻さずに使い回す。
       戻すと、その popstate を新しいステージが受け取ってすぐ閉じてしまう */
    if (stageClose) stageClose(true, true);
    const st = el("div", "stage"); st.setAttribute("role", "dialog"); st.setAttribute("aria-modal", "true"); st.setAttribute("aria-label", o.label || "練習");
    const doors = el("div", "doors", '<span class="door l"></span><span class="door r"></span>');
    const inner = el("div", "stage-in");
    st.append(inner, doors);
    let release = null, closed = false, byPop = false, unwinding = false;
    const close = (silent, chain) => {
      if (closed) return; closed = true;
      TTS.stop(); if (window.Speech) Speech.stop();
      st.classList.add("out"); stageClose = null;
      setTimeout(() => st.remove(), reduced() ? 0 : 280);
      document.documentElement.classList.remove("staged");
      /* ×で閉じたときは、開くときに積んだ履歴を 1 つ戻す。その popstate はこのステージの onPop が受けて捨てる */
      if (chain && !byPop) { chained = true; window.removeEventListener("popstate", onPop); }
      else if (!byPop && history.state && history.state.stage === token) { unwinding = true; history.back(); }
      else window.removeEventListener("popstate", onPop);
      if (release) release();
      st.dispatchEvent(new CustomEvent("stage-closed"));
      if (!silent && o.onClose) o.onClose();
    };
    /* スマホの「戻る」（ブラウザの戻る・Android の戻る操作）でステージを閉じる */
    const token = Date.now() + Math.random();
    const onPop = () => {
      window.removeEventListener("popstate", onPop);
      if (unwinding) { unwinding = false; return; }
      byPop = true; close();
    };
    stageClose = close;
    document.body.appendChild(st);
    document.documentElement.classList.add("staged");
    try {
      if (chained && history.state && history.state.stage) history.replaceState({ stage: token }, ""); else history.pushState({ stage: token }, "");
      chained = false;
      window.addEventListener("popstate", onPop);
    } catch (e) { /* 履歴が使えない環境では戻る操作に対応しない */ }
    release = modal(st, () => close());
    build(inner, close);
    /* 開いたら見出しにフォーカス（読み上げソフトが何の画面か読む） */
    setTimeout(() => { if (closed) return; const h = inner.querySelector("h1,h2,[data-focus]"); const f = h || inner.querySelector(".btn,button"); if (!f) return; if (h && !h.hasAttribute("tabindex")) h.setAttribute("tabindex", "-1"); f.focus({ preventScroll: true }); }, reduced() ? 0 : 750);
    requestAnimationFrame(() => { st.classList.add("on"); if (!reduced()) setTimeout(() => doors.classList.add("open"), 60); else doors.remove(); });
    setTimeout(() => { if (doors.isConnected) doors.remove(); }, 1400);
    return close;
  }

  /* ---------- 見せる画面（店員さんに画面を向ける） ---------- */
  let wake = null;
  function show(fr, ja, kana, o2) {
    const lead = o2 && o2.lead;
    stage((root, close) => {
      root.classList.add("showpane");
      const bar = el("div", "stage-bar");
      bar.appendChild(button("icon-btn", icon("close"), () => close(), "閉じる"));
      root.appendChild(bar);
      bar.appendChild(el("p", "show-tip", "画面を相手に向けてください"));
      const box = el("div", "show-box enamel");
      if (lead) box.appendChild(el("p", "show-lead", esc(lead)));
      const big = el("p", "show-fr" + (lead ? " addr" : ""), esc(fr)); big.setAttribute("data-head", ""); box.appendChild(big);
      root.appendChild(box);
      const act = el("div", "show-act");
      if (kana || ja) act.appendChild(el("div", "show-mine", `${kana ? `<p class="show-kana">${esc(kana)}</p>` : ""}${ja ? `<p class="show-ja">${esc(ja)}</p>` : ""}`));
      act.appendChild(button("btn big wide", icon("say") + "<span>読み上げる</span>", () => TTS.speak(fr)));
      root.appendChild(act);
      /* 画面を見せている間は暗くならないように（対応ブラウザのみ。拒否されても見せる画面は使える） */
      let open = true;
      root.closest(".stage").addEventListener("stage-closed", () => { open = false; if (wake) { wake.release().catch(() => {}); wake = null; } });
      if (navigator.wakeLock) navigator.wakeLock.request("screen").then((w) => { if (open) wake = w; else w.release().catch(() => {}); }).catch(() => {});
    }, { label: "店員さんに見せる" });
  }

  const FR_SEL = ".fr,.l-fr,.show-fr,.tc-fr,.q-word,.chk-fr,.sign span,.psign b,.st-t b,.tile,.next-fr";
  const markFr = (n) => { if (n.matches && n.matches(FR_SEL) && !n.lang) n.lang = "fr"; if (n.querySelectorAll) n.querySelectorAll(FR_SEL).forEach((x) => { if (!x.lang) x.lang = "fr"; }); };
  new MutationObserver((ms) => { for (const m of ms) m.addedNodes.forEach((n) => { if (n.nodeType === 1) markFr(n); }); }).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("keydown", (e) => {
    const r = e.target.closest && e.target.closest('[role="radio"]'); if (!r) return;
    if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(e.key)) return;
    const g = r.closest('[role="radiogroup"]'); if (!g) return;
    const all = [...g.querySelectorAll('[role="radio"]')]; const i = all.indexOf(r);
    const n = all[(i + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : all.length - 1)) % all.length];
    e.preventDefault(); n.focus(); n.click();
  });

  /* 駅の写真（data/photos.js）。飾りなので alt は空、意味は隣の文字で伝える。cls で枠の形を変える */
  function photo(id, cls) {
    const p = (window.DATA && DATA.photos && DATA.photos[id]) || null;
    if (!p) return "";
    return `<span class="photo${cls ? " " + cls : ""}"><img src="${p.src}" alt="" width="${p.w}" height="${p.h}" decoding="async" style="object-position:${p.pos}"></span>`;
  }

  window.App = { el, esc, photo, onColor, avStyle, contrast, mix, inkOn, initials, modal, shuffle, $, button, icon, IC, toast, sfx, haptic, reduced, TTS, sayBtn, favBtn, isFav, phrase, scene, phraseRow,
    onTab, goTab, currentTab, initTabs, sheet, stage, show };
})();
