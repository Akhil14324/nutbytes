/* Cart, account and order storage. Everything is kept in this browser's localStorage:
 * there is no server yet, so orders reach NutBytes through WhatsApp. */
(function () {
  const NB = (window.NB = window.NB || {});
  const KEYS = { cart: "nbshop-cart", users: "nbshop-users", session: "nbshop-session", orders: "nbshop-orders" };
  const MAX_QTY = 20;

  const read = (k, fallback) => {
    try {
      const v = JSON.parse(localStorage.getItem(k));
      return v ?? fallback;
    } catch {
      return fallback;
    }
  };
  const write = (k, v) => {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {}
  };
  const emit = () => document.dispatchEvent(new CustomEvent("nb:cart"));

  /* ---------------- cart ---------------- */
  const cleanCart = (items) =>
    (Array.isArray(items) ? items : [])
      .filter((i) => NB.productById(i.id) && i.qty > 0)
      // a pack size this product isn't sold in (e.g. an old 250 g line) moves to its first size
      .map((i) => ({ ...i, weight: NB.weightFor(NB.productById(i.id), i.weight).id }));

  NB.cart = {
    items: () => cleanCart(read(KEYS.cart, [])),
    save(items) {
      write(KEYS.cart, items);
      emit();
    },
    add(id, weight, qty = 1) {
      const items = this.items();
      const found = items.find((i) => i.id === id && i.weight === weight);
      if (found) found.qty = Math.min(MAX_QTY, found.qty + qty);
      else items.push({ id, weight, qty: Math.min(MAX_QTY, qty) });
      this.save(items);
    },
    setQty(id, weight, qty) {
      let items = this.items();
      if (qty <= 0) items = items.filter((i) => !(i.id === id && i.weight === weight));
      else items.forEach((i) => i.id === id && i.weight === weight && (i.qty = Math.min(MAX_QTY, qty)));
      this.save(items);
    },
    /** Change a line's pack size in place; merges with a line that already has that size. */
    setWeight(id, from, to) {
      if (from === to) return;
      const items = this.items();
      const src = items.find((i) => i.id === id && i.weight === from);
      if (!src) return;
      const dst = items.find((i) => i.id === id && i.weight === to);
      if (dst) {
        dst.qty = Math.min(MAX_QTY, dst.qty + src.qty);
        items.splice(items.indexOf(src), 1);
      } else src.weight = to;
      this.save(items);
    },
    remove(id, weight) {
      this.save(this.items().filter((i) => !(i.id === id && i.weight === weight)));
    },
    clear() {
      this.save([]);
    },
    count() {
      return this.items().reduce((n, i) => n + i.qty, 0);
    },
    /** Each line with its product, unit price and line total, plus the order total. */
    lines() {
      const lines = this.items().map((i) => {
        const product = NB.productById(i.id);
        const unit = NB.priceFor(product, i.weight);
        return { ...i, product, unit, total: unit * i.qty };
      });
      return { lines, subtotal: lines.reduce((s, l) => s + l.total, 0) };
    },
  };
  NB.MAX_QTY = MAX_QTY;

  /* ---------------- accounts (on this device only) ---------------- */
  async function hash(text) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  NB.auth = {
    user() {
      const email = read(KEYS.session, null);
      const u = email && read(KEYS.users, {})[email];
      return u ? { name: u.name, email: u.email, phone: u.phone } : null;
    },
    async register({ name, email, phone, password }) {
      const users = read(KEYS.users, {});
      const key = email.trim().toLowerCase();
      if (users[key]) throw new Error("An account with this email already exists. Please log in.");
      users[key] = { name: name.trim(), email: key, phone: phone.trim(), pass: await hash(key + ":" + password) };
      write(KEYS.users, users);
      write(KEYS.session, key);
      emit();
    },
    async login({ email, password }) {
      const key = email.trim().toLowerCase();
      const u = read(KEYS.users, {})[key];
      if (!u || u.pass !== (await hash(key + ":" + password))) throw new Error("That email and password don't match.");
      write(KEYS.session, key);
      emit();
    },
    logout() {
      try {
        localStorage.removeItem(KEYS.session);
      } catch {}
      emit();
    },
  };

  /* ---------------- orders ---------------- */
  NB.orders = {
    all: () => read(KEYS.orders, []),
    byId: (id) => read(KEYS.orders, []).find((o) => o.id === id.trim().toUpperCase()),
    place(details) {
      const { lines, subtotal } = NB.cart.lines();
      const d = new Date();
      const stamp = d.toISOString().slice(2, 10).replace(/-/g, "");
      const id = `NB-${stamp}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const order = {
        id,
        placedAt: d.toISOString(),
        status: "Waiting for WhatsApp confirmation",
        items: lines.map((l) => ({ id: l.id, name: l.product.name, weight: l.weight, qty: l.qty, unit: l.unit, total: l.total })),
        subtotal,
        details,
      };
      write(KEYS.orders, [order, ...NB.orders.all()].slice(0, 50));
      NB.cart.clear();
      return order;
    },
  };

  /* ---------------- WhatsApp ---------------- */
  /** True on laptops and desktops, false on phones and tablets. */
  NB.isDesktop = () => {
    const ua = navigator.userAgent;
    if (/Android|iPhone|iPad|iPod|Mobile|Opera Mini|IEMobile|Silk/i.test(ua)) return false;
    return !(/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  };

  /** WhatsApp Web on computers, the WhatsApp app (wa.me) on phones. */
  NB.waLink = (text) => {
    const msg = encodeURIComponent(text);
    return NB.isDesktop()
      ? `https://web.whatsapp.com/send?phone=${NB.SITE.whatsapp}&text=${msg}`
      : `https://wa.me/${NB.SITE.whatsapp}?text=${msg}`;
  };

  NB.WA_HELLO = "Hello NutBytes! I would like to order.";

  /** The order as a WhatsApp message, with a comma after every detail. */
  NB.orderMessage = (order) => {
    const d = order.details;
    const date = d.date ? d.date.split("-").reverse().join("/") : "";
    const items = order.items.map(
      (i) => `• Product: ${i.name}, Weight: ${NB.weightById(i.weight).label}, Quantity: ${i.qty}, Price: ${NB.money(i.total)}`
    );
    const details = [
      `Order ID: ${order.id}`,
      `Name: ${d.name}`,
      `Phone: ${d.phone}`,
      d.email ? `Email: ${d.email}` : "",
      `Address: ${[d.address, d.city].filter(Boolean).join(", ")}`,
      `Pincode: ${d.pincode}`,
      date ? `Delivery date: ${date}` : "",
      `Payment: ${d.payment}`,
      d.note ? `Note: ${d.note}` : "",
    ]
      .filter(Boolean)
      .map((line, i, all) => (i < all.length - 1 ? line + "," : line));
    return [
      "Hello NutBytes! I would like to place this order:",
      "",
      ...items,
      `Total: ${NB.money(order.subtotal)}`,
      "",
      ...details,
      "",
      "Please confirm the order and delivery.",
    ].join("\n");
  };
})();
