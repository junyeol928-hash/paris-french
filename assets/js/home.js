/* ホーム「わたしの路線」: 次の駅の名画の壁（今日のレッスン）、今日の一文、今日の 3 つ、路線（運行表・家族の現在地） */
(function () {
  const { el, esc, button, icon, onTab, $ } = App;

  function tripState() {
    const t = Store.trip();
    if (!t) return null;
    const now = Store.dayNum(Store.today()), s = Store.dayNum(t.start), e = s + t.days - 1;
    if (now < s) return { kind: "before", n: s - now };
    if (now <= e) return { kind: "during", n: now - s + 1 };
    return { kind: "after", n: now - e };
  }

  /* 家族の名前（頭文字の重なりを見るため） */
  const allNames = () => Store.profiles().map((p) => p.name).concat(Object.values(Store.family()).map((c) => c.n));
  const ini = (name) => App.initials(name, allNames());
  App.ini = ini;

  /* 家族の現在地: この端末の他の人 + 受け取ったカード */
  function familyAt() {
    const me = Store.curId();
    const out = [];
    for (const p of Store.profiles()) if (p.id !== me) out.push({ id: p.id, name: p.name, c: Store.lineOf(p.color).c, idx: Course.indexFor(p.id) });
    for (const c of Object.values(Store.family())) out.push({ id: c.id, name: c.n, c: Store.lineOf(c.c).c, idx: c.p || 0, card: true });
    return out;
  }

  /* レッスンの所要時間（どの画面でも同じ計算） */
  const minutes = (l) => (l.kind === "dlg" ? 3 : l.kind === "rules" ? 4 : Math.max(3, Math.round(l.ids.length * 0.8)));
  App.lessonMinutes = minutes;

  /* しおりの何日目に使う表現がある駅か */
  function tripDaysFor(s) {
    const set = new Set(s.phraseIds);
    return DATA.days.map((d, i) => ({ i, d, n: d.ph.filter((id) => set.has(id)).length })).filter((x) => x.n > 0);
  }

  function stationSheet(s) {
    const curIdx = Course.indexFor();
    const done = Course.stationDone(s);
    const here = familyAt().filter((f) => f.idx === s.idx);
    App.sheet(s.ja, (b, close) => {
      b.appendChild(el("div", "st-hd", `${App.medal(s.id, "st-medal")}<p><span class="ttl" lang="fr">${esc(App.titleFr(s.fr))}</span><small>${String(s.num).padStart(2, "0")} 番目の駅</small></p>`));
      const p = Course.stationProgress(s);
      b.appendChild(el("p", "muted", `${done ? "修了しました" : s.idx === curIdx ? "いまの駅" : s.idx < curIdx ? "通過済み" : "これからの駅"} · レッスン ${p.d} / ${p.n}${s.phraseIds.length ? " · 表現 " + s.phraseIds.length : ""}`));
      const days = tripDaysFor(s);
      if (days.length) {
        const t = Store.trip();
        b.appendChild(el("p", "hint", "旅で使う日: " + days.map((x) => { const d = t ? Store.addDays(t.start, x.i).slice(5).replace("-", "/") : (x.i + 1) + " 日目"; return `${d}（${esc(x.d.ja)}）`; }).join("、")));
      }
      if (here.length) b.appendChild(el("p", "hint", here.map((f) => esc(f.name)).join("、") + " がこの駅にいます"));
      const next = s.lessons.find((l) => !Course.isDone(l.id));
      if (next && s.idx <= curIdx) b.appendChild(button("btn big wide", `<span>${Course.isDone(s.lessons[0].id) ? "続きから乗る" : "乗る"}</span>` + icon("arrow"), () => { close(); Lesson.start(next.id, { onClose: render }); }));
      if (done) {
        const list = el("div", "lesson-list");
        s.lessons.forEach((l, i) => list.appendChild(button("btn ghost wide", `<span>${l.kind === "dlg" ? "会話をもう一度" : l.kind === "rules" ? "きまり " + (i + 1) + " をもう一度" : "レッスン " + (i + 1) + " をもう一度"}</span>`, () => { close(); Lesson.start(l.id, { onClose: render, single: true }); })));
        b.appendChild(list);
      }
      if (s.rules) b.appendChild(button("btn ghost wide", icon("abc") + "<span>読み方のきまりを見る</span>", () => { close(); App.goTab("practice", "rules"); }));
      else if (s.phraseIds.length) b.appendChild(button("btn ghost wide", icon("list") + "<span>この駅の表現を見る</span>", () => { close(); App.goTab("phrases", s.id); }));
    });
  }

  function render() {
    const root = $("v-home");
    const me = Store.cur();
    if (!me) return;
    root.innerHTML = "";
    const st = tripState();
    const stations = Course.stations();
    const curIdx = Course.indexFor();
    const cur = stations[curIdx];
    const next = Course.nextLesson();
    const all = stations.length - 1;
    const away = !st ? "" : st.kind === "before" ? `出発まで ${st.n}日` : st.kind === "during" ? `パリ ${st.n}日目` : "おかえりなさい";

    /* 次の駅の名画を、切らずに壁いっぱいに掛ける。題は絵の上端に重ねる */
    const before = root.childElementCount;
    if (cur.terminus) {
      root.appendChild(App.wall({ art: "paris", hero: true, title: "Paris", ja: "全部の駅を通りました", kick: `<span>終点</span>${away ? `<span>${away}</span>` : ""}` }));
    } else {
      root.appendChild(App.wall({ art: App.lessonArt(next.id), hero: true, title: App.titleFr(cur.fr), ja: `<span class="sr">次の駅、</span>${esc(cur.ja)}`,
        kick: `<span>つぎの駅　${cur.num}／${all}</span>${away ? `<span>${away}</span>` : ""}` }));
    }
    if (st && st.kind === "during" && root.children[before]) root.children[before].classList.add("brief");
    /* 署名の動き（絵の一部分から全体へ引く）は、開いて最初の 1 回だけ。タブを行き来するたびには動かさない */
    if (!hung && root.children[before]) { root.children[before].classList.add("hang"); hung = true; }

    /* 旅行中: 白い面のいちばん上は「今日の旅」 */
    if (st && st.kind === "during" && DATA.days[st.n - 1]) root.appendChild(todayTrip(st.n - 1));
    const news = familyNews();
    if (news.length) root.appendChild(newsCard(news));

    if (cur.terminus) {
      const end = el("section", "today-one");
      end.innerHTML = `<p class="label">あとは旅を楽しむだけ</p><p class="lede">毎日の復習カードで、覚えた表現を忘れないように。</p>`;
      root.appendChild(end);
      const cta = el("div", "cta");
      cta.appendChild(button("btn big wide", icon("download") + "<span>到着証明書をつくる</span>", () => Passport.certificate()));
      cta.appendChild(button("btn ghost wide", "<span>復習カードへ</span>" + icon("arrow"), () => App.goTab("practice", "review")));
      root.appendChild(cta);
    } else {
      const i = cur.lessons.indexOf(next) + 1;
      const sample = next.kind === "learn" ? App.phrase(next.ids[0]) : next.kind === "dlg" ? DATA.dialogs.find((d) => d.id === next.dlg).lines[0] : null;
      /* 今日の一文: この回で最初に出会う文 */
      if (sample) {
        const one = el("section", "today-one");
        one.innerHTML = `<p class="label">${next.kind === "dlg" ? "今日の会話" : "今日の一文"}</p>`;
        const row = el("div", "one-row");
        row.appendChild(el("div", "one-t", `<p class="fr" lang="fr">${esc(sample.fr)}</p>${sample.ja ? `<p class="ja">${esc(sample.ja)}</p>` : ""}`));
        row.appendChild(App.sayBtn(sample.fr));
        one.appendChild(row);
        root.appendChild(one);
      }
      const started = Course.isDone(cur.lessons[0].id) || i > 1;
      const cta = el("div", "cta");
      cta.appendChild(button("btn big wide", `<span>${started ? "続きのレッスンへ" : "レッスンを始める"}</span><small class="btn-fr" lang="fr" aria-hidden="true">${started ? "Continuer" : "Commencer"}</small>`, () => Lesson.start(next.id, { onClose: render })));
      cta.appendChild(el("p", "cta-meta", `${next.kind === "dlg" ? "会話の練習" : (next.kind === "rules" ? "きまり " : "レッスン ") + i + "／" + cur.lessons.length}・約${minutes(next)}分`));
      root.appendChild(cta);
    }

    /* 今日の 3 つ */
    const tk = Course.ticket();
    const ticket = el("section", "sec ticket");
    ticket.innerHTML = `<div class="sh"><h2>${tk.done === tk.total ? "今日の分は全部できました" : "今日の3つ"}</h2><span>${tk.done}／${tk.total}</span></div>`;
    const legs = el("div", "group legs");
    tk.legs.slice().sort((a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0)).forEach((g) => {
      const b = button("leg" + (g.done ? " done" : g.none ? " none" : ""), `<i class="ck" aria-hidden="true"></i><span><b>${esc(g.t)}</b><small>${esc(g.s)}</small></span>${icon("arrow", "go")}`, () => {
        if (g.k === "lesson") { if (next) Lesson.start(next.id, { onClose: render }); }
        else if (g.k === "weak") Lesson.drill(Course.weakIds(), "苦手な表現", "もう一度", render);
        else if (g.k === "rehearse") Lesson.drill(g.reh.d.ph, `${g.reh.date.slice(5).replace("-", "/")} ${g.reh.d.ja}`, "旅の予行演習", render, "rehearse");
        else if (g.k === "review") App.review({ onClose: () => { render(); header(); } });
        else if (g.k === "listen") App.listen({ onClose: () => { render(); header(); } });
        else App.goTab("practice", g.k);
      });
      b.setAttribute("aria-label", `${g.t}。${g.done ? "済み" : g.none ? "今日はありません" : "まだ"}。${g.s}`);
      legs.appendChild(b);
    });
    ticket.appendChild(legs);
    root.appendChild(ticket);

    /* わたしの路線: 運行表のように、番号・線・駅名を縦に並べる */
    root.appendChild(route(curIdx, stations));
  }

  let hung = false;
  /* 路線（運行表）。ふだんはいまの駅の前後だけを見せ、「すべて見る」で全駅を開く */
  let routeOpen = false;
  function route(curIdx, stations) {
    const sec = el("section", "sec route-sec");
    const doneN = Object.keys(Store.LS.get("stamps", {})).length;
    sec.innerHTML = `<div class="sh"><h2>わたしの路線</h2><span>${stations.length - 1}駅のうち${doneN}駅</span></div>`;
    const ol = el("ol", "route");
    const fam = familyAt();
    const lo = Math.max(0, Math.min(curIdx - 2, stations.length - 5)), hi = lo + 4;
    stations.forEach((s, i) => {
      const state = s.terminus ? (curIdx >= i ? "done" : "todo") : Course.stationDone(s) ? "done" : i === curIdx ? "now" : "todo";
      const here = fam.filter((f) => f.idx === i);
      const li = el("li", state + (i < lo || i > hi ? " far" : ""));
      const label = `${s.ja}（${s.fr}）。${state === "done" ? "修了" : state === "now" ? "いまの駅" : "これから"}${here.length ? "。" + here.map((f) => f.name).join("、") + "がここ" : ""}`;
      const inner = `<span class="n">${s.terminus ? "" : String(s.num).padStart(2, "0")}</span><i class="dot" aria-hidden="true"></i><span class="rt-t"><b>${s.terminus ? "パリ到着" : esc(s.ja)}</b><small lang="fr">${esc(App.titleFr(s.fr))}</small></span>`
        + `<span class="rt-r">${here.map((f) => App.roundel(f.c)).join("")}${state === "now" ? '<span class="tag">いまここ</span>' : state === "done" ? '<span class="st">済み</span>' : ""}</span>`;
      if (s.terminus) li.innerHTML = `<div class="rt-row" role="img" aria-label="${esc(label)}">${inner}</div>`;
      else li.appendChild(button("rt-row", inner, () => stationSheet(s), label));
      ol.appendChild(li);
    });
    if (routeOpen) ol.classList.add("open");
    sec.appendChild(ol);
    const more = button("more", `<span>${routeOpen ? "いまの駅のまわりだけ" : `${stations.length - 1}駅すべて見る`}</span>`, () => {
      routeOpen = !routeOpen; ol.classList.toggle("open", routeOpen);
      more.firstChild.textContent = routeOpen ? "いまの駅のまわりだけ" : `${stations.length - 1}駅すべて見る`;
      more.setAttribute("aria-expanded", String(routeOpen));
    });
    more.setAttribute("aria-expanded", String(routeOpen));
    sec.appendChild(more);
    if (!fam.length) sec.appendChild(el("p", "hint", `家族を招待すると、ここに家族の現在地が出ます。<a href="#" data-go="family">家族のページへ</a>`));
    return sec;
  }

  function familyNews() {
    const seen = Store.LS.get("famSeen", null);
    const fam = familyAt();
    const now = {}; for (const f of fam) now[f.id] = f.idx;
    if (!seen) { Store.LS.set("famSeen", now); return []; }   /* はじめては記録だけ */
    const fresh = fam.filter((f) => seen[f.id] == null);
    if (fresh.length) { for (const f of fresh) seen[f.id] = f.idx; Store.LS.set("famSeen", seen); }
    const st = Course.stations();
    return fam.filter((f) => seen[f.id] != null && f.idx > seen[f.id]).map((f) => ({ id: f.id, idx: f.idx, name: f.name, st: st[Math.min(f.idx, st.length - 1)] }));
  }
  function markSeen(news) { const seen = Store.LS.get("famSeen", {}) || {}; for (const n of news) seen[n.id] = n.idx; Store.LS.set("famSeen", seen); }
  function newsCard(news) {
    const c = el("section", "news");
    c.setAttribute("role", "status");
    const first = news[0];
    c.innerHTML = `${App.roundel(familyAt().find((f) => f.id === first.id)?.c || "", "news-rdl")}
      <p class="news-t"><b>${esc(first.name)}</b> さんが<wbr><b>${esc(first.st.ja)}</b>に<wbr>着きました${news.length > 1 ? `<wbr><span class="nw">（ほか ${news.length - 1} 人）</span>` : ""}</p>`;
    const me = Store.cur();
    const row = el("div", "news-act");
    row.appendChild(button("btn small cheer-btn", icon("star") + "<span>応援する</span>", () => {
      const url = Store.cardUrl(me.id, true);
      const done = () => { markSeen(news); c.remove(); };
      /* 送れたときだけお知らせを消す。共有をやめた・失敗したときは残して、もう一度押せるように */
      if (navigator.share) navigator.share({ title: `${me.name}から応援`, text: `Bravo ! ${me.name}から応援が届きました。`, url }).then(done).catch(() => {});
      else { done(); App.goTab("family"); }
    }, "応援する（Bravo を送る）"));
    c.appendChild(button("icon-btn news-x", icon("close"), () => { markSeen(news); c.remove(); }, "お知らせを閉じる"));
    c.appendChild(row);
    return c;
  }
  function todayTrip(i) {
    const d = DATA.days[i];
    const t = Store.trip();
    const date = Store.addDays(t.start, i);
    const nowHm = new Date().toTimeString().slice(0, 5);
    const nextStop = d.stops.find(([tm]) => /^\d\d:\d\d$/.test(tm) && tm >= nowHm) || null;
    const c = el("section", "today card");
    c.innerHTML = `<p class="eyebrow">旅行中 · À Paris · Jour ${i + 1}</p><h1>${esc(d.ja)}</h1><p class="muted">${date.slice(5).replace("-", "/")} · ${esc(d.fr)}</p>
      ${nextStop ? `<div class="today-next"><span class="tl-t">${esc(nextStop[0])}</span><span><b>${esc(nextStop[1])}</b>${nextStop[2] ? `<small>${esc(nextStop[2])}</small>` : ""}</span></div>` : ""}`;
    const g = el("div", "today-act");
    g.appendChild(button("tool", icon("book") + "<span>表現</span>", () => App.goTab("book", d.id)));
    const pr = Store.prefs(); const addr = [pr.hotelName, pr.hotelAddr].filter(Boolean).join("\n");
    g.appendChild(button("tool", icon("pin") + "<span>住所</span>", () => (addr ? App.show(addr, "この住所までお願いします", "", { lead: "À cette adresse, s’il vous plaît." }) : App.goTab("book", "addr"))));
    g.appendChild(button("tool", icon("cards") + "<span>予行演習</span>", () => Lesson.drill(d.ph, d.ja, "今日の予行演習", render, "rehearse")));
    const sos = button("tool sos", icon("sos") + "<span>SOS</span>", () => App.openSos()); g.appendChild(sos);
    c.appendChild(g);
    return c;
  }

  function header() {
    const me = Store.cur();
    const st = tripState();
    const ch = $("hdMe");
    if (!me) return;
    ch.innerHTML = `${App.roundel(me.color, "hd-rdl")}<span class="nm">${esc(me.name)}</span>`;
    ch.setAttribute("aria-label", `${me.name}（使う人の切り替えと設定）`);
    const c = $("hdCount");
    c.innerHTML = !st ? "" : st.kind === "before" ? `<small>出発まで</small><b><i lang="fr">J</i><i class="mn">−</i>${st.n}</b>` : st.kind === "during" ? `<small>パリ</small><b><i lang="fr">Jour </i>${st.n}</b>` : `<small>おかえり</small><b>${icon("check")}</b>`;
    c.setAttribute("aria-label", !st ? "" : st.kind === "before" ? `出発まであと ${st.n} 日` : st.kind === "during" ? `旅の ${st.n} 日目` : "旅から帰りました");
    const n = Store.streakOf();
    $("hdStreak").textContent = n;
    $("hdStreakBox").setAttribute("aria-label", `${n} 日続けて練習しています`);
    $("hdStreakBox").hidden = n === 0;
  }

  onTab("home", render);
  document.addEventListener("progress-changed", header);
  App.renderHome = render;
  App.renderHeader = header;
})();
