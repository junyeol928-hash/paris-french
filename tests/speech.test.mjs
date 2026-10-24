import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { score, best, verdict } = require("../assets/js/speech.js");

test("score: 同じ文なら 100 点（大文字・記号・アクセントの違いは無視）", () => {
  assert.equal(score("Un café, s'il vous plaît.", "un cafe s il vous plait").pct, 100);
});

test("score: 抜けた単語を見つける", () => {
  const r = score("Un café crème, s'il vous plaît.", "un café s'il vous plaît");
  assert.ok(r.pct >= 80 && r.pct < 100);
  assert.deepEqual(r.words, ["un", "cafe", "creme", "s", "il", "vous", "plait"]);
  assert.equal(r.hit[2], false);
});

test("score: 関係ない言葉は低い", () => {
  assert.ok(score("Bonjour.", "merci beaucoup").pct < 30);
});

test("best: 候補の中でいちばん近いものを使う", () => {
  const r = best("Bonsoir.", ["bon soir", "bonsoir"]);
  assert.equal(r.pct, 100);
  assert.equal(r.heard, "bonsoir");
});

test("verdict: 点数の区切り", () => {
  assert.equal(verdict(90).k, "great");
  assert.equal(verdict(70).k, "ok");
  assert.equal(verdict(30).k, "retry");
});
