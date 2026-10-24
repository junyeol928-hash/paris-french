import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const NUM = require("../assets/js/numbers.js");

test("fr: 数え方が特殊な所", () => {
  assert.equal(NUM.fr(0), "zéro");
  assert.equal(NUM.fr(17), "dix-sept");
  assert.equal(NUM.fr(21), "vingt et un");
  assert.equal(NUM.fr(22), "vingt-deux");
  assert.equal(NUM.fr(70), "soixante-dix");
  assert.equal(NUM.fr(71), "soixante et onze");
  assert.equal(NUM.fr(79), "soixante-dix-neuf");
  assert.equal(NUM.fr(80), "quatre-vingts");
  assert.equal(NUM.fr(81), "quatre-vingt-un");
  assert.equal(NUM.fr(91), "quatre-vingt-onze");
  assert.equal(NUM.fr(99), "quatre-vingt-dix-neuf");
  assert.equal(NUM.fr(100), "cent");
  assert.throws(() => NUM.fr(101));
});

test("kana: 0〜100 すべてカタカナで返る", () => {
  for (let n = 0; n <= 100; n++) assert.match(NUM.kana(n), /^[゠-ヿ]+$/, String(n));
  assert.equal(NUM.kana(21), "ヴァンテアン");
  assert.equal(NUM.kana(22), "ヴァントドゥ");
  assert.equal(NUM.kana(71), "ソワサンテオンズ");
  assert.equal(NUM.kana(80), "キャトルヴァン");
});

test("choices: 正解が先頭、4 つとも違う数で 0〜100 の範囲", () => {
  for (let n = 0; n <= 100; n++) {
    const c = NUM.choices(n);
    assert.equal(c[0], n);
    assert.equal(c.length, 4, String(n));
    assert.equal(new Set(c).size, 4, String(n));
    for (const x of c) assert.ok(x >= 0 && x <= 100);
  }
});

test("choices: 70 台には 60 台・10 台の紛らわしい数が入りうる", () => {
  const seen = new Set();
  for (let i = 0; i < 200; i++) for (const x of NUM.choices(76).slice(1)) seen.add(x);
  assert.ok(seen.has(66) && seen.has(16));
});
