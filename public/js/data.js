/* NutBytes shop data: business details, collections, pack sizes, products, offers and home page wording.
 * Everything here can be changed in the /admin panel, which publishes data/catalog.js.
 * The values below are only the defaults used when catalog.js doesn't set something. */
(function () {
  const NB = (window.NB = window.NB || {});
  const CATALOG = window.NB_CATALOG || {};

  NB.SITE = {
    name: "NutBytes",
    tagline: "Healthy Snacking",
    // WhatsApp number in international format, without "+"
    whatsapp: "919000242480",
    phoneDisplay: "+91 90002 42480",
    // TODO: confirm this address before launch (it comes from the design mock-up)
    email: "hello@nutbytes.in",
    location: "Ongole, Andhra Pradesh",
    deliveryArea: "Ongole and nearby areas",
    instagram: "https://www.instagram.com/nutbytes/",
    fssai: "20126171000742",
    ...CATALOG.site,
    currency: "₹",
  };

  NB.COLLECTIONS =
    CATALOG.collections && CATALOG.collections.length
      ? CATALOG.collections
      : [
          { id: "nut-bites", name: "Nut Bites", line: "Crunchy, Nutty & Satisfying", img: "img/bite-nut.webp", tone: "blush" },
          { id: "coconut-bites", name: "Coconut Bites", line: "A Natural Energy Boost", img: "img/bite-coconut.webp", tone: "peach" },
          { id: "seed-bites", name: "Seed Bites", line: "Packed with Goodness", img: "img/bite-seed.webp", tone: "lilac" },
        ];

  /* Pack sizes a customer can choose, and how the price scales from the first size's price. */
  NB.WEIGHTS =
    CATALOG.weights && CATALOG.weights.length
      ? CATALOG.weights
      : [
          { id: "250g", label: "250 g", factor: 1 },
          { id: "500g", label: "500 g", factor: 1.9 },
          { id: "1kg", label: "1 kg", factor: 3.6 },
        ];

  /* Products: prices are for the first pack size. Hidden products are not shown or sold. */
  NB.PRODUCTS = (CATALOG.products || [])
    .filter((p) => !p.hidden)
    .map((p) => ({ ...p, img: p.img || `img/products/${p.id}.webp` }));

  /** Offers that are switched on and not past their last day. */
  NB.LIVE_OFFERS = (CATALOG.offers || []).filter(
    (o) => o.active && (!o.until || o.until >= new Date().toISOString().slice(0, 10))
  );

  /** Home page wording and photos changed in /admin (keys missing here keep the page's own text). */
  NB.CONTENT = CATALOG.content || {};

  NB.productById = (id) => NB.PRODUCTS.find((p) => p.id === id);
  NB.collectionById = (id) => NB.COLLECTIONS.find((c) => c.id === id);
  NB.weightById = (id) => NB.WEIGHTS.find((w) => w.id === id) || NB.WEIGHTS[0];
  /** Label of the pack size prices are quoted for, e.g. "250 g". */
  NB.baseWeight = () => NB.WEIGHTS[0].label;

  /** Questions for the Customer Care page; null keeps the ones written in help.html. */
  NB.FAQS = Array.isArray(CATALOG.faqs) ? CATALOG.faqs : null;

  /** Biggest live discount (percent) that covers this product: whole shop, its collection, or the product itself. */
  NB.discountFor = (product) =>
    NB.LIVE_OFFERS.reduce((best, o) => {
      const d = Number(o.discount) || 0;
      if (d <= 0) return best;
      const hit =
        !o.scope ||
        o.scope === "all" ||
        (o.scope === "collection" && o.target === product.collection) ||
        (o.scope === "product" && o.target === product.id);
      return hit && d > best ? d : best;
    }, 0);

  /** Price before any offer, rounded to the nearest rupee. */
  NB.fullPriceFor = (product, weightId) => Math.round(product.price * NB.weightById(weightId).factor);

  /** Price the customer pays for a product at a given weight, after any offer. */
  NB.priceFor = (product, weightId) => {
    const full = NB.fullPriceFor(product, weightId);
    const off = NB.discountFor(product);
    return off ? Math.round((full * (100 - off)) / 100) : full;
  };

  NB.money = (n) => NB.SITE.currency + Math.round(n).toLocaleString("en-IN");

  /** Price as HTML: the offer price, with the old price crossed out when there is a discount. */
  NB.priceHtml = (product, weightId, qty = 1) => {
    const now = NB.priceFor(product, weightId) * qty;
    if (!NB.discountFor(product)) return NB.money(now);
    const was = NB.fullPriceFor(product, weightId) * qty;
    return `${NB.money(now)} <s class="was"><span class="visually-hidden">was </span>${NB.money(was)}</s>`;
  };
})();
