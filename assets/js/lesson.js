/* レッスンの再生（全画面のステージの中）
   learn: 表現を 1 つずつ聞く → 確認問題（聞いて意味 / 意味からフランス語 / 単語を並べる）→ 結果
   rules: 発音のきまりを読む → 読み方クイズ
   dlg:   会話ロールプレイ（相手は音声、自分は 2 択から選んで声に出す）
   答えた後の結果と「次へ」は、いつも画面の下に固定して出す（片手で届き、スクロールしなくてよい） */
(function () {
  const { el, esc, button, icon, shuffle, sayBtn, TTS, sfx, haptic, stage, phrase } = App;

  /* 上の進み具合 */
  function railbar(root, close, total, label, mark) {
    const bar = el("div", "stage-bar");
    bar.appendChild(button("icon-btn", icon("close"), () => close(), label || "レッスンをやめる"));
    const rail = el("div", "lrail"); rail.setAttribute("role", "progressbar"); rail.setAttribute("aria-valuemin", "0"); rail.setAttribute("aria-valuemax", String(total)); rail.setAttribute("aria-label", "進み具合");
    const fill = el("i"); rail.appendChild(fill);
    const dots = [];
    const at = (f) => `calc(14px + (100% - 14px) * ${f})`;
    if (total <= 16) for (let k = 1; k <= total; k++) { const d = el("b", k === mark || k === total ? "big" : ""); d.style.left = at(k / total); d.dataset.k = k; rail.appendChild(d); dots.push(d); }
    const me = el("span", "lr-me", esc(App.ini ? App.ini(Store.cur().name) : "")); rail.appendChild(me);
    if (mark) {
      rail.classList.add("staged");
      const c1 = el("small", "lr-cap", "聞く"); c1.style.left = "14px"; rail.appendChild(c1);
      const c2 = el("small", "lr-cap", "確認問題"); c2.style.left = at(mark / total); rail.appendChild(c2);
    }
    bar.appendChild(rail);
    root.appendChild(bar);
    const set = (n) => {
      const f = Math.min(1, n / total);
      fill.style.width = `calc((100% - 14px) * ${f})`; me.style.left = at(f);
      for (const d of dots) d.classList.toggle("on", +d.dataset.k <= n);
      rail.setAttribute("aria-valuenow", String(Math.round(n)));
    };
    set.hop = () => { me.classList.remove("hop"); void me.offsetWidth; me.classList.add("hop"); };
    return set;
  }
  /* カードの上辺に付ける小さな駅名標（いまどの駅のレッスンか） */
  function stband(s, label, art) {
    const b = el("div", "stband");
    if (s && !label) { b.classList.add("art"); b.innerHTML = `${App.photo(art || s.id, "sb-art")}${App.medal(s.id, "sb-medal")}<span class="sb-t"><b>${s.num} 番目の駅</b><span>${esc(App.titleFr(s.fr))}</span></span>`; }
    else b.innerHTML = `<span>${esc(App.titleFr(label || s.fr))}</span>`;
    b.setAttribute("aria-hidden", "true");
    return b;
  }
  /* 正解したら駅の絵がふっと寄って戻る（ポスターの絵が手応えになる） */
  function glow(body) {
    const a = body.querySelector(".stband.art"); if (!a) return;
    a.classList.remove("is-glow"); void a.offsetWidth; a.classList.add("is-glow");
  }
  /* 画面の下に固定する操作欄 */
  function footer(body) { const f = el("div", "stage-foot"); body.appendChild(f); return f; }
  /* 答えた結果のパネル。フォーカスを移すと、読み上げソフトが「正解／正しくは」から文まで読む */
  function resultPanel(ok, fr, ja, extra) {
    const fb = el("div", "fb-in");
    fb.tabIndex = -1;
    fb.setAttribute("role", "group");
    fb.setAttribute("aria-label", (ok ? "正解。" : "不正解。正しくは ") + fr + "。" + (ja || ""));
    fb.innerHTML = `<p class="fb-hd">${icon(ok ? "check" : "close")}<span>${ok ? "正解" : "正しくは"}</span></p><p class="fr">${esc(fr)}</p>${ja ? `<p class="ja">${esc(ja)}</p>` : ""}${extra || ""}`;
    return fb;
  }
  /* 途中で閉じても続きから再開できるように、どこまで進んだかを残す（人ごと） */
  let saveTo = null;
  function save(pos) { if (!saveTo) return; Store.LS.set("resume", Object.assign({ lid: saveTo, t: Date.now() }, pos)); }
  function resumeOf(lid) { const r = Store.LS.get("resume", null); return r && r.lid === lid && Date.now() - r.t < 7 * 864e5 ? r : null; }
  function clearResume() { Store.LS.set("resume", null); }

  /* 新しい問題・カードの見出しにフォーカスを移す（読み上げソフトが内容から読む） */
  function focusHead(box) { const h = box.querySelector("[data-head]"); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } }

  function start(lid, opts) {
    saveTo = null;
    const l = Course.lesson(lid);
    const s = Course.stationOfLesson(lid);
    if (!l || !s) return;
    stage((root, close) => {
      root.classList.add("lesson");
      if (l.kind === "dlg") return runDialog(root, close, s, l, opts);
      if (l.kind === "rules") return runRules(root, close, s, l, opts);
      return runLearn(root, close, s, l, opts);
    }, { label: s.ja + "のレッスン", onClose: opts && opts.onClose });
  }

  /* ---------- 駅に着いた画面: 前の駅から自分の丸が走ってきて止まり、駅名標が出る ---------- */
  function arrival(body, s, l, sub, onGo, resume) {
    const st = Course.stations();
    const prev = st[s.idx - 1], next = st[s.idx + 1];
    const i = s.lessons.indexOf(l) + 1;
    const box = el("div", "arrive");
    const nn = String(s.num).padStart(2, "0"), all = String(st.length - 1).padStart(2, "0");
    box.innerHTML = `<figure class="aff-art arr-art">${App.photo(App.lessonArt(l.id))}${App.medal(s.id, "arr-medal")}</figure>
      <p class="aff-title fr" lang="fr" aria-hidden="true" style="--n:${s.fr.length + 1}">${esc(App.titleFr(s.fr))}<em>.</em></p>
      <div class="aff-cartel"><div><h1 data-head><span class="sr">${esc(s.fr)}、</span>${esc(s.ja)}</h1><p class="aff-cr fr" lang="fr">${App.creditHtml(App.lessonArt(l.id))}</p></div></div>
      <div class="ride" aria-hidden="true"><span class="ride-line"></span>
        <span class="ride-st prev"><i></i><small>${esc(App.titleFr(prev ? prev.fr : "DÉPART"))}</small></span>
        <span class="ride-st cur"><i></i><small>${esc(App.titleFr(s.fr))}</small></span>
        <span class="ride-st nxt"><i></i><small>${esc(next ? App.titleFr(next.fr) : "")}</small></span>
        <span class="ride-me">${esc(App.ini ? App.ini(Store.cur().name) : "")}</span></div>
      <p class="eyebrow">${s.num} 番目の駅 · ${l.kind === "dlg" ? "会話の練習" : l.kind === "rules" ? "読み方のきまり" : "レッスン " + i + " / " + s.lessons.length}</p>
      <p class="lede">${esc(sub)}</p>`;
    body.appendChild(box);
    const f = footer(body);
    if (resume) {
      f.appendChild(button("btn big wide", `<span>続きから（${resume.label}）</span>` + icon("arrow"), () => onGo(resume)));
      f.appendChild(button("btn ghost wide", "<span>最初から</span>", () => { clearResume(); onGo(null); }));
    } else f.appendChild(button("btn big wide", "<span>はじめる</span><small class=\"btn-fr\" lang=\"fr\" aria-hidden=\"true\">Commencer</small>" + icon("arrow"), () => onGo(null)));
  }

  /* ---------- learn ---------- */
  function runLearn(root, close, s, l, opts) {
    const items = l.ids.map(phrase).filter(Boolean);
    const quiz = buildQuiz(items);
    const total = items.length + quiz.length;
    const setP = railbar(root, close, total, null, items.length);
    const body = el("div", "stage-body"); root.appendChild(body);
    let results = {};
    saveTo = l.id;
    const r0 = resumeOf(l.id);
    const res = r0 ? Object.assign({ label: r0.phase === "learn" ? `表現 ${r0.i + 1} / ${items.length}` : `確認問題 ${Math.min(r0.i + 1, quiz.length)} / ${quiz.length}` }, r0) : null;
    arrival(body, s, l, `新しい表現 ${items.length} つ · 約 ${App.lessonMinutes(l)} 分`, (r) => {
      if (r) { results = r.results || {}; if (r.phase === "quiz") return askQuiz(Math.min(r.i, quiz.length)); return learnCard(r.i); }
      learnCard(0);
    }, res);
    const save2 = (pos) => save(Object.assign({ results }, pos));

    function learnCard(i) {
      if (i >= items.length) return askQuiz(0);
      save2({ phase: "learn", i }); setP(i + 1);
      const p = items[i];
      body.innerHTML = "";
      body.appendChild(stband(s, null, App.lessonArt(l.id)));   /* 駅の絵の帯は進み具合のすぐ下に固定。中央に寄せるのは帯より下の中身だけ */
      const card = el("div", "lcard");
      card.insertAdjacentHTML("beforeend", `<p class="eyebrow">${i + 1} / ${items.length} · 聞いて、まねする</p>`);
      const fr = el("p", "l-fr fr", esc(p.fr)); fr.setAttribute("data-head", "");
      card.appendChild(fr);
      card.appendChild(el("p", "l-kana", esc(p.kana)));
      card.appendChild(el("p", "l-ja", esc(p.ja)));
      if (p.n) card.appendChild(el("p", "note", esc(p.n)));
      const act = el("div", "l-act");
      act.appendChild(sayBtn(p.fr, { label: "もう一度" }));
      act.appendChild(sayBtn(p.fr, { slow: true }));
      card.appendChild(act);
      body.appendChild(card);
      if (Speech.supported()) body.appendChild(speakBox(p.fr));
      const f = footer(body); f.classList.add("two");
      const back = button("btn ghost", icon("back") + "<span>前へ</span>", () => (i === 0 ? null : learnCard(i - 1)));
      back.disabled = i === 0;
      f.append(back, button("btn big", "<span>次へ</span><small class=\"btn-fr\" lang=\"fr\" aria-hidden=\"true\">Suivant</small>" + icon("arrow"), () => learnCard(i + 1)));
      TTS.speak(p.fr);
      focusHead(card);
    }

    function askQuiz(qi, retry) {
      const list = retry || quiz;
      if (qi >= list.length) {
        const wrong = list.filter((q) => q.wrong && !q.retried);
        if (wrong.length) { wrong.forEach((q) => { q.retried = true; q.wrong = false; }); return askQuiz(0, wrong); }
        return finish();
      }
      setP(retry ? items.length + quiz.length * ((qi + 1) / list.length) : items.length + qi + 1);
      const q = list[qi];
      body.innerHTML = "";
      body.appendChild(stband(s, null, App.lessonArt(l.id)));
      const box = el("div", "quiz");
      const head = el("p", "eyebrow q-head", retry ? "もう一度 · " + (q.type === "hear" ? "聞いて、意味を選ぶ" : q.type === "meaning" ? "フランス語で言うと？" : "単語を並べて文にする")
        : q.type === "hear" ? "聞いて、意味を選ぶ" : q.type === "meaning" ? "フランス語で言うと？" : "単語を並べて文にする");
      head.setAttribute("data-head", "");
      box.appendChild(head);
      body.appendChild(box);
      const foot = footer(body);
      const done = (ok) => {
        if (!retry) results[q.p.id] = results[q.p.id] === false ? false : ok;
        else if (!ok) results[q.p.id] = false;
        if (!ok) q.wrong = true;
        (ok ? sfx.ok : sfx.ng)(); haptic(ok ? 10 : 30);
        if (ok && setP.hop) setP.hop();
        if (ok) glow(body);
        box.classList.add("answered");
        foot.classList.add("fb", ok ? "ok" : "ng");
        foot.innerHTML = "";
        const fb = resultPanel(ok, q.p.fr, q.p.ja);
        const row = el("div", "fb-row");
        row.appendChild(sayBtn(q.p.fr));
        row.appendChild(button("btn big", "<span>次へ</span><small class=\"btn-fr\" lang=\"fr\" aria-hidden=\"true\">Suivant</small>" + icon("arrow"), () => askQuiz(qi + 1, retry)));
        fb.appendChild(row);
        foot.appendChild(fb);
        TTS.speak(q.p.fr);
        fb.focus({ preventScroll: true });
        if (!retry) save2({ phase: "quiz", i: qi + 1 });
      };
      if (q.type === "order") { orderQ(box, foot, q, done); focusHead(box); return; }
      if (q.type === "hear") {
        const hw = el("div", "hearwrap");
        hw.appendChild(button("hearbtn", icon("say"), () => TTS.speak(q.p.fr), "もう一度聞く"));
        hw.appendChild(sayBtn(q.p.fr, { slow: true }));
        box.appendChild(hw);
        TTS.speak(q.p.fr);
      } else box.appendChild(el("p", "q-ja", esc(q.p.ja)));
      const os = el("div", "opts"); os.setAttribute("role", "group"); os.setAttribute("aria-label", "選択肢");
      q.choices.forEach((c, k) => {
        const b = button("opt", `<span class="k" aria-hidden="true">${"abcd"[k]}</span><span class="${q.type === "meaning" ? "fr" : ""}">${esc(c.t)}</span>`, () => {
          if (os.dataset.done) return; os.dataset.done = "1";
          os.querySelectorAll(".opt").forEach((x, j) => { x.disabled = true; if (q.choices[j].ok) { x.classList.add("right"); x.setAttribute("aria-label", "正解: " + q.choices[j].t); } });
          if (!c.ok) { b.classList.add("wrong"); b.setAttribute("aria-label", "選んだ答え（違う）: " + c.t); }
          done(c.ok);
        });
        os.appendChild(b);
      });
      box.appendChild(os);
      focusHead(box);
    }

    function finish() {
      setP(total);
      clearResume(); saveTo = null;
      const r = Course.completeLesson(l.id, results);
      const missed = items.filter((p) => results[p.id] === false);
      const ok = items.length - missed.length;
      result(body, s, l, r, ok === items.length ? `確認問題は全問正解でした。この ${items.length} つは、明日から復習カードに出てきます。` : `確認問題 ${items.length} 問のうち ${ok} 問が 1 回目で正解。間違えた表現は「苦手な表現」に入り、復習カードでも早めにもう一度出てきます。`, close, opts, missed);
    }
  }

  /* 確認問題を作る。表現ごとに 1 問、型は文の長さで選ぶ */
  function buildQuiz(items) {
    const pool = DATA.phrases.filter((p) => p.s === items[0].s);
    const others = (p, key) => shuffle(pool.filter((x) => x.id !== p.id && x[key] !== p[key])).slice(0, 3);
    return shuffle(items).map((p, i) => {
      const words = tilesOf(p.fr);
      const type = words.length >= 3 && words.length <= 7 && i % 3 === 2 ? "order" : i % 2 === 0 ? "hear" : "meaning";
      if (type === "order") return { type, p, words };
      const key = type === "hear" ? "ja" : "fr";
      const choices = shuffle([{ t: p[key], ok: true }].concat(others(p, key).map((x) => ({ t: x[key], ok: false }))));
      return { type, p, choices };
    });
  }
  /* 並べる問題の単語: 文頭の大文字と文末の記号は、答えの手がかりになるので外す（固有名詞は大文字のまま） */
  function tilesOf(fr) {
    const w = fr.replace(/[«»]/g, "").replace(/\s+([?!.;:])/g, "$1").split(/\s+/).filter(Boolean);
    if (!w.length) return w;
    w[w.length - 1] = w[w.length - 1].replace(/[.?!;:]+$/, "");
    for (let i = 0; i < w.length; i++) w[i] = w[i].replace(/,$/, "");
    if (/^[A-ZÀ-Ý][a-zà-ÿ'’]/.test(w[0]) && !/^(Paris|Versailles|Charles|Notre|Air|Angelina)/.test(w[0])) w[0] = w[0].charAt(0).toLowerCase() + w[0].slice(1);
    return w.filter(Boolean);
  }

  /* 単語を並べる問題: 下の単語を押して順に並べる。並べた単語を押すと戻る。答え合わせは下の固定欄 */
  function orderQ(box, foot, q, done) {
    box.appendChild(el("p", "q-ja", esc(q.p.ja)));
    const ans = el("div", "tiles ans"); ans.setAttribute("aria-label", "並べた単語"); ans.setAttribute("role", "group");
    const bank = el("div", "tiles bank"); bank.setAttribute("aria-label", "使う単語"); bank.setAttribute("role", "group");
    const picked = [];
    const words = q.words.map((w, i) => ({ w, i }));
    let order = shuffle(words); if (order.every((x, k) => x.i === k) && words.length > 1) order = order.slice(1).concat(order[0]);
    const tip = el("p", "hint center order-tip", "単語を全部並べると、答え合わせができます");
    const check = button("btn big wide", "<span>答え合わせ</span>", () => {
      check.disabled = true; box.querySelectorAll(".tile").forEach((b) => (b.disabled = true));
      const ok = picked.map((x) => x.w).join(" ") === q.words.join(" ");
      ans.classList.add(ok ? "right" : "wrong");
      if (ok) glow(box.parentNode || box);
      done(ok);
    });
    const draw = (focusFrom) => {
      ans.innerHTML = ""; bank.innerHTML = "";
      picked.forEach((x, k) => ans.appendChild(button("tile on", esc(x.w), () => { picked.splice(k, 1); draw("ans"); }, x.w + "（押すと戻す）")));
      order.forEach((x) => { const used = picked.includes(x); const b = button("tile" + (used ? " used" : ""), esc(x.w), () => { if (!used) { picked.push(x); haptic(6); draw("bank"); } }); b.disabled = used; bank.appendChild(b); });
      check.disabled = picked.length !== words.length;
      if (!picked.length) ans.appendChild(el("span", "tiles-hint", "下の単語を順に押す"));
      /* 押した後もキーボードの位置を見失わないように、次に押せる単語へ */
      if (focusFrom) { const n = bank.querySelector(".tile:not([disabled])") || (check.disabled ? ans.querySelector(".tile") : check); if (n) n.focus({ preventScroll: true }); }
    };
    draw();
    box.append(ans, bank);
    foot.append(tip, check);
    const watch = new MutationObserver(() => { tip.hidden = !check.disabled; }); watch.observe(check, { attributes: true, attributeFilter: ["disabled"] }); tip.hidden = !check.disabled;
  }

  /* 話してみる（音声認識が使える端末だけ）。通信が無いときは使えない旨を先に出す */
  function speakBox(text) {
    const box = el("div", "speakbox");
    const out = el("p", "speak-out", "マイクを押して、まねして言ってみよう");
    out.setAttribute("aria-live", "polite");
    const gate = el("span", "gate", '<i class="g l"></i><i class="post"></i><i class="g r"></i>'); gate.setAttribute("aria-hidden", "true"); gate.hidden = true;
    const mic = button("micbtn", icon("mic"), () => {
      if (!navigator.onLine) { out.textContent = "発音チェックはインターネットにつながっているときだけ使えます"; return; }
      TTS.stop();
      mic.classList.add("rec"); out.textContent = "聞いています…";
      Speech.listen(text, (r) => {
        mic.classList.remove("rec");
        const v = Speech.verdict(r.pct);
        out.innerHTML = `<b class="pts ${v.k}">${r.pct}</b>点 · ${v.t}<small>聞き取れた単語 ${r.hit.filter(Boolean).length} / ${r.words.length}</small>`;
        /* 60 点以上は改札が開く */
        gate.hidden = false; box.classList.add("has-gate"); gate.classList.remove("open"); void gate.offsetWidth;
        gate.classList.toggle("open", r.pct >= 60);
        (r.pct >= 60 ? sfx.ok : sfx.ng)(); haptic(r.pct >= 60 ? 10 : 25);
        Course.recordSpeak(text, r.pct);
      }, (msg) => { mic.classList.remove("rec"); out.textContent = msg; });
    }, "話して発音をチェック");
    box.append(mic, out, gate);
    if (!navigator.onLine) out.textContent = "発音チェックはインターネットにつながっているときだけ使えます";
    return box;
  }

  /* ---------- rules ---------- */
  function runRules(root, close, s, l, opts) {
    const rules = l.ids.map((id) => DATA.pron.find((r) => r.id === id)).filter(Boolean);
    const pool = DATA.pron.flatMap((r) => r.ex.map((e) => ({ fr: e[0], kana: e[1], ja: e[2], rule: r.t })));
    const mine = rules.flatMap((r) => r.ex.map((e) => ({ fr: e[0], kana: e[1], ja: e[2], rule: r.t })));
    const quiz = shuffle(mine).slice(0, 6).map((q) => ({ q, choices: shuffle([{ t: q.kana, ok: true }].concat(shuffle(pool.filter((x) => x.kana !== q.kana)).slice(0, 3).map((x) => ({ t: x.kana, ok: false })))) }));
    const total = rules.length + quiz.length;
    const setP = railbar(root, close, total);
    const body = el("div", "stage-body"); root.appendChild(body);
    let ok = 0;
    saveTo = l.id;
    const r0 = resumeOf(l.id);
    arrival(body, s, l, `読み方のきまり ${rules.length} つ · 例を聞いて覚える`, (r) => (r ? rule(Math.min(r.i, rules.length - 1)) : rule(0)), r0 && r0.phase === "rule" ? Object.assign({ label: `きまり ${r0.i + 1} / ${rules.length}` }, r0) : null);
    function rule(i) {
      if (i >= rules.length) return q(0);
      save({ phase: "rule", i });
      setP(i + 1);
      const r = rules[i];
      body.innerHTML = "";
      const card = el("div", "lcard rule");
      card.innerHTML = `<p class="eyebrow">きまり ${i + 1} / ${rules.length}</p><h2 data-head>${esc(r.t)}</h2><p class="rule-r">${esc(r.r)}</p>`;
      const ul = el("ul", "ex");
      for (const [fr, kana, ja] of r.ex) {
        const li = el("li"); li.innerHTML = `<span class="fr">${esc(fr)}</span><span class="kana">${esc(kana)}</span><span class="ja">${esc(ja)}</span>`;
        li.appendChild(sayBtn(fr)); ul.appendChild(li);
      }
      card.appendChild(ul);
      body.appendChild(card);
      const f = footer(body); f.classList.add("two");
      const back = button("btn ghost", icon("back") + "<span>前へ</span>", () => (i === 0 ? null : rule(i - 1))); back.disabled = i === 0;
      f.append(back, button("btn big", "<span>次へ</span><small class=\"btn-fr\" lang=\"fr\" aria-hidden=\"true\">Suivant</small>" + icon("arrow"), () => rule(i + 1)));
      TTS.speak(r.ex.map((x) => x[0]));
      focusHead(card);
    }
    function q(i) {
      if (i >= quiz.length) { setP(total); clearResume(); saveTo = null; const r = Course.completeLesson(l.id); return result(body, s, l, r, `読み方クイズ ${quiz.length} 問のうち ${ok} 問正解。読み方は、フレーズを聞くたびに身についていきます。`, close, opts); }
      setP(rules.length + i + 1);
      const it = quiz[i];
      body.innerHTML = "";
      const box = el("div", "quiz");
      const h = el("p", "eyebrow q-head", "どう読む？"); h.setAttribute("data-head", ""); box.appendChild(h);
      box.appendChild(el("p", "q-word fr", esc(it.q.fr)));
      const os = el("div", "opts");
      const foot = footer(body);
      it.choices.forEach((c, k) => {
        const b = button("opt", `<span class="k" aria-hidden="true">${"abcd"[k]}</span><span>${esc(c.t)}</span>`, () => {
          if (os.dataset.done) return; os.dataset.done = "1";
          os.querySelectorAll(".opt").forEach((x, j) => { x.disabled = true; if (it.choices[j].ok) x.classList.add("right"); });
          if (!c.ok) b.classList.add("wrong"); else ok++;
          (c.ok ? sfx.ok : sfx.ng)(); haptic(c.ok ? 10 : 30);
          TTS.speak(it.q.fr);
          box.classList.add("answered");
          foot.classList.add("fb", c.ok ? "ok" : "ng");
          foot.innerHTML = "";
          const fb = resultPanel(c.ok, it.q.fr, `${it.q.kana}（${it.q.ja}）`, `<p class="small muted">きまり: ${esc(it.q.rule)}</p>`);
          fb.appendChild(button("btn big wide", "<span>次へ</span><small class=\"btn-fr\" lang=\"fr\" aria-hidden=\"true\">Suivant</small>" + icon("arrow"), () => q(i + 1))); foot.appendChild(fb);
          fb.focus({ preventScroll: true });
        });
        os.appendChild(b);
      });
      box.appendChild(os);
      body.insertBefore(box, foot);
      focusHead(box);
    }
  }

  /* ---------- dlg: 会話ロールプレイ ---------- */
  function runDialog(root, close, s, l, opts) {
    const d = DATA.dialogs.find((x) => x.id === l.dlg);
    const total = d.lines.length;
    const setP = railbar(root, close, total, "会話をやめる");
    const body = el("div", "stage-body chatbody"); root.appendChild(body);
    let timer = 0, gen = 0;   /* 自動で次の行へ進むタイマー。手で進めたり閉じたりしたら無効にする */
    const later = (fn, ms) => { clearTimeout(timer); const my = ++gen; timer = setTimeout(() => { if (my === gen && root.isConnected) fn(); }, ms); };
    const cancel = () => { clearTimeout(timer); gen++; };
    root.closest(".stage").addEventListener("stage-closed", cancel);
    arrival(body, s, l, `${d.ja} · 店員さんの言葉を聞いて、自分の番は 2 つから選んで声に出す`, () => { body.innerHTML = ""; body.insertAdjacentHTML("beforeend", `<figure class="wall-poster">${App.photo(s.id)}<figcaption>${esc(s.fr)} · ${esc(d.ja)}</figcaption></figure>`); body.appendChild(chat); line(0); });
    const chat = el("div", "chat"); chat.setAttribute("aria-live", "polite"); chat.setAttribute("aria-label", "会話");
    let foot = null;
    function bubble(who, fr, ja, n) {
      const b = el("div", "bub " + who);
      b.appendChild(el("span", "bub-av", who === "s" ? "店員" : "あなた"));
      const t = el("div", "bub-t");
      t.appendChild(el("span", "fr", esc(fr)));
      t.appendChild(el("span", "ja", esc(ja)));
      if (n) t.appendChild(el("span", "note", esc(n)));
      b.appendChild(t);
      b.appendChild(sayBtn(fr));
      chat.appendChild(b);
      requestAnimationFrame(() => b.scrollIntoView({ block: "nearest", behavior: App.reduced() ? "auto" : "smooth" }));
      return b;
    }
    function line(i) {
      cancel();
      setP(i);
      if (foot) foot.remove();
      if (i >= d.lines.length) {
        setP(total);
        if (!l.id) {   /* 練習タブから開いた会話: レッスンの進み具合には数えず、話した記録だけ残す */
          const rec = Store.LS.get("dlg", {}); rec[d.id] = Date.now(); Store.LS.set("dlg", rec); Store.bumpLog("dlg", 1);
          return result(body, s, l, { stamped: false, station: s }, `「${d.ja}」を最後まで話せました。`, close, { single: true });
        }
        const r = Course.completeLesson(l.id);
        return result(body, s, l, r, `「${d.ja}」を最後まで話せました。本番でもこの流れで大丈夫。`, close, opts);
      }
      foot = footer(body); foot.classList.add("chatfoot");
      const ln = d.lines[i];
      if (ln.who === "s") {
        bubble("s", ln.fr, ln.ja, ln.n);
        const my = gen;
        TTS.speak(ln.fr, { onEnd: (c) => { if (!c && my === gen) later(() => line(i + 1), 500); } });
        foot.appendChild(button("btn ghost wide", "<span>先へ</span>" + icon("arrow"), () => { TTS.stop(); line(i + 1); }));
        return;
      }
      const h = el("p", "eyebrow", "あなたの番 · どちらかを選ぶ"); h.setAttribute("data-head", ""); foot.appendChild(h);
      ln.opts.forEach((o) => {
        foot.appendChild(button("reply", `<span class="fr">${esc(o.fr)}</span><span class="kana">${esc(o.kana)}</span><span class="ja">${esc(o.ja)}</span>`, () => {
          cancel();
          foot.innerHTML = "";
          bubble("me", o.fr, o.ja);
          haptic(8);
          if (Speech.supported()) {
            foot.appendChild(el("p", "eyebrow", "声に出して言ってみる"));
            foot.appendChild(speakBox(o.fr));
            foot.appendChild(button("btn big wide", "<span>次へ</span><small class=\"btn-fr\" lang=\"fr\" aria-hidden=\"true\">Suivant</small>" + icon("arrow"), () => { Speech.stop(); line(i + 1); }));
            TTS.speak(o.fr);
          } else {
            const my = gen;
            TTS.speak(o.fr, { onEnd: (c) => { if (!c && my === gen) later(() => line(i + 1), 400); } });
            foot.appendChild(button("btn ghost wide", "<span>先へ</span>" + icon("arrow"), () => { TTS.stop(); line(i + 1); }));
          }
        }));
      });
      focusHead(foot);
    }
  }

  /* ---------- 結果とスタンプ ---------- */
  function result(body, s, l, r, msg, close, opts, missed) {
    body.innerHTML = "";
    const box = el("div", "result");
    const p = Course.stationProgress(s);
    const perfect = !missed || !missed.length;
    const cheer = r.stamped ? "Félicitations !" : perfect ? "Parfait !" : "Bien joué !";
    const art = App.lessonArt(l.id), ap = (DATA.photos || {})[art];
    box.innerHTML = `${ap ? `<figure class="got"><img src="${ap.src}" alt="" decoding="async" style="object-position:${ap.pos}"><figcaption><small>この絵を手に入れました</small><span class="aff-cr" lang="fr">${App.creditHtml(art)}</span></figcaption></figure>` : ""}<p class="cheer fr">${cheer}</p>${r.stamped ? "" : `<p class="eyebrow">レッスン終了</p>`}<h1 data-head>${r.stamped ? esc(s.ja) + "の駅、修了です" : perfect ? "全部わかりました" : "よくがんばりました"}</h1><p class="lede">${esc(msg)}</p>`;
    const seg = el("div", "segs"); seg.setAttribute("role", "img"); seg.setAttribute("aria-label", `この駅 ${p.d} / ${p.n}`);
    for (let i = 0; i < p.n; i++) seg.appendChild(el("i", i < p.d ? "on" : ""));
    box.appendChild(seg);
    if (missed && missed.length) {
      /* 修了の喜びを先に。間違えた表現は畳んだ一覧にして、下の操作と競わないように */
      const dt = el("details", "missed-box");
      dt.innerHTML = `<summary><span>もう一度聞いておきたい表現</span><b>${missed.length}</b></summary>`;
      const ul = el("ul", "missed");
      for (const m of missed) { const li = el("li"); li.innerHTML = `<span class="fr">${esc(m.fr)}</span><span class="ja">${esc(m.ja)}</span>`; li.appendChild(sayBtn(m.fr)); ul.appendChild(li); }
      dt.appendChild(ul);
      box.appendChild(dt);
    }
    if (r.stamped) {
      const st = el("div", "stamp-land"); st.innerHTML = Passport.stampSVG(s, Store.LS.get("stamps", {})[s.id], true);
      box.insertBefore(st, box.firstChild);
      setTimeout(() => { sfx.stamp(); haptic([20, 40, 60]); }, App.reduced() ? 0 : 520);
      setTimeout(() => sfx.chime(), App.reduced() ? 100 : 900);
    } else sfx.chime();
    body.appendChild(box);
    const x = body.closest(".stage-in") && body.closest(".stage-in").querySelector(".stage-bar .icon-btn"); if (x) x.hidden = true;
    const next = Course.nextLesson();
    const foot = footer(body);
    if (next && !(opts && opts.single)) foot.appendChild(button("btn big wide", `<span>次へ：${esc(Course.stationOfLesson(next.id).ja)}</span>` + icon("arrow"), () => start(next.id, opts)));
    foot.appendChild(button("btn ghost wide", "<span>路線図に戻る</span>", () => close()));
    focusHead(box);
  }

  /* 確認問題だけの短い練習。ids の表現から最大 8 問。苦手な表現（weak）と、しおりの日の予行演習で使う */
  function drill(ids, title, sub, onClose, kind) {
    /* 予行演習はしおりの順（その日に出会う順）、苦手はばらばらに */
    const all = ids.map(phrase).filter(Boolean);
    const items = (kind === "rehearse" ? all : shuffle(all)).slice(0, 8);
    if (!items.length) return;
    saveTo = null;
    stage((root, close) => {
      root.classList.add("lesson");
      const quiz = kind === "rehearse" ? buildQuiz(items).sort((a, b) => items.indexOf(a.p) - items.indexOf(b.p)) : buildQuiz(items);
      const setP = railbar(root, close, quiz.length, "練習をやめる");
      const body = el("div", "stage-body"); root.appendChild(body);
      const box0 = el("div", "arrive"); box0.innerHTML = `<div class="sign big"><span>${kind === "rehearse" ? "RÉPÉTITION" : "RÉVISION"}</span></div><p class="eyebrow">${esc(sub)}</p><h1 data-head>${esc(title)}</h1><p class="lede">${items.length} 問 · 約 ${Math.max(2, Math.round(items.length * 0.5))} 分${kind === "rehearse" ? " · その日に出会う順番で" : ""}</p>`;
      const scenes = [...new Set(items.map((p) => p.s))].slice(0, 4);
      box0.insertAdjacentHTML("beforeend", `<div class="mini-posters" aria-hidden="true">${scenes.map((sc) => `<figure>${App.medal(App.SCENE_PHOTO[sc] || "bonjour")}<figcaption>${esc((App.scene(sc) || {}).ja || "")}</figcaption></figure>`).join("")}</div>`);
      body.appendChild(box0);
      footer(body).appendChild(button("btn big wide", "<span>はじめる</span><small class=\"btn-fr\" lang=\"fr\" aria-hidden=\"true\">Commencer</small>" + icon("arrow"), () => ask(0)));
      const results = {};
      function ask(qi) {
        if (qi >= quiz.length) return end();
        setP(qi + 1);
        const q = quiz[qi];
        body.innerHTML = "";
        const box = el("div", "quiz");
        const h = el("p", "eyebrow q-head", q.type === "hear" ? "聞いて、意味を選ぶ" : q.type === "meaning" ? "フランス語で言うと？" : "単語を並べて文にする"); h.setAttribute("data-head", "");
        box.appendChild(h); body.appendChild(box);
        const foot = footer(body);
        const done = (ok) => {
          results[q.p.id] = ok;
          (ok ? sfx.ok : sfx.ng)(); haptic(ok ? 10 : 30);
          box.classList.add("answered"); foot.classList.add("fb", ok ? "ok" : "ng"); foot.innerHTML = "";
          const fb = resultPanel(ok, q.p.fr, q.p.ja);
          const row = el("div", "fb-row"); row.appendChild(sayBtn(q.p.fr)); row.appendChild(button("btn big", "<span>次へ</span><small class=\"btn-fr\" lang=\"fr\" aria-hidden=\"true\">Suivant</small>" + icon("arrow"), () => ask(qi + 1)));
          fb.appendChild(row); foot.appendChild(fb); TTS.speak(q.p.fr); fb.focus({ preventScroll: true });
        };
        if (q.type === "order") { orderQ(box, foot, q, done); focusHead(box); return; }
        if (q.type === "hear") { const hw = el("div", "hearwrap"); hw.appendChild(button("hearbtn", icon("say"), () => TTS.speak(q.p.fr), "もう一度聞く")); hw.appendChild(sayBtn(q.p.fr, { slow: true })); box.appendChild(hw); TTS.speak(q.p.fr); }
        else box.appendChild(el("p", "q-ja", esc(q.p.ja)));
        const os = el("div", "opts"); os.setAttribute("role", "group"); os.setAttribute("aria-label", "選択肢");
        q.choices.forEach((c, k) => {
          const b = button("opt", `<span class="k" aria-hidden="true">${"abcd"[k]}</span><span class="${q.type === "meaning" ? "fr" : ""}">${esc(c.t)}</span>`, () => {
            if (os.dataset.done) return; os.dataset.done = "1";
            os.querySelectorAll(".opt").forEach((x, j) => { x.disabled = true; if (q.choices[j].ok) x.classList.add("right"); });
            if (!c.ok) b.classList.add("wrong");
            done(c.ok);
          });
          os.appendChild(b);
        });
        box.appendChild(os); focusHead(box);
      }
      function end() {
        Course.recordDrill(results);
        if (kind) Store.bumpLog(kind, 1);
        const ok = Object.values(results).filter(Boolean).length;
        body.innerHTML = "";
        const r = el("div", "result");
        r.innerHTML = `<p class="eyebrow">${esc(sub)}</p><h1 data-head>${ok} / ${quiz.length} 問 正解</h1><p class="lede">${ok === quiz.length ? "全部わかりました。苦手な表現から外しました。" : "まだあやしい表現は、苦手な表現に残ります。"}</p>`;
        body.appendChild(r); sfx.chime();
        footer(body).appendChild(button("btn big wide", "<span>閉じる</span>", () => close()));
        focusHead(r);
      }
    }, { label: title, onClose });
  }

  /* 家族で会話: 1 台のスマホを店員役とお客役で渡し合う。店員役はフランス語を声に出して読み、お客役は聞いて答えを選んで言う */
  function duo(id, onClose) {
    const d = DATA.dialogs.find((x) => x.id === id);
    if (!d) return;
    saveTo = null;
    stage((root, close) => {
      root.classList.add("lesson", "duo");
      const setP = railbar(root, close, d.lines.length, "家族で会話をやめる");
      const body = el("div", "stage-body"); root.appendChild(body);
      const intro = el("div", "arrive");
      intro.innerHTML = `<div class="sign big"><span>EN FAMILLE</span></div><p class="eyebrow">家族で会話</p><h1 data-head>${esc(d.ja)}</h1><p class="lede">2 人で 1 台のスマホを渡し合います。<b>店員役</b>は画面のフランス語を声に出して読み、<b>お客役</b>はそれを聞いて答えを選び、声に出して返します。</p>
        ${(() => { const st = Course.stations().find((x) => x.lessons.some((l) => l.dlg === id)); return st ? `<figure class="wall-poster">${App.photo(st.id)}<figcaption>${esc(st.fr)} · ${esc(d.ja)}</figcaption></figure>` : ""; })()}
        <div class="duo-roles"><span class="role s">${icon("chat")}<b>店員役</b><small>読む人</small></span><span class="role c">${icon("family")}<b>お客役</b><small>答える人</small></span></div>`;
      body.appendChild(intro);
      footer(body).appendChild(button("btn big wide", "<span>店員役の人から始める</span>" + icon("arrow"), () => step(0)));
      const pass = (to, fn) => {   /* 相手に渡す画面 */
        body.innerHTML = "";
        const b = el("div", "handoff " + to);
        b.innerHTML = `${icon(to === "s" ? "chat" : "family", "big")}<h1 data-head>${to === "s" ? "店員役" : "お客役"}の人に渡してください</h1><p class="lede">${to === "s" ? "次は店員さんのせりふを読みます" : "次はお客さんの番です"}</p>`;
        body.appendChild(b);
        footer(body).appendChild(button("btn big wide", "<span>受け取りました</span>", fn));
        focusHead(b);
      };
      let prevWho = null;
      function step(i) {
        setP(i);
        if (i >= d.lines.length) {
          body.innerHTML = "";
          const r = el("div", "result"); r.innerHTML = `<p class="eyebrow">家族で会話</p><h1 data-head>Bravo&nbsp;!</h1><p class="lede">「${esc(d.ja)}」を 2 人で最後まで話せました。役を交代して、もう一度どうぞ。</p>`;
          body.appendChild(r); sfx.chime(); App.TTS.speak("Bravo !");
          const f = footer(body);
          f.appendChild(button("btn big wide", "<span>役を交代してもう一度</span>", () => { prevWho = null; step(0); }));
          f.appendChild(button("btn ghost wide", "<span>閉じる</span>", () => close()));
          focusHead(r);
          return;
        }
        const ln = d.lines[i];
        const who = ln.who === "s" ? "s" : "c";
        if (prevWho && prevWho !== who) { prevWho = who; return pass(who, () => show(i)); }
        prevWho = who;
        show(i);
      }
      /* お客役: 選んだ文を大きく出して、声に出してもらう */
      function sayIt(i, o) {
        body.innerHTML = "";
        const card = el("div", "lcard duo-card");
        card.innerHTML = `<p class="eyebrow">お客役 · 店員役の人に向かって言う</p><p class="l-fr fr" data-head>${esc(o.fr)}</p><p class="l-kana">${esc(o.kana)}</p><p class="l-ja">${esc(o.ja)}</p>`;
        const a = el("div", "l-act"); a.appendChild(sayBtn(o.fr, { label: "お手本を聞く" })); a.appendChild(sayBtn(o.fr, { slow: true })); card.appendChild(a);
        body.appendChild(card);
        footer(body).appendChild(button("btn big wide", "<span>言いました</span>" + icon("arrow"), () => step(i + 1)));
        focusHead(card);
      }
      function show(i) {
        const ln = d.lines[i];
        body.innerHTML = "";
        const card = el("div", "lcard duo-card");
        if (ln.who === "s") {
          card.innerHTML = `<p class="eyebrow">店員役 · まずお手本を聞いて、声に出して読む</p><p class="l-fr fr" data-head>${esc(ln.fr)}</p>${ln.kana ? `<p class="l-kana">${esc(ln.kana)}</p>` : ""}<p class="l-ja">${esc(ln.ja)}</p>`;
          const a = el("div", "l-act"); a.appendChild(sayBtn(ln.fr, { label: "お手本を聞く" })); a.appendChild(sayBtn(ln.fr, { slow: true })); card.appendChild(a);
          body.appendChild(card);
          footer(body).appendChild(button("btn big wide", "<span>読みました</span>" + icon("arrow"), () => step(i + 1)));
        } else {
          card.innerHTML = `<p class="eyebrow">お客役 · 聞いて、答えを選んで言う</p><p class="q-ja" data-head>店員さんは何と言ったかな？</p>`;
          const prev = d.lines[i - 1];
          if (prev && prev.who === "s") { const hint = el("details", "duo-hint"); hint.innerHTML = `<summary>聞き取れなかったら</summary><p class="fr">${esc(prev.fr)}</p><p class="ja">${esc(prev.ja)}</p>`; card.appendChild(hint); }
          body.appendChild(card);
          const f = footer(body); f.classList.add("chatfoot");
          ln.opts.forEach((o) => f.appendChild(button("reply", `<span class="fr">${esc(o.fr)}</span><span class="kana">${esc(o.kana)}</span><span class="ja">${esc(o.ja)}</span>`, () => { haptic(8); sayIt(i, o); })));
        }
        focusHead(card);
      }
    }, { label: "家族で会話: " + d.ja, onClose });
  }

  /* 練習タブから会話だけを開く */
  function dialog(id, onClose) {
    const d = DATA.dialogs.find((x) => x.id === id);
    if (!d) return;
    const s = Course.stations().find((x) => x.dlg === id || x.dlg2 === id) || Course.stations()[0];
    stage((root, close) => { root.classList.add("lesson"); runDialog(root, close, s, { id: null, kind: "dlg", dlg: id }, { single: true }); }, { label: d.ja, onClose });
  }

  window.Lesson = { start, dialog, drill, duo, tilesOf };
})();
