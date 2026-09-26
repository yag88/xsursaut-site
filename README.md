# X-Sursaut website reconstruction

Clean static reconstruction of the historic X-Sursaut website from verified public material and Internet Archive captures.

## Build

```bash
npm install
npm run build
```

The deployable output is `site/public/`. It contains no PHP, database, WordPress runtime, tracking code, or archived JavaScript.

## Deploy

The project is suitable for Cloudflare Pages, GitHub Pages, Netlify, or any static web server. Use `npm run build` as the build command and `site/public` as the output directory.

## Editorial status

Recovered historical pages are visibly marked as archives. The current bureau must validate current responsibilities, contact details, legal notices, and publication rights before the custom domain becomes authoritative.
