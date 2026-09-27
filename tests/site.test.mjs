// X-Sursaut — tests/site.test.mjs — 2026-09-27
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "../site/public");

test("core pages are generated", async () => {
  for (const route of ["index.html", "presentation/index.html", "actualites/index.html", "publications/index.html", "evenements/index.html", "archives/index.html"]) {
    const page = await fs.readFile(path.join(root, route), "utf8");
    assert.match(page, /<!doctype html>/);
    assert.doesNotMatch(page, /wp-login|wp-admin|stats\.wp\.com/);
  }
});

test("editable Markdown content is rendered", async () => {
  const presentation = await fs.readFile(path.join(root, "presentation/index.html"), "utf8");
  assert.match(presentation, /créé en juillet 2005/);
  assert.match(presentation, /contact@xsursaut\.org|bureau/);
});

test("RSS and social metadata are generated", async () => {
  const home = await fs.readFile(path.join(root, "index.html"), "utf8");
  const rss = await fs.readFile(path.join(root, "actualites/rss.xml"), "utf8");
  assert.match(home, /property="og:title"/);
  assert.match(rss, /<rss version="2\.0">/);
});

test("deleted editorial entries do not leave stale output", async () => {
  await assert.rejects(fs.access(path.join(root, "actualites/test-publication/index.html")));
  await assert.rejects(fs.access(path.join(root, "publications/test-rapport/index.html")));
});

test("the recovered archive is substantial", async () => {
  const entries = await fs.readdir(path.join(root, "archives"), { withFileTypes: true });
  assert.ok(entries.filter((entry) => entry.isDirectory()).length >= 80);
});
// ---------------------------------------------------------------- 39 lines
