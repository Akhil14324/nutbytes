/** The shop's products and offers. They live in public/data/catalog.js, edited from /admin. */

export const CATALOG_FILE = "public/data/catalog.js";

export const COLLECTIONS = [
  { id: "nut-bites", name: "Nut Bites" },
  { id: "coconut-bites", name: "Coconut Bites" },
  { id: "seed-bites", name: "Seed Bites" },
] as const;

export type Product = {
  id: string;
  name: string;
  collection: string;
  /** Price in rupees for 250 g. */
  price: number;
  short: string;
  /** Small label on the card, e.g. "New". Empty = none. */
  badge: string;
  /** Site-relative photo path, e.g. img/products/x.webp (no leading slash). */
  img: string;
};

export type Offer = {
  id: string;
  text: string;
  /** Last day the offer is shown (YYYY-MM-DD). Empty = until removed. */
  until: string;
  active: boolean;
};

export type Catalog = { products: Product[]; offers: Offer[] };

const PREFIX = "window.NB_CATALOG = ";

export function parseCatalog(file: string | null): Catalog {
  if (!file) return { products: [], offers: [] };
  const body = file.trim().replace(/;$/, "");
  if (!body.startsWith(PREFIX)) throw new Error("catalog.js has an unexpected format.");
  const c = JSON.parse(body.slice(PREFIX.length)) as Partial<Catalog>;
  return { products: c.products ?? [], offers: c.offers ?? [] };
}

export function serializeCatalog(c: Catalog): string {
  return `${PREFIX}${JSON.stringify(c, null, 2)};\n`;
}
