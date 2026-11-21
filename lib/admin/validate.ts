import {
  CONTENT_FIELDS,
  CONTENT_PHOTOS,
  OFFER_SCOPES,
  TONES,
  type Collection,
  type Content,
  type Faq,
  type Offer,
  type OfferScope,
  type Product,
  type Site,
  type Weight,
} from "../catalog";

export class Invalid extends Error {}

const str = (v: unknown, name: string, max: number, required = true) => {
  if (v == null && !required) return "";
  if (typeof v !== "string") throw new Invalid(`${name} must be text.`);
  const t = v.trim();
  if (required && !t) throw new Invalid(`${name} is required.`);
  if (t.length > max) throw new Invalid(`${name} is too long (max ${max}).`);
  return t;
};

const ID = /^[a-z0-9-]+$/;

/** Any photo in img/, img/products/ or img/uploads/ (site-relative, no leading slash). */
export const IMG_OK = /^img\/((products|uploads)\/)?[A-Za-z0-9._-]+\.(jpg|jpeg|png|webp)$/;
export const UPLOAD_OK = /^public\/img\/uploads\/[a-z0-9-]+\.jpg$/;
export const DELETE_OK = /^public\/img\/(products|uploads)\/[A-Za-z0-9._-]+\.(jpg|jpeg|png|webp)$/;

const photo = (v: unknown, name: string, library: Set<string>, required = true) => {
  const p = str(v, name, 200, required);
  if (!p) return "";
  if (!IMG_OK.test(p)) throw new Invalid(`${name} is not a valid photo.`);
  if (!library.has(p)) throw new Invalid(`${name} uses a photo that is missing or being deleted. Choose another photo first.`);
  return p;
};

export function cleanCollections(input: unknown, library: Set<string>): Collection[] {
  if (!Array.isArray(input) || input.length < 1) throw new Invalid("The shop needs at least one collection.");
  if (input.length > 12) throw new Invalid("Too many collections (max 12).");
  const seen = new Set<string>();
  return input.map((raw, i) => {
    const r = (raw ?? {}) as Record<string, unknown>;
    const label = `Collection ${i + 1}`;
    const id = str(r.id, `${label} id`, 60);
    if (!ID.test(id)) throw new Invalid(`${label} has an invalid id.`);
    if (seen.has(id)) throw new Invalid(`Two collections share the id "${id}".`);
    seen.add(id);
    const tone = TONES.includes(r.tone as (typeof TONES)[number]) ? (r.tone as Collection["tone"]) : "blush";
    return {
      id,
      name: str(r.name, `${label} name`, 40),
      line: str(r.line, `${label} line`, 80, false),
      img: photo(r.img, `${label} photo`, library),
      tone,
    };
  });
}

export function cleanWeights(input: unknown): Weight[] {
  if (!Array.isArray(input) || input.length < 1) throw new Invalid("The shop needs at least one pack size.");
  if (input.length > 8) throw new Invalid("Too many pack sizes (max 8).");
  const seen = new Set<string>();
  return input.map((raw, i) => {
    const r = (raw ?? {}) as Record<string, unknown>;
    const label = `Pack size ${i + 1}`;
    const id = str(r.id, `${label} id`, 40);
    if (!ID.test(id)) throw new Invalid(`${label} has an invalid id.`);
    if (seen.has(id)) throw new Invalid(`Two pack sizes share the id "${id}".`);
    seen.add(id);
    const factor = i === 0 ? 1 : Number(r.factor);
    if (!Number.isFinite(factor) || factor < 0.1 || factor > 100)
      throw new Invalid(`${label} needs a price multiplier between 0.1 and 100.`);
    return { id, label: str(r.label, `${label} name`, 20), factor: Math.round(factor * 100) / 100 };
  });
}

export function cleanProducts(input: unknown, collections: Collection[], library: Set<string>): Product[] {
  if (!Array.isArray(input) || input.length < 1) throw new Invalid("The shop needs at least one product.");
  if (input.length > 60) throw new Invalid("Too many products (max 60).");
  const seen = new Set<string>();
  const ids = new Set(collections.map((c) => c.id));
  const list = input.map((raw, i) => {
    const r = (raw ?? {}) as Record<string, unknown>;
    const label = `Product ${i + 1}`;
    const id = str(r.id, `${label} id`, 80);
    if (!ID.test(id)) throw new Invalid(`${label} has an invalid id.`);
    if (seen.has(id)) throw new Invalid(`Two products share the id "${id}".`);
    seen.add(id);
    const name = str(r.name, `${label} name`, 80);
    const collection = str(r.collection, `${name} collection`, 60);
    if (!ids.has(collection)) throw new Invalid(`${name} is in a collection that no longer exists.`);
    const price = Number(r.price);
    if (!Number.isInteger(price) || price < 1 || price > 100000)
      throw new Invalid(`${name} needs a whole-rupee price between 1 and 100000.`);
    return {
      id,
      name,
      collection,
      price,
      short: str(r.short, `${name} description`, 240, false),
      badge: str(r.badge, `${name} label`, 20, false),
      img: photo(r.img, `${name} photo`, library),
      hidden: r.hidden === true,
      soldOut: r.soldOut === true,
    };
  });
  if (list.every((p) => p.hidden)) throw new Invalid("At least one product must be shown in the shop.");
  return list;
}

