// Runs before CSS to avoid a flash when a visitor explicitly chose a theme.
// This device-local preference is never sent anywhere by StylePort.
(() => {
  const key = "styleport-appearance";
  const root = document.documentElement;
  const system = window.matchMedia("(prefers-color-scheme: dark)");
  const valid = value => ["light", "dark"].includes(value) ? value : "system";
  let preference = "system";

  try { preference = valid(localStorage.getItem(key)); } catch { /* System appearance still works. */ }

  function apply() {
    if (preference === "system") root.removeAttribute("data-theme");
    else root.dataset.theme = preference;
    const dark = preference === "dark" || (preference === "system" && system.matches);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#151718" : "#f7f3ed");
  }

  apply();
  system.addEventListener("change", apply);
  window.addEventListener("storage", event => {
    if (event.key !== key && event.key !== null) return;
    preference = valid(event.newValue);
    apply();
    const control = document.querySelector("#appearance");
    if (control) control.value = preference;
  });

  document.addEventListener("DOMContentLoaded", () => {
    const control = document.querySelector("#appearance");
    if (!control) return;
    control.value = preference;
    control.closest(".appearance-control").hidden = false;
    control.addEventListener("change", () => {
      preference = valid(control.value);
      try {
        if (preference === "system") localStorage.removeItem(key);
        else localStorage.setItem(key, preference);
      } catch { /* The selector remains usable for this page. */ }
      apply();
    });
  });
})();
