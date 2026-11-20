import data from "@/data/offers.json";

export type Offer = {
  id: string;
  en: string;
  te: string;
  /** Last day the offer is shown (YYYY-MM-DD). Empty = until removed. */
  until: string;
  active: boolean;
};

// Offers live in data/offers.json and are edited from /admin.
export const OFFERS: Offer[] = data as Offer[];

export const isLive = (o: Offer, today = new Date().toISOString().slice(0, 10)) =>
  o.active && (!o.until || o.until >= today);
