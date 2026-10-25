/* 起動: リンク（招待・家族カード）を読み、人がいなければ「はじめに」、いれば前回のタブを開く */
(function () {
  const { $, goTab, toast } = App;

  /* その人の路線色と文字の大きさを画面全体に反映 */
  function applyProfile() {
    const me = Store.cur();
    const root = document.documentElement;
    if (me) {
      const c = Store.lineOf(me.color).c;
      root.style.setProperty("--line", c);
      root.style.setProperty("--on-line", App.onColor(c));
      /* 路線色を文字に使う所（読みのカタカナなど）は、ライト・ダークそれぞれで 4.5:1 以上になる色を計算して使う */
      root.style.setProperty("--line-ink-l", App.inkOn(c, "#F4EFE5", "#1C1915"));
      root.style.setProperty("--line-ink-d", App.inkOn(c, "#1C1814", "#FFFFFF"));
    }
    const pr = me ? Store.prefs() : null;
    root.dataset.size = pr ? pr.size : "md";
    const aa = document.getElementById("hdAa"); if (aa) aa.setAttribute("aria-pressed", root.dataset.size === "lg" ? "true" : "false");
    root.dataset.motion = pr && pr.motion === "less" ? "less" : "full";
  }

  function boot() {
    const link = Store.readLink();
    App.initTabs();
    $("hdMe").addEventListener("click", () => Onboard.switcher());
    $("hdSos").addEventListener("click", () => App.openSos());
    $("hdAa").addEventListener("click", () => { const lg = Store.prefs().size !== "lg"; Store.setPrefs({ size: lg ? "lg" : "md" }); $("hdAa").setAttribute("aria-pressed", lg ? "true" : "false"); toast(lg ? "文字を大きくしました" : "文字をふつうに戻しました"); });
    /* 日付が変わったら描き直す（ホーム画面に置いたアプリを開いたまま翌日になったとき） */
    let shownDay = Store.today();
    const refresh = () => { if (document.visibilityState !== "visible" || !Store.cur()) return; if (Store.today() !== shownDay) { shownDay = Store.today(); App.renderHeader(); goTab(App.currentTab() || "home"); } };
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("pageshow", refresh);
    setInterval(refresh, 60000);
    document.addEventListener("profile-changed", () => { applyProfile(); App.renderHeader(); goTab(App.currentTab() || "home"); });
    document.addEventListener("prefs-changed", applyProfile);
    applyProfile();
    /* 見出し帯は名画の壁の上では透明に重ね、壁を過ぎたら白い帯に戻す */
    const solid = () => { const w = document.querySelector(".view:not([hidden]) > .wall"); document.documentElement.classList.toggle("hd-solid", window.scrollY > (w ? w.offsetHeight - 72 : 24)); };
    window.addEventListener("scroll", solid, { passive: true }); solid();
    document.addEventListener("click", () => requestAnimationFrame(solid));
    /* 保存できなかったときは一度だけ知らせる（何度も出すと邪魔なので） */
    let warned = false;
    document.addEventListener("save-failed", () => { if (warned) return; warned = true; toast("記録を保存できませんでした。プライベートブラウズを切るか、端末の空きを確かめてください"); });
    /* 新しい版が届いたら、使っている途中で勝手に再読み込みせず、知らせてから更新する */
    document.addEventListener("pwa-update", () => {
      App.sheet("新しい版があります", (b, close) => {
        b.appendChild(App.el("p", null, "アプリが新しくなりました。更新すると、新しい表現や直した所が使えます。記録はそのまま残ります。"));
        b.appendChild(App.button("btn big wide", "<span>更新する</span>", () => { close(); window.PWA && PWA.applyUpdate(); }));
        b.appendChild(App.button("btn ghost wide", "<span>あとで</span>", close));
      });
    });
    if (link.card) {
      const r = Store.addFamilyCard(link.card);
      /* 応援つきのカード: 声つきで「Bravo !」 */
      if (link.card.cheer && r === "ok") setTimeout(() => { App.toast(`${link.card.n} さんから応援が届きました — Bravo !`); App.TTS.speak("Bravo !"); App.sfx.chime(); }, 1200);
      setTimeout(() => toast(r === "ok" ? `${link.card.n} さんの進み具合を受け取りました` : r === "old" ? "もっと新しい進み具合を受け取り済みです" : "自分の端末にいる人のカードでした"), 600);
    }
    if (!Store.cur()) { Onboard.start(); return; }
    App.renderHeader();
    goTab(link.card ? "family" : Store.LS.get("tab", "home"));
    if (link.trip) setTimeout(() => toast("旅の日程を受け取りました"), 600);
  }
  boot();
})();
