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

  /* SAMPLE PRICES (per 250 g). Replace them with real prices before launch. */
  NB.PRODUCTS = [
    {
      id: "signature-dry-fruit-ladoo",
      name: "Signature Dry Fruit Ladoo",
      collection: "nut-bites",
      price: 299,
      short: "Almonds, pistachios, pumpkin seeds and figs, pressed into every bite.",
      badge: "Bestseller",
    },
    {
      id: "royal-nut-sunnunda",
      name: "Royal Nut Sunnunda",
      collection: "nut-bites",
      price: 249,
      short: "A rich, nutty sunnunda made the traditional way.",
    },
    {
      id: "crunchy-peanut-laddu",
      name: "Crunchy Peanut Laddu",
      collection: "nut-bites",
      price: 149,
      short: "Crunchy peanuts and dry fruit in a round, bite-sized laddu.",
    },
    {
      id: "premium-peeled-peanut-chikki",
      name: "Premium Peeled Peanut Chikki",
      collection: "nut-bites",
      price: 129,
      short: "Peeled peanuts set into a crisp, golden chikki.",
    },
    {
      id: "coconutty-ball",
      name: "Coconutty Ball",
      collection: "coconut-bites",
      price: 179,
      short: "A soft, sweet ball rolled in fresh coconut.",
      badge: "New",
    },
    {
      id: "dry-fruits-coconut-burelu",
      name: "Dry Fruits Coconut Burelu",
      collection: "coconut-bites",
      price: 219,
      short: "Golden burelu with a sweet filling of coconut and dry fruit.",
    },
    {
      id: "peanut-sesame-fusion",
      name: "Peanut Sesame Fusion",
      collection: "seed-bites",
      price: 139,
      short: "Peanuts and sesame together in one crunchy bite.",
    },
    {
      id: "nuvvulu-coated-dry-fruit-ariselu",
      name: "Nuvvulu Coated Dry Fruit Ariselu",
      collection: "seed-bites",
      price: 229,
      short: "Dry fruit ariselu with a crisp coat of sesame.",
    },
    {
      id: "ghee-ariselu",
      name: "Ghee Ariselu",
      collection: "seed-bites",
      price: 199,
      short: "Traditional Andhra ariselu, made with pure ghee.",
    },
  ].map((p) => ({ ...p, img: `img/products/${p.id}.webp` }));

  NB.productById = (id) => NB.PRODUCTS.find((p) => p.id === id);
  NB.collectionById = (id) => NB.COLLECTIONS.find((c) => c.id === id);
  NB.weightById = (id) => NB.WEIGHTS.find((w) => w.id === id) || NB.WEIGHTS[0];

  /** Price for a product at a given weight, rounded to the nearest rupee. */
  NB.priceFor = (product, weightId) => Math.round(product.price * NB.weightById(weightId).factor);

  NB.money = (n) => NB.SITE.currency + Math.round(n).toLocaleString("en-IN");
})();
