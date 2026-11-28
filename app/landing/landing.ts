/** Landing page behaviour: language switch, mobile menu, copy-to-clipboard for example sentences, footer year. */
import { initI18n, label } from "./i18n";
import { initSttPicker } from "./stt";

const toggle = document.querySelector<HTMLButtonElement>(".nav-toggle");
const links = document.getElementById("nav-links");

function setMenu(open: boolean) {
  links?.classList.toggle("open", open);
  toggle?.setAttribute("aria-expanded", String(open));
}

toggle?.addEventListener("click", () => setMenu(!links?.classList.contains("open")));
links?.addEventListener("click", (e) => {
  if ((e.target as HTMLElement).closest("a")) setMenu(false);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") setMenu(false);
});

for (const btn of document.querySelectorAll<HTMLButtonElement>("button.copy")) {
  btn.addEventListener("click", async () => {
    // Copy the sentence as currently shown, so it matches the selected language.
    const q = btn.parentElement?.querySelector("q");
    const text = (q?.textContent ?? "").replace(/\s+/g, " ").trim();
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = label("copied");
    } catch {
      btn.textContent = label("press");
      const range = document.createRange();
      if (q) {
        range.selectNodeContents(q);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
    setTimeout(() => (btn.textContent = label("copy")), 2000);
  });
}

const year = document.getElementById("year");
if (year) year.textContent = String(new Date().getFullYear());

initSttPicker();

// Last: the year is already filled in and the DOM is complete, so the translation pass sees final text.
initI18n();
