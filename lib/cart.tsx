"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { PRODUCTS, productById, type Weight } from "./products";
import { isDesktop, waLink } from "./site";

export type CartItem = { id: string; weight: Weight; qty: number };

export type Details = { name: string; phone: string; area: string; date: string; note: string };

type Ctx = {
  items: CartItem[];
  count: number;
  open: boolean;
  setOpen: (o: boolean) => void;
  add: (id: string, weight: Weight, qty: number) => void;
  setQty: (id: string, weight: Weight, qty: number) => void;
  setWeight: (id: string, from: Weight, to: Weight) => void;
  remove: (id: string, weight: Weight) => void;
  clear: () => void;
  buildMessage: (d: Details) => string;
  buildLink: (d: Details) => string;
};

const CartCtx = createContext<Ctx | null>(null);
const KEY = "nb-cart-v1";

const order = (id: string) => PRODUCTS.findIndex((p) => p.id === id);

/** The WhatsApp order message: one line per product, then the customer's details, each ending in a comma. */
export function formatOrder(items: CartItem[], d: Details) {
  const lines = items.map((i) => {
    const p = productById(i.id);
    return `• Product: ${p?.en ?? i.id}, Weight: ${i.weight}, Quantity: ${i.qty}`;
  });
  // the date input gives yyyy-mm-dd; show it the Indian way, dd/mm/yyyy
  const date = d.date ? d.date.split("-").reverse().join("/") : "";
  const details = [
    `Name: ${d.name.trim()}`,
    d.phone.trim() ? `Phone: ${d.phone.trim()}` : "",
    `Area / pincode: ${d.area.trim()}`,
    date ? `Delivery date: ${date}` : "",
    d.note.trim() ? `Note: ${d.note.trim()}` : "",
  ]
    .filter(Boolean)
    // a comma after every detail except the last
    .map((line, i, all) => (i < all.length - 1 ? `${line},` : line));
  return [
    "Hello NutBytes! I would like to order:",
    "",
    ...lines,
    "",
    ...details,
    "",
    "Please confirm the price and delivery.",
  ].join("\n");
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        // restore the saved box after mount so server and client markup match
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setItems(parsed.filter((i) => order(i.id) >= 0 && i.qty > 0));
      }
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items, ready]);

  const add = useCallback((id: string, weight: Weight, qty: number) => {
    setItems((cur) => {
      const found = cur.find((i) => i.id === id && i.weight === weight);
      if (found) return cur.map((i) => (i === found ? { ...i, qty: Math.min(20, i.qty + qty) } : i));
      return [...cur, { id, weight, qty }];
    });
  }, []);

  const setQty = useCallback((id: string, weight: Weight, qty: number) => {
    setItems((cur) =>
      qty <= 0
        ? cur.filter((i) => !(i.id === id && i.weight === weight))
        : cur.map((i) => (i.id === id && i.weight === weight ? { ...i, qty: Math.min(20, qty) } : i))
    );
  }, []);

  const setWeight = useCallback((id: string, from: Weight, to: Weight) => {
    setItems((cur) => {
      if (from === to) return cur;
      const src = cur.find((i) => i.id === id && i.weight === from);
      if (!src) return cur;
      const dst = cur.find((i) => i.id === id && i.weight === to);
      const rest = cur.filter((i) => i !== src && i !== dst);
      return [...rest, { id, weight: to, qty: Math.min(20, src.qty + (dst?.qty ?? 0)) }].sort(
        (a, b) => order(a.id) - order(b.id)
      );
    });
  }, []);

  const remove = useCallback((id: string, weight: Weight) => {
    setItems((cur) => cur.filter((i) => !(i.id === id && i.weight === weight)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const buildMessage = useCallback((d: Details) => formatOrder(items, d), [items]);

  const buildLink = useCallback((d: Details) => waLink(buildMessage(d), { desktop: isDesktop() }), [buildMessage]);

  const count = useMemo(() => items.reduce((n, i) => n + i.qty, 0), [items]);

  const value = useMemo<Ctx>(
    () => ({ items, count, open, setOpen, add, setQty, setWeight, remove, clear, buildMessage, buildLink }),
    [items, count, open, add, setQty, setWeight, remove, clear, buildMessage, buildLink]
  );
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}
