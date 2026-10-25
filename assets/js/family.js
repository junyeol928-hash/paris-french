/* 家族: わたしのパスポート（駅のスタンプ）、家族の進み具合、カードを送る・招待する、この端末の人、設定 */
(function () {
  const { el, esc, button, icon, onTab, toast, sheet, $ } = App;
  const { LS } = Store;
  /* スタンプのインク。色は CSS の --ink0〜5（ライトとダークで明るさを変える） */
  const INKS = 6;

  /* 入国スタンプ風の SVG。押した日付が入る。ts が無ければ点線の空き枠 */
  function stampSVG(s, ts, big) {
    const name = s.fr.length > 9 && s.fr.includes(" ") ? s.fr.replace(" ", "\n") : s.fr;
    const lines = name.split("\n");
    /* 長い駅名は円の中の幅（約 74）に収まるよう、字の幅をそろえて縮める */
    const fit = (l, max) => (l.length > max ? ` textLength="74" lengthAdjust="spacingAndGlyphs"` : "");
    if (!ts) return `<svg class="stamp empty" viewBox="0 0 120 120" role="img" aria-label="${esc(s.ja)}（まだ）"><circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="5 5"/><text x="60" y="${lines.length > 1 ? 56 : 64}" text-anchor="middle" class="st-n">${lines.map((l, i) => `<tspan x="60" dy="${i ? 14 : 0}"${fit(l, 7)}>${esc(l)}</tspan>`).join("")}</text></svg>`;
    const c = `var(--ink${s.idx % INKS})`;
    const d = new Date(ts);
    const date = String(d.getDate()).padStart(2, "0") + "." + String(d.getMonth() + 1).padStart(2, "0") + "." + String(d.getFullYear()).slice(2);
    const rot = ((s.idx * 37) % 17) - 8;
    return `<svg class="stamp${big ? " land" : ""}" viewBox="0 0 120 120" role="img" aria-label="${esc(s.ja)}のスタンプ ${date}" style="--rot:${rot}deg;color:${c}">
      <defs><filter id="ink${s.idx}"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="${s.idx + 3}"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.9 1.35"/><feComposite in="SourceGraphic" operator="in"/></filter></defs>
      <g filter="url(#ink${s.idx})" fill="none" stroke="currentColor">
        <circle cx="60" cy="60" r="54" stroke-width="3"/><circle cx="60" cy="60" r="47" stroke-width="1.5"/>
        <path id="arc${s.idx}" d="M22 60a38 38 0 0176 0" stroke="none"/>
        <text class="st-top" fill="currentColor" stroke="none"><textPath href="#arc${s.idx}" startOffset="50%" text-anchor="middle">PARIS · FRANCE</textPath></text>
        <text x="60" y="${lines.length > 1 ? 60 : 67}" text-anchor="middle" class="st-n" fill="currentColor" stroke="none">${lines.map((l, i) => `<tspan x="60" dy="${i ? 15 : 0}"${fit(l, 7)}>${esc(l)}</tspan>`).join("")}</text>
        <text x="60" y="95" text-anchor="middle" class="st-d" fill="currentColor" stroke="none">${date}</text>
      </g></svg>`;
  }
  /* パスポート（到着証明書）を 1 枚の画像にする。canvas で描き、共有できる端末は共有シート、できなければ保存 */
  async function certificate(opts) {
    const me = Store.cur(); if (!me) return;
    try {
      await Promise.all(["700 72px 'Zen Maru Gothic'", "700 30px 'Zen Maru Gothic'", "italic 500 56px Fraunces", "600 92px Jost", "500 20px Jost"].map((f) => document.fonts.load(f)));
      await document.fonts.ready;
    } catch (e) { /* 書体が読めなくても代わりの書体で描く */ }
    const W = 1080, H = 1350, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const g = cv.getContext("2d");
    const line = Store.lineOf(me.color).c;
    const navy = "#1B2A5C", ink = "#14213D", paper = "#F4EFE4";
    /* 地は画面のパスポートと同じ紙: 生成りに、路線色のごく薄い斜線 */
    g.fillStyle = paper; g.fillRect(0, 0, W, H);
    g.save(); g.strokeStyle = line; g.globalAlpha = 0.07; g.lineWidth = 2;
    for (let x = -H; x < W; x += 21) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + H, H); g.stroke(); }
    g.restore();
    const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
    /* 駅名標 PARIS */
    g.fillStyle = navy; rr(80, 80, W - 160, 150, 18); g.fill();
    g.strokeStyle = "#fff"; g.lineWidth = 5; rr(92, 92, W - 184, 126, 12); g.stroke();
    g.fillStyle = "#fff"; g.font = "600 92px Jost, Futura, sans-serif"; g.textBaseline = "middle"; g.fillText("PARIS", 130, 158);
    g.fillStyle = line; g.beginPath(); g.arc(W - 160, 155, 52, 0, Math.PI * 2); g.fill();
    g.fillStyle = App.onColor(line); g.textAlign = "center";
    g.font = "600 17px Jost, sans-serif"; g.fillText("LIGNE", W - 160, 130);
    g.font = "600 46px Jost, sans-serif"; g.fillText(Store.lineOf(me.color).line, W - 160, 168); g.textAlign = "left";
    /* 名前と見出し */
    g.fillStyle = ink; g.font = "italic 500 56px Fraunces, Georgia, serif"; g.fillText("Passeport de langue", 80, 310);
    g.font = "700 72px 'Zen Maru Gothic', sans-serif"; g.fillText(me.name, 80, 400);
    g.fillStyle = "#5D6680"; g.font = "700 34px 'Zen Maru Gothic', sans-serif";
    const t = Store.trip(); const stamps = LS.get("stamps", {});
    const sts = Course.stations().filter((s) => !s.terminus);
    g.fillText(`フランス語の路線 ${Object.keys(stamps).length} / ${sts.length} 駅${t ? " · パリ到着 " + t.start.replace(/-/g, "/") : ""}`, 80, 462);
    /* スタンプ */
    const inks = ["#2E7D4F", "#1F5FAF", "#B23A2B", "#7A3F8F", "#8A5A1E", "#0E6E73"];
    const cols = 5, size = 168, gap = 22, x0 = (W - (cols * size + (cols - 1) * gap)) / 2, y0 = 530;
    /* 円の上の弧に沿って文字を置く（入国スタンプの « PARIS · FRANCE »） */
    const arcText = (text, r, px) => {
      g.font = `600 ${px}px Jost, sans-serif`;
      const sp = 2, ws = [...text].map((ch) => g.measureText(ch).width + sp);
      let a = -Math.PI / 2 - ws.reduce((x, y) => x + y, 0) / (2 * r);
      for (let k = 0; k < ws.length; k++) {
        a += ws[k] / (2 * r);
        g.save(); g.rotate(a + Math.PI / 2); g.fillText(text[k], 0, -r); g.restore();
        a += ws[k] / (2 * r);
      }
    };
    sts.forEach((s, i) => {
      const cx = x0 + (i % cols) * (size + gap) + size / 2, cy = y0 + Math.floor(i / cols) * (size + 18) + size / 2;
      const done = stamps[s.id];
      g.save(); g.translate(cx, cy); g.rotate((((s.idx * 37) % 17) - 8) * Math.PI / 180);
      g.strokeStyle = done ? inks[s.idx % inks.length] : "#C9C6BC"; g.fillStyle = g.strokeStyle;
      g.setLineDash(done ? [] : [10, 10]); g.lineWidth = done ? 6 : 3; g.beginPath(); g.arc(0, 0, size / 2 - 8, 0, Math.PI * 2); g.stroke();
      if (done) { g.lineWidth = 3; g.beginPath(); g.arc(0, 0, size / 2 - 22, 0, Math.PI * 2); g.stroke(); }
      g.setLineDash([]); g.textAlign = "center"; g.textBaseline = "middle";
      g.fillStyle = done ? g.strokeStyle : "#9AA0AE";
      /* 駅名はどれも同じ字の大きさ。長い名前は横だけ詰める（画面のスタンプの textLength と同じ考え方） */
      g.font = "600 26px Jost, sans-serif";
      const wName = g.measureText(s.fr).width, room = size - 66;
      g.save(); g.scale(Math.min(1, room / wName), 1); g.fillText(s.fr, 0, done ? 2 : 0); g.restore();
      if (done) {
        arcText("PARIS · FRANCE", size / 2 - 33, 14);
        const d = new Date(done); g.font = "500 18px Jost, sans-serif";
        g.fillText(`${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getFullYear()).slice(2)}`, 0, 38);
      }
      g.restore();
    });
    /* 家族 */
    const nSt = (o) => Object.keys(o || {}).length;
    const fam = Store.profiles().map((p) => ({ n: p.name, c: Store.lineOf(p.color).c, l: Store.lineOf(p.color).line, k: nSt(Store.raw.get("p:" + p.id + ":stamps", {})) }))
      .concat(Object.values(Store.family()).map((c) => ({ n: c.n, c: Store.lineOf(c.c).c, l: Store.lineOf(c.c).line, k: (c.st || []).length })));
    const rows = Math.ceil(sts.length / cols);
    let fx = 80; const fy = Math.min(H - 150, y0 + (rows - 1) * (size + 18) + size + 100);   /* 見出しが最後の列のスタンプに重ならない位置 */
    g.font = "700 30px 'Zen Maru Gothic', sans-serif"; g.textAlign = "left";
    g.fillStyle = "#5D6680"; g.fillText("EN FAMILLE", fx, fy - 70);
    for (const f of fam.slice(0, 5)) {
      g.fillStyle = f.c; g.beginPath(); g.arc(fx + 30, fy, 30, 0, Math.PI * 2); g.fill();
      g.fillStyle = App.onColor(f.c); g.textAlign = "center"; g.font = "700 26px 'Zen Maru Gothic', sans-serif"; g.fillText(String(f.l), fx + 30, fy + 2);
      g.textAlign = "left"; g.fillStyle = ink; g.font = "700 28px 'Zen Maru Gothic', sans-serif"; g.fillText(f.n, fx + 70, fy - 12);
      const wN = g.measureText(f.n).width;
      g.fillStyle = "#5D6680"; g.font = "600 22px Jost, 'Zen Maru Gothic', sans-serif"; g.fillText(`${f.k} / ${sts.length} 駅`, fx + 70, fy + 22);
      fx += 90 + Math.max(wN, g.measureText(`${f.k} / ${sts.length} 駅`).width);
    }
    g.textAlign = "right"; g.fillStyle = line; g.font = "italic 500 64px Fraunces, Georgia, serif"; g.fillText("Bon voyage !", W - 80, H - 56);
    g.textAlign = "left";
    if (opts && opts.preview) return cv.toDataURL("image/png");   /* 確認用（画面写真のスクリプト） */
    const blob = await new Promise((r) => cv.toBlob(r, "image/png"));
    if (!blob) { toast("画像を作れませんでした"); return; }
    const file = new File([blob], `paris-passport-${me.name}.png`, { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], title: "パリ旅のフランス語", text: `${me.name}のことばのパスポート` }).catch(() => {}); return; }
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = file.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast("パスポートの画像を保存しました");
  }

  window.Passport = { stampSVG, certificate };

  function members() {
    const me = Store.curId();
    const out = Store.profiles().map((p) => ({ id: p.id, name: p.name, c: Store.lineOf(p.color).c, me: p.id === me, local: true, streak: Store.streakOf(p.id), stamps: Object.keys(LS.of(p.id, "stamps", {})).length, idx: Course.indexFor(p.id), learned: Course.learnedCount(p.id) }));
    for (const c of Object.values(Store.family())) out.push({ id: c.id, name: c.n, c: Store.lineOf(c.c).c, card: true, streak: c.s, stamps: c.st.length, idx: c.p || 0, at: c.t });
    return out;
  }

  function render() {
    const root = $("v-family");
    const me = Store.cur(); if (!me) return;
    root.innerHTML = "";
    root.appendChild(el("header", "vh", `<figure class="vign" aria-hidden="true"><img src="assets/img/il/v-family.webp" alt="" width="1200" height="800" decoding="async"></figure><p class="eyebrow fr-lbl" lang="fr">En famille</p><h1>家族とパスポート</h1>`));

    /* 家族だからできる練習: 1 台を渡し合って、店員とお客の役で会話する（家族の画面のいちばん上） */
    const duo = el("section", "duo-cta");
    duo.innerHTML = `<p class="eyebrow"><i class="fr-lbl" lang="fr">Ensemble</i> · 一緒に</p><h2>1 台を渡し合って、会話を練習</h2><p>1 人が店員、1 人がお客。カフェやホテルの場面を、家族で役を替えながら声に出します。</p>`;
    duo.appendChild(button("btn big board", icon("chat") + "<span>家族で会話を始める</span>", () => App.goTab("practice", "talk")));
    root.appendChild(duo);

    /* 家族の進み具合 */
    const fam = el("section", "fam card");
    fam.appendChild(el("div", "pp-hd", `<div><p class="eyebrow fr-lbl" lang="fr">La famille</p><h2>家族の進み具合</h2></div>`));
    const total = Course.stations().length - 1;
    const ul = el("ul", "members");
    const sts2 = Course.stations();
    for (const m of members().sort((a, b) => (b.me ? 1 : 0) - (a.me ? 1 : 0))) {
      const li = el("li", "member");
      const here = sts2[Math.min(m.idx, sts2.length - 1)];
      li.innerHTML = `${App.roundel(m.c, "av-rdl")}
        <div class="m-t"><b>${esc(m.name)}${m.me ? '<small class="tag me">あなた</small>' : m.card ? '<small class="tag">リンクで受け取り</small>' : '<small class="tag">この端末</small>'}</b>
        <span class="m-here">${App.medal(here.id, "m-medal")}<span><small>いまの駅</small>${esc(here.ja)}<span class="fr-s" lang="fr">${esc(App.titleFr(here.fr))}</span></span></span>
        <small>${m.streak ? m.streak + " 日続けて練習" : "これから"}${m.card ? " · " + (() => { const d = new Date(typeof m.at === "number" ? m.at : Date.parse(m.at) || 0); return d.getMonth() + 1 + "/" + d.getDate(); })() + " 時点" : ""}</small></div>`;
      if (m.card) li.querySelector(".m-t").appendChild(button("linkbtn", "<span>外す</span>", () => {
        const card = Store.family()[m.id];
        Store.removeFamilyCard(m.id); render();
        App.toast(`${m.name} さんを外しました`, { label: "元に戻す", run: () => { Store.restoreFamilyCard(card); render(); } });
      }, m.name + "さんのカードを外す"));
      ul.appendChild(li);
    }
    fam.appendChild(ul);
    const act = el("div", "fam-act");
    act.appendChild(button("btn ghost wide", icon("share") + "<span>進み具合を家族に送る</span>", () => shareLink(Store.cardUrl(me.id), `${me.name}のフランス語の進み具合`, `パリ旅のフランス語：${me.name}は ${Object.keys(stamps).length} 駅まで進みました。開くと家族の路線図に表示されます。`)));
    act.appendChild(button("btn ghost", icon("star") + "<span>応援を送る</span>", () => shareLink(Store.cardUrl(me.id, true), `${me.name}から応援`, `Bravo ! ${me.name}から応援が届きました。パリまで一緒にがんばろう。`)));
    act.appendChild(button("btn ghost", icon("plus") + "<span>家族を招待</span>", () => shareLink(Store.inviteUrl(), "パリ旅のフランス語", "家族のパリ旅行に向けて、一緒にフランス語を覚えよう。開いて自分の名前を入れるだけで始められます。")));
    fam.appendChild(act);
    fam.appendChild(el("p", "hint", "記録は各自のスマホに保存されます。家族の進み具合は、送られてきたリンクを開くとここに並びます。"));
    root.appendChild(fam);

    /* わたしの美術館 */
    root.appendChild(museum());

    /* わたしのパスポート */
    const stamps = LS.get("stamps", {});
    const pass = el("section", "passport card");
    const sts = Course.stations().filter((s) => !s.terminus);
    pass.innerHTML = `<div class="pp-hd"><div><p class="eyebrow fr-lbl" lang="fr">Passeport de langue</p><h2>${esc(me.name)} のパスポート</h2></div><span class="pp-n"><b>${Object.keys(stamps).length}</b>/ ${sts.length}</span></div>`;
    const grid = el("div", "stamps");
    for (const s of sts) { const d = stamps[s.id] ? new Date(stamps[s.id]) : null; grid.appendChild(el("div", "stamp-cell" + (d ? "" : " todo"), stampSVG(s, stamps[s.id]) + `<span>${esc(s.ja)}</span><small>${d ? d.getMonth() + 1 + "/" + d.getDate() : "まだ"}</small>`)); }
    pass.appendChild(grid);
    pass.appendChild(button("btn ghost wide", icon("download") + "<span>パスポートを画像にする</span>", () => certificate()));
    root.appendChild(pass);

    /* この端末の人 */
    const dev = el("section", "card");
    dev.appendChild(el("div", "pp-hd", `<div><p class="eyebrow fr-lbl" lang="fr">Cet appareil</p><h2>この端末を使う人</h2></div>`));
    const pl = el("div", "people");
    for (const p of Store.profiles()) {
      const b = button("person" + (p.id === me.id ? " on" : ""), `${App.roundel(p.color, "av-rdl")}<span>${esc(p.name)}</span>`, () => { if (p.id !== me.id) { Store.switchTo(p.id); toast(p.name + "に切り替えました"); } });
      b.setAttribute("aria-pressed", p.id === me.id ? "true" : "false");
      pl.appendChild(b);
    }
    pl.appendChild(button("person add", `<span class="av add">${icon("plus")}</span><span>人を追加</span>`, () => Onboard.addPerson()));
    dev.appendChild(pl);
    dev.appendChild(button("btn ghost", icon("gear") + "<span>名前と色を変える</span>", () => editMe()));
    root.appendChild(dev);

    const st = el("section", "card");
    st.appendChild(el("div", "pp-hd", `<div><p class="eyebrow">設定 · RÉGLAGES</p><h2>文字の大きさ・速さ・旅の日程</h2></div>`));
    st.appendChild(button("btn ghost wide", icon("gear") + "<span>設定を開く</span>", () => openSettings()));
    root.appendChild(st);
  }

  function openSettings() { sheet("設定", (b) => b.appendChild(settings()), { cls: "tall", onClose: () => { if (App.currentTab() === "family") render(); } }); }
  App.openSettings = openSettings;

  function shareLink(url, title, text) {
    if (navigator.share) { navigator.share({ title, text, url }).catch(() => {}); return; }
    sheet("リンクを送る", (b) => {
      b.appendChild(el("p", "muted", "このリンクを LINE やメールで送ってください。"));
      const inp = el("input", "copyfield"); inp.value = url; inp.readOnly = true; inp.setAttribute("aria-label", "送るリンク");
      b.appendChild(inp);
      b.appendChild(button("btn wide", "<span>リンクをコピー</span>", () => {
        const done = () => toast("コピーしました");
        if (navigator.clipboard) navigator.clipboard.writeText(url).then(done).catch(() => { inp.select(); });
        else inp.select();
      }));
    });
  }

  function editMe() {
    const me = Store.cur();
    sheet("名前と色", (b, close) => {
      const f = el("form", "form");
      f.innerHTML = `<label for="edName">名前（家族に見える呼び名）</label><input id="edName" type="text" maxlength="20" value="${esc(me.name)}" autocomplete="off">`;
      const colors = Onboard.colorPicker(me.color);
      f.appendChild(el("span", "lbl", "路線の色")); f.appendChild(colors.el);
      f.appendChild(button("btn wide", "<span>保存</span>", () => f.requestSubmit()));
      f.addEventListener("submit", (e) => { e.preventDefault(); const n = $("edName").value.trim(); if (!n) return; Store.updateProfile(me.id, { name: n, color: colors.value() }); close(); toast("保存しました"); });
      b.appendChild(f);
      const del = button("btn danger ghost wide", "<span>この人の記録を消す</span>", () => {
        b.innerHTML = "";
        b.appendChild(el("p", null, `${esc(me.name)} の記録（スタンプ・カード・設定）をこの端末から消します。元には戻せません。`));
        b.appendChild(button("btn danger wide", "<span>消す</span>", () => { Store.removeProfile(me.id); close(); if (!Store.cur()) Onboard.start(); }));
        b.appendChild(button("btn ghost wide", "<span>やめる</span>", close));
      });
      b.appendChild(del);
    });
  }

  function settings() {
    const pr = Store.prefs();
    const t = Store.trip();
    const sec = el("div", "settings");
    const f = el("div", "form");
    f.innerHTML = `
      <span class="lbl" id="lbSize">文字の大きさ</span>
      <div class="seg" role="radiogroup" aria-labelledby="lbSize"><button type="button" role="radio" data-size="md" aria-checked="${pr.size === "md"}">ふつう</button><button type="button" role="radio" data-size="lg" aria-checked="${pr.size === "lg"}">大きい</button></div>
      <label for="stRate">読み上げの速さ</label>
      <select id="stRate"><option value="0.8">ゆっくりめ</option><option value="1">ふつう</option><option value="1.15">速め</option></select>
      <span class="lbl" id="lbMotion">画面の動き</span>
      <div class="seg" role="radiogroup" aria-labelledby="lbMotion"><button type="button" role="radio" data-motion="full" aria-checked="${pr.motion === "full"}">ふつう</button><button type="button" role="radio" data-motion="less" aria-checked="${pr.motion === "less"}">減らす</button></div>
      <span class="lbl" id="lbGrades">復習カードの答え方</span>
      <div class="seg" role="radiogroup" aria-labelledby="lbGrades"><button type="button" role="radio" data-grades="4" aria-checked="${pr.grades === "4"}">4 段階</button><button type="button" role="radio" data-grades="2" aria-checked="${pr.grades === "2"}">2 択</button></div>
      <span class="lbl" id="lbSound">効果音</span>
      <div class="seg" role="radiogroup" aria-labelledby="lbSound"><button type="button" role="radio" data-sound="1" aria-checked="${pr.sound}">鳴らす</button><button type="button" role="radio" data-sound="0" aria-checked="${!pr.sound}">鳴らさない</button></div>
      <label for="stTrip">パリに着く日（4 日間の旅）</label>
      <input id="stTrip" type="date" value="${t ? t.start : ""}">`;
    sec.appendChild(f);
    f.querySelector("#stRate").value = String(pr.rate === 1 ? 1 : pr.rate < 1 ? 0.8 : 1.15);
    const radio = (sel, fn) => f.querySelectorAll(sel).forEach((b) => b.addEventListener("click", () => { fn(b); b.parentNode.querySelectorAll("[role=radio]").forEach((x) => x.setAttribute("aria-checked", x === b ? "true" : "false")); }));
    radio("[data-size]", (b) => Store.setPrefs({ size: b.dataset.size }));
    radio("[data-motion]", (b) => Store.setPrefs({ motion: b.dataset.motion }));
    radio("[data-grades]", (b) => Store.setPrefs({ grades: b.dataset.grades }));
    radio("[data-sound]", (b) => { Store.setPrefs({ sound: b.dataset.sound === "1" }); if (b.dataset.sound === "1") App.sfx.ok(); });
    f.querySelector("#stRate").addEventListener("change", (e) => { Store.setPrefs({ rate: +e.target.value }); App.TTS.speak("Bonjour, bienvenue à Paris."); });
    f.querySelector("#stTrip").addEventListener("change", (e) => { const v = e.target.value; if (v) { Store.setTrip(v); App.renderHeader(); toast("旅の日程を保存しました"); } });

    const data = el("div", "row");
    data.appendChild(button("btn ghost", icon("download") + "<span>記録を書き出す</span>", () => {
      const me = Store.cur();
      const blob = new Blob([JSON.stringify(Store.exportProfile(me.id))], { type: "application/json" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `paris-fr-${me.name}.json`;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }));
    const file = el("input"); file.type = "file"; file.accept = "application/json,.json"; file.hidden = true;
    file.addEventListener("change", () => {
      const fl = file.files[0]; file.value = ""; if (!fl) return;   /* 同じファイルをもう一度選んでも反応するように */
      fl.text().then((txt) => { const p = Store.importProfile(JSON.parse(txt)); toast(p.name + " の記録を読み込みました"); }).catch((e) => toast("読み込めませんでした：" + e.message));
    });
    data.appendChild(file);
    data.appendChild(button("btn ghost", icon("upload") + "<span>記録を読み込む</span>", () => file.click()));
    sec.appendChild(el("h3", "sub", "機種変更・別の端末へ"));
    sec.appendChild(data);
    /* オフラインの準備（教材と音声を端末に保存できたか） */
    const off = el("p", "offline-st", "オフラインの準備: 確かめています…");
    sec.appendChild(el("h3", "sub", "電波がない所で使う"));
    sec.appendChild(off);
    let tries = 0;
    const check = () => {
      if (!off.isConnected && tries > 0) return;
      if (!(window.PWA && PWA.status)) { off.textContent = "このブラウザではオフラインの準備ができません。"; return; }
      PWA.status().then((st) => {
        off.className = "offline-st " + st;
        off.innerHTML = st === "ready" ? `${icon("check")}<span>準備できています。電波がない所でも、レッスン・フレーズ・音声・しおりが使えます（発音チェックだけは通信が必要）。</span>`
          : st === "installing" ? `<span>準備中です（教材と音声を保存しています）。この画面を開いたまま少し待ってください。</span>`
          : `<span>このブラウザではオフラインの準備ができません。Safari や Chrome で開くか、ホーム画面に追加してください。</span>`;
        if (st === "installing" && tries++ < 30) setTimeout(check, 2000);
      });
    };
    check();
    if (window.PWA) {
      const inst = el("div", "install");
      if (PWA.canInstallHint && PWA.canInstallHint()) inst.innerHTML = `<h3 class="sub">ホーム画面に追加</h3><p class="hint">Safari の共有ボタン ${icon("share")} から「ホーム画面に追加」を選ぶと、アプリのように開けて、電波がない所でも使えます。</p>`;
      else if (PWA.canPrompt && PWA.canPrompt()) { inst.appendChild(el("h3", "sub", "ホーム画面に追加")); inst.appendChild(el("p", "hint", "アプリのように開けて、電波がない所でも使えます。")); inst.appendChild(button("btn ghost", icon("download") + "<span>ホーム画面に追加</span>", () => PWA.promptInstall())); }
      sec.appendChild(inst);
    }
    sec.appendChild(el("h3", "sub", "絵の出典"));
    sec.appendChild(el("p", "hint", "駅の絵は、パリを描いた名画（著作権の切れたパブリックドメイン）の画像を Wikimedia Commons から借りています。"));
    sec.appendChild(button("btn ghost wide", icon("list") + "<span>絵の出典を見る</span>", openCredits));
    return sec;
  }

  /* わたしの美術館: レッスンを終えるごとに、その回の名画が 1 枚ずつ並ぶ */
  function museum() {
    const seen = new Set(), items = [];
    for (const s of Course.stations()) for (const l of s.lessons) {
      const a = App.lessonArt(l.id);
      if (seen.has(a) || !(DATA.photos || {})[a]) continue;
      seen.add(a); items.push({ a, done: Course.isDone(l.id), s });
    }
    const got = items.filter((x) => x.done).length;
    const sec = el("section", "musee card");
    sec.innerHTML = `<div class="pp-hd"><div><p class="eyebrow fr-lbl" lang="fr">Mon musée</p><h2>わたしの美術館</h2></div><span class="pp-n"><b>${got}</b> / ${items.length} 枚</span></div>
      <p class="hint">レッスンを 1 つ終えるたびに、その回の名画が 1 枚ここに掛かります。</p>`;
    const g = el("div", "mu-grid");
    let empties = 0;
    for (const x of items) {
      if (!x.done && ++empties > 2) continue;
      const p = DATA.photos[x.a];
      if (x.done) g.appendChild(button("mu-f", `<span class="mu-im"><img src="${p.src}" alt="" loading="lazy" decoding="async" style="object-position:${p.pos}"></span><span class="mu-c" lang="fr"><i>${esc(p.work)}</i>${esc(p.artist.split(" ").slice(-1)[0])}</span>`, () => sheet(p.work, (b) => {
        b.insertAdjacentHTML("beforeend", `<figure class="mu-big"><img src="${p.src}" alt="" decoding="async"></figure><p class="aff-cr" lang="fr">${App.creditHtml(x.a)}</p><p class="hint">${esc(x.s.ja)}の駅で手に入れた絵</p>`);
      }), `${p.artist}「${p.work}」`));
      else g.appendChild(el("span", "mu-f empty", `<span class="mu-im"></span><span class="mu-c">次の絵</span>`));
    }
    sec.appendChild(g);
    if (items.length - got > 2) sec.appendChild(el("p", "hint", `ほかに ${items.length - got - 2} 枚の絵が、これからの駅で待っています。`));
    return sec;
  }

  /* 絵ごとの画家・作品・ライセンス・元のページ */
  function openCredits() {
    sheet("絵の出典", (b) => {
      b.appendChild(el("p", "hint", "どの絵も、画面に合わせて縮小と切り抜きをしています。"));
      const ul = el("ul", "credits");
      for (const [id, p] of Object.entries(DATA.photos)) {
        const st = Course.station(id);
        const li = el("li");
        li.innerHTML = `${App.photo(id, "cr-ph")}<div><b>${esc(st ? st.ja + "（" + st.fr + "）" : id === "welcome" ? "はじめの画面" : id)}</b>
          <span lang="fr"><i>${esc(p.work || p.title)}</i>${p.year ? ", " + esc(p.year) : ""}</span><span>${esc(p.artist || p.author || "不明")}</span>
          <span>${p.licenseUrl ? `<a href="${esc(p.licenseUrl)}" target="_blank" rel="noopener">${esc(p.license)}</a>` : esc(p.license)} · <a href="${esc(p.source)}" target="_blank" rel="noopener">元のページ</a></span></div>`;
        ul.appendChild(li);
      }
      b.appendChild(ul);
    }, { cls: "tall" });
  }

  onTab("family", render);
})();
