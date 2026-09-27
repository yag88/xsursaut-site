// X-Sursaut — scripts/build.mjs — 2026-09-27
import fs from "node:fs/promises";
import path from "node:path";
import * as cheerio from "cheerio";
import matter from "gray-matter";
import { marked } from "marked";

const root = path.resolve(import.meta.dirname, "..");
const archiveDir = path.join(root, "archive/html");
const contentDir = path.join(root, "content");
const publicDir = path.join(root, "site/public");
const generatedDir = path.join(publicDir, "archives");

marked.use({ gfm: true, breaks: false });

const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
const slugForFile = (file) => file.replace(/\.html$|\.md$/i, "");
const normalizeTitle = (value = "") => value.replace(/\s*\|\s*X-Sursaut\s*$/i, "").replace(/\s+/g, " ").trim();
const dateObject = (value) => value instanceof Date ? value : new Date(`${value}T00:00:00Z`);
const displayDate = (value) => value ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" }).format(dateObject(value)) : "";

async function readMarkdownDirectory(directory) {
  const absolute = path.join(contentDir, directory);
  const entries = await fs.readdir(absolute, { withFileTypes: true }).catch(() => []);
  return Promise.all(entries.filter((entry) => entry.isFile() && entry.name.endsWith(".md")).map(async (entry) => {
    const source = await fs.readFile(path.join(absolute, entry.name), "utf8");
    const parsed = matter(source);
    return { ...parsed.data, slug: parsed.data.slug || slugForFile(entry.name), body: marked.parse(parsed.content), source: `${directory}/${entry.name}` };
  }));
}

