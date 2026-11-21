/**
 * Everything the shop shows that the admin can change: products, offers, business details,
 * collections, pack sizes and the home page's wording and photos. It all lives in
 * public/data/catalog.js, which /admin edits and publishes.
 */

export const CATALOG_FILE = "public/data/catalog.js";

export type Product = {
  id: string;
  name: string;
  collection: string;
  /** Price in rupees for the first pack size (250 g by default). */
  price: number;
  short: string;
  /** Small label on the card, e.g. "New". Empty = none. */
  badge: string;
  /** Site-relative photo path, e.g. img/products/x.webp (no leading slash). */
  img: string;
  /** Hidden products stay in the admin but are not shown or sold in the shop. */
  hidden?: boolean;
  /** Sold-out products stay in the shop with a "Sold out" label but can't be added to the cart. */
  soldOut?: boolean;
};

export const OFFER_SCOPES = ["all", "collection", "product"] as const;
export type OfferScope = (typeof OFFER_SCOPES)[number];

export type Offer = {
  id: string;
  /** Banner text at the top of every page. */
  text: string;
  /** Last day the offer is shown (YYYY-MM-DD). Empty = until removed. */
  until: string;
  active: boolean;
  /** Percent taken off the price (1–90). 0 = banner only, prices unchanged. */
  discount?: number;
  /** What the discount applies to: every product, one collection or one product. */
  scope?: OfferScope;
  /** Collection id or product id when scope is "collection" or "product". */
  target?: string;
};

export type Faq = { q: string; a: string };

export type Site = {
  /** WhatsApp number in international format, digits only, e.g. 919000242480. */
  whatsapp: string;
  phoneDisplay: string;
  email: string;
  location: string;
  /** Where NutBytes delivers, e.g. "Ongole and nearby areas". */
  deliveryArea: string;
  instagram: string;
  fssai: string;
};

export const TONES = ["blush", "peach", "lilac"] as const;
export type Tone = (typeof TONES)[number];

export type Collection = {
  id: string;
  name: string;
  /** Short line on the home page card. */
  line: string;
  img: string;
  tone: Tone;
};

export type Weight = {
  id: string;
  label: string;
  /** Price multiplier from the first pack size's price. The first pack is always 1. */
  factor: number;
};

export const CONTENT_FIELDS = [
  { group: "Top banner", key: "heroTitle", label: "Heading", def: "Deliciously Handcrafted Sweets and Treats made with Love", max: 120 },
  { group: "Top banner", key: "heroSub", label: "Line under the heading", def: "Perfect for every celebration", max: 80 },
  { group: "Top banner", key: "heroText", label: "Description", def: "Nutritious and delicious snacks made with the finest nuts, seeds and dry fruits.", max: 240, long: true },
  { group: "Top banner", key: "heroButton", label: "Button text", def: "Explore Our Snacks", max: 40 },
  { group: "Why NutBytes", key: "benefit1Title", label: "Point 1 title", def: "Naturally Nutritious", max: 40 },
  { group: "Why NutBytes", key: "benefit1Text", label: "Point 1 text", def: "Goodness of nuts, seeds and dry fruits.", max: 100 },
  { group: "Why NutBytes", key: "benefit2Title", label: "Point 2 title", def: "No Preservatives", max: 40 },
  { group: "Why NutBytes", key: "benefit2Text", label: "Point 2 text", def: "Pure, natural and honest snacking.", max: 100 },
  { group: "Why NutBytes", key: "benefit3Title", label: "Point 3 title", def: "Energy Boost", max: 40 },
  { group: "Why NutBytes", key: "benefit3Text", label: "Point 3 text", def: "A healthy bite anytime, anywhere.", max: 100 },
  { group: "About section", key: "aboutTitle", label: "Heading", def: "A Little Bite of Goodness", max: 80 },
  { group: "About section", key: "aboutText", label: "Text", def: "At NutBytes, we bring you healthy snacking crafted with care, using high-quality ingredients and a whole lot of love.", max: 400, long: true },
  { group: "About page", key: "aboutPageLine", label: "Line under \"Our Story\"", def: "A little bite of goodness, from Ongole.", max: 120 },
  { group: "About page", key: "aboutStory1", label: "Story, first paragraph", def: "NutBytes began with a simple idea: snacks can be delicious and wholesome at the same time. We make traditional sweets and treats with the finest nuts, seeds and dry fruits.", max: 600, long: true },
  { group: "About page", key: "aboutStory2", label: "Story, second paragraph", def: "Every laddu, chikki, sunnunda and ariselu is made the traditional way, with no processed sugar and no maida. From festival boxes to everyday snacking, we want every bite to be a treat you can feel good about.", max: 600, long: true },
  { group: "About page", key: "aboutGiftTitle", label: "Gifting heading", def: "Gifting with NutBytes", max: 80 },
  { group: "About page", key: "aboutGiftText", label: "Gifting text", def: "Planning a festival, a wedding or a corporate gift? Tell us the occasion, how many boxes you need and the date, and we'll help you put together the right box.", max: 400, long: true },
  { group: "Footer", key: "footerBlurb", label: "Text under the logo", def: "Wholesome, delicious snacks for a healthier and happier you.", max: 160 },
] as const;

