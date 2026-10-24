import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const list = execFileSync(process.execPath, [fileURLToPath(new URL("../tools/gen-sw.mjs", import.meta.url)), "--list"], { encoding: "utf8" }).trim().split("\n");

test("オフライン用の一覧に index.html が読むローカルの JS・CSS が全部入る", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const refs = [...html.matchAll(/<(?:script[^>]+src|link[^>]+href)="([^"]+)"/g)].map((m) => m[1]).filter((u) => !/^https?:/.test(u));
  for (const r of refs) assert.ok(list.includes(r), r + " が一覧にない");
});

test("一覧のファイルは全部ある", () => {
  for (const f of list) if (f !== "./") assert.ok(existsSync(root + f), f + " がない");
});

test("sw.js は今の一覧で作られている（画面を変えたら node tools/gen-sw.mjs）", () => {
  const sw = readFileSync(new URL("../sw.js", import.meta.url), "utf8");
  const m = sw.match(/const FILES = (\[.*\]);/);
  assert.ok(m, "sw.js に FILES がない");
  assert.deepEqual(JSON.parse(m[1]), list);
});

test("sw.js の版が今のファイルの中身と一致する（node tools/gen-sw.mjs --check）", () => {
  execFileSync(process.execPath, [fileURLToPath(new URL("../tools/gen-sw.mjs", import.meta.url)), "--check"], { encoding: "utf8" });
});
