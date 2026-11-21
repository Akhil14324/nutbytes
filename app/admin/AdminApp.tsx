"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CONTENT_FIELDS,
  CONTENT_PHOTOS,
  TONES,
  type Catalog,
  type Collection,
  type Content,
  type Faq,
  type Offer,
  type Product,
  type Site,
  type Weight,
} from "@/lib/catalog";

const TABS = [
  ["products", "Products"],
  ["offers", "Offers"],
  ["collections", "Collections"],
  ["home", "Page text"],
  ["faqs", "FAQs"],
  ["business", "Business details"],
  ["sizes", "Pack sizes"],
  ["photos", "Photos"],
] as const;
type Tab = (typeof TABS)[number][0];
type Load = Catalog & { photos: string[]; mode: "local" | "github" };
type Setter<T> = React.Dispatch<React.SetStateAction<T>>;

const uid = () => Math.random().toString(36).slice(2, 7);
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "photo";

/** Shrinks a phone photo to a web-sized JPEG in the browser, so uploads stay small. */
async function shrink(file: File, maxSide = 1400, quality = 0.82): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, bad) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => bad(new Error("That file is not a photo this browser can open."));
      i.src = url;
    });
    const k = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * k);
    c.height = Math.round(img.naturalHeight * k);
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff"; // PNGs with see-through areas become white, not black
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function AdminApp() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [data, setData] = useState<Load | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/content", { cache: "no-store" });
    if (res.status === 401) {
      setAuthed(false);
      return;
    }
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error || "Could not load.");
      setAuthed(true);
      return;
    }
    setData(await res.json());
    setAuthed(true);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  if (authed === null) return <main className="adm adm-center">Loading…</main>;
  if (!authed) return <Login onDone={load} />;
  if (!data)
    return (
      <main className="adm adm-center">
        <p>{error || "Loading…"}</p>
      </main>
    );
  return (
    <Editor
      initial={data}
      onLogout={async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        setData(null);
        setAuthed(false);
      }}
    />
  );
}

function Login({ onDone }: { onDone: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    setBusy(false);
    if (res.ok) onDone();
    else setErr((await res.json().catch(() => ({}))).error || "Login failed.");
  };

  return (
    <main className="adm adm-center">
      <form className="adm-card adm-login" onSubmit={submit}>
        <h1>NutBytes admin</h1>
        <p className="adm-muted">Log in to manage the website.</p>
        <label>
          Password
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus autoComplete="current-password" />
        </label>
        {err && <p className="adm-err" role="alert">{err}</p>}
        <button className="adm-btn adm-primary" disabled={busy || !pw}>
          {busy ? "Checking…" : "Log in"}
        </button>
      </form>
    </main>
  );
}

const snapshot = (c: Catalog) =>
  JSON.stringify([c.products, c.offers, c.site, c.collections, c.weights, c.content, c.faqs]);