/** Site photos the admin can swap. Empty = the built-in photo. */
export const CONTENT_PHOTOS = [
  { key: "heroImg", label: "Top banner photo", def: "img/hero-banner.webp", hint: "Wide photo. Keep the left side plain: the heading sits there on computers." },
  { key: "aboutImg", label: "About photo", def: "img/about-packaging-v2.webp", hint: "Shown beside \"A Little Bite of Goodness\" on the home page, and at the top of the About page." },
] as const;

export type ContentKey = (typeof CONTENT_FIELDS)[number]["key"] | (typeof CONTENT_PHOTOS)[number]["key"];
/** Home page wording and photos. An empty value keeps the wording built into the page. */
export type Content = Record<ContentKey, string>;

export const DEFAULT_SITE: Site = {
  whatsapp: "919000242480",
  phoneDisplay: "+91 90002 42480",
  email: "hello@nutbytes.in",
  location: "Ongole, Andhra Pradesh",
  deliveryArea: "Ongole and nearby areas",
  instagram: "https://www.instagram.com/nutbytes/",
  fssai: "20126171000742",
};

export const DEFAULT_COLLECTIONS: Collection[] = [
  { id: "nut-bites", name: "Nut Bites", line: "Crunchy, Nutty & Satisfying", img: "img/bite-nut.webp", tone: "blush" },
  { id: "coconut-bites", name: "Coconut Bites", line: "A Natural Energy Boost", img: "img/bite-coconut.webp", tone: "peach" },
  { id: "seed-bites", name: "Seed Bites", line: "Packed with Goodness", img: "img/bite-seed.webp", tone: "lilac" },
];

export const DEFAULT_WEIGHTS: Weight[] = [
  { id: "250g", label: "250 g", factor: 1 },
  { id: "500g", label: "500 g", factor: 1.9 },
  { id: "1kg", label: "1 kg", factor: 3.6 },
];

/** The questions on the Customer Care page (help.html), as built into the page. */
export const DEFAULT_FAQS: Faq[] = [
  { q: "Do your snacks contain sugar or maida?", a: "Our snacks are made with no processed sugar and no maida." },
  {
    q: "Where do you deliver?",
    a: "We deliver in {deliveryArea}. If you're further away, message us on WhatsApp and we'll let you know.",
  },
  {
    q: "Are the prices on the website final?",
    a: "We confirm the final price, and any delivery charge, with you on WhatsApp before we pack your order.",
  },
  {
    q: "Can I order gift boxes for an event?",
    a: "Yes. Message us on WhatsApp with the occasion, the number of boxes and the date, and we'll help you plan it.",
  },
  { q: "Is NutBytes FSSAI registered?", a: "Yes. Our FSSAI registration number is {fssai}." },
];

export const emptyContent = (): Content =>
  Object.fromEntries([...CONTENT_FIELDS, ...CONTENT_PHOTOS].map((f) => [f.key, ""])) as Content;

export type Catalog = {
  products: Product[];
  offers: Offer[];
  site: Site;
  collections: Collection[];
  weights: Weight[];
  content: Content;
  faqs: Faq[];
};

const PREFIX = "window.NB_CATALOG = ";

export function parseCatalog(file: string | null): Catalog {
  let c: Partial<Catalog> = {};
  if (file) {
    const body = file.trim().replace(/;$/, "");
    if (!body.startsWith(PREFIX)) throw new Error("catalog.js has an unexpected format.");
    c = JSON.parse(body.slice(PREFIX.length));
  }
  return {
    products: c.products ?? [],
    offers: c.offers ?? [],
    site: { ...DEFAULT_SITE, ...c.site },
    collections: c.collections?.length ? c.collections : DEFAULT_COLLECTIONS,
    weights: c.weights?.length ? c.weights : DEFAULT_WEIGHTS,
    content: { ...emptyContent(), ...c.content },
    faqs: Array.isArray(c.faqs) ? c.faqs : DEFAULT_FAQS,
  };
}

export function serializeCatalog(c: Catalog): string {
  // only keep the wording the admin actually changed, so the page's own text stays the default
  const content = Object.fromEntries(Object.entries(c.content).filter(([, v]) => v));
  return `${PREFIX}${JSON.stringify({ ...c, content }, null, 2)};\n`;
}
