/* Cookie consent banner (vanilla-cookieconsent 3.1), same setup as mazdom.pl and istnestudio.pl.
   Consent Mode v2: everything "denied" by default, a saved decision is replayed at once.
   Bump REV when the list of services changes so the banner shows again.
   GTM_ID stays empty until analytics is installed; nothing is loaded before that. */
(function () {
  var REV = 1, COOKIE = "cc_cookie", GTM_ID = "";
  var base = document.currentScript.src.replace(/assets\/consent\.js.*$/, "");
  var POLICY = base + "polityka-prywatnosci.html";
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { dataLayer.push(arguments); };
  gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied", functionality_storage: "granted", security_storage: "granted", wait_for_update: 500 });
  gtag("set", "ads_data_redaction", true);
  function update(cats) {
    var a = cats.indexOf("analytics") > -1 ? "granted" : "denied", k = cats.indexOf("marketing") > -1 ? "granted" : "denied";
    gtag("consent", "update", { analytics_storage: a, ad_storage: k, ad_user_data: k, ad_personalization: k });
    return k;
  }
  function apply(cats) {
    var k = update(cats);
    if (window.fbq) fbq("consent", k === "granted" ? "grant" : "revoke");
    dataLayer.push({ event: "cookie_consent_update", consent_categories: cats.join(",") });
  }
  try {
    var m = document.cookie.match(new RegExp("(?:^|; )" + COOKIE + "=([^;]*)"));
    if (m) { var c = JSON.parse(decodeURIComponent(m[1])); if (c && c.revision === REV && c.categories) update(c.categories); }
  } catch (e) {}
  if (GTM_ID) {
    gtag("js", new Date());
    dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    var loadGtm = function () { var g = document.createElement("script"); g.async = true; g.src = "https://www.googletagmanager.com/gtm.js?id=" + GTM_ID; document.head.appendChild(g); };
    if (document.readyState === "complete") loadGtm(); else addEventListener("load", function () { setTimeout(loadGtm, 1200); });
  }

  var css = document.createElement("link"); css.rel = "stylesheet"; css.href = base + "assets/vendor/cookieconsent.css"; document.head.appendChild(css);
  var st = document.createElement("style");
  st.textContent = '#cc-main{--cc-font-family:"Inter Tight","Helvetica Neue",Arial,sans-serif;--cc-modal-border-radius:20px;--cc-btn-border-radius:999px;--cc-z-index:100001;--cc-bg:#FFFFFF;--cc-primary-color:#14181B;--cc-secondary-color:#5E636A;--cc-link-color:#14181B;--cc-btn-primary-bg:#14181B;--cc-btn-primary-color:#FFFFFF;--cc-btn-primary-border-color:#14181B;--cc-btn-primary-hover-bg:#2B3238;--cc-btn-primary-hover-color:#FFFFFF;--cc-btn-primary-hover-border-color:#2B3238;--cc-btn-secondary-bg:transparent;--cc-btn-secondary-color:#14181B;--cc-btn-secondary-border-color:#14181B;--cc-btn-secondary-hover-bg:#14181B;--cc-btn-secondary-hover-color:#FFFFFF;--cc-btn-secondary-hover-border-color:#14181B;--cc-separator-border-color:#DEDAD2;--cc-toggle-on-bg:#14181B;--cc-toggle-off-bg:#A9ADB2;--cc-toggle-on-knob-bg:#FFFFFF;--cc-toggle-readonly-bg:#A99273;--cc-cookie-category-block-bg:#F6F4EF;--cc-cookie-category-block-border:#F6F4EF;--cc-cookie-category-block-hover-bg:#ECE8E0;--cc-cookie-category-block-hover-border:#ECE8E0;--cc-cookie-category-expanded-block-hover-bg:#ECE8E0;--cc-overlay-bg:rgba(20,24,27,.55);--cc-footer-bg:#F6F4EF;--cc-footer-color:#5E636A;--cc-footer-border-color:#DEDAD2;font-weight:400;}#cc-main .cm__btn,#cc-main .pm__btn{font-weight:500;}#cc-main .cm__title,#cc-main .pm__title{font-weight:500;letter-spacing:-.02em;}#cc-main a{text-decoration:underline;text-underline-offset:3px;}';
  document.head.appendChild(st);

  function lang() { try { return localStorage.getItem("wbf-lang") === "pl" ? "pl" : "en"; } catch (e) { return "en"; } }
  function tbl(h, rows) { return { headers: h, body: rows }; }
  var s = document.createElement("script"); s.src = base + "assets/vendor/cookieconsent.umd.js"; s.defer = true;
  s.onload = function () {
    var hEn = { name: "Cookie", service: "Service", exp: "Expiry" }, hPl = { name: "Cookie", service: "Usługa", exp: "Ważność" };
    CookieConsent.run({
      revision: REV, mode: "opt-in", hideFromBots: true,
      cookie: { name: COOKIE, expiresAfterDays: 182 },
      guiOptions: { consentModal: { layout: "box wide", position: "bottom left", equalWeightButtons: true, flipButtons: false }, preferencesModal: { layout: "box", equalWeightButtons: true, flipButtons: false } },
      categories: { necessary: { enabled: true, readOnly: true }, analytics: { autoClear: { cookies: [{ name: /^_ga/ }, { name: /^_cl/ }, { name: "CLID" }] } }, marketing: { autoClear: { cookies: [{ name: /^_gcl/ }, { name: /^_fbp/ }, { name: /^_fbc/ }, { name: /^li_/ }] } } },
      onConsent: function (o) { apply(o.cookie.categories); },
      onChange: function (o) { apply(o.cookie.categories); },
      language: { default: lang(), translations: {
        en: {
          consentModal: { title: "We respect your privacy", description: "We use cookies to make the site work and, with your consent, to analyse traffic and measure the effectiveness of our campaigns. You can accept all, reject the optional ones or choose what you agree to. You can change your decision at any time in “Privacy settings” in the footer.", acceptAllBtn: "Accept all", acceptNecessaryBtn: "Reject optional", showPreferencesBtn: "Settings", footer: '<a href="' + POLICY + '">Privacy policy</a>' },
          preferencesModal: { title: "Privacy settings", acceptAllBtn: "Accept all", acceptNecessaryBtn: "Reject optional", savePreferencesBtn: "Save my choice", closeIconLabel: "Close", sections: [
            { description: 'Choose which categories of cookies you agree to. Details are in our <a href="' + POLICY + '">privacy policy</a>.' },
            { title: "Necessary", description: "Required for the site to work, for example to remember your cookie decision. They cannot be switched off.", linkedCategory: "necessary" },
            { title: "Analytics", description: "Help us understand how the site is used so we can improve it (Google Analytics 4, Microsoft Clarity).", linkedCategory: "analytics", cookieTable: tbl(hEn, [{ name: "_ga, _ga_*", service: "Google Analytics", exp: "2 years" }, { name: "_clck, _clsk, CLID", service: "Microsoft Clarity", exp: "up to 1 year" }]) },
            { title: "Marketing", description: "Let us measure the effectiveness of campaigns on Google Ads, LinkedIn and Meta.", linkedCategory: "marketing", cookieTable: tbl(hEn, [{ name: "_gcl_au", service: "Google Ads", exp: "90 days" }, { name: "li_*", service: "LinkedIn Insight Tag", exp: "up to 6 months" }, { name: "_fbp, _fbc", service: "Meta Pixel", exp: "90 days" }]) }
          ] }
        },
        pl: {
          consentModal: { title: "Szanujemy Twoją prywatność", description: "Używamy plików cookies, żeby strona działała poprawnie, a za Twoją zgodą także do analizy ruchu i mierzenia skuteczności kampanii. Możesz zaakceptować wszystkie, odrzucić opcjonalne albo wybrać, na co się zgadzasz. Decyzję zmienisz w każdej chwili w „Ustawieniach prywatności” w stopce strony.", acceptAllBtn: "Akceptuj wszystkie", acceptNecessaryBtn: "Odrzuć opcjonalne", showPreferencesBtn: "Ustawienia", footer: '<a href="' + POLICY + '">Polityka prywatności</a>' },
          preferencesModal: { title: "Ustawienia prywatności", acceptAllBtn: "Akceptuj wszystkie", acceptNecessaryBtn: "Odrzuć opcjonalne", savePreferencesBtn: "Zapisz wybór", closeIconLabel: "Zamknij", sections: [
            { description: 'Wybierz, na które kategorie plików cookies się zgadzasz. Szczegóły znajdziesz w <a href="' + POLICY + '">polityce prywatności</a>.' },
            { title: "Niezbędne", description: "Konieczne do działania strony, np. zapamiętanie Twojej decyzji o cookies. Nie można ich wyłączyć.", linkedCategory: "necessary" },
            { title: "Analityczne", description: "Pomagają zrozumieć, jak korzystasz ze strony, żeby można ją było ulepszać (Google Analytics 4, Microsoft Clarity).", linkedCategory: "analytics", cookieTable: tbl(hPl, [{ name: "_ga, _ga_*", service: "Google Analytics", exp: "2 lata" }, { name: "_clck, _clsk, CLID", service: "Microsoft Clarity", exp: "do 1 roku" }]) },
            { title: "Marketingowe", description: "Pozwalają mierzyć skuteczność kampanii w Google Ads, LinkedIn i Meta.", linkedCategory: "marketing", cookieTable: tbl(hPl, [{ name: "_gcl_au", service: "Google Ads", exp: "90 dni" }, { name: "li_*", service: "LinkedIn Insight Tag", exp: "do 6 miesięcy" }, { name: "_fbp, _fbc", service: "Meta Pixel", exp: "90 dni" }]) }
          ] }
        }
      } }
    });
    // follow the page's EN/PL switch
    document.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-lang]");
      if (b) CookieConsent.setLanguage(b.dataset.lang);
    });
  };
  document.head.appendChild(s);
})();