function Editor({ initial, onLogout }: { initial: Load; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("products");
  const [products, setProducts] = useState<Product[]>(initial.products);
  const [offers, setOffers] = useState<Offer[]>(initial.offers);
  const [site, setSite] = useState<Site>(initial.site);
  const [collections, setCollections] = useState<Collection[]>(initial.collections);
  const [weights, setWeights] = useState<Weight[]>(initial.weights);
  const [content, setContent] = useState<Content>(initial.content);
  const [faqs, setFaqs] = useState<Faq[]>(initial.faqs);
  const [photos, setPhotos] = useState<string[]>(initial.photos); // site paths like img/products/x.webp
  const [pending, setPending] = useState<Record<string, string>>({}); // new photos: site path to data URL
  const [removed, setRemoved] = useState<string[]>([]); // site paths to delete on publish
  const [saved, setSaved] = useState(() => snapshot(initial));
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const catalog: Catalog = { products, offers, site, collections, weights, content, faqs };
  const dirty = snapshot(catalog) !== saved || Object.keys(pending).length > 0 || removed.length > 0;

  // warn before closing the tab with unpublished changes
  useEffect(() => {
    if (!dirty) return;
    const on = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", on);
    return () => window.removeEventListener("beforeunload", on);
  }, [dirty]);

  const src = (p: string) => pending[p] ?? `/${p}`;

  /** Which products, collections or site spots use each photo, so used photos can't be deleted. */
  const usedBy = useMemo(() => {
    const m = new Map<string, string[]>();
    const use = (img: string, what: string) => img && m.set(img, [...(m.get(img) ?? []), what]);
    for (const p of products) use(p.img, p.name || "New product");
    for (const c of collections) use(c.img, `${c.name || "New"} collection`);
    for (const f of CONTENT_PHOTOS) use(content[f.key] || f.def, f.label);
    return m;
  }, [products, collections, content]);

  const addPhoto = async (file: File, hint: string, maxSide?: number) => {
    const dataUrl = await shrink(file, maxSide);
    const path = `img/uploads/${slug(hint)}-${uid()}.jpg`;
    setPending((m) => ({ ...m, [path]: dataUrl }));
    setPhotos((l) => [path, ...l]);
    return path;
  };

  const deletePhoto = (path: string) => {
    if (usedBy.has(path)) return;
    if (!confirm("Delete this photo? This cannot be undone once published.")) return;
    setPhotos((l) => l.filter((p) => p !== path));
    if (pending[path]) {
      setPending((m) => {
        const { [path]: _gone, ...rest } = m;
        return rest;
      });
    } else {
      setRemoved((r) => [...r, path]);
    }
  };

  const publish = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const uploads = Object.entries(pending)
        .filter(([path]) => photos.includes(path))
        .map(([path, url]) => ({ path: `public/${path}`, data: url.split(",")[1] }));
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...catalog, uploads, deletes: removed.map((p) => `public/${p}`) }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setMsg({ kind: "err", text: "Your login expired. Log in again (your edits here are kept until you close this page)." });
        return;
      }
      if (!res.ok) {
        setMsg({ kind: "err", text: body.error || "Saving failed." });
        return;
      }
      setSaved(snapshot(catalog));
      setPending({});
      setRemoved([]);
      setMsg({
        kind: "ok",
        text: body.mode === "local" ? "Saved to the local project files." : "Published. The website updates in about a minute.",
      });
    } catch {
      setMsg({ kind: "err", text: "No connection. Nothing was changed. Try again." });
    } finally {
      setBusy(false);
    }
  };

  const count: Partial<Record<Tab, number>> = {
    products: products.length,
    offers: offers.length,
    faqs: faqs.length,
    collections: collections.length,
    sizes: weights.length,
    photos: photos.length,
  };
  const pick = { photos, src, addPhoto };

  return (
    <main className="adm">
      <header className="adm-top">
        <div>
          <h1>NutBytes admin</h1>
          {initial.mode === "local" && <span className="adm-badge">Local test mode</span>}
        </div>
        <div className="adm-actions">
          <a className="adm-btn" href="/" target="_blank" rel="noopener">View website ↗</a>
          <button className="adm-btn" onClick={onLogout}>Log out</button>
        </div>
      </header>

      <nav className="adm-tabs" aria-label="Sections">
        {TABS.map(([t, name]) => (
          <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)} aria-pressed={tab === t}>
            {name}
            {count[t] != null && ` (${count[t]})`}
          </button>
        ))}
      </nav>

      {tab === "products" && (
        <ProductsTab products={products} setProducts={setProducts} collections={collections} weights={weights} {...pick} />
      )}
      {tab === "offers" && <OffersTab offers={offers} setOffers={setOffers} products={products} collections={collections} />}
      {tab === "faqs" && <FaqsTab faqs={faqs} setFaqs={setFaqs} />}
      {tab === "collections" && (
        <CollectionsTab collections={collections} setCollections={setCollections} products={products} {...pick} />
      )}
      {tab === "home" && <HomeTab content={content} setContent={setContent} {...pick} />}
      {tab === "business" && <BusinessTab site={site} setSite={setSite} />}
      {tab === "sizes" && <SizesTab weights={weights} setWeights={setWeights} />}
      {tab === "photos" && <PhotosTab photos={photos} src={src} usedBy={usedBy} onDelete={deletePhoto} addPhoto={addPhoto} />}

      <div className="adm-bar" role="region" aria-label="Publish">
        <span className={msg ? (msg.kind === "ok" ? "adm-ok" : "adm-err") : "adm-muted"} role="status">
          {msg ? msg.text : dirty ? "You have changes that are not published yet." : "Everything is published."}
        </span>
        <button className="adm-btn adm-primary" onClick={publish} disabled={!dirty || busy}>
          {busy ? "Publishing…" : "Publish changes"}
        </button>
      </div>
    </main>
  );
}

