// X-Sursaut — tests/worker.test.mjs — 2026-09-27
import assert from "node:assert/strict";
import test from "node:test";
import worker from "../src/worker.js";

test("www redirects permanently to the canonical hostname and preserves the URL", async () => {
  const response = await worker.fetch(new Request("https://www.xsursaut.org/archives/?page=2"), { ASSETS: { fetch: () => new Response("asset") } });
  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://xsursaut.org/archives/?page=2");
});

test("the canonical hostname is served from static assets", async () => {
  const response = await worker.fetch(new Request("https://xsursaut.org/"), { ASSETS: { fetch: () => new Response("asset") } });
  assert.equal(await response.text(), "asset");
});
// ---------------------------------------------------------------- 16 lines
