/* Shared helpers for the Westbridge mockups: EN/PL switch, copy buttons, reveal on scroll */
window.WB = (function () {
  var lang = "en", PL = {}, nodes = [], attrs = [], hooks = [];

  function t(en) { return lang === "pl" && PL[en] ? PL[en] : en; }

  function collect() {
    nodes = []; attrs = [];
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      var n = walker.currentNode, k = n.nodeValue.replace(/\s+/g, " ").trim();
      if (k && PL[k] && !n.parentNode.closest("script,style")) {
        // keep the spacing around inline elements such as <em> and <span>
        var lead = /^\s/.test(n.nodeValue) ? " " : "", trail = /\s$/.test(n.nodeValue) ? " " : "";
        nodes.push([n, n.nodeValue, lead + PL[k] + trail]);
      }
    }
    document.querySelectorAll("[alt],[placeholder],[aria-label]").forEach(function (el) {
      ["alt", "placeholder", "aria-label"].forEach(function (a) {
        var v = el.getAttribute(a); if (v && PL[v]) attrs.push([el, a, v, PL[v]]);
      });
    });
  }

  function setLang(l) {
    lang = l;
    nodes.forEach(function (x) { x[0].nodeValue = l === "pl" ? x[2] : x[1]; });
    attrs.forEach(function (x) { x[0].setAttribute(x[1], l === "pl" ? x[3] : x[2]); });
    document.documentElement.lang = l;
    document.querySelectorAll("[data-lang]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.lang === l)); });
    hooks.forEach(function (h) { h(l); });
    try { localStorage.setItem("wbf-lang", l); } catch (e) {}
  }

  function init(dict) {
    PL = dict || {};
    collect();
    document.querySelectorAll("[data-lang]").forEach(function (b) { b.addEventListener("click", function () { setLang(b.dataset.lang); }); });

    document.querySelectorAll("[data-copy]").forEach(function (b) {
      b.addEventListener("click", function () {
        var src = document.getElementById(b.dataset.copy);
        var done = function () { b.textContent = t("Copied"); setTimeout(function () { b.textContent = t("Copy"); }, 1600); };
        try { navigator.clipboard.writeText(src.textContent).then(done, done); } catch (e) {}
      });
    });

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
      }, { rootMargin: "0px 0px -8% 0px" });
      document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
    } else {
      document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
    }

    var start = "en";
    try { start = localStorage.getItem("wbf-lang") || start; } catch (e) {}
    if (location.hash === "#pl") start = "pl";
    if (start === "pl") setLang("pl"); else hooks.forEach(function (h) { h("en"); });
  }

  return {
    init: init, t: t,
    lang: function () { return lang; },
    onLang: function (fn) { hooks.push(fn); },
    fmt: function (n, d) { return n.toLocaleString(lang === "pl" ? "pl-PL" : "en-GB", { maximumFractionDigits: d || 0, minimumFractionDigits: d || 0 }); }
  };
})();
