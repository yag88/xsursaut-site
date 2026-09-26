// X-Sursaut — scripts/build.mjs — 2026-09-26
import fs from "node:fs/promises";
import path from "node:path";
import * as cheerio from "cheerio";

const root = path.resolve(import.meta.dirname, "..");
const archiveDir = path.join(root, "archive/html");
const publicDir = path.join(root, "site/public");
const generatedDir = path.join(publicDir, "archives");

const files = (await fs.readdir(archiveDir)).filter((file) => file.endsWith(".html"));
const pages = [];

function normalizeTitle(value = "") {
  return value.replace(/\s*\|\s*X-Sursaut\s*$/i, "").replace(/\s+/g, " ").trim();
}

function slugForFile(file) {
  return file.replace(/\.html$/, "");
}

function cleanContent($, sourceFile) {
  const content = $("#content").first().clone();
  content.find("script, style, form, iframe, noscript, .sidebar, .pagination, .comments, .share-bar").remove();
  content.find("*[style]").removeAttr("style");
  content.find("*[class]").each((_, element) => {
    const keep = ($(element).attr("class") || "").split(/\s+/).filter((name) =>
      ["row", "col-md-12", "col-md-8", "col-md-4", "staff-item", "event-item"].includes(name),
    );
    keep.length ? $(element).attr("class", keep.join(" ")) : $(element).removeAttr("class");
  });
  content.find("a").each((_, element) => {
    const href = $(element).attr("href") || "";
    if (/wp-content\/uploads\/.*\.pdf/i.test(href) || /\/uploads\/Accueil\/.*\.pdf/i.test(href)) {
      $(element).attr("href", `/documents/${path.basename(href.split("?")[0])}`);
    } else if (/^https?:\/\/(www\.)?x-sursaut\.org/i.test(href)) {
      const parsed = new URL(href.replace(":80/", "/"));
      const candidate = `${parsed.pathname}${parsed.search}`.replace(/^\/+|\/+$/g, "")
        .replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "home";
      $(element).attr("href", `/archives/${candidate}/`);
    }
    $(element).removeAttr("target");
  });
  content.find("img").each((_, element) => {
    const alt = $(element).attr("alt") || "Illustration archivée";
    $(element).replaceWith(`<span class="missing-image" role="img" aria-label="${alt}">${alt}</span>`);
  });
  let html = content.html() || "";
  html = html.replace(/<div>\s*<\/div>/g, "").trim();
  if (!html) html = `<p>Le contenu de cette page n’a pas pu être récupéré dans l’archive.</p>`;
  return `<div class="archive-source" data-source="${sourceFile}">${html}</div>`;
}

for (const file of files) {
  const html = await fs.readFile(path.join(archiveDir, file), "utf8");
  const $ = cheerio.load(html);
  const title = normalizeTitle($("title").text()) || normalizeTitle($(".page-header h2").text()) || slugForFile(file);
  const slug = slugForFile(file);
  const kind = slug.startsWith("event-") ? "Événement" : slug.startsWith("staff-") ? "Personne" : slug.includes("blog-") ? "Article" : "Page";
  pages.push({ file, slug, title, kind, body: cleanContent($, file) });
}

pages.sort((a, b) => a.title.localeCompare(b.title, "fr"));

const escapeHtml = (value) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