function cleanContent($, sourceFile) {
  const content = $("#content").first().clone();
  content.find("script, style, form, iframe, noscript, .sidebar, .pagination, .comments, .share-bar").remove();
  content.find("*[style]").removeAttr("style");
  content.find("*[class]").each((_, element) => {
    const keep = ($(element).attr("class") || "").split(/\s+/).filter((name) => ["row", "col-md-12", "col-md-8", "col-md-4", "staff-item", "event-item"].includes(name));
    keep.length ? $(element).attr("class", keep.join(" ")) : $(element).removeAttr("class");
  });
  content.find("a").each((_, element) => {
    const href = $(element).attr("href") || "";
    if (/wp-content\/uploads\/.*\.pdf/i.test(href) || /\/uploads\/Accueil\/.*\.pdf/i.test(href)) {
      $(element).attr("href", `/documents/${path.basename(href.split("?")[0])}`);
    } else if (/^https?:\/\/(www\.)?x-sursaut\.org/i.test(href)) {
      const parsed = new URL(href.replace(":80/", "/"));
      const candidate = `${parsed.pathname}${parsed.search}`.replace(/^\/+|\/+$/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "home";
      $(element).attr("href", `/archives/${candidate}/`);
    }
    $(element).removeAttr("target");
  });
  content.find("img").each((_, element) => {
    const alt = $(element).attr("alt") || "Illustration archivée";
    $(element).replaceWith(`<span class="missing-image" role="img" aria-label="${escapeHtml(alt)}">${escapeHtml(alt)}</span>`);
  });
  const html = (content.html() || "").replace(/<div>\s*<\/div>/g, "").trim() || "<p>Le contenu de cette page n’a pas pu être récupéré dans l’archive.</p>";
  return `<div class="archive-source" data-source="${escapeHtml(sourceFile)}">${html}</div>`;
}

const archiveFiles = (await fs.readdir(archiveDir)).filter((file) => file.endsWith(".html"));
const archives = [];
for (const file of archiveFiles) {
  const html = await fs.readFile(path.join(archiveDir, file), "utf8");
  const $ = cheerio.load(html);
  const slug = slugForFile(file);
  archives.push({ file, slug, title: normalizeTitle($("title").text()) || normalizeTitle($(".page-header h2").text()) || slug, kind: slug.startsWith("event-") ? "Événement" : slug.startsWith("staff-") ? "Personne" : slug.includes("blog-") ? "Article" : "Page", body: cleanContent($, file) });
}
archives.sort((a, b) => a.title.localeCompare(b.title, "fr"));

const pageEntries = await readMarkdownDirectory("pages");
const pages = Object.fromEntries(pageEntries.map((page) => [page.slug, page]));
const news = (await readMarkdownDirectory("actualites")).filter((item) => item.published !== false).sort((a, b) => dateObject(b.date) - dateObject(a.date));
const reports = (await readMarkdownDirectory("rapports")).filter((item) => item.published !== false).sort((a, b) => dateObject(b.date) - dateObject(a.date));

function layout({ title, description, body, active = "", canonical = "", image = "" }) {
  const nav = [["Accueil", "/"], ["Présentation", "/presentation/"], ["Actualités", "/actualites/"], ["Publications", "/publications/"], ["Événements", "/evenements/"], ["Équipe", "/equipe/"], ["Archives", "/archives/"], ["Contact", "/contact/"]]
    .map(([label, href]) => `<a href="${href}"${active === label ? ' aria-current="page"' : ""}>${label}</a>`).join("");
  const canonicalUrl = `https://xsursaut.org${canonical}`;
  return `<!doctype html>\n<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">\n<title>${escapeHtml(title)} — X-Sursaut</title><meta name="description" content="${escapeHtml(description)}">\n<link rel="canonical" href="${canonicalUrl}"><meta property="og:type" content="website"><meta property="og:title" content="${escapeHtml(title)} — X-Sursaut"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${canonicalUrl}">${image ? `<meta property="og:image" content="${escapeHtml(image)}">` : ""}\n<link rel="alternate" type="application/rss+xml" title="Actualités X-Sursaut" href="/actualites/rss.xml"><link rel="stylesheet" href="/assets/site.css"><link rel="icon" href="/assets/logo.png"></head>\n<body><header class="site-header"><a class="brand" href="/"><img src="/assets/logo.png" alt="X-Sursaut"></a>\n<button class="menu-button" aria-expanded="false" aria-controls="navigation">Menu</button><nav id="navigation">${nav}</nav></header>\n<main>${body}</main><footer><p><strong>X-Sursaut</strong> — Groupe de réflexion économique issu de la communauté polytechnicienne.</p>\n<p><a href="mailto:contact@xsursaut.org">contact@xsursaut.org</a> · <a href="/mentions-legales/">Mentions légales</a></p>\n<p class="notice">Site reconstruit à partir d’archives publiques. Certains contenus historiques restent à valider par le bureau.</p></footer>\n<script src="/assets/site.js"></script></body></html>`;
}

async function writePage(route, options) {
  const directory = route === "/" ? publicDir : path.join(publicDir, route.replace(/^\//, ""));
  await fs.mkdir(directory, { recursive: true });
  const filename = route === "/" ? "index.html" : `${route.replace(/^\//, "")}index.html`;
  const lines = [`<!-- X-Sursaut — ${filename} — 2026-09-27 -->`, ...layout({ ...options, canonical: route }).split("\n")];
  lines.push(`<!-- ---------------------------------------------------------------- ${lines.length + 1} lines -->`);
  await fs.writeFile(path.join(directory, "index.html"), `${lines.join("\n")}\n`);
}

function editablePage(slug, active) {
  const page = pages[slug];
  if (!page) throw new Error(`Missing content/pages/${slug}.md`);
  return { title: page.title, description: page.description, active, body: `<section class="page-heading"><p class="eyebrow">${escapeHtml(page.eyebrow || "X-Sursaut")}</p><h1>${escapeHtml(page.title)}</h1><p>${escapeHtml(page.lead || page.description)}</p></section><section class="prose">${page.body}</section>` };
}

const home = pages.accueil;
const hero = `<section class="hero"><div><p class="eyebrow">${escapeHtml(home.eyebrow)}</p><h1>${escapeHtml(home.title)}</h1><p>${escapeHtml(home.lead)}</p><div class="actions"><a class="button" href="${escapeHtml(home.primary_url)}">${escapeHtml(home.primary_label)}</a><a class="button secondary" href="${escapeHtml(home.secondary_url)}">${escapeHtml(home.secondary_label)}</a></div></div></section>`;
await writePage("/", { title: "Accueil", description: home.description, body: `${hero}<section class="prose home-content">${home.body}</section>`, active: "Accueil" });
await writePage("/presentation/", editablePage("presentation", "Présentation"));
await writePage("/equipe/", editablePage("equipe", "Équipe"));
await writePage("/contact/", editablePage("contact", "Contact"));
await writePage("/mentions-legales/", editablePage("mentions-legales", ""));

const cards = (items, prefix, empty) => items.length ? `<section class="content-cards">${items.map((item) => `<article><p class="eyebrow">${displayDate(item.date)}</p><h2><a href="/${prefix}/${escapeHtml(item.slug)}/">${escapeHtml(item.title)}</a></h2><p>${escapeHtml(item.summary || item.description || "")}</p></article>`).join("")}</section>` : `<section class="prose"><p>${empty}</p></section>`;
await writePage("/actualites/", { title: "Actualités", description: "Actualités de X-Sursaut.", active: "Actualités", body: `<section class="page-heading"><p class="eyebrow">Vie du groupe</p><h1>Actualités</h1><p>Les dernières nouvelles, rencontres et prises de position de X-Sursaut.</p></section>${cards(news, "actualites", "Aucune actualité récente n’a encore été publiée.")}` });
for (const item of news) await writePage(`/actualites/${item.slug}/`, { title: item.title, description: item.summary || item.description || item.title, image: item.image, body: `<article><section class="page-heading"><p class="eyebrow">Actualité · ${displayDate(item.date)}</p><h1>${escapeHtml(item.title)}</h1><p>${escapeHtml(item.summary || "")}</p></section><section class="prose">${item.body}</section></article>`, active: "Actualités" });

const archiveListing = (matching) => archives.filter(matching).map((page) => `<li><span>${page.kind}</span><a href="/archives/${page.slug}/">${escapeHtml(page.title)}</a></li>`).join("");
const reportCards = reports.map((item) => `<article><p class="eyebrow">${displayDate(item.date)}</p><h2><a href="/publications/${escapeHtml(item.slug)}/">${escapeHtml(item.title)}</a></h2><p>${escapeHtml(item.summary || "")}</p>${item.authors ? `<p><strong>Auteurs :</strong> ${escapeHtml(item.authors)}</p>` : ""}<p><a class="button" href="${escapeHtml(item.document)}">Lire le rapport (PDF)</a></p></article>`).join("");
await writePage("/publications/", { title: "Publications", description: "Études, notes et rapports de X-Sursaut.", active: "Publications", body: `<section class="page-heading"><p class="eyebrow">Travaux</p><h1>Publications</h1><p>Rapports récents et fonds documentaire historique de X-Sursaut.</p></section>${reportCards ? `<section class="content-cards">${reportCards}</section>` : ""}<section class="listing"><h2>Publications historiques</h2><ul>${archiveListing((page) => page.slug.includes("publication") || page.kind === "Article")}</ul></section>` });
for (const item of reports) await writePage(`/publications/${item.slug}/`, { title: item.title, description: item.summary || item.title, active: "Publications", body: `<article><section class="page-heading"><p class="eyebrow">Rapport · ${displayDate(item.date)}</p><h1>${escapeHtml(item.title)}</h1><p>${escapeHtml(item.summary || "")}</p></section><section class="prose">${item.authors ? `<p><strong>Auteurs :</strong> ${escapeHtml(item.authors)}</p>` : ""}${item.body}<p><a class="button" href="${escapeHtml(item.document)}">Télécharger le rapport (PDF)</a></p></section></article>` });
await writePage("/evenements/", { title: "Événements", description: "Conférences, débats et webinaires retrouvés dans les archives publiques.", active: "Événements", body: `<section class="page-heading"><p class="eyebrow">Fonds restauré</p><h1>Événements</h1><p>Conférences, débats et webinaires retrouvés dans les archives publiques.</p></section><section class="listing"><ul>${archiveListing((page) => page.kind === "Événement" && !page.slug.includes("event_date"))}</ul></section>` });

await fs.rm(generatedDir, { recursive: true, force: true });
await writePage("/archives/", { title: "Archives du site", description: `${archives.length} pages historiques récupérées et nettoyées.`, active: "Archives", body: `<section class="page-heading"><p class="eyebrow">Fonds restauré</p><h1>Archives du site</h1><p>${archives.length} pages historiques ont été récupérées, nettoyées et rendues consultables.</p></section><section class="listing"><ul>${archiveListing(() => true)}</ul></section>` });
for (const page of archives) await writePage(`/archives/${page.slug}/`, { title: page.title, description: `Archive restaurée : ${page.title}`, body: `<section class="page-heading"><p class="eyebrow">Archive restaurée · ${page.kind}</p><h1>${escapeHtml(page.title)}</h1><p>Contenu historique récupéré depuis Internet Archive. Les informations peuvent être anciennes.</p></section><section class="prose">${page.body}</section>` });

const rssItems = news.map((item) => `<item><title>${escapeHtml(item.title)}</title><link>https://xsursaut.org/actualites/${escapeHtml(item.slug)}/</link><guid>https://xsursaut.org/actualites/${escapeHtml(item.slug)}/</guid><pubDate>${dateObject(item.date).toUTCString()}</pubDate><description>${escapeHtml(item.summary || "")}</description></item>`).join("");
await fs.mkdir(path.join(publicDir, "actualites"), { recursive: true });
await fs.writeFile(path.join(publicDir, "actualites/rss.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>Actualités X-Sursaut</title><link>https://xsursaut.org/actualites/</link><description>Actualités de X-Sursaut</description>${rssItems}</channel></rss>\n`);

console.log(`Built ${archives.length} archives, ${pageEntries.length} editable pages, ${news.length} news items and ${reports.length} reports.`);
// ---------------------------------------------------------------- 123 lines
