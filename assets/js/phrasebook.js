/* フレーズ: 写真のポスターの場面 → その場面の表現。上の検索は日本語・フランス語・カタカナのどれでも引ける */
(function () {
  const { el, esc, button, icon, onTab, phraseRow, $ } = App;
  const { LS } = Store;
  /* 路線図の駅から開いたときの対応 */
  const FROM_STATION = { bonjour: "base", comprendre: "base", aeroport: "air", musee: "visite", carte: "menu", boutique: "shop" };
  /* 場面ごとに RATP の路線番号と色を割り当てる（駅名標の右上の丸） */
  const SCENE_ST = { base: "bonjour", air: "aeroport", taxi: "taxi", hotel: "hotel", cafe: "cafe", resto: "resto", menu: "carte", metro: "metro", visite: "musee", shop: "boutique", urgence: "urgence" };
  const lineOf = (sceneId) => { const st = Course.station(SCENE_ST[sceneId]); const n = st ? st.num : 1; return [String(n), Store.lineOf(Store.cur().color).c]; };
  const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’']/g, "'");

  function render(arg) {
    const root = $("v-phrases");
    if (arg) LS.set("phScene", FROM_STATION[arg] || arg);
    let cur = LS.get("phScene", "base");
    if (!App.scene(cur)) cur = "base";
    if (!root.firstChild) {
      root.innerHTML = `<header class="vh"><p class="eyebrow">PHRASES · ${DATA.phrases.length}</p><h1>場面別フレーズ</h1></header>
        <div class="search"><label class="sr" for="phQ">フレーズを探す</label>${icon("search")}<input id="phQ" type="search" placeholder="探す（水、トイレ、merci）" autocomplete="off" enterkeyhint="search"></div>
        <ul class="signs" id="phSigns" aria-label="場面"></ul><div class="listhd" id="phHead"></div><ul class="phl" id="phList"></ul>`;
      $("phQ").addEventListener("input", () => draw());
    }
    draw();
    function draw() {
      const q = norm($("phQ").value.trim());
      const signs = $("phSigns"); signs.innerHTML = "";
      DATA.scenes.slice().sort((a, b) => +lineOf(a.id)[0] - +lineOf(b.id)[0]).forEach((s) => {
        const n = DATA.phrases.filter((p) => p.s === s.id).length;
        const [num, col] = lineOf(s.id);
        const b = button("pscene" + (s.id === cur && !q ? " on" : ""), `${App.photo(SCENE_ST[s.id], "ps-ph")}<span class="ps-t"><b>${esc(s.ja)}</b><span class="fr-s">${esc(s.fr)}</span><small>${s.id === cur && !q ? "前回見た場面" : n + " 表現"}</small></span>`, () => { $("phQ").value = ""; LS.set("phScene", s.id); cur = s.id; draw(); $("phHead").scrollIntoView({ block: "start", behavior: App.reduced() ? "auto" : "smooth" }); const h = $("phHead").querySelector("h2"); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } });
        b.setAttribute("aria-pressed", s.id === cur && !q ? "true" : "false");
        b.setAttribute("aria-label", `${s.ja}（${s.fr}）、${n} 表現`);
        const li = el("li"); li.appendChild(b); signs.appendChild(li);
      });
      let items, title;
      if (q) { items = DATA.phrases.filter((p) => norm(p.fr + " " + p.ja + " " + p.kana + " " + (p.n || "")).includes(q)); title = `<h2>「${esc($("phQ").value.trim())}」<small>${items.length} 件</small></h2>`; }
      else { const s = App.scene(cur); items = DATA.phrases.filter((p) => p.s === cur); title = `${App.photo(SCENE_ST[cur], "lh-ph")}<h2><span class="fr">${esc(s.fr)}</span><small>${esc(s.ja)}</small></h2>`; }
      $("phHead").innerHTML = "";
      if (!q) { const up = button("btn ghost small up", icon("back") + "<span>場面一覧</span>", () => { $("phSigns").scrollIntoView({ block: "start", behavior: App.reduced() ? "auto" : "smooth" }); }); $("phHead").appendChild(up); }
      $("phHead").insertAdjacentHTML("beforeend", title);
      const list = $("phList"); list.innerHTML = "";
      if (!items.length) { list.appendChild(el("li", "empty", "見つかりませんでした。日本語でもフランス語でも探せます（例: 水、eau）")); return; }
      for (const p of items) list.appendChild(phraseRow(p));
    }
  }
  onTab("phrases", render);
})();
