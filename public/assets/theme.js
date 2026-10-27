// Runs before CSS to avoid a flash when a visitor explicitly chose a theme.
// This device-local preference is never sent anywhere by StylePort.
(() => {
  const key = "styleport-appearance";
  const root = document.documentElement;
  const system = window.matchMedia("(prefers-color-scheme: dark)");
  const labels = { system: "System", light: "Light", dark: "Dark" };
  const valid = value => ["light", "dark"].includes(value) ? value : "system";
  let preference = "system";

  try { preference = valid(localStorage.getItem(key)); } catch { /* System appearance still works. */ }

  function apply() {
    if (preference === "system") root.removeAttribute("data-theme");
    else root.dataset.theme = preference;
    const dark = preference === "dark" || (preference === "system" && system.matches);
    document.querySelectorAll('meta[name="theme-color"]').forEach(meta => {
      meta.setAttribute("content", dark ? "#151718" : "#f7f3ed");
    });
  }

  function persist() {
    try {
      if (preference === "system") localStorage.removeItem(key);
      else localStorage.setItem(key, preference);
    } catch { /* The control remains usable for this page. */ }
  }

  function updateControl() {
    const trigger = document.querySelector("#appearance");
    if (!trigger) return;
    const label = labels[preference];
    trigger.querySelector("[data-appearance-label]").textContent = label;
    trigger.setAttribute("aria-label", `Color theme: ${label}`);
    document.querySelectorAll("[data-appearance-value]").forEach(option => {
      const selected = option.dataset.appearanceValue === preference;
      option.setAttribute("aria-checked", String(selected));
      option.tabIndex = selected ? 0 : -1;
    });
  }

  function choose(value) {
    preference = valid(value);
    persist();
    apply();
    updateControl();
  }

  apply();
  system.addEventListener("change", apply);
  window.addEventListener("storage", event => {
    if (event.key !== key && event.key !== null) return;
    preference = valid(event.newValue);
    apply();
    updateControl();
  });

  document.addEventListener("DOMContentLoaded", () => {
    const control = document.querySelector(".appearance-control");
    const trigger = document.querySelector("#appearance");
    const menu = document.querySelector("#appearance-menu");
    const options = [...document.querySelectorAll("[data-appearance-value]")];
    if (!control || !trigger || !menu || options.length !== 3) return;

    function setOpen(open, focusSelected = false) {
      menu.hidden = !open;
      trigger.setAttribute("aria-expanded", String(open));
      if (open && focusSelected) {
        (options.find(option => option.dataset.appearanceValue === preference) || options[0]).focus();
      }
    }

    function moveFocus(direction) {
      const current = Math.max(0, options.indexOf(document.activeElement));
      options[(current + direction + options.length) % options.length].focus();
    }

    updateControl();
    control.hidden = false;
    trigger.addEventListener("click", () => setOpen(menu.hidden, !menu.hidden));
    trigger.addEventListener("keydown", event => {
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      setOpen(true);
      if (event.key === "ArrowUp" || event.key === "End") options.at(-1).focus();
      else options[0].focus();
    });
    menu.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        trigger.focus();
      } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        moveFocus(event.key === "ArrowDown" ? 1 : -1);
      } else if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        options[event.key === "Home" ? 0 : options.length - 1].focus();
      }
    });
    options.forEach(option => {
      option.addEventListener("click", () => {
        choose(option.dataset.appearanceValue);
        setOpen(false);
        trigger.focus();
      });
    });
    document.addEventListener("pointerdown", event => {
      if (!control.contains(event.target)) setOpen(false);
    });
    document.addEventListener("focusin", event => {
      if (!control.contains(event.target)) setOpen(false);
    });
  });
})();
