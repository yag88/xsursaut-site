// X-Sursaut — tests/site.test.mjs — 2026-09-26
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "../site/public");

test("core pages are generated", async () => {
  for (const route of ["index.html", "presentation/index.html", "publications/index.html", "evenements/index.html", "archives/index.html"]) {
    const page = await fs.readFile(path.join(root, route), "utf8");
    assert.match(page, /<!doctype html>/);
    assert.doesNotMatch(page, /wp-login|wp-admin|stats\.wp\.com/);
  }
});

test("the recovered archive is substantial", async () => {
  const entries = await fs.readdir(path.join(root, "archives"), { withFileTypes: true });
  assert.ok(entries.filter((entry) => entry.isDirectory()).length >= 80);
});
// ---------------------------------------------------------------- 21 lines
