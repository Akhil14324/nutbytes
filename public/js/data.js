/* NutBytes shop data: business details, collections and products.
 * Edit this file to change prices, products or contact details. */
(function () {
  const NB = (window.NB = window.NB || {});

  NB.SITE = {
    name: "NutBytes",
    tagline: "Healthy Snacking",
    // WhatsApp number in international format, without "+"
    whatsapp: "919000242480",
    phoneDisplay: "+91 90002 42480",
    // TODO: confirm this address before launch (it comes from the design mock-up)
    email: "hello@nutbytes.in",
    location: "Ongole, Andhra Pradesh",
    instagram: "https://www.instagram.com/nutbytes/",
    fssai: "20126171000742",
    currency: "₹",
  };

  NB.COLLECTIONS = [
    {
      id: "laddus",
      name: "Laddus",
      line: "Traditional favourites, made wholesome",
      img: "img/collection-laddus.webp",
      tone: "blush",
    },
    {
      id: "chikkies",
      name: "Chikkies",
      line: "Crisp, nutty and golden",
      img: "img/collection-chikkies.webp",
      tone: "peach",
    },
    {
      id: "ariselu",
      name: "Ariselu",
      line: "Andhra tradition with ghee and sesame",
      img: "img/products/ghee-ariselu.webp",
      tone: "lilac",
    },
    { id: "spicy-munchies", name: "Spicy Munchies", line: "Savoury bites for every tea-time", img: "img/collection-spicy-munchies.webp", tone: "peach" },
  ];

  /* Weights a customer can choose, and how the price scales from the 250 g price. */
  NB.WEIGHTS = [
    { id: "250g", label: "250 g", factor: 1 },
    { id: "500g", label: "500 g", factor: 1.9 },
    { id: "750g", label: "750 g", factor: 2.8 },
    { id: "1kg", label: "1 kg", factor: 3.6 },
  ];

  /* Products and offers come from data/catalog.js, which the /admin panel edits and publishes.
   * Prices are per 250 g. */
  const CATALOG = window.NB_CATALOG || { products: [], offers: [] };
  NB.PRODUCTS = CATALOG.products.map((p) => ({ ...p, img: p.img || `img/products/${p.id}.webp` }));

  /** Offers that are switched on and not past their last day. */
  NB.LIVE_OFFERS = (CATALOG.offers || []).filter(
    (o) => o.active && (!o.until || o.until >= new Date().toISOString().slice(0, 10))
  );

  NB.productById = (id) => NB.PRODUCTS.find((p) => p.id === id);
  NB.collectionById = (id) => NB.COLLECTIONS.find((c) => c.id === id);
  NB.weightById = (id) => NB.WEIGHTS.find((w) => w.id === id) || NB.WEIGHTS[0];

  /** Pack sizes sold for a product. A product with its own "prices" is sold only in those sizes. */
  NB.weightsFor = (product) => {
    const own = product && product.prices ? NB.WEIGHTS.filter((w) => product.prices[w.id]) : [];
    return own.length ? own : NB.WEIGHTS;
  };
  /** A pack size this product is sold in: the one asked for if available, otherwise its first size. */
  NB.weightFor = (product, weightId) => {
    const list = NB.weightsFor(product);
    return list.find((w) => w.id === weightId) || list[0];
  };

  /** Price for a product at a given weight: its own price for that pack if set,
   * otherwise the 250 g price scaled for the pack, rounded to the nearest rupee. */
  NB.priceFor = (product, weightId) => {
    const own = product.prices && product.prices[weightId];
    return own ? own : Math.round(product.price * NB.weightById(weightId).factor);
  };

  NB.money = (n) => NB.SITE.currency + Math.round(n).toLocaleString("en-IN");
})();
