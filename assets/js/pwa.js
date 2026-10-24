/* オフライン対応（service worker の登録）と「ホーム画面に追加」の手伝い。
   https か localhost のときだけ動く（file:// で開いたときは何もしない） */
(function () {
  let deferred = null, waiting = null, applying = false, failed = false;
  const ok = "serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1");
  const standalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e; document.dispatchEvent(new CustomEvent("pwa-installable")); });

  function notify(w) { waiting = w; document.dispatchEvent(new CustomEvent("pwa-update")); }
  if (ok) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").then((reg) => {
        if (reg.waiting && navigator.serviceWorker.controller) notify(reg.waiting);
        reg.addEventListener("updatefound", () => {
          const w = reg.installing;
          if (w) w.addEventListener("statechange", () => { if (w.state === "installed" && navigator.serviceWorker.controller) notify(w); });
        });
      }).catch((e) => { failed = true; console.warn("オフライン対応を登録できませんでした", e); });
      let reloaded = false;
      /* 初めて保存が終わったとき（clients.claim）は再読み込みしない。入力やレッスンの途中を消さないため */
      navigator.serviceWorker.addEventListener("controllerchange", () => { if (applying && !reloaded) { reloaded = true; location.reload(); } });
    });
  }

  window.PWA = {
    applyUpdate() { if (waiting) { applying = true; waiting.postMessage("SKIP_WAITING"); } },
    /* オフラインの準備: ready（保存済み）/ installing（保存中）/ none（使えない） */
    status() {
      if (!ok) return Promise.resolve("none");
      return navigator.serviceWorker.getRegistration().then((r) => {
        if (!r) return failed ? "none" : "installing";
        if (r.active && navigator.serviceWorker.controller) return caches.keys().then((ks) => (ks.some((k) => k.startsWith("paris-fr-") && k !== "paris-fr-fonts") ? "ready" : "installing"));
        return "installing";
      }).catch(() => "none");
    },
    /* iPhone の Safari ではインストールの合図が無いので、共有ボタンからの手順を案内する */
    canInstallHint() { return /iPhone|iPad|iPod/.test(navigator.userAgent) && !standalone(); },
    canPrompt() { return !!deferred && !standalone(); },
    promptInstall() { if (!deferred) return; deferred.prompt(); deferred.userChoice.finally(() => { deferred = null; }); },
    standalone,
  };
})();
