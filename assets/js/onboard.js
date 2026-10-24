/* はじめての人: ようこそ → 呼び名 → 路線の色 → 文字の大きさ → 旅の初日（招待リンクで入っていれば飛ばす）→ 開通
   ヘッダーの名前を押すと、この端末の人を切り替えるシートが出る */
(function () {
  const { el, esc, button, icon, sheet, toast, $ } = App;

  function colorPicker(sel) {
    let val = sel || Store.LINES[0].id;
    const wrap = el("div", "colors"); wrap.setAttribute("role", "radiogroup"); wrap.setAttribute("aria-label", "路線の色");
    const draw = () => {
      wrap.innerHTML = "";
      for (const l of Store.LINES) {
        const b = button("color", `<span class="roundel" style="${App.avStyle(l.c)}">${l.line}</span><span>${l.name}</span>`, () => { val = l.id; draw(); App.haptic(6); });
        b.setAttribute("role", "radio"); b.setAttribute("aria-checked", val === l.id ? "true" : "false");
        wrap.appendChild(b);
      }
    };
    draw();
    return { el: wrap, value: () => val };
  }

  /* 全画面のはじめての画面。steps の中を左右に送る */
  function flow(opts) {
    const o = opts || {};
    const ov = el("div", "onboard"); ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", "はじめに");
    document.body.appendChild(ov);
    document.documentElement.classList.add("staged");
    const release = App.modal(ov, o.add ? () => finish(false) : null);
    const st = { name: "", color: Store.LINES[Store.profiles().length % Store.LINES.length].id, size: "md", trip: Store.trip() };
    const steps = [];
    if (!o.add) steps.push(welcome);
    steps.push(nameStep, colorStep, sizeStep);
    if (!Store.trip()) steps.push(tripStep);
    steps.push(doneStep);
    let i = 0;
    const go = (d) => { i += d; draw(); };
    function frame(inner, canBack) {
      ov.innerHTML = "";
      const top = el("div", "ob-top");
      if (canBack) top.appendChild(button("icon-btn", icon("back"), () => go(-1), "戻る"));
      else if (o.add) top.appendChild(button("icon-btn", icon("close"), () => finish(false), "やめる"));
      const dots = el("div", "ob-dots"); steps.forEach((_, k) => dots.appendChild(el("i", k === i ? "on" : k < i ? "done" : "")));
      top.appendChild(dots);
      ov.appendChild(top);
      const b = el("div", "ob-body"); b.appendChild(inner); ov.appendChild(b);
      const f = b.querySelector("input") || b.querySelector("h1"); if (f) { if (f.tagName === "H1") f.tabIndex = -1; setTimeout(() => f.focus({ preventScroll: true }), 50); }
    }
    function draw() { steps[i](); }

    function welcome() {
      const others = Store.profiles();
      const w = el("div", "ob welcome");
      w.innerHTML = `<figure class="ob-hero">${App.photo("welcome")}<figcaption lang="fr">${App.creditHtml("welcome")}</figcaption></figure>
        <p class="eyebrow">PARIS · EN FAMILLE</p><h1 class="fr hello">Bonjour&nbsp;!</h1>
        <p class="lede">家族でパリへ。フランス語ゼロから、旅で困らないところまで。1 日 5 分、駅をひとつずつ進みます。</p>`;
      if (others.length) {
        w.appendChild(el("p", "ob-q", "この端末を使うのは誰ですか？"));
        const pl = el("div", "people");
        for (const p of others) pl.appendChild(button("person", `<span class="av" style="${App.avStyle(Store.lineOf(p.color).c)}">${esc(App.initials(p.name, others.map((x) => x.name)))}</span><span>${esc(p.name)}</span>`, () => { Store.switchTo(p.id); finish(true, true); }));
        w.appendChild(pl);
        w.appendChild(button("btn ghost wide", icon("plus") + "<span>新しく始める</span>", () => go(1)));
      } else w.appendChild(button("btn big wide primary", "<span>はじめる</span>" + icon("arrow"), () => go(1)));
      frame(w, false);
    }
    function nameStep() {
      const w = el("form", "ob");
      w.innerHTML = `<p class="ob-plate"><b>1</b><span>VOTRE NOM</span></p><h1>呼び名を教えてください</h1><p class="lede">家族の路線図に表示されます。ひらがな・カタカナ・ローマ字、どれでも。</p>
        <label class="sr" for="obName">呼び名</label><input id="obName" class="big-input" type="text" maxlength="20" autocomplete="nickname" placeholder="例: ママ、Junyeol" value="${esc(st.name)}">`;
      const next = button("btn big wide primary", "<span>次へ</span>" + icon("arrow"), () => w.requestSubmit());
      w.appendChild(next);
      w.addEventListener("submit", (e) => { e.preventDefault(); const v = $("obName").value.trim(); if (!v) { $("obName").focus(); toast("呼び名を入れてください"); return; } st.name = v; go(1); });
      frame(w, i > 0);
    }
    function colorStep() {
      const w = el("div", "ob");
      w.innerHTML = `<p class="ob-plate"><b>2</b><span>VOTRE LIGNE</span></p><h1>${esc(st.name)} さんの路線の色</h1><p class="lede">パリのメトロは路線ごとに色があります。家族で別々の色にすると、路線図で見分けやすくなります。</p>`;
      const used = Store.profiles().map((p) => p.color);
      if (used.includes(st.color)) { const free = Store.LINES.find((l) => !used.includes(l.id)); if (free) st.color = free.id; }
      const cp = colorPicker(st.color);
      w.appendChild(cp.el);
      w.appendChild(button("btn big wide primary", "<span>次へ</span>" + icon("arrow"), () => { st.color = cp.value(); go(1); }));
      frame(w, true);
    }
    function sizeStep() {
      const w = el("div", "ob");
      w.innerHTML = `<p class="ob-plate"><b>3</b><span>LISIBILITÉ</span></p><h1>文字の大きさ</h1><p class="lede">あとから設定で変えられます。</p>`;
      const pv = el("div", "sizes");
      [["md", "ふつう"], ["lg", "大きい"]].forEach(([k, t]) => {
        const b = button("sizeopt" + (k === "lg" ? " lg" : ""), `<span class="fr">Bonjour !</span><span>${t}</span>`, () => { st.size = k; document.documentElement.dataset.size = k; pv.querySelectorAll(".sizeopt").forEach((x) => x.setAttribute("aria-checked", x === b ? "true" : "false")); });
        b.setAttribute("role", "radio"); b.setAttribute("aria-checked", st.size === k ? "true" : "false");
        pv.appendChild(b);
      });
      w.appendChild(pv);
      w.appendChild(button("btn big wide primary", "<span>次へ</span>" + icon("arrow"), () => go(1)));
      frame(w, true);
    }
    function tripStep() {
      const w = el("form", "ob");
      w.innerHTML = `<p class="ob-plate"><b>4</b><span>LE VOYAGE</span></p><h1>パリに着く日は？</h1><p class="lede">出発までの日数と、旅のしおりの日付に使います。この端末だけに保存されます。</p>
        <label for="obTrip">パリに着く日（4 日間の旅）</label><p class="hint">欄をタップすると日付を選べます</p><input id="obTrip" class="big-input" type="date" value="${st.trip ? st.trip.start : ""}">`;
      w.appendChild(button("btn big wide primary", "<span>次へ</span>" + icon("arrow"), () => w.requestSubmit()));
      w.appendChild(button("btn ghost wide", "<span>あとで決める</span>", () => go(1)));
      w.addEventListener("submit", (e) => { e.preventDefault(); const v = $("obTrip").value; if (v) Store.setTrip(v); go(1); });
      frame(w, true);
    }
    function doneStep() {
      const l = Store.lineOf(st.color);
      const w = el("div", "ob done");
      w.style.setProperty("--c", l.c);
      w.innerHTML = `<svg class="ob-open" viewBox="0 0 320 160" aria-hidden="true"><path class="track" d="M20 80 H300"/><path class="run" d="M20 80 H300"/><circle cx="20" cy="80" r="10"/><circle cx="300" cy="80" r="14" class="end"/><text x="300" y="124" text-anchor="middle">PARIS</text></svg>
        <p class="eyebrow">LIGNE ${l.line} · OUVERTURE</p><h1>${esc(st.name)} さんの路線が開通しました</h1><p class="lede">最初の駅は「BONJOUR（あいさつ）」。5 分で終わります。</p>`;
      w.appendChild(button("btn big wide primary", "<span>最初の駅へ</span>" + icon("arrow"), () => finish(true)));
      frame(w, false);
      App.sfx.chime(); App.haptic([10, 30, 10]);
    }
    function finish(ok, switched) {
      if (ok && !switched) {
        const id = Store.addProfile(st.name, st.color);
        Store.setPrefs({ size: st.size });
        if (o.onDone) o.onDone(id);
      }
      ov.classList.add("out");
      release();
      document.documentElement.classList.remove("staged");
      setTimeout(() => ov.remove(), App.reduced() ? 0 : 300);
      document.dispatchEvent(new CustomEvent("profile-changed"));
    }
    draw();
  }

  function switcher() {
    sheet("使う人を切り替える", (b, close) => {
      const me = Store.curId();
      const pl = el("div", "people");
      for (const p of Store.profiles()) {
        const x = button("person" + (p.id === me ? " on" : ""), `<span class="av" style="${App.avStyle(Store.lineOf(p.color).c)}">${esc(App.ini ? App.ini(p.name) : p.name.slice(0, 1))}</span><span>${esc(p.name)}</span>`, () => { close(); if (p.id !== me) { Store.switchTo(p.id); toast(p.name + "に切り替えました"); } });
        x.setAttribute("aria-pressed", p.id === me ? "true" : "false");
        pl.appendChild(x);
      }
      pl.appendChild(button("person add", `<span class="av add">${icon("plus")}</span><span>人を追加</span>`, () => { close(); addPerson(); }));
      b.appendChild(pl);
      b.appendChild(el("p", "hint", "記録は人ごとに分かれていて、この端末の中だけに保存されます。"));
      b.appendChild(button("btn ghost wide", icon("gear") + "<span>設定</span>", () => { close(); setTimeout(() => App.openSettings(), 280); }));
      b.appendChild(el("p", "hint center", "文字の大きさ・読み上げの速さ・旅の日程など"));
    });
  }

  const start = () => flow({});
  const addPerson = () => flow({ add: true });
  window.Onboard = { start, addPerson, colorPicker, switcher };
})();
