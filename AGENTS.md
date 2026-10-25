# パリ旅のフランス語（« Ma ligne »、デザイン第 7 版 « Salle »）

家族 3 人（本人・母・弟）がパリ旅行に向けて、フランス語ほぼゼロから「旅で困らない」まで進む Web アプリ。
GitHub Pages で公開し、記録は人ごと・端末ごとに localStorage に保存する（クラウドなし）。手組みの静的 HTML / CSS / JS。
デザインの決まりは `docs/design.md`、レビューの採点表は `docs/review-rubric.md`、引き継ぎは `docs/handoff.md`。

## 構成
```
index.html              画面の骨組み（ヘッダー・5 タブ: 路線 / フレーズ / 練習 / しおり / 家族）
assets/css/style.css    スタイル（色は :root のトークン。名画の壁 .wall とレッスンの壁 .stage-top は --art の絵をぼかす。大きな文字は html[data-size=lg]）
assets/js/store.js      保存: 人（プロフィール）ごとの記録、旅の日程、招待リンク、家族カード、書き出し・読み込み（window.Store）
assets/js/core.js       共通部品: DOM・線のアイコン・読み上げ（生成音声 → 端末の fr 声）・効果音と振動・タブ・シート・全画面ステージ・見せる画面（window.App）
assets/js/speech.js     発音チェック（音声認識 fr-FR、単語単位の採点は純関数）
assets/js/course.js     コース: 駅（場面）・レッスン・進み具合・スタンプ・今日の切符
assets/js/lesson.js     レッスンの再生: 表現を聞く → 確認問題（聞く / 意味 / 並べる）→ 結果、読み方のきまり、会話ロールプレイ
assets/js/home.js       路線（ホーム）  phrasebook.js フレーズ  practice.js 練習  book.js しおり  family.js 家族・パスポート・設定
assets/js/onboard.js    はじめての人の流れ・人の切り替え   main.js 起動
assets/js/srs.js        SRS（純関数）   numbers.js  0〜100 の数（純関数）
data/phrases.js         場面と表現   listen.js 言われる文（4 択）   pron.js 発音のきまり   days.js 旅のしおり（日付は持たない）
data/dialogs.js         会話ロールプレイの台本   audio.js 生成物（tools/gen-audio.py）。文の FNV-1a → MP3 の data URI
data/photos.js          生成物（tools/make-photos.py）。駅の絵のパス・切り抜きの中心・画家・作品名・年・出典
assets/img/st/          名画 40 枚（駅 <駅id>.webp とレッスンごと a01〜a28、Wikimedia Commons のパブリックドメイン）。元の画像と credits.json は _src/（git 管理外）。レッスンと絵の対応は core.js の LESSON_ART
assets/img/il/          第 6 版の挿絵（Codex の画像生成）。第 7 版の画面では使っていない（オフライン用の一覧には残る）
tools/validate.mjs      データ検査（個人情報の検査語は git 管理外の tools/private-words.txt）   tools/gen-audio.py 音声生成
tools/make-photos.py    絵をそろえて data/photos.js を作る   tools/gen-sw.mjs  オフライン用の sw.js（--check で作り直し忘れを検出）
build.py                1 ファイル版（dist/site.html、旧）
tests/                  node --test
```

## 決まりごと
- ビルド不要で `index.html` を配信すれば動く状態を保つ。外部ライブラリは入れない。
- 公開サイトなので、名前・便名・予約番号・日付など個人が特定できる情報はデータに書かない（validate が弾く）。旅の日程は端末の設定か招待リンク（?trip=YYYY-MM-DD&days=N）で入る。
- 記録は `Store.LS`（いまの人）経由。キーは `store.js` の `KEYS`。キーを足したら `mergeKey` の合わせ方も考える。
- フレーズ・レッスン・会話の id は変えない（記録のキー）。カードは `s:<id>`（言う）/ `h:<id>`（聞く）。
- フランス語の文を足したり直したりしたら `python tools/gen-audio.py`。
- 絵を足す・替えるときは `assets/img/st/_src/` に元の画像と credits.json の出典を置き、tools/make-photos.py の FOCUS・ART（画家・作品名・年）に足して `python tools/make-photos.py`。出典は設定の「絵の出典」に出る。
- 画面やデータを変えたら `node tools/gen-sw.mjs`（作り直さないと家族の端末に古い版が残る）。
- 挿絵を描き直したら拡大して検品する（文字や字のような線・崩れた手や顔・時代に合わない物・虫がないこと）。生成の挿絵を名画に重ねない。
- 絵文字は使わない（線のアイコン `App.icon`）。押せる所は 44px 以上。動きは `prefers-reduced-motion` で止まること。

## 検証
- テスト: `node --test tests/*.test.mjs`
- データ: `node tools/validate.mjs`
- 文を変えたとき: `python tools/gen-audio.py`（要 `pip install edge-tts lameenc miniaudio`）
- オフライン版: `node tools/gen-sw.mjs --check`
- 終了前に上の 3 つを実行し、失敗していたら直してから報告する。画面を変えたときはブラウザ（`python -m http.server` で配信）で該当画面を開き、390px 幅とデスクトップ幅で確認する。

## 公開
GitHub Pages（main ブランチの直下）https://junyeol928-hash.github.io/paris-french/ 。origin/main から作業ブランチを切り、PR で main に入れると数分で公開される。
手元の `init` ブランチは個人情報を含む古い履歴なので push しない。
