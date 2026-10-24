# 引き継ぎメモ（Claude Code ⇄ Codex）

## 現状（2026-09-25、初版）
- Artifact: https://claude.ai/artifact/T9SDbwTB7uSKvRfXywCBxp（Version 1、capabilities: db, downloads。db の progress はまだ空＝初回に開いた端末から書かれる）
- 6 タブすべて動作: ホーム（出発までの日数・今日やること・設定・同期）/ 発音（きまり 16・例 66・読み方クイズ）/ フレーズ（11 場面 178 文、検索、☆）/ カード（言う・聞くの 2 方向 SRS）/ 聞き取り（言われる文 95 問・数字 0〜100）/ 指さし帳（旅程 4 日分・困ったとき・★・住所カード・見せる画面・1 ファイル保存）。
- 音声: edge-tts の fr-FR-DeniseNeural / HenriNeural で 433 本、data URI で埋め込み（3.1 MB）。無い文は端末のフランス語の声。
- 検証済み: `node --test` 18 pass、`node tools/validate.mjs` OK、ローカル配信のブラウザで各タブの流れ（カード採点、聞き取り・数字・発音クイズ、住所の保存、見せる画面）と 375px 幅のレイアウトを確認。
- 未検証: claude.ai 上での db 同期と downloads（保存）の実動作、iPhone Safari での音声再生。

## 変更内容
- 場面「メニューの読み方（La carte）」25 語を追加（前菜・メイン・料理名・デザート・Service compris など）。聞き取りに料理の説明 3 問。指さし帳の 2/24（Angelina のモンブラン）と 2/25（Entrecôte・Bouillon Racine）に料理名を足した。
- 第 2 版（2026-09-25）デザイン刷新 « Carnet de Paris »。案は Claude Design のキャンバス https://claude.ai/artifact/VazhdZ3ZBmzm6hbhFLaTdy（ホーム・フレーズ・カード・聞き取り・指さし帳の 5 画面）。
  ワラスの泉の深緑 × カフェの縞テント（ヘッダー）× 通りの標識（場面）× メトロの切符（カード）× 路線図（聞き取りの進み具合）× 切手（旅程の日付）× スタンプ（連続日数）。
  書体は Bodoni Moda（フランス語）/ Jost（数字・ラベル）/ しっぽり明朝（見出し）/ Zen 角ゴシック（本文）。絵文字をやめて線のアイコンに。タブは header の外に出した（スマホは下固定）。ライト・ダーク両方をブラウザで確認済み。
- 初版。英語ツールから srs.js / merge.js / sync.js / build.py / gen-audio.py の仕組みを流用。音声は pack ファイルではなく data URI 埋め込みにした（量が少ないので files 不要）。

## 次に依頼すること
- ホテルが決まったら住所カードに入力（画面から入れれば同期される）。
- フランス語・カタカナの自然さのレビュー（特に data/listen.js の選択肢の紛らわしさ、data/phrases.js の kana）。
- 足すなら: 英作文型の「言ってみる」練習、配色の差し替え（Claude Design のキャンバスで Tweaks から主色を試せる）。
