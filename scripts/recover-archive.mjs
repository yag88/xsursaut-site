// X-Sursaut — scripts/recover-archive.mjs — 2026-09-26
import fs from "node:fs/promises";
import path from "node:path";

const source = process.argv[2] ?? "/tmp/xsursaut-cdx-html.json";
const outDir = process.argv[3] ?? "archive/html";
const rows = JSON.parse(await fs.readFile(source, "utf8")).slice(1);
await fs.mkdir(outDir, { recursive: true });

const safeName = (url) => {
  const parsed = new URL(url.replace(":80/", "/"));
  const raw = `${parsed.pathname}${parsed.search}`
    .replace(/^\/+|\/+$/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${raw || "home"}.html`;
};

let next = 0;
let succeeded = 0;
let failed = 0;

async function worker() {
  while (next < rows.length) {
    const [timestamp, original] = rows[next++];
    if (/wp-login|wp-admin|sitemap/i.test(original)) continue;
    const destination = path.join(outDir, safeName(original));
    const archiveUrl = `https://web.archive.org/web/${timestamp}id_/${original}`;
    try {
      const response = await fetch(archiveUrl, {
        headers: { "User-Agent": "X-Sursaut archival recovery/1.0" },
        signal: AbortSignal.timeout(90_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await fs.writeFile(destination, await response.text());
      succeeded++;
      process.stdout.write(`OK ${destination}\n`);
    } catch (error) {
      failed++;
      process.stderr.write(`FAIL ${original}: ${error.message}\n`);
    }
  }
}

await Promise.all(Array.from({ length: 4 }, worker));
console.log(JSON.stringify({ total: rows.length, succeeded, failed }));
// ---------------------------------------------------------------- 47 lines
