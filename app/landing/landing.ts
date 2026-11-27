/** Landing page behaviour: mobile menu, copy-to-clipboard for example sentences, footer year. */

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
    const text = btn.dataset.copy ?? "";
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = "Copied ✓";
    } catch {
      btn.textContent = "Press Ctrl/⌘+C";
      const range = document.createRange();
      const q = btn.parentElement?.querySelector("q");
      if (q) {
        range.selectNodeContents(q);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
    setTimeout(() => (btn.textContent = "Copy"), 2000);
  });
}

const year = document.getElementById("year");
if (year) year.textContent = String(new Date().getFullYear());