export function cleanOffers(input: unknown, products: Product[], collections: Collection[]): Offer[] {
  if (!Array.isArray(input)) throw new Invalid("Offers must be a list.");
  if (input.length > 20) throw new Invalid("Too many offers (max 20).");
  return input.map((raw, i) => {
    const r = (raw ?? {}) as Record<string, unknown>;
    const label = `Offer ${i + 1}`;
    const id = str(r.id, `${label} id`, 60);
    if (!ID.test(id)) throw new Invalid(`${label} has an invalid id.`);
    const until = str(r.until, `${label} end date`, 10, false);
    if (until && !/^\d{4}-\d{2}-\d{2}$/.test(until)) throw new Invalid(`${label} has an invalid end date.`);
    const text = str(r.text, `${label} text`, 160);

    const discount = r.discount == null || r.discount === "" ? 0 : Number(r.discount);
    if (!Number.isInteger(discount) || discount < 0 || discount > 90)
      throw new Invalid(`"${text}": the discount must be a whole number from 0 to 90 (%).`);
    const offer: Offer = { id, text, until, active: r.active !== false, discount };
    if (!discount) return offer;

    const scope = OFFER_SCOPES.includes(r.scope as OfferScope) ? (r.scope as OfferScope) : "all";
    offer.scope = scope;
    if (scope === "all") return offer;
    const target = str(r.target, `"${text}" applies to`, 80);
    if (scope === "collection" && !collections.some((c) => c.id === target))
      throw new Invalid(`"${text}" is for a collection that no longer exists. Choose another one.`);
    if (scope === "product" && !products.some((p) => p.id === target))
      throw new Invalid(`"${text}" is for a product that no longer exists. Choose another one.`);
    offer.target = target;
    return offer;
  });
}

export function cleanFaqs(input: unknown): Faq[] {
  if (!Array.isArray(input)) throw new Invalid("FAQs must be a list.");
  if (input.length > 30) throw new Invalid("Too many FAQs (max 30).");
  return input.map((raw, i) => {
    const r = (raw ?? {}) as Record<string, unknown>;
    return { q: str(r.q, `FAQ ${i + 1} question`, 200), a: str(r.a, `FAQ ${i + 1} answer`, 800) };
  });
}

export function cleanSite(input: unknown): Site {
  const r = (input ?? {}) as Record<string, unknown>;
  const whatsapp = str(r.whatsapp, "WhatsApp number", 20).replace(/[\s+-]/g, "");
  if (!/^\d{10,15}$/.test(whatsapp))
    throw new Invalid("WhatsApp number must be 10–15 digits with the country code, e.g. 919000242480.");
  const email = str(r.email, "Email", 120);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Invalid("Email address is not valid.");
  const instagram = str(r.instagram, "Instagram link", 200, false);
  if (instagram && !/^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._/-]*$/.test(instagram))
    throw new Invalid("Instagram link must start with https://www.instagram.com/");
  const fssai = str(r.fssai, "FSSAI number", 20, false);
  if (fssai && !/^\d{14}$/.test(fssai)) throw new Invalid("FSSAI number must be 14 digits.");
  return {
    whatsapp,
    phoneDisplay: str(r.phoneDisplay, "Phone number as shown", 30),
    email,
    location: str(r.location, "Location", 80),
    deliveryArea: str(r.deliveryArea, "Delivery area", 80),
    instagram,
    fssai,
  };
}

export function cleanContent(input: unknown, library: Set<string>): Content {
  const r = (input ?? {}) as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const f of CONTENT_FIELDS) out[f.key] = str(r[f.key], `${f.group}: ${f.label}`, f.max, false);
  for (const f of CONTENT_PHOTOS) out[f.key] = photo(r[f.key], f.label, library, false);
  return out as Content;
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
    if (d.length > 2_500_000) throw new Invalid("A photo is too large after resizing.");
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
