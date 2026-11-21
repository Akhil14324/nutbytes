/* Shared page chrome: header, mobile menu, search, footer, toast, WhatsApp button and scroll reveals.
 * Every page has <div id="site-header"></div> and <div id="site-footer"></div>, and sets
 * <body data-page="..."> so the matching nav link is highlighted. */
(function () {
  const NB = (window.NB = window.NB || {});

  const svg = (body, size = 22, extra = "") =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${body}</svg>`;

  NB.icon = {
    search: (s) => svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', s),
    user: (s) => svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>', s),
    cart: (s) =>
      svg('<path d="M3 4h2.5l2.2 11h10.6L21 7.5H6.4"/><circle cx="9.5" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/>', s),
    arrow: (s = 18) => svg('<path d="M5 12h14M13 6l6 6-6 6"/>', s),
    close: (s) => svg('<path d="M6 6l12 12M18 6 6 18"/>', s),
    menu: (s) => svg('<path d="M4 7h16M4 12h16M4 17h16"/>', s),
    heart: (s = 40) => svg('<path d="M12 20s-7.5-4.6-9.3-9.4C1.5 7.3 3.7 4 7.1 4c2 0 3.6 1.1 4.9 3 1.3-1.9 2.9-3 4.9-3 3.4 0 5.6 3.3 4.4 6.6C19.5 15.4 12 20 12 20Z"/>', s, 'stroke-width="1.4"'),
    leaf: (s = 30) => svg('<path d="M5 19c0-8 5-13 15-14-1 10-6 15-14 15"/><path d="M5 19c3-4 6-7 10-9"/>', s),
    bolt: (s = 30) => svg('<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>', s),
    minus: (s = 16) => svg('<path d="M5 12h14"/>', s),
    plus: (s = 16) => svg('<path d="M12 5v14M5 12h14"/>', s),
    trash: (s = 18) => svg('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', s),
    phone: (s = 18) => svg('<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2Z"/>', s),
    mail: (s = 18) => svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>', s),
    pin: (s = 18) => svg('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>', s),
    check: (s = 18) => svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', s),
    instagram: (s = 22) =>
      svg('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".6" fill="currentColor"/>', s),
    whatsapp: (s = 22) =>
      `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.6-.3Z"/></svg>`,
  };

  /** The round NutBytes badge (img/logo.webp). */
  NB.logoMark = (size, cls = "") =>
    `<img class="brand-logo ${cls}" src="img/${size > 80 ? "logo.webp" : "logo-160.webp"}" alt="" width="${size}" height="${size}" />`;

  const NAV = [
    { id: "home", label: "Home", href: "index.html" },
    { id: "snacks", label: "Snacks", href: "products.html" },
    { id: "collections", label: "Collections", href: "index.html#collections" },
    { id: "about", label: "About Us", href: "about.html" },
    { id: "contact", label: "Contact", href: "#contact" },
  ];

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  NB.esc = esc;

  /** Banner for offers switched on in /admin. */
  function offerStrip() {
    if (!NB.LIVE_OFFERS || !NB.LIVE_OFFERS.length) return "";
    return `<div class="offer-strip" role="status">${NB.LIVE_OFFERS.map((o) => `<span>${esc(o.text)}</span>`).join("")}</div>`;
  }

  function header(page) {
    const links = NAV.map(
      (n) => `<li><a href="${n.href}"${n.id === page ? ' class="is-active" aria-current="page"' : ""}>${n.label}</a></li>`
    ).join("");
    return `
<header class="site-header" id="top">
  <div class="header-inner">
    <a class="brand" href="index.html" aria-label="NutBytes home">
      ${NB.logoMark(62)}
      <span class="brand-text"><span class="brand-name">NutBytes</span><span class="brand-tag">Healthy Snacking</span></span>
    </a>
    <nav class="main-nav" aria-label="Main"><ul>${links}</ul></nav>
    <div class="header-tools">
      <button class="icon-btn" type="button" data-open-search aria-label="Search snacks">${NB.icon.search()}</button>
      <a class="icon-btn" href="login.html" aria-label="My account">${NB.icon.user()}</a>
      <a class="icon-btn cart-btn" href="cart.html" aria-label="Shopping cart">${NB.icon.cart()}<span class="cart-count" data-cart-count>0</span></a>
      <a class="btn btn-brown btn-order" href="products.html">Order Now</a>
      <button class="icon-btn menu-btn" type="button" data-open-menu aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu">${NB.icon.menu()}</button>
    </div>
  </div>
</header>
<div class="mobile-menu" id="mobile-menu" hidden>
  <div class="mobile-menu-panel" role="dialog" aria-modal="true" aria-label="Menu">
    <div class="mobile-menu-head">
      <span class="brand-name">NutBytes</span>
      <button class="icon-btn" type="button" data-close-menu aria-label="Close menu">${NB.icon.close()}</button>
    </div>
    <ul>${links}<li><a href="cart.html">Cart</a></li><li><a href="login.html">My account</a></li></ul>
    <a class="btn btn-brown" href="products.html">Order Now ${NB.icon.arrow()}</a>
  </div>
</div>
<div class="search-overlay" id="search" hidden>
  <div class="search-panel" role="dialog" aria-modal="true" aria-label="Search snacks">
    <form class="search-form" action="products.html" role="search">
      ${NB.icon.search(22)}
      <input type="search" name="q" placeholder="Search laddus, chikki, ariselu…" autocomplete="off" aria-label="Search snacks" />
      <button class="icon-btn" type="button" data-close-search aria-label="Close search">${NB.icon.close()}</button>
    </form>
    <ul class="search-results" aria-live="polite"></ul>
  </div>
</div>`;
  }

  function footer() {
    const S = NB.SITE;
    return `
<footer class="site-footer" id="contact">
  <div class="footer-inner">
    <div class="footer-col footer-brand">
      <a class="brand brand-light" href="index.html">
        ${NB.logoMark(96, "brand-logo-lg")}
        <span class="brand-text"><span class="brand-name">NutBytes</span><span class="brand-tag">Healthy Snacking</span></span>
      </a>
      <p>Wholesome, delicious snacks for a healthier and happier you.</p>
      <div class="socials">
        <a href="${S.instagram}" target="_blank" rel="noopener noreferrer" aria-label="NutBytes on Instagram">${NB.icon.instagram()}</a>
        <a href="#" data-wa aria-label="Chat with NutBytes on WhatsApp">${NB.icon.whatsapp()}</a>
      </div>
    </div>
    <div class="footer-col">
      <h3>Quick Links</h3>
      <ul>
        <li><a href="index.html">Home</a></li>
        <li><a href="products.html">Snacks</a></li>
        <li><a href="index.html#collections">Collections</a></li>
        <li><a href="about.html">About Us</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h3>Customer Care</h3>
      <ul>
        <li><a href="help.html#faqs">FAQs</a></li>
        <li><a href="help.html#delivery">Order &amp; Delivery</a></li>
        <li><a href="help.html#returns">Returns &amp; Refunds</a></li>
        <li><a href="help.html#track">Track Your Order</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h3>Get in Touch</h3>
      <ul class="contact-list">
        <li>${NB.icon.phone()}<a href="tel:+${S.whatsapp}">${S.phoneDisplay}</a></li>
        <li>${NB.icon.mail()}<a href="mailto:${S.email}">${S.email}</a></li>
        <li>${NB.icon.pin()}<span>${S.location}</span></li>
      </ul>
    </div>
  </div>
  <div class="footer-base">
    <span>© ${new Date().getFullYear()} NutBytes. All rights reserved.</span>
    <span>FSSAI Reg. No. ${S.fssai}</span>
  </div>
</footer>
<a class="wa-float" href="#" data-wa aria-label="Order on WhatsApp">${NB.icon.whatsapp(28)}</a>
<div class="toast" role="status" aria-live="polite"></div>`;
  }

  /* ---------- behaviour ---------- */
  function updateCount() {
    const n = NB.cart.count();
    document.querySelectorAll("[data-cart-count]").forEach((el) => {
      el.textContent = n;
      el.classList.toggle("is-empty", n === 0);
    });
  }

  let toastTimer;
  NB.toast = (msg) => {
    const t = document.querySelector(".toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("is-on"), 2800);
  };

  /** Show/hide an overlay, keep focus inside it, and close it on Escape or a backdrop click. */
  function overlay(el, opener, onOpen) {
    const open = () => {
      el.hidden = false;
      requestAnimationFrame(() => el.classList.add("is-open"));
      document.body.classList.add("no-scroll");
      opener && opener.setAttribute("aria-expanded", "true");
      onOpen && onOpen();
    };
    const close = () => {
      el.classList.remove("is-open");
      document.body.classList.remove("no-scroll");
      opener && opener.setAttribute("aria-expanded", "false");
      setTimeout(() => (el.hidden = true), 250);
      opener && opener.focus();
    };
    el.addEventListener("click", (e) => e.target === el && close());
    el.addEventListener("keydown", (e) => e.key === "Escape" && close());
    return { open, close };
  }

  function searchResults(q) {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return NB.PRODUCTS.filter((p) =>
      [p.name, p.short, NB.collectionById(p.collection).name].join(" ").toLowerCase().includes(s)
    );
  }
  NB.search = searchResults;

  function setupSearch() {
    const el = document.getElementById("search");
    const input = el.querySelector("input");
    const list = el.querySelector(".search-results");
    const ui = overlay(el, document.querySelector("[data-open-search]"), () => setTimeout(() => input.focus(), 60));
    document.querySelectorAll("[data-open-search]").forEach((b) => b.addEventListener("click", ui.open));
    el.querySelector("[data-close-search]").addEventListener("click", ui.close);
    input.addEventListener("input", () => {
      const q = input.value;
      const found = searchResults(q).slice(0, 6);
      list.innerHTML = !q.trim()
        ? ""
        : found.length
          ? found
              .map(
                (p) => `<li><a href="product.html?id=${p.id}"><img src="${p.img}" alt="" width="52" height="52" loading="lazy" />
                  <span><b>${esc(p.name)}</b><small>${NB.money(p.price)} · ${esc(NB.collectionById(p.collection).name)}</small></span></a></li>`
              )
              .join("") + `<li class="search-all"><a href="products.html?q=${encodeURIComponent(q)}">See all results ${NB.icon.arrow(16)}</a></li>`
          : `<li class="search-empty">No snacks match “${esc(q)}”.</li>`;
    });
  }

  function setupMenu() {
    const el = document.getElementById("mobile-menu");
    const btn = document.querySelector("[data-open-menu]");
    const ui = overlay(el, btn);
    btn.addEventListener("click", ui.open);
    el.querySelector("[data-close-menu]").addEventListener("click", ui.close);
    el.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => ui.close()));
  }

  function setupWhatsApp() {
    document.querySelectorAll("[data-wa]").forEach((a) => {
      a.href = NB.waLink(a.dataset.waText || NB.WA_HELLO);
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    });
  }

  function setupReveal() {
    const els = document.querySelectorAll("[data-reveal]");
    if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((e) => e.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("is-in");
            io.unobserve(en.target);
          }
        }),
      { rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((e) => io.observe(e));
  }

  function setupHeaderShadow() {
    const h = document.querySelector(".site-header");
    const on = () => h.classList.toggle("is-scrolled", window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
  }

  /** Product card used by the shop grid and "you may also like". */
  NB.productCard = (p) => {
    const c = NB.collectionById(p.collection);
    return `<article class="product-card tone-${c.tone}" data-reveal>
      <a class="product-card-img" href="product.html?id=${p.id}">
        <img src="${p.img}" alt="${esc(p.name)}" width="400" height="400" loading="lazy" />
        ${p.badge ? `<span class="badge">${esc(p.badge)}</span>` : ""}
      </a>
      <div class="product-card-body">
        <span class="eyebrow">${esc(c.name)}</span>
        <h3><a href="product.html?id=${p.id}">${esc(p.name)}</a></h3>
        <p>${esc(p.short)}</p>
        <div class="product-card-foot">
          <span class="price">${NB.money(p.price)} <small>/ 250 g</small></span>
          <button class="btn btn-brown btn-sm" type="button" data-add="${p.id}" aria-label="Add ${esc(p.name)} to cart">Add ${NB.icon.plus(14)}</button>
        </div>
      </div>
    </article>`;
  };

  /** Any [data-add] button adds the 250 g pack of that product. */
  function setupQuickAdd() {
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-add]");
      if (!b) return;
      const p = NB.productById(b.dataset.add);
      NB.cart.add(p.id, NB.WEIGHTS[0].id, 1);
      NB.toast(`${p.name} (250 g) added to your cart`);
      b.classList.add("is-added");
      setTimeout(() => b.classList.remove("is-added"), 900);
    });
  }

  NB.reveal = setupReveal;

  document.addEventListener("DOMContentLoaded", () => {
    const page = document.body.dataset.nav || document.body.dataset.page || "";
    const h = document.getElementById("site-header");
    const f = document.getElementById("site-footer");
    if (h) h.outerHTML = offerStrip() + header(page);
    if (f) f.outerHTML = footer();
    updateCount();
    setupSearch();
    setupMenu();
    setupWhatsApp();
    setupHeaderShadow();
    setupQuickAdd();
    document.addEventListener("nb:cart", updateCount);
    window.addEventListener("storage", updateCount);
    // page scripts run after the chrome is in place
    document.dispatchEvent(new CustomEvent("nb:ready"));
    // on the home page the logo intro plays first; reveal the sections once it has finished
    (NB.introDone || Promise.resolve()).then(setupReveal);
  });
})();
