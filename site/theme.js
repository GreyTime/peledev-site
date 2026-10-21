/* Farbschema-Umschalter. Ohne JavaScript gilt weiter die Systemeinstellung. */
(function () {
  var root = document.documentElement;
  var KEY = "peledev-theme";

  function stored() {
    try {
      var v = localStorage.getItem(KEY);
      return v === "light" || v === "dark" ? v : null;
    } catch (e) {
      return null;
    }
  }

  function effective() {
    var v = stored();
    if (v) return v;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function paint() {
    var v = stored();
    if (v) {
      root.setAttribute("data-theme", v);
    } else {
      root.removeAttribute("data-theme");
    }
    var btn = document.querySelector("[data-theme-toggle]");
    if (!btn) return;
    var now = effective();
    var next = now === "dark" ? "light" : "dark";
    // data-target steuert Icon und Label: Mond = "Dunkel", Sonne = "Hell".
    btn.dataset.target = next;
    var label = btn.querySelector(".theme-toggle-label");
    if (label) label.textContent = next === "dark" ? "Dunkel" : "Hell";
    btn.setAttribute("aria-label", "Farbschema wechseln (aktuell " + now + ")");
    btn.setAttribute("aria-pressed", now === "dark" ? "true" : "false");
  }

  // Vor dem ersten Rendern setzen, damit nichts aufblitzt.
  paint();

  // Button existiert erst nach dem Parsen des Bodys.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", paint);
  } else {
    paint();
  }

  document.addEventListener("click", function (ev) {
    var btn = ev.target.closest("[data-theme-toggle]");
    if (!btn) return;
    ev.preventDefault();
    var next = effective() === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(KEY, next);
    } catch (e) {
      /* Speichern nicht möglich: nur für diese Seite umschalten */
      root.setAttribute("data-theme", next);
    }
    paint();
  });

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
    if (!stored()) paint();
  });
})();