type AddPhoto = (f: File, hint: string, maxSide?: number) => Promise<string>;
type Pick = { photos: string[]; src: (p: string) => string; addPhoto: AddPhoto };

function UploadInner({
  hint,
  onAdded,
  label,
  addPhoto,
  maxSide,
}: {
  hint: string;
  onAdded?: (path: string) => void;
  label: string;
  addPhoto: AddPhoto;
  maxSide?: number;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState("");
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple={!onAdded}
        hidden
        onChange={async (e) => {
          setErr("");
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          try {
            for (const f of files) {
              const p = await addPhoto(f, hint || f.name.replace(/\.[^.]+$/, ""), maxSide);
              onAdded?.(p);
            }
          } catch (x) {
            setErr(x instanceof Error ? x.message : "Upload failed.");
          }
        }}
      />
      <button type="button" className="adm-btn" onClick={() => ref.current?.click()}>{label}</button>
      {err && <span className="adm-err">{err}</span>}
    </>
  );
}

/** Grid of library photos to choose from, plus an upload button. */
function PhotoPicker({
  value,
  onChange,
  hint,
  photos,
  src,
  addPhoto,
  maxSide,
  legend = "Photo",
  note,
}: Pick & { value: string; onChange: (p: string) => void; hint: string; maxSide?: number; legend?: string; note?: string }) {
  return (
    <fieldset>
      <legend>{legend}</legend>
      {note && <p className="adm-muted adm-note">{note}</p>}
      <div className="adm-pick">
        {photos.map((ph) => (
          <button
            type="button"
            key={ph}
            className={ph === value ? "on" : ""}
            onClick={() => onChange(ph)}
            aria-pressed={ph === value}
            aria-label="Use this photo"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src(ph)} alt="" loading="lazy" />
          </button>
        ))}
      </div>
      <UploadInner addPhoto={addPhoto} hint={hint} maxSide={maxSide} label="Upload a new photo" onAdded={onChange} />
    </fieldset>
  );
}

const move = <T,>(set: Setter<T[]>, i: number, d: -1 | 1) =>
  set((l) => {
    const j = i + d;
    if (j < 0 || j >= l.length) return l;
    const c = [...l];
    [c[i], c[j]] = [c[j], c[i]];
    return c;
  });

