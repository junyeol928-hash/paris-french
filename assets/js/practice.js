/* 練習: 復習カード（SRS）・聞き取り（言われることば / 数字）・会話ロールプレイ・読み方のきまり。どれも全画面のステージで行う */
(function () {
  const { el, esc, button, icon, shuffle, sayBtn, TTS, sfx, haptic, stage, phrase, onTab, $ } = App;
  const { LS } = Store;

  function render(arg) {
    const root = $("v-practice");
    root.innerHTML = "";
    root.appendChild(el("header", "vh", `<figure class="vign" aria-hidden="true"><img src="assets/img/il/v-practice.webp" alt="" width="1200" height="800" decoding="async"></figure><p class="eyebrow fr-lbl" lang="fr">Pratique</p><h1>練習</h1>`));
    const plan = Course.reviewPlan();
    const done = LS.get("done", {});
    const lsOk = DATA.listen.filter((x) => done[x.id] > 0).length;
    const dlg = LS.get("dlg", {});
    const tiles = [
      { k: "review", ic: "cards", t: "復習カード", s: plan.dueTotal ? `今日 ${plan.dueTotal} 枚` : Course.learnedCount() ? "今日のぶんは済み" : "レッスンで覚えた表現がここに", badge: plan.dueTotal, go: () => review() },
      { k: "listen", ic: "ear", t: "聞き取り", s: `言われることば ${lsOk} / ${DATA.listen.length}`, go: () => listenSetup("words") },
      { k: "nums", ic: "hash", t: "数字と値段", s: "0〜100。70〜99 が山場", go: () => listenSetup("nums") },
      { k: "weak", ic: "swap", t: "苦手な表現", s: Course.weakIds().length ? `${Course.weakIds().length} つ · 1 回 8 問まで` : "間違えた表現がここに", go: () => { if (Course.weakIds().length) Lesson.drill(Course.weakIds(), "苦手な表現", "もう一度", render); else App.toast("いまは苦手な表現はありません"); } },
      { k: "talk", ic: "chat", t: "会話の練習", s: `${Object.keys(dlg).length} / ${DATA.dialogs.length} 場面`, go: () => talkList() },
      { k: "rules", ic: "abc", t: "読み方のきまり", s: `${DATA.pron.length} のきまりと例`, go: () => rulesList() },
    ];
    /* 乗り換え案内の行き先のように、それぞれのフランス語の名前 */
    const DEST = { review: "RÉVISION", listen: "ÉCOUTE", nums: "NOMBRES", weak: "ENCORE", talk: "DIALOGUE", rules: "LIRE" };
    const LINE_C = { listen: "#1F5FAF", nums: "#E5A800", weak: "#D9701C", talk: "#3F9160", rules: "#9B2F8F" };
    const grid = el("div", "pgrid");
    for (const t of tiles) {
      const b = button("ptile p-" + t.k, `<span class="pt-ic"${LINE_C[t.k] ? ` style="color:${LINE_C[t.k]}"` : ""}>${icon(t.ic)}</span><span class="pt-t"><b>${esc(t.t)}</b><span class="pt-fr">${DEST[t.k]}</span><small>${esc(t.s)}</small></span>${t.badge ? `<span class="badge">${t.badge}</span>` : ""}`, t.go);
      grid.appendChild(b);
    }
    root.appendChild(grid);
    if (arg === "review") review(); else if (arg === "listen") listenSetup("words"); else if (arg === "rules") rulesList(); else if (arg === "talk") talkList();
  }

  /* 場面 → 駅の写真 */
  const SCENE_PHOTO = { base: "bonjour", air: "aeroport", taxi: "taxi", hotel: "hotel", cafe: "cafe", resto: "resto", menu: "carte", metro: "metro", visite: "musee", shop: "boutique", urgence: "urgence" };
  /* ---------- 復習カード ---------- */
  function review(o) {
    const back = (o && o.onClose) || (() => { render(); App.renderHeader(); });
    const st = SRS.unpack(LS.get("srs", {}));
    const plan = SRS.buildQueue(Object.keys(st), st, { newLimit: 0 });
    let queue = plan.due.slice(0, 40);
    if (!queue.length) {
      App.sheet("復習カード", (b, close) => {
        b.appendChild(el("p", null, Course.learnedCount() ? "今日の復習は全部済みました。明日また、忘れかけた表現が出てきます。" : "まだカードがありません。路線図のレッスンで覚えた表現が、ここに出てきます。"));
        b.appendChild(button("btn wide", "<span>閉じる</span>", close));
      });
      return;
    }
    let n = 0, again = 0;
    stage((root, close) => {
      root.classList.add("lesson");
      const bar = el("div", "stage-bar"); bar.appendChild(button("icon-btn", icon("close"), () => close(), "やめる"));
      const cnt = el("span", "bar-t"); bar.appendChild(cnt); root.appendChild(bar);
      const body = el("div", "stage-body"); root.appendChild(body);
      const next = () => {
        if (!queue.length) {
          body.innerHTML = "";
          const r = el("div", "result"); r.innerHTML = `<p class="eyebrow fr-lbl" lang="fr">Révision</p><h1>復習おわり</h1><p class="lede">${n} 枚めくりました。${again ? "忘れた " + again + " 枚は、また近いうちに出てきます。" : "全部覚えていました。"}</p>`;
          body.appendChild(r); sfx.chime();
          body.appendChild(el("div", "stage-foot")).appendChild(button("btn big wide", "<span>閉じる</span>", () => close()));
          return;
        }
        const id = queue.shift(); const mode = id.slice(0, 1); const p = phrase(id.slice(2));
        if (!p) return next();
        cnt.textContent = `残り ${queue.length + 1} 枚`;
        body.innerHTML = "";
        body.insertAdjacentHTML("beforeend", `<figure class="wall-poster sm">${App.photo(SCENE_PHOTO[p.s] || "bonjour")}<figcaption>${esc(((Course.station(SCENE_PHOTO[p.s]) || {}).fr) || "")} · ${esc((App.scene(p.s) || {}).ja || "")}</figcaption></figure>`);
        const card = el("div", "ticketcard");
        card.innerHTML = `<div class="tc-hd"><span>RÉVISION · ${mode === "s" ? "言う" : "聞く"}</span></div>`;
        const front = el("div", "tc-front");
        if (mode === "s") { front.innerHTML = `<p class="hint">フランス語で言うと？</p><p class="tc-ja" data-head tabindex="-1">${esc(p.ja)}</p>`; }
        else { front.innerHTML = `<p class="hint" data-head tabindex="-1">聞いて、意味を思い浮かべる</p>`; front.appendChild(button("hearbtn", icon("say"), () => TTS.speak(p.fr), "もう一度聞く")); TTS.speak(p.fr); }
        const back = el("div", "tc-back"); back.hidden = true;
        back.innerHTML = `<p class="tc-fr fr">${esc(p.fr)}</p><p class="kana">${esc(p.kana)}</p>${mode === "h" ? `<p class="tc-ja sm">${esc(p.ja)}</p>` : ""}`;
        const row = el("div", "row center"); row.append(sayBtn(p.fr), sayBtn(p.fr, { slow: true })); back.appendChild(row);
        card.append(front, back, el("div", "tc-stripe"));
        body.appendChild(card);
        const foot = el("div", "stage-foot"); body.appendChild(foot);
        const show = button("btn big wide", "<span>答えを見る</span>", () => {
          foot.prepend(el("p", "eyebrow center", "どのくらい言えた？"));
          back.hidden = false; show.remove(); TTS.speak(p.fr);
          const g = el("div", "grades");
          const c = st[id];
          if (Store.prefs().grades === "2") g.classList.add("two");
          (Store.prefs().grades === "2" ? [[1, "もう一回", "g1"], [3, "覚えた", "g3"]] : [[1, "忘れた", "g1"], [2, "あやしい", "g2"], [3, "言えた", "g3"], [4, "かんたん", "g4"]]).forEach(([v, t, cls]) => {
            const when = v === 1 ? "このあと" : SRS.preview(c, v) === "10分" ? "あとで" : SRS.preview(c, v) + "後";
            g.appendChild(button(cls, `<b>${t}</b><small>${when}</small>`, () => {
              const nc = SRS.review(c, v, Date.now()); st[id] = nc;
              const pk = LS.get("srs", {}); pk[id] = SRS.pack({ [id]: nc })[id]; LS.set("srs", pk);
              Store.bumpLog("rev", 1); n++; haptic(8);
              if (v === 1) { again++; queue.push(id); }
              next();
            }));
          });
          foot.appendChild(g);
          setTimeout(() => g.querySelector(".g3").focus({ preventScroll: true }), 50);
        });
        foot.appendChild(show);
        const h = front.querySelector("[data-head]"); if (h) h.focus({ preventScroll: true });
      };
      next();
    }, { label: "復習カード", onClose: back });
  }

  /* ---------- 聞き取り ---------- */
  function listenSetup(mode, o) {
    App.sheet(mode === "nums" ? "数字と値段" : "聞き取り", (b, close) => {
      b.appendChild(el("p", "muted", mode === "nums" ? "数字を聞いて、4 つから選びます。1 回 10 問。" : "店員さんや駅の放送で言われそうな文を聞いて、意味を選びます。1 回 10 問。"));
      const chips = el("div", "chips");
      const done = LS.get("done", {});
      const opts = mode === "nums" ? [["all", "0〜100"], ["0-20", "0〜20"], ["21-69", "21〜69"], ["70-100", "70〜100"]]
        : [["all", "全部"]].concat(DATA.listen.some((x) => done[x.id] < 0) ? [["wrong", "間違えた問題"]] : []).concat(DATA.listenCats.map((c) => [c.id, c.ja]));
      let pick = opts[0][0];
      opts.forEach(([id, t]) => { const c = button("chip", esc(t), () => { pick = id; chips.querySelectorAll(".chip").forEach((x) => x.setAttribute("aria-pressed", x === c ? "true" : "false")); }); c.setAttribute("aria-pressed", id === pick ? "true" : "false"); chips.appendChild(c); });
      b.appendChild(chips);
      b.appendChild(button("btn big wide", "<span>10 問はじめる</span>" + icon("arrow"), () => { close(); listenRun(mode, pick, o); }));
    });
  }
  function listenPool(mode, pick) {
    if (mode === "nums") {
      const [a, z] = pick === "all" ? [0, 100] : pick.split("-").map(Number);
      const ns = []; for (let i = a; i <= z; i++) ns.push(i);
      return shuffle(ns).slice(0, 10).map((n) => ({ id: "n" + n, n, fr: NUM.fr(n), c: NUM.choices(n).map(String) }));
    }
    const done = LS.get("done", {});
    let items = DATA.listen.filter((x) => pick === "all" || (pick === "wrong" ? done[x.id] < 0 : x.s === pick));
    return shuffle(items).sort((x, y) => (done[x.id] > 0) - (done[y.id] > 0)).slice(0, 10);
  }
  function listenRun(mode, pick, o) {
    const qs = listenPool(mode, pick);
    let i = 0, ok = 0;
    stage((root, close) => {
      root.classList.add("lesson");
      const bar = el("div", "stage-bar"); bar.appendChild(button("icon-btn", icon("close"), () => close(), "やめる"));
      const rail = el("div", "lrail"); const fill = el("i"); rail.appendChild(fill); bar.appendChild(rail); root.appendChild(bar);
      const body = el("div", "stage-body"); root.appendChild(body);
      const ask = () => {
        fill.style.width = (i / qs.length) * 100 + "%";
        if (i >= qs.length) {
          body.innerHTML = "";
          const r = el("div", "result"); r.innerHTML = `<p class="eyebrow fr-lbl" lang="fr">Écoute</p><h1>${ok} / ${qs.length} 問 正解</h1><p class="lede">${ok === qs.length ? "全問正解。次は別の場面も。" : mode === "nums" ? "70〜99 は「60＋10」「4×20」で数えます。ゆっくり再生で耳を慣らしましょう。" : "間違えた問題は「間違えた問題」にまとまります。"}</p>`;
          body.appendChild(r); sfx.chime();
          const f = el("div", "stage-foot"); f.appendChild(button("btn big wide", "<span>もう 10 問</span>", () => listenRun(mode, pick, o))); f.appendChild(button("btn ghost wide", "<span>閉じる</span>", () => close())); body.appendChild(f);
          return;
        }
        const q = qs[i];
        body.innerHTML = "";
        const box = el("div", "quiz");
        const hd = el("p", "eyebrow q-head", `${i + 1} / ${qs.length} · ${mode === "nums" ? "数字を聞く" : "聞いて、意味を選ぶ"}`); hd.setAttribute("data-head", ""); hd.tabIndex = -1;
        box.appendChild(hd);
        const hw = el("div", "hearwrap"); hw.appendChild(button("hearbtn", icon("say"), () => TTS.speak(q.fr), "もう一度聞く")); hw.appendChild(sayBtn(q.fr, { slow: true })); box.appendChild(hw);
        const os = el("div", "opts" + (mode === "nums" ? " nums" : ""));
        shuffle(q.c.map((t, k) => ({ t, ok: k === 0 }))).forEach((c, k) => {
          const b = button("opt", `<span class="k">${"abcd"[k]}</span><span>${esc(c.t)}</span>`, () => {
            if (os.dataset.done) return; os.dataset.done = "1";
            [...os.children].forEach((x) => { x.disabled = true; if (x.dataset.ok) x.classList.add("right"); });
            if (!c.ok) b.classList.add("wrong"); else ok++;
            if (mode === "words") { const d = LS.get("done", {}); d[q.id] = c.ok ? Date.now() : -Date.now(); LS.set("done", d); }
            Store.bumpLog("q", 1);
            (c.ok ? sfx.ok : sfx.ng)(); haptic(c.ok ? 10 : 30);
            box.classList.add("answered");
            const f = el("div", "stage-foot fb " + (c.ok ? "ok" : "ng"));
            const fb = el("div", "fb-in"); fb.setAttribute("role", "status"); fb.setAttribute("aria-live", "polite");
            fb.innerHTML = `<p class="fb-hd">${icon(c.ok ? "check" : "close")}<span>${c.ok ? "正解" : "正しくは"}</span></p><p class="fr">${esc(q.fr)}</p><p class="ja">${esc(mode === "nums" ? NUM.kana(q.n) + "（" + q.n + "）" : q.c[0])}</p>${q.n && mode === "words" ? `<p class="note">${esc(q.n)}</p>` : ""}`;
            const row = el("div", "fb-row"); row.appendChild(sayBtn(q.fr));
            const nb = button("btn big", "<span>次へ</span>" + icon("arrow"), () => { i++; ask(); }); row.appendChild(nb); fb.appendChild(row);
            f.appendChild(fb); body.appendChild(f); setTimeout(() => nb.focus({ preventScroll: true }), 60);
          });
          if (c.ok) b.dataset.ok = "1";
          os.appendChild(b);
        });
        box.appendChild(os);
        body.appendChild(box);
        hd.focus({ preventScroll: true });
        TTS.speak(q.fr);
      };
      ask();
    }, { label: "聞き取り", onClose: (o && o.onClose) || (() => { render(); App.renderHeader(); }) });
  }

  /* ---------- 会話ロールプレイの一覧 ---------- */
  function talkList() {
    App.sheet("会話の練習", (b, close) => {
      b.appendChild(el("p", "muted", "店員さんの言葉を聞いて、自分の番は 2 つから選んで声に出します。"));
      const dlg = LS.get("dlg", {});
      const mode = el("div", "seg"); mode.setAttribute("role", "radiogroup"); mode.setAttribute("aria-label", "練習のしかた");
      let duo = false;
      [["1", "ひとりで"], ["2", "家族と 2 人で"]].forEach(([k, t]) => { const x = button("", t, () => { duo = k === "2"; mode.querySelectorAll("button").forEach((y) => y.setAttribute("aria-checked", y === x ? "true" : "false")); note.textContent = duo ? "1 台のスマホを渡し合って、店員役とお客役に分かれます。" : "店員さんの音声に、2 つから選んで答えます。"; }); x.setAttribute("role", "radio"); x.setAttribute("aria-checked", k === "1" ? "true" : "false"); mode.appendChild(x); });
      b.appendChild(mode);
      const note = el("p", "hint", "店員さんの音声に、2 つから選んで答えます。"); b.appendChild(note);
      const ul = el("div", "talks");
      for (const d of DATA.dialogs) {
        ul.appendChild(button("talk" + (dlg[d.id] ? " done" : ""), `<span class="t-fr fr">${esc(d.fr)}</span><span class="t-ja">${esc(d.ja)}</span><span class="t-m">${dlg[d.id] ? icon("check") : ""}約 ${d.min} 分</span>`, () => { close(); if (duo) Lesson.duo(d.id, () => render()); else Lesson.dialog(d.id, () => render()); }));
      }
      b.appendChild(ul);
    });
  }

  /* ---------- 読み方のきまり ---------- */
  function rulesList() {
    App.sheet("読み方のきまり", (b) => {
      DATA.pron.forEach((r, k) => {
        const d = el("details", "rule");
        d.appendChild(el("summary", null, `<span class="rn">${k + 1}</span><span>${esc(r.t)}</span>`));
        const body = el("div", "rule-b"); body.appendChild(el("p", null, esc(r.r)));
        const ul = el("ul", "ex");
        for (const [fr, kana, ja] of r.ex) { const li = el("li"); li.innerHTML = `<span class="fr">${esc(fr)}</span><span class="kana">${esc(kana)}</span><span class="ja">${esc(ja)}</span>`; li.appendChild(sayBtn(fr)); ul.appendChild(li); }
        body.appendChild(ul); d.appendChild(body); b.appendChild(d);
      });
    }, { cls: "tall" });
  }

  App.review = review;
  App.listen = (o) => listenSetup("words", o);
  onTab("practice", render);
})();
