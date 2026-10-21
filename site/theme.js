/* Farbschema-Umschalter. Ohne JavaScript gilt weiter die Systemeinstellung. */
(function () {
  var root = document.documentElement;
  var KEY = "peledev-theme";

  // Beschriftung folgt der Browsersprache: Deutsch -> Hell/Dunkel, sonst Englisch.
  // Die Seite selbst bleibt deutsch, uebersetzt wird nur der Umschalter.
  var lang = (navigator.language || root.lang || "en").toLowerCase();
  var de = lang.indexOf("de") === 0;
  var T = de
    ? { dark: "Dunkel", light: "Hell", toggle: "Farbschema wechseln", current: "aktuell " }
    : { dark: "Dark", light: "Light", toggle: "Toggle color scheme", current: "currently " };

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
    if (label) label.textContent = next === "dark" ? T.dark : T.light;
    btn.setAttribute("aria-label", T.toggle + " (" + T.current + (now === "dark" ? T.dark.toLowerCase() : T.light.toLowerCase()) + ")");
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
