import data from "@/data/products.json";

export type Product = {
  id: string;
  en: string;
  te: string;
  blurbEn: string;
  blurbTe: string;
  img: string;
  /** Background tint the menu section fades to while this item is showing. */
  tint: string;
};

export const WEIGHTS = ["250g", "500g", "1kg"] as const;
export type Weight = (typeof WEIGHTS)[number];

// The menu lives in data/products.json and is edited from /admin.
export const PRODUCTS: Product[] = data as Product[];

export const productById = (id: string) => PRODUCTS.find((p) => p.id === id);
