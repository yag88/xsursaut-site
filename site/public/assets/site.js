// X-Sursaut — site/public/assets/site.js — 2026-09-26
const button = document.querySelector(".menu-button");
const navigation = document.querySelector("#navigation");

button?.addEventListener("click", () => {
  const open = navigation.classList.toggle("open");
  button.setAttribute("aria-expanded", String(open));
});
// ---------------------------------------------------------------- 9 lines
