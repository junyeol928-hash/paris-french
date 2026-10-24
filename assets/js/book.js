/* しおり: 旅の日ごとの予定と使う表現（「見せる」で店員さんに画面を向ける）、困ったとき、自分用（★）、住所カード。
   旅行中は今日のページを最初に開く。オフラインでも使える（PWA） */
(function () {
  const { el, esc, button, icon, onTab, phraseRow, phrase, show, toast, $ } = App;
  const { LS } = Store;
  const WD = ["日", "月", "火", "水", "木", "金", "土"];

  function dayDate(i) {
    const t = Store.trip(); if (!t) return null;
    const d = Store.addDays(t.start, i);
    const [y, m, dd] = d.split("-").map(Number);
    return { iso: d, m, d: dd, wd: WD[new Date(y, m - 1, dd).getDay()] };
  }
  function defaultView() {
    const t = Store.trip();
    if (t) { const i = Store.dayNum(Store.today()) - Store.dayNum(t.start); if (i >= 0 && i < DATA.days.length) return DATA.days[i].id; }
    return LS.get("bkView", DATA.days[0].id);
  }

  function render(arg) {
    const root = $("v-book");
    const view = arg || defaultView();
    LS.set("bkView", view);
    root.innerHTML = "";
    root.appendChild(el("header", "vh", `<p class="eyebrow">CARNET DE VOYAGE</p><h1>旅のしおり</h1>`));
    const nav = el("div", "daynav"); nav.setAttribute("role", "tablist"); nav.setAttribute("aria-label", "しおりのページ");
    DATA.days.forEach((d, i) => {
      const dt = dayDate(i);
      const b = button("dstamp", `<b>${dt ? dt.d : i + 1}</b><span>${dt ? dt.m + "月 " + dt.wd : i + 1 + " 日目"}</span><small>${esc(d.short || d.ja)}</small>`, () => render(d.id));
      b.setAttribute("aria-label", `${dt ? dt.m + "月" + dt.d + "日（" + dt.wd + "）" : i + 1 + " 日目"}、${d.ja}`);
      b.setAttribute("role", "tab"); b.setAttribute("aria-selected", view === d.id ? "true" : "false");
      nav.appendChild(b);
    });
    root.appendChild(nav);
    const more = el("div", "chips bk-more");
    [["sos", "困ったとき", "sos"], ["fav", "保存した表現", "star"], ["addr", "住所カード", "pin"]].forEach(([id, t, ic]) => {
      const b = button("chip" + (id === "sos" ? " sos" : ""), icon(ic) + `<span>${t}</span>`, () => render(id));
      b.setAttribute("aria-pressed", view === id ? "true" : "false"); more.appendChild(b);
    });
    root.appendChild(more);
    const body = el("div", "bk-body"); root.appendChild(body);
    const d = DATA.days.find((x) => x.id === view);
    if (d) drawDay(body, d, DATA.days.indexOf(d));
    else if (view === "sos") drawSos(body);
    else if (view === "fav") drawFav(body);
    else drawAddr(body);
  }

  const list = (ids) => { const ul = el("ul", "phl"); ids.map(phrase).filter(Boolean).forEach((p) => ul.appendChild(phraseRow(p, { compact: true }))); return ul; };

  function drawDay(body, d, i) {
    const dt = dayDate(i);
    body.appendChild(el("div", "bk-hd", `<p class="bk-fr fr">${esc(d.fr)}</p><h2>${dt ? `${dt.m}/${dt.d}（${dt.wd}）` : ""}${esc(d.ja)}</h2>`));
    if (!Store.trip()) body.appendChild(el("p", "hint", `旅の初日を入れると、日付つきで表示されます。<a href="#" data-go="family">設定へ</a>`));
    const ol = el("ol", "tl");
    for (const [t, place, note] of d.stops) ol.appendChild(el("li", null, `<span class="tl-t">${esc(t)}</span><span class="tl-p">${esc(place)}${note ? `<small>${esc(note)}</small>` : ""}</span>`));
    body.appendChild(ol);
    const hd = el("div", "bk-subrow"); hd.appendChild(el("h3", "bk-sub", "この日に使う表現"));
    hd.appendChild(button("btn ghost small", icon("cards") + "<span>この日の予行演習</span>", () => Lesson.drill(d.ph, `${dt ? dt.m + "/" + dt.d + " " : ""}${d.ja}`, "旅の予行演習", null, "rehearse")));
    body.appendChild(hd);
    body.appendChild(list(d.ph));
  }
  function drawSos(body) {
    const b = el("a", "sosbox"); b.href = "tel:112";
    b.innerHTML = `<div class="sos-n"><small>緊急（警察・救急・消防）</small><b>112</b></div><p>ヨーロッパ共通の緊急番号。英語での対応を頼み、いる場所と何が起きたかを伝える。</p><span class="sos-call">${icon("phone")}押すと電話がかかります</span>`;
    body.appendChild(b);
    body.appendChild(el("div", null, `<div class="calls">
        <a class="call" href="tel:15">${icon("phone")}<span><b>15</b><small>救急車</small></span></a>
        <a class="call" href="tel:17">${icon("phone")}<span><b>17</b><small>警察</small></span></a>
        <a class="call" href="tel:18">${icon("phone")}<span><b>18</b><small>消防</small></span></a>
        <a class="call wide" href="tel:+33148886200">${icon("phone")}<span><b>01 48 88 62 00</b><small>日本大使館（パスポート紛失など）</small></span></a>
      </div><p class="hint">電話番号は出発前にもう一度確かめておくと安心です。</p>`));
    body.appendChild(list(DATA.phrases.filter((p) => p.s === "urgence").map((p) => p.id)));
  }
  function drawFav(body) {
    const ids = Object.entries(LS.get("fav", {})).sort((a, b) => a[1] - b[1]).map((x) => x[0]).filter((id) => phrase(id));
    body.appendChild(el("div", "bk-hd", `<p class="bk-fr fr">Mes phrases</p><h2>保存した表現</h2>`));
    if (!ids.length) { body.appendChild(el("p", "empty", "フレーズの星のボタンを押すと、ここに集まります。旅先でよく使いそうな表現を入れておくと、すぐ見せられます。")); return; }
    body.appendChild(list(ids));
  }
  function drawAddr(body) {
    const pr = Store.prefs();
    body.appendChild(el("div", "bk-hd", `<p class="bk-fr fr">Adresse de l’hôtel</p><h2>住所カード</h2><p class="lede">ホテルの名前と住所を入れておくと、タクシーで見せるカードになります。この端末だけに保存されます。</p>`));
    const f = el("form", "form");
    f.innerHTML = `<label for="bkName">ホテル名</label><input id="bkName" type="text" maxlength="80" autocomplete="off" placeholder="例: Hôtel ○○" value="${esc(pr.hotelName)}">
      <label for="bkAddr">住所</label><textarea id="bkAddr" rows="2" maxlength="160" placeholder="例: 9 rue ○○, 75005 Paris">${esc(pr.hotelAddr)}</textarea>`;
    f.appendChild(button("btn", "<span>保存する</span>", () => f.requestSubmit()));
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      /* 保存できたときだけ「保存しました」。失敗したら入力はそのまま残す（save-failed で別に知らせる） */
      if (Store.setPrefs({ hotelName: $("bkName").value.trim(), hotelAddr: $("bkAddr").value.trim() })) { toast("住所を保存しました"); render("addr"); }
    });
    const txt = [pr.hotelName, pr.hotelAddr].filter(Boolean).join("\n");
    const card = el("div", "addrcard");
    card.innerHTML = `<p class="ac-say fr">À cette adresse, s’il vous plaît.</p><p class="ac-addr">${txt ? esc(txt).replace(/\n/g, "<br>") : "（まだ住所が入っていません）"}</p><p class="ac-ja">この住所までお願いします</p>`;
    const sb = button("btn light", icon("show") + "<span>見せる</span>", () => show(txt, "この住所までお願いします", "", { lead: "À cette adresse, s’il vous plaît." }));
    sb.disabled = !txt; card.appendChild(sb);
    if (txt) { body.appendChild(card); body.appendChild(el("p", "eyebrow form-hd", "住所を直す")); body.appendChild(f); }
    else { body.appendChild(f); body.appendChild(card); }
  }

  /* SOS: どの画面からでもヘッダーの赤いボタンで開く。緊急番号・住所・助けを求める表現を 1 枚に */
  function openSos() {
    const pr = Store.prefs();
    App.sheet("困ったとき", (b, close) => {
      const sb112 = el("a", "sosbox", `<div class="sos-n"><small>緊急（警察・救急・消防）</small><b>112</b></div><p>ヨーロッパ共通の緊急番号。英語での対応を頼み、いる場所と何が起きたかを伝える。</p><span class="sos-call">${icon("phone")}押すと電話がかかります</span>`); sb112.href = "tel:112"; b.appendChild(sb112);
      b.appendChild(el("div", null, `<div class="calls">
        <a class="call" href="tel:15">${icon("phone")}<span><b>15</b><small>救急車</small></span></a>
        <a class="call" href="tel:17">${icon("phone")}<span><b>17</b><small>警察</small></span></a>
        <a class="call" href="tel:18">${icon("phone")}<span><b>18</b><small>消防</small></span></a>
        <a class="call wide" href="tel:+33148886200">${icon("phone")}<span><b>01 48 88 62 00</b><small>日本大使館（パスポート紛失など）</small></span></a>
      </div><p class="hint">電話番号は出発前にもう一度確かめておくと安心です。</p>`));
      const addr = [pr.hotelName, pr.hotelAddr].filter(Boolean).join("\n");
      if (addr) b.appendChild(button("btn ghost wide", icon("pin") + "<span>泊まっている所の住所を見せる</span>", () => show(addr, "この住所にいます", "", { lead: "Je suis à cette adresse." })));
      b.appendChild(list(["b25", "u01", "u02", "u03", "u06", "u19", "u04", "u05", "u18"]));
      b.appendChild(button("btn ghost wide", "<span>困ったときの表現を全部見る</span>", () => { close(); App.goTab("book", "sos"); }));
    }, { cls: "tall" });
  }
  App.openSos = openSos;

  onTab("book", render);
})();
