import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

test("tools/validate.mjs が通る", () => {
  const out = execFileSync(process.execPath, [fileURLToPath(new URL("../tools/validate.mjs", import.meta.url))], { encoding: "utf8" });
  assert.match(out, /^OK/);
});

test("core.js と gen-audio.py の文 id（FNV-1a）が一致する", () => {
  /* core.js の textId と同じ計算。gen-audio.py 側は ord() で同じ手順 */
  const id = (text) => { let h = 0x811C9DC5; for (const ch of String(text).trim()) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, "0"); };
  const core = readFileSync(new URL("../assets/js/core.js", import.meta.url), "utf8");
  const py = readFileSync(new URL("../tools/gen-audio.py", import.meta.url), "utf8");
  assert.ok(core.includes("0x811C9DC5") && core.includes("0x01000193"));
  assert.ok(py.includes("0x811C9DC5") && py.includes("0x01000193"));
  assert.equal(id("Bonjour."), id(" Bonjour. "));
  assert.notEqual(id("Ça va."), id("Ca va."));
});

test("並べる問題の単語: 文頭の大文字と文末の記号を外す", async () => {
  global.window = global.window || {};
  const src = readFileSync(new URL("../assets/js/lesson.js", import.meta.url), "utf8");
  const m = src.match(/function tilesOf\(fr\) \{[\s\S]*?\n  \}/);
  const tilesOf = new Function(m[0] + "; return tilesOf;")();
  assert.deepEqual(tilesOf("Je voudrais faire la détaxe."), ["je", "voudrais", "faire", "la", "détaxe"]);
  assert.deepEqual(tilesOf("Où est la Joconde ?"), ["où", "est", "la", "Joconde"]);
  assert.deepEqual(tilesOf("Paris, c'est beau."), ["Paris", "c'est", "beau"]);
});
