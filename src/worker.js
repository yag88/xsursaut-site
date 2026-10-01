// X-Sursaut — src/worker.js — 2026-09-27
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === "www.xsursaut.org") {
      url.hostname = "xsursaut.org";
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
  async email(message) {
    await Promise.all([
      message.forward("xsursaut@gagnard.net"),
      message.forward("laurentdaniel@yahoo.fr"),
    ]);
  },
};
// ---------------------------------------------------------------- 18 lines
