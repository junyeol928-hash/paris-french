import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const SRS = require("../assets/js/srs.js");

const T0 = Date.UTC(2026, 8, 19, 0, 0, 0);
const DAY = SRS.DAY;

test("新規カード: good で 1 日後、easy で 4 日後", () => {
  const g = SRS.review(null, 3, T0);
  assert.equal(g.iv, 1); assert.equal(g.st, "rev"); assert.equal(g.due, T0 + DAY);
  const e = SRS.review(null, 4, T0);
  assert.equal(e.iv, 4); assert.equal(e.due, T0 + 4 * DAY);
});

test("新規カード: again は 10 分後に学習中として戻る", () => {
  const a = SRS.review(null, 1, T0);
  assert.equal(a.st, "learn"); assert.equal(a.due, T0 + 600000);
  assert.ok(SRS.isDue(a, T0 + 600000));
  assert.ok(!SRS.isDue(a, T0 + 1000));
});

test("復習カード: good で間隔が ease 倍に伸び、忘却で 1 日に戻り ease が下がる", () => {
  let c = SRS.review(null, 3, T0);           // iv 1
  c = SRS.review(c, 3, T0 + DAY);            // iv max(2, round(1*2.5)) = 3
  assert.equal(c.iv, 3);
  c = SRS.review(c, 3, T0 + 4 * DAY);        // iv round(3*2.5)=8
  assert.equal(c.iv, 8);
  const lapse = SRS.review(c, 1, T0 + 12 * DAY);
  assert.equal(lapse.iv, 1); assert.equal(lapse.lapses, 1); assert.equal(lapse.ease, 2.3); assert.equal(lapse.st, "learn");
});

test("ease は 1.3 を下回らない", () => {
  let c = SRS.review(null, 3, T0);
  // 学習中(learn)の again では ease を下げない。rev に戻してから忘れるのを繰り返す
  for (let i = 0; i < 20; i++) { c = SRS.review(c, 3, T0 + i * DAY); c = SRS.review(c, 1, T0 + i * DAY + 1); }
  assert.equal(c.ease, 1.3);
});

test("preview はラベルを返す", () => {
  assert.equal(SRS.preview(null, 1, T0), "10分");
  assert.equal(SRS.preview(null, 3, T0), "1日");
  const c = { iv: 40, ease: 2.5, due: T0, reps: 3, lapses: 0, last: T0, st: "rev" };
  assert.equal(SRS.preview(c, 3, T0), "3.3か月");
});

test("buildQueue: 期限切れは期限順、新規は上限まで", () => {
  const st = {
    a: { iv: 1, ease: 2.5, due: T0 - 2 * DAY, reps: 1, lapses: 0, last: 0, st: "rev" },
    b: { iv: 1, ease: 2.5, due: T0 - DAY, reps: 1, lapses: 0, last: 0, st: "rev" },
    c: { iv: 1, ease: 2.5, due: T0 + DAY, reps: 1, lapses: 0, last: 0, st: "rev" },
  };
  const q = SRS.buildQueue(["c", "b", "a", "d", "e", "f"], st, { now: T0, newLimit: 2, newToday: 0 });
  assert.deepEqual(q.due, ["a", "b"]);
  assert.deepEqual(q.fresh, ["d", "e"]);
  assert.equal(q.freshTotal, 3);
  const q2 = SRS.buildQueue(["d", "e"], st, { now: T0, newLimit: 2, newToday: 2 });
  assert.deepEqual(q2.fresh, []);
});

test("pack/unpack は新規を落とし、それ以外を往復できる", () => {
  const st = { a: SRS.fresh(), b: SRS.review(null, 3, T0) };
  const p = SRS.pack(st);
  assert.ok(!("a" in p));
  assert.deepEqual(SRS.unpack(p).b, st.b);
});

test("復習中のカード: かんたんは必ず「言えた」より先", () => {
  for (const iv of [1, 2, 3, 5, 10]) {
    const c = { iv, ease: 2.5, due: T0, reps: 2, lapses: 0, last: T0, st: "rev" };
    assert.ok(SRS.review(c, 4, T0).iv > SRS.review(c, 3, T0).iv, "iv " + iv);
  }
});