function ProductsTab({
  products,
  setProducts,
  collections,
  weights,
  ...pick
}: Pick & { products: Product[]; setProducts: Setter<Product[]>; collections: Collection[]; weights: Weight[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const patch = (id: string, next: Partial<Product>) => setProducts((l) => l.map((p) => (p.id === id ? { ...p, ...next } : p)));
  const add = () => {
    const id = `item-${uid()}`;
    setProducts((l) => [
      ...l,
      { id, name: "", collection: collections[0].id, price: 199, short: "", badge: "", img: pick.photos[0] ?? "", hidden: false },
    ]);
    setOpen(id);
  };
  const base = weights[0]?.label ?? "250 g";
  const shown = products.filter((p) => !p.hidden).length;

  return (
    <section>
      <div className="adm-row">
        <p className="adm-muted">
          Products appear in the shop in this order. Prices are for {base}; other pack sizes are worked out from it (see Pack sizes).
        </p>
        <button className="adm-btn adm-primary" onClick={add}>+ Add product</button>
      </div>
      <ul className="adm-list">
        {products.map((p, i) => (
          <li key={p.id} className={`adm-card${p.hidden ? " adm-off" : ""}`}>
            <div className="adm-item-head">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.img ? pick.src(p.img) : ""} alt="" className="adm-thumb" />
              <button className="adm-name" onClick={() => setOpen(open === p.id ? null : p.id)} aria-expanded={open === p.id}>
                {p.name || <em>New product (add a name)</em>}
                <span className="adm-muted">
                  {" "}· ₹{p.price}
                  {p.hidden ? " · hidden" : ""}
                  {p.soldOut && !p.hidden ? " · sold out" : ""}
                </span>
              </button>
              <div className="adm-actions">
                <button className="adm-icon" onClick={() => move(setProducts, i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
                <button className="adm-icon" onClick={() => move(setProducts, i, 1)} disabled={i === products.length - 1} aria-label="Move down">↓</button>
                <button
                  className="adm-icon adm-danger"
                  aria-label={`Remove ${p.name || "product"}`}
                  disabled={products.length <= 1}
                  onClick={() => {
                    if (confirm(`Remove "${p.name || "this product"}" from the shop?`)) setProducts((l) => l.filter((x) => x.id !== p.id));
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {open === p.id && (
              <div className="adm-form">
                <label className="adm-check">
                  <input
                    type="checkbox"
                    checked={!p.hidden}
                    disabled={!p.hidden && shown <= 1}
                    onChange={(e) => patch(p.id, { hidden: !e.target.checked })}
                  />
                  Show in the shop (untick to hide it completely)
                </label>
                <label className="adm-check">
                  <input type="checkbox" checked={!!p.soldOut} onChange={(e) => patch(p.id, { soldOut: e.target.checked })} />
                  Sold out (stays in the shop with a &ldquo;Sold out&rdquo; label; customers can&apos;t add it to the cart)
                </label>
                <label>
                  Name
                  <input value={p.name} maxLength={80} onChange={(e) => patch(p.id, { name: e.target.value })} />
                </label>
                <label>
                  Collection
                  <select value={p.collection} onChange={(e) => patch(p.id, { collection: e.target.value })}>
                    {collections.map((c) => (
                      <option key={c.id} value={c.id}>{c.name || "(unnamed collection)"}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Price for {base} (₹)
                  <input
                    type="number"
                    min={1}
                    max={100000}
                    step={1}
                    inputMode="numeric"
                    value={Number.isFinite(p.price) ? p.price : ""}
                    onChange={(e) => patch(p.id, { price: Math.round(Number(e.target.value)) })}
                  />
                </label>
                <label>
                  Description
                  <textarea rows={2} value={p.short} maxLength={240} onChange={(e) => patch(p.id, { short: e.target.value })} />
                </label>
                <label>
                  Label on the card (optional, e.g. New, Bestseller)
                  <input value={p.badge} maxLength={20} onChange={(e) => patch(p.id, { badge: e.target.value })} />
                </label>
                <PhotoPicker {...pick} value={p.img} hint={p.name} onChange={(img) => patch(p.id, { img })} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function OffersTab({
  offers,
  setOffers,
  products,
  collections,
}: {
  offers: Offer[];
  setOffers: Setter<Offer[]>;
  products: Product[];
  collections: Collection[];
}) {
  const patch = (id: string, next: Partial<Offer>) => setOffers((l) => l.map((o) => (o.id === id ? { ...o, ...next } : o)));
  return (
    <section>
      <div className="adm-row">
        <p className="adm-muted">
          Active offers show in a banner at the top of every page. Add a discount to lower the prices too: the shop shows the old
          price crossed out, and the cart, checkout and WhatsApp order use the offer price. If two discounts cover the same product,
          the bigger one is used. Set an end date and the offer switches itself off.
        </p>
        <button
          className="adm-btn adm-primary"
          onClick={() => setOffers((l) => [...l, { id: `offer-${uid()}`, text: "", until: "", active: true, discount: 0, scope: "all" }])}
        >
          + Add offer
        </button>
      </div>
      {offers.length === 0 && <p className="adm-card adm-muted">No offers yet.</p>}
      <ul className="adm-list">
        {offers.map((o) => (
          <li key={o.id} className="adm-card adm-form">
            <label>
              Offer text
              <input value={o.text} maxLength={160} placeholder="e.g. 10% off gift boxes this Diwali" onChange={(e) => patch(o.id, { text: e.target.value })} />
            </label>
            <div className="adm-row adm-2">
              <label>
                Discount (%)
                <input
                  type="number"
                  min={0}
                  max={90}
                  step={1}
                  inputMode="numeric"
                  value={o.discount || ""}
                  placeholder="0 = banner only"
                  onChange={(e) => patch(o.id, { discount: Math.max(0, Math.min(90, Math.round(Number(e.target.value) || 0))) })}
                />
              </label>
              {!!o.discount && (
                <label>
                  Applies to
                  <select
                    value={o.scope === "all" || !o.scope ? "all" : `${o.scope}:${o.target ?? ""}`}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "all") return patch(o.id, { scope: "all", target: undefined });
                      const [scope, target] = v.split(":") as ["collection" | "product", string];
                      patch(o.id, { scope, target });
                    }}
                  >
                    <option value="all">Everything in the shop</option>
                    <optgroup label="A collection">
                      {collections.map((c) => (
                        <option key={c.id} value={`collection:${c.id}`}>{c.name || "(unnamed collection)"}</option>
                      ))}
                    </optgroup>
                    <optgroup label="One product">
                      {products.map((p) => (
                        <option key={p.id} value={`product:${p.id}`}>{p.name || "(unnamed product)"}</option>
                      ))}
                    </optgroup>
                    {o.scope !== "all" &&
                      o.scope &&
                      !(o.scope === "collection" ? collections : products).some((x) => x.id === o.target) && (
                        <option value={`${o.scope}:${o.target ?? ""}`} disabled>
                          (removed, choose another)
                        </option>
                      )}
                  </select>
                </label>
              )}
            </div>
            <div className="adm-row">
              <label>
                Last day (optional)
                <input type="date" value={o.until} onChange={(e) => patch(o.id, { until: e.target.value })} />
              </label>
              <label className="adm-check">
                <input type="checkbox" checked={o.active} onChange={(e) => patch(o.id, { active: e.target.checked })} />
                Show on the site
              </label>
              <button
                className="adm-btn adm-danger"
                onClick={() => {
                  if (confirm("Remove this offer?")) setOffers((l) => l.filter((x) => x.id !== o.id));
                }}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CollectionsTab({
  collections,
  setCollections,
  products,
  ...pick
}: Pick & { collections: Collection[]; setCollections: Setter<Collection[]>; products: Product[] }) {
  const patch = (id: string, next: Partial<Collection>) => setCollections((l) => l.map((c) => (c.id === id ? { ...c, ...next } : c)));
  const inUse = (id: string) => products.filter((p) => p.collection === id).length;
  return (
    <section>
      <div className="adm-row">
        <p className="adm-muted">
          Collections are the cards on the home page and the filters on the snacks page. A collection with products in it can only be
          removed after moving those products.
        </p>
        <button
          className="adm-btn adm-primary"
          onClick={() =>
            setCollections((l) => [...l, { id: `col-${uid()}`, name: "", line: "", img: pick.photos[0] ?? "", tone: TONES[l.length % 3] }])
          }
        >
          + Add collection
        </button>
      </div>
      <ul className="adm-list">
        {collections.map((c, i) => {
          const n = inUse(c.id);
          return (
            <li key={c.id} className="adm-card adm-form">
              <div className="adm-item-head">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.img ? pick.src(c.img) : ""} alt="" className="adm-thumb" />
                <strong className="adm-name">
                  {c.name || <em>New collection</em>} <span className="adm-muted">· {n} product{n === 1 ? "" : "s"}</span>
                </strong>
                <div className="adm-actions">
                  <button className="adm-icon" onClick={() => move(setCollections, i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
                  <button className="adm-icon" onClick={() => move(setCollections, i, 1)} disabled={i === collections.length - 1} aria-label="Move down">↓</button>
                  <button
                    className="adm-icon adm-danger"
                    aria-label={`Remove ${c.name || "collection"}`}
                    disabled={n > 0 || collections.length <= 1}
                    title={n > 0 ? "Move its products to another collection first" : undefined}
                    onClick={() => {
                      if (confirm(`Remove the "${c.name || "new"}" collection?`)) setCollections((l) => l.filter((x) => x.id !== c.id));
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="adm-row adm-2">
                <label>
                  Name
                  <input value={c.name} maxLength={40} onChange={(e) => patch(c.id, { name: e.target.value })} />
                </label>
                <label>
                  Line on the card
                  <input value={c.line} maxLength={80} onChange={(e) => patch(c.id, { line: e.target.value })} />
                </label>
              </div>
              <label>
                Card colour
                <select value={c.tone} onChange={(e) => patch(c.id, { tone: e.target.value as Collection["tone"] })}>
                  {TONES.map((t) => (
                    <option key={t} value={t}>{{ blush: "Pink", peach: "Peach", lilac: "Lilac" }[t]}</option>
                  ))}
                </select>
              </label>
              <PhotoPicker
                {...pick}
                value={c.img}
                hint={c.name || "collection"}
                onChange={(img) => patch(c.id, { img })}
                note="The built-in cards use cut-out photos with no background. Uploaded photos keep their background."
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function HomeTab({ content, setContent, ...pick }: Pick & { content: Content; setContent: Setter<Content> }) {
  const set = (key: keyof Content, v: string) => setContent((c) => ({ ...c, [key]: v }));
  const groups = [...new Set(CONTENT_FIELDS.map((f) => f.group))];
  return (
    <section>
      <p className="adm-muted">
        Leave a box empty to keep the wording shown in grey. Changes show on the home page, the About page and in the footer.
      </p>
      {groups.map((g) => (
        <div key={g} className="adm-card adm-form">
          <h2>{g}</h2>
          {CONTENT_FIELDS.filter((f) => f.group === g).map((f) => (
            <label key={f.key}>
              {f.label}
              {"long" in f ? (
                <textarea rows={3} value={content[f.key]} maxLength={f.max} placeholder={f.def} onChange={(e) => set(f.key, e.target.value)} />
              ) : (
                <input value={content[f.key]} maxLength={f.max} placeholder={f.def} onChange={(e) => set(f.key, e.target.value)} />
              )}
            </label>
          ))}
        </div>
      ))}
      {CONTENT_PHOTOS.map((f) => (
        <div key={f.key} className="adm-card adm-form">
          <h2>{f.label}</h2>
          <PhotoPicker
            {...pick}
            legend="Choose a photo"
            note={f.hint}
            value={content[f.key] || f.def}
            hint={f.key === "heroImg" ? "banner" : "about"}
            maxSide={f.key === "heroImg" ? 2000 : 1400}
            onChange={(p) => set(f.key, p === f.def ? "" : p)}
          />
          {content[f.key] && (
            <button className="adm-btn" onClick={() => set(f.key, "")}>Use the original photo</button>
          )}
        </div>
      ))}
    </section>
  );
}

function FaqsTab({ faqs, setFaqs }: { faqs: Faq[]; setFaqs: Setter<Faq[]> }) {
  const patch = (i: number, next: Partial<Faq>) => setFaqs((l) => l.map((f, j) => (j === i ? { ...f, ...next } : f)));
  return (
    <section>
      <div className="adm-row">
        <p className="adm-muted">
          Questions on the Customer Care page, in this order. Write {"{deliveryArea}"}, {"{fssai}"}, {"{phoneDisplay}"} or {"{email}"} in an
          answer to show the current business detail.
        </p>
        <button className="adm-btn adm-primary" onClick={() => setFaqs((l) => [...l, { q: "", a: "" }])}>+ Add question</button>
      </div>
      {faqs.length === 0 && <p className="adm-card adm-muted">No questions. The FAQs section will be left out.</p>}
      <ul className="adm-list">
        {faqs.map((f, i) => (
          <li key={i} className="adm-card adm-form">
            <div className="adm-item-head">
              <strong className="adm-name">Question {i + 1}</strong>
              <div className="adm-actions">
                <button className="adm-icon" onClick={() => move(setFaqs, i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
                <button className="adm-icon" onClick={() => move(setFaqs, i, 1)} disabled={i === faqs.length - 1} aria-label="Move down">↓</button>
                <button
                  className="adm-icon adm-danger"
                  aria-label={`Remove question ${i + 1}`}
                  onClick={() => {
                    if (confirm("Remove this question?")) setFaqs((l) => l.filter((_, j) => j !== i));
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
            <label>
              Question
              <input value={f.q} maxLength={200} onChange={(e) => patch(i, { q: e.target.value })} />
            </label>
            <label>
              Answer
              <textarea rows={3} value={f.a} maxLength={800} onChange={(e) => patch(i, { a: e.target.value })} />
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}

function BusinessTab({ site, setSite }: { site: Site; setSite: Setter<Site> }) {
  const field = (key: keyof Site, label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label>
      {label}
      <input value={site[key]} onChange={(e) => setSite((s) => ({ ...s, [key]: e.target.value }))} {...extra} />
    </label>
  );
  return (
    <section>
      <p className="adm-muted">Used in the footer, on the help and about pages, and for every WhatsApp order.</p>
      <div className="adm-card adm-form">
        {field("whatsapp", "WhatsApp number for orders (with country code, digits only)", { inputMode: "numeric", maxLength: 15, placeholder: "919000242480" })}
        {field("phoneDisplay", "Phone number as shown on the site", { maxLength: 30 })}
        {field("email", "Email", { type: "email", maxLength: 120 })}
        {field("location", "Location", { maxLength: 80 })}
        {field("deliveryArea", "Delivery area", { maxLength: 80, placeholder: "Ongole and nearby areas" })}
        {field("instagram", "Instagram link", { type: "url", maxLength: 200 })}
        {field("fssai", "FSSAI registration number", { inputMode: "numeric", maxLength: 14 })}
      </div>
    </section>
  );
}

function SizesTab({ weights, setWeights }: { weights: Weight[]; setWeights: Setter<Weight[]> }) {
  const patch = (id: string, next: Partial<Weight>) => setWeights((l) => l.map((w) => (w.id === id ? { ...w, ...next } : w)));
  return (
    <section>
      <div className="adm-row">
        <p className="adm-muted">
          Product prices are for the first pack size. Each other size costs that price × its multiplier (e.g. 1.9 for 500 g = ₹190 when 250 g
          is ₹100). Customers with an old pack size in their cart get the first size instead.
        </p>
        <button className="adm-btn adm-primary" onClick={() => setWeights((l) => [...l, { id: `w-${uid()}`, label: "", factor: 2 }])}>
          + Add pack size
        </button>
      </div>
      <ul className="adm-list">
        {weights.map((w, i) => (
          <li key={w.id} className="adm-card adm-row adm-size">
            <label>
              Name
              <input value={w.label} maxLength={20} placeholder="e.g. 2 kg" onChange={(e) => patch(w.id, { label: e.target.value })} />
            </label>
            <label>
              Price multiplier
              {i === 0 ? (
                <input value="1 (base price)" disabled />
              ) : (
                <input
                  type="number"
                  min={0.1}
                  max={100}
                  step={0.05}
                  value={Number.isFinite(w.factor) ? w.factor : ""}
                  onChange={(e) => patch(w.id, { factor: Number(e.target.value) })}
                />
              )}
            </label>
            <div className="adm-actions">
              <button className="adm-icon" onClick={() => move(setWeights, i, -1)} disabled={i <= 1} aria-label="Move up">↑</button>
              <button className="adm-icon" onClick={() => move(setWeights, i, 1)} disabled={i === 0 || i === weights.length - 1} aria-label="Move down">↓</button>
              <button
                className="adm-icon adm-danger"
                disabled={i === 0}
                aria-label={`Remove ${w.label || "pack size"}`}
                onClick={() => {
                  if (confirm(`Remove the ${w.label || "new"} pack size?`)) setWeights((l) => l.filter((x) => x.id !== w.id));
                }}
              >
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PhotosTab({
  photos,
  src,
  usedBy,
  onDelete,
  addPhoto,
}: {
  photos: string[];
  src: (p: string) => string;
  usedBy: Map<string, string[]>;
  onDelete: (p: string) => void;
  addPhoto: AddPhoto;
}) {
  const deletable = (p: string) => /^img\/(products|uploads)\//.test(p);
  return (
    <section>
      <div className="adm-row">
        <p className="adm-muted">
          All photos the site can use. A photo in use can&apos;t be deleted until nothing uses it. The site&apos;s original design photos can&apos;t be
          deleted.
        </p>
        <UploadInner addPhoto={addPhoto} hint="" label="+ Upload photos" />
      </div>
      <ul className="adm-grid">
        {photos.map((p) => {
          const used = usedBy.get(p);
          return (
            <li key={p} className="adm-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src(p)} alt="" loading="lazy" />
              <p className="adm-muted">{used ? `Used by: ${used.join(", ")}` : "Not used"}</p>
              {deletable(p) && (
                <button className="adm-btn adm-danger" disabled={!!used} onClick={() => onDelete(p)}>
                  Delete
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
