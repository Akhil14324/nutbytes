import { COLLECTIONS, type Offer, type Product } from "../catalog";

export class Invalid extends Error {}

const str = (v: unknown, name: string, max: number, required = true) => {
  if (typeof v !== "string") throw new Invalid(`${name} must be text.`);
  const t = v.trim();
  if (required && !t) throw new Invalid(`${name} is required.`);
  if (t.length > max) throw new Invalid(`${name} is too long (max ${max}).`);
  return t;
};

const IMG_OK = /^img\/(products|uploads)\/[A-Za-z0-9._-]+\.(jpg|jpeg|png|webp)$/;
export const UPLOAD_OK = /^public\/img\/uploads\/[a-z0-9-]+\.jpg$/;
export const DELETE_OK = /^public\/img\/(products|uploads)\/[A-Za-z0-9._-]+\.(jpg|jpeg|png|webp)$/;

export function cleanProducts(input: unknown): Product[] {
  if (!Array.isArray(input) || input.length < 1) throw new Invalid("The shop needs at least one product.");
  if (input.length > 60) throw new Invalid("Too many products (max 60).");
  const seen = new Set<string>();
  const collections = new Set<string>(COLLECTIONS.map((c) => c.id));
  return input.map((raw, i) => {
    const r = (raw ?? {}) as Record<string, unknown>;
    const label = `Product ${i + 1}`;
    const id = str(r.id, `${label} id`, 80);
    if (!/^[a-z0-9-]+$/.test(id)) throw new Invalid(`${label} has an invalid id.`);
    if (seen.has(id)) throw new Invalid(`Two products share the id "${id}".`);
    seen.add(id);
    const img = str(r.img, `${label} photo`, 200);
    if (!IMG_OK.test(img)) throw new Invalid(`${label} has an invalid photo.`);
    const collection = str(r.collection, `${label} collection`, 40);
    if (!collections.has(collection)) throw new Invalid(`${label} has an unknown collection.`);
    const price = Number(r.price);
    if (!Number.isInteger(price) || price < 1 || price > 100000)
      throw new Invalid(`${label} needs a whole-rupee price between 1 and 100000.`);
    const product: Product = {
      id,
      name: str(r.name, `${label} name`, 80),
      collection,
      price,
      short: str(r.short, `${label} description`, 240, false),
      badge: str(r.badge ?? "", `${label} label`, 20, false),
      img,
    };
    // fixed pack prices (set in catalog.js) are kept on every publish
    if (r.prices != null) {
      if (typeof r.prices !== "object" || Array.isArray(r.prices)) throw new Invalid(`${product.name}: invalid pack prices.`);
      const entries = Object.entries(r.prices as Record<string, unknown>);
      if (entries.length > 8) throw new Invalid(`${product.name}: too many pack prices.`);
      const prices: Record<string, number> = {};
      for (const [size, v] of entries) {
        const n = Number(v);
        if (!/^[a-z0-9-]+$/.test(size) || !Number.isInteger(n) || n < 1 || n > 1000000)
          throw new Invalid(`${product.name}: invalid price for the ${size} pack.`);
        prices[size] = n;
      }
      if (entries.length) product.prices = prices;
    }
    return product;
  });
}

export function cleanOffers(input: unknown): Offer[] {
  if (!Array.isArray(input)) throw new Invalid("Offers must be a list.");
  if (input.length > 20) throw new Invalid("Too many offers (max 20).");
  return input.map((raw, i) => {
    const r = (raw ?? {}) as Record<string, unknown>;
    const id = str(r.id, `Offer ${i + 1} id`, 60);
    if (!/^[a-z0-9-]+$/.test(id)) throw new Invalid(`Offer ${i + 1} has an invalid id.`);
    const until = str(r.until ?? "", `Offer ${i + 1} end date`, 10, false);
    if (until && !/^\d{4}-\d{2}-\d{2}$/.test(until)) throw new Invalid(`Offer ${i + 1} has an invalid end date.`);
    return {
      id,
      text: str(r.text, `Offer ${i + 1} text`, 160),
      until,
      active: r.active !== false,
    };
  });
}

export type Upload = { path: string; data: string };

export function cleanUploads(input: unknown): Upload[] {
  if (input == null) return [];
  if (!Array.isArray(input) || input.length > 12) throw new Invalid("Too many photos in one save (max 12).");
  return input.map((raw) => {
    const r = (raw ?? {}) as Record<string, unknown>;
    const p = typeof r.path === "string" ? r.path : "";
    const d = typeof r.data === "string" ? r.data : "";
    if (!UPLOAD_OK.test(p)) throw new Invalid("Invalid photo name.");
    if (!/^[A-Za-z0-9+/=]+$/.test(d) || d.length < 100) throw new Invalid("Invalid photo data.");
    if (d.length > 1_800_000) throw new Invalid("A photo is too large after resizing.");
    // JPEG magic bytes: /9j/ in base64
    if (!d.startsWith("/9j/")) throw new Invalid("Photos must be JPEG.");
    return { path: p, data: d };
  });
}

export function cleanDeletes(input: unknown): string[] {
  if (input == null) return [];
  if (!Array.isArray(input) || input.length > 40) throw new Invalid("Too many deletions.");
  return input.map((p) => {
    if (typeof p !== "string" || !DELETE_OK.test(p)) throw new Invalid("Invalid photo to delete.");
    return p;
  });
}