function layout({ title, description, body, active = "" }) {
  const nav = [
    ["Accueil", "/"], ["Présentation", "/presentation/"], ["Publications", "/publications/"],
    ["Événements", "/evenements/"], ["Équipe", "/equipe/"], ["Archives", "/archives/"], ["Contact", "/contact/"],
  ].map(([label, href]) => `<a href="${href}"${active === label ? ' aria-current="page"' : ""}>${label}</a>`).join("");
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)} — X-Sursaut</title><meta name="description" content="${escapeHtml(description)}">
<link rel="stylesheet" href="/assets/site.css"><link rel="icon" href="/assets/logo.png"></head>
<body><header class="site-header"><a class="brand" href="/"><img src="/assets/logo.png" alt="X-Sursaut"></a>
<button class="menu-button" aria-expanded="false" aria-controls="navigation">Menu</button><nav id="navigation">${nav}</nav></header>
<main>${body}</main><footer><p><strong>X-Sursaut</strong> — Groupe de réflexion économique issu de la communauté polytechnicienne.</p>
<p><a href="mailto:x-sursaut@polytechnique.org">x-sursaut@polytechnique.org</a> · <a href="/mentions-legales/">Mentions légales</a></p>
<p class="notice">Site reconstruit à partir d’archives publiques. Certains contenus historiques restent à valider par le bureau.</p></footer>
<script src="/assets/site.js"></script></body></html>`;
}

async function writePage(route, options) {
  const directory = route === "/" ? publicDir : path.join(publicDir, route.replace(/^\//, ""));
  await fs.mkdir(directory, { recursive: true });
  const filename = route === "/" ? "index.html" : `${route.replace(/^\//, "")}index.html`;
  const lines = [`<!-- X-Sursaut — ${filename} — 2026-09-26 -->`, ...layout(options).split("\n")];
  lines.push(`<!-- ---------------------------------------------------------------- ${lines.length + 1} lines -->`);
  await fs.writeFile(path.join(directory, "index.html"), `${lines.join("\n")}\n`);
}

const hero = `<section class="hero"><div><p class="eyebrow">Depuis 2005</p><h1>Éclairer les choix économiques et budgétaires</h1>
<p>X-Sursaut associe l’expérience des acteurs aux idées des économistes académiques pour contribuer au débat public.</p>
<div class="actions"><a class="button" href="/publications/">Voir les publications</a><a class="button secondary" href="/presentation/">Découvrir le groupe</a></div></div></section>`;
const homeBody = `${hero}<section class="intro"><h2>Un réseau au service du débat public</h2><p>Créé en juillet 2005 par Hubert Lévy-Lambert et soixante polytechniciens, X-Sursaut organise des conférences et publie des notes, études, livres et vidéos.</p></section>
<section class="cards"><article><p class="eyebrow">Fonds documentaire</p><h2>Publications</h2><p>Les études et notes récupérées sont à nouveau consultables, avec leurs documents d’origine lorsqu’ils ont été préservés.</p><a href="/publications/">Parcourir les publications →</a></article>
<article><p class="eyebrow">2005–2023</p><h2>Événements</h2><p>Conférences, petits-déjeuners, débats et webinaires retracent près de vingt ans d’activité.</p><a href="/evenements/">Explorer les événements →</a></article>
<article><p class="eyebrow">Transparence</p><h2>Archives restaurées</h2><p>Les pages historiques sont signalées comme telles et séparées des informations institutionnelles à confirmer.</p><a href="/archives/">Consulter les archives →</a></article></section>`;

await writePage("/", { title: "Accueil", description: "X-Sursaut, groupe de réflexion économique issu de la communauté polytechnicienne.", body: homeBody, active: "Accueil" });

const select = (...slugs) => pages.find((page) => slugs.includes(page.slug));
const pageBody = (heading, lead, selected) => `<section class="page-heading"><p class="eyebrow">X-Sursaut</p><h1>${heading}</h1><p>${lead}</p></section><section class="prose">${selected?.body || "<p>Contenu en cours de validation.</p>"}</section>`;
await writePage("/presentation/", { title: "Présentation", description: "Histoire, mission et méthode de X-Sursaut.", body: pageBody("Présentation", "L’histoire et la raison d’être du groupe.", select("presentation-qui-sommes-nous", "presentation")), active: "Présentation" });
await writePage("/contact/", { title: "Contact", description: "Contacter ou rejoindre X-Sursaut.", body: pageBody("Contact", "Pour contacter le groupe ou proposer une contribution.", select("contact")), active: "Contact" });
await writePage("/mentions-legales/", { title: "Mentions légales", description: "Mentions légales historiques de X-Sursaut.", body: pageBody("Mentions légales", "Version historique récupérée ; à mettre à jour avant la mise en production.", select("mentions-legales")) });

function listing(title, lead, matching, active) {
  const items = pages.filter(matching).map((page) => `<li><span>${page.kind}</span><a href="/archives/${page.slug}/">${escapeHtml(page.title)}</a></li>`).join("");
  return { title, description: lead, active, body: `<section class="page-heading"><p class="eyebrow">Fonds restauré</p><h1>${title}</h1><p>${lead}</p></section><section class="listing"><ul>${items}</ul></section>` };
}
await writePage("/publications/", listing("Publications", "Études, notes et articles issus du site historique, accompagnés des PDF récupérés.", (page) => page.slug.includes("publication") || page.kind === "Article", "Publications"));
await writePage("/evenements/", listing("Événements", "Conférences, débats et webinaires retrouvés dans les archives publiques.", (page) => page.kind === "Événement" && !page.slug.includes("event_date"), "Événements"));
await writePage("/equipe/", listing("Équipe historique", "Profils publiés sur l’ancien site ; les responsabilités actuelles doivent être confirmées.", (page) => page.kind === "Personne", "Équipe"));
await fs.rm(generatedDir, { recursive: true, force: true });
await writePage("/archives/", listing("Archives du site", `${pages.length} pages historiques ont été récupérées, nettoyées et rendues consultables.`, () => true, "Archives"));
for (const page of pages) {
  await writePage(`/archives/${page.slug}/`, { title: page.title, description: `Archive restaurée : ${page.title}`, body: `<section class="page-heading"><p class="eyebrow">Archive restaurée · ${page.kind}</p><h1>${escapeHtml(page.title)}</h1><p>Contenu historique récupéré depuis Internet Archive. Les informations peuvent être anciennes.</p></section><section class="prose">${page.body}</section>` });
}

console.log(`Built ${pages.length + 8} pages from ${pages.length} recovered archive pages.`);
// ---------------------------------------------------------------- 123 lines
