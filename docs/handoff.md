# 引き継ぎメモ（Claude Code ⇄ Codex）

## 現状（2026-10-24、第 3 版 « Ma ligne »）
- 家族 3 人（本人・母・弟）が各自のスマホで使う、パリ旅行向けのフランス語学習アプリ。手組みの静的 HTML/CSS/JS、ビルド不要（`python -m http.server` で `index.html`）。
- 構成: メトロの路線を進むコース（13 駅＋終点 PARIS、駅ごとにレッスン・読み方・会話、スタンプ）、今日の切符（レッスン・復習・予行演習／苦手／聞き取り）、フレーズ（11 場面 189 文）、練習（復習カード・聞き取り・数字・苦手・会話の練習・読み方）、しおり（旅の 4 日・困ったとき・保存した表現・住所カード）、家族（進み具合をリンクで共有・応援・この端末を使う人・設定）。
- 記録は端末ごと・人ごと（localStorage `fr3:p:<id>:<key>`）。クラウドなし。家族の進み具合は `?card=FR1.…` のリンク、招待は `?trip=YYYY-MM-DD&days=4`。
- PWA（sw.js は tools/gen-sw.mjs が生成、オフラインで動く・ホーム画面に置ける）。音声は edge-tts の data URI 517 本。
- 検証済み: `node --test tests/*.mjs` 24 pass、`node tools/validate.mjs` OK、Playwright の画面写真（モバイル・ダーク・デスクトップ 59 枚）でページエラーなし。
- 未検証: 実機（iPhone Safari／Android Chrome）での音声認識・tel: リンク・ホーム画面追加。大使館の電話番号（01 48 88 62 00）は出発前に要確認。
- 公開: **まだ**。GitHub https://github.com/junyeol928-hash/paris-french に `release` ブランチだけ push 済み（過去の履歴には公開できない個人情報があるので、現在の中身を 1 コミットにまとめた別の履歴。手元の `pub-main` が土台、`release` がその上）。`main` は未作成（push ガードと権限で止まった）。

## 変更内容
- 第 3 版で全面作り直し（人ごとの記録、メトロの路線のコース、家族機能、PWA、発音チェック、会話ロールプレイ）。デザインは docs/design.md。
- ADA 基準のレビュー（docs/review-rubric.md）を 3 回実施し、指摘を反映（第 3 回: A 3.83 / B 3.5、第 4 回: A 4.33 / B 4.0、第 5 回: A・B とも 4.5 で合格）。合格後に余裕を持たせる仕上げ（答えた後のずれ、復習カードと会話の位置など）も反映済み。
- 個人情報の検査語は `tools/private-words.txt`（git 管理外、1 行 1 正規表現）に移した。無いと validate はその検査を飛ばして注意を出す。

## 次に依頼すること
- `main` を作って `release` から PR → マージ → GitHub Pages（main / ルート）を有効化。公開 URL は https://junyeol928-hash.github.io/paris-french/ の見込み。
- 以後の作業は公開側の履歴（origin/main）から枝を切る。手元の `init` は個人情報を含む古い履歴なので push しない。
- 合格ラインちょうどなので、余裕を持たせるなら: 並べ替えの札を大きく下寄せ、到着画面の下の空白、修了前の修了証は押した駅だけ並べる。
