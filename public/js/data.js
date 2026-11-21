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
      id: "nut-bites",
      name: "Nut Bites",
      line: "Crunchy, Nutty & Satisfying",
      img: "img/bite-nut.webp",
      tone: "blush",
    },
    {
      id: "coconut-bites",
      name: "Coconut Bites",
      line: "A Natural Energy Boost",
      img: "img/bite-coconut.webp",
      tone: "peach",
    },
    {
      id: "seed-bites",
      name: "Seed Bites",
      line: "Packed with Goodness",
      img: "img/bite-seed.webp",
      tone: "lilac",
    },
  ];

  /* Weights a customer can choose, and how the price scales from the 250 g price. */
  NB.WEIGHTS = [
    { id: "250g", label: "250 g", factor: 1 },
    { id: "500g", label: "500 g", factor: 1.9 },
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

  /** Price for a product at a given weight, rounded to the nearest rupee. */
  NB.priceFor = (product, weightId) => Math.round(product.price * NB.weightById(weightId).factor);

  NB.money = (n) => NB.SITE.currency + Math.round(n).toLocaleString("en-IN");
})();
