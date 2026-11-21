"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { COLLECTIONS, type Offer, type Product } from "@/lib/catalog";

type Tab = "menu" | "offers" | "photos";
type Load = { products: Product[]; offers: Offer[]; photos: string[]; mode: "local" | "github" };

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
        <p className="adm-muted">Log in to edit the menu, offers and photos.</p>
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

function Editor({ initial, onLogout }: { initial: Load; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("menu");
  const [products, setProducts] = useState<Product[]>(initial.products);
  const [offers, setOffers] = useState<Offer[]>(initial.offers);
  const [photos, setPhotos] = useState<string[]>(initial.photos); // site paths like img/products/x.webp
  const [pending, setPending] = useState<Record<string, string>>({}); // new photos: site path to data URL
  const [removed, setRemoved] = useState<string[]>([]); // site paths to delete on publish
  const [saved, setSaved] = useState(() => JSON.stringify([initial.products, initial.offers]));
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const dirty =
    JSON.stringify([products, offers]) !== saved || Object.keys(pending).length > 0 || removed.length > 0;

  // warn before closing the tab with unpublished changes
  useEffect(() => {
    if (!dirty) return;
    const on = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", on);
    return () => window.removeEventListener("beforeunload", on);
  }, [dirty]);

  const src = (p: string) => pending[p] ?? `/${p}`;
  const usedBy = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const p of products) m.set(p.img, [...(m.get(p.img) ?? []), p.name || "New product"]);
    return m;
  }, [products]);

  const addPhoto = async (file: File, hint: string) => {
    const dataUrl = await shrink(file);
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
        body: JSON.stringify({
          products,
          offers,
          uploads,
          deletes: removed.map((p) => `public/${p}`),
        }),
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
      setSaved(JSON.stringify([products, offers]));
      setPending({});
      setRemoved([]);
      setMsg({
        kind: "ok",
        text:
          body.mode === "local"
            ? "Saved to the local project files."
            : "Published. The website updates in about a minute.",
      });
    } catch {
      setMsg({ kind: "err", text: "No connection. Nothing was changed. Try again." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="adm">
      <header className="adm-top">
        <div>
          <h1>NutBytes admin</h1>
          {initial.mode === "local" && <span className="adm-badge">Local test mode</span>}
        </div>
        <button className="adm-btn" onClick={onLogout}>Log out</button>
      </header>

      <nav className="adm-tabs" aria-label="Sections">
        {(["menu", "offers", "photos"] as Tab[]).map((t) => (
          <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)} aria-pressed={tab === t}>
            {t === "menu" ? `Products (${products.length})` : t === "offers" ? `Offers (${offers.length})` : `Photos (${photos.length})`}
          </button>
        ))}
      </nav>

      {tab === "menu" && (
        <MenuTab products={products} setProducts={setProducts} photos={photos} src={src} addPhoto={addPhoto} />
      )}
      {tab === "offers" && <OffersTab offers={offers} setOffers={setOffers} />}
      {tab === "photos" && (
        <PhotosTab photos={photos} src={src} usedBy={usedBy} onDelete={deletePhoto} addPhoto={addPhoto} />
      )}

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

type AddPhoto = (f: File, hint: string) => Promise<string>;

function UploadInner({ hint, onAdded, label, addPhoto }: { hint: string; onAdded?: (path: string) => void; label: string; addPhoto: AddPhoto }) {
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
              const p = await addPhoto(f, hint || f.name.replace(/\.[^.]+$/, ""));
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

function MenuTab({
  products,
  setProducts,
  photos,
  src,
  addPhoto,
}: {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  photos: string[];
  src: (p: string) => string;
  addPhoto: AddPhoto;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const patch = (id: string, next: Partial<Product>) =>
    setProducts((l) => l.map((p) => (p.id === id ? { ...p, ...next } : p)));
  const move = (i: number, d: -1 | 1) =>
    setProducts((l) => {
      const j = i + d;
      if (j < 0 || j >= l.length) return l;
      const c = [...l];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });
  const add = () => {
    const id = `item-${uid()}`;
    setProducts((l) => [
      ...l,
      { id, name: "", collection: COLLECTIONS[0].id, price: 199, short: "", badge: "", img: photos[0] ?? "img/products/coconutty-ball.webp" },
    ]);
    setOpen(id);
  };

  return (
    <section>
      <div className="adm-row">
        <p className="adm-muted">Products appear in the shop in this order. Prices are for 250 g; 500 g and 1 kg are worked out from it.</p>
        <button className="adm-btn adm-primary" onClick={add}>+ Add product</button>
      </div>
      <ul className="adm-list">
        {products.map((p, i) => (
          <li key={p.id} className="adm-card">
            <div className="adm-item-head">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src(p.img)} alt="" className="adm-thumb" />
              <button className="adm-name" onClick={() => setOpen(open === p.id ? null : p.id)} aria-expanded={open === p.id}>
                {p.name || <em>New product (add a name)</em>}
                <span className="adm-muted"> · ₹{p.price}</span>
              </button>
              <div className="adm-actions">
                <button className="adm-icon" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
                <button className="adm-icon" onClick={() => move(i, 1)} disabled={i === products.length - 1} aria-label="Move down">↓</button>
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
                <label>
                  Name
                  <input value={p.name} maxLength={80} onChange={(e) => patch(p.id, { name: e.target.value })} />
                </label>
                <label>
                  Collection
                  <select value={p.collection} onChange={(e) => patch(p.id, { collection: e.target.value })}>
                    {COLLECTIONS.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Price for 250 g (₹)
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
                <fieldset>
                  <legend>Photo</legend>
                  <div className="adm-pick">
                    {photos.map((ph) => (
                      <button
                        type="button"
                        key={ph}
                        className={ph === p.img ? "on" : ""}
                        onClick={() => patch(p.id, { img: ph })}
                        aria-pressed={ph === p.img}
                        aria-label="Use this photo"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src(ph)} alt="" />
                      </button>
                    ))}
                  </div>
                  <UploadInner addPhoto={addPhoto} hint={p.name} label="Upload a new photo" onAdded={(path) => patch(p.id, { img: path })} />
                </fieldset>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function OffersTab({ offers, setOffers }: { offers: Offer[]; setOffers: React.Dispatch<React.SetStateAction<Offer[]>> }) {
  const patch = (id: string, next: Partial<Offer>) =>
    setOffers((l) => l.map((o) => (o.id === id ? { ...o, ...next } : o)));
  return (
    <section>
      <div className="adm-row">
        <p className="adm-muted">Active offers show in a banner at the top of every page. Set an end date and it hides itself.</p>
        <button
          className="adm-btn adm-primary"
          onClick={() => setOffers((l) => [...l, { id: `offer-${uid()}`, text: "", until: "", active: true }])}
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
  return (
    <section>
      <div className="adm-row">
        <p className="adm-muted">Photos you can use on products. A photo that a product uses cannot be deleted until you change that product.</p>
        <UploadInner addPhoto={addPhoto} hint="" label="+ Upload photos" />
      </div>
      <ul className="adm-grid">
        {photos.map((p) => {
          const used = usedBy.get(p);
          return (
            <li key={p} className="adm-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src(p)} alt="" />
              <p className="adm-muted">{used ? `Used by: ${used.join(", ")}` : "Not used"}</p>
              <button className="adm-btn adm-danger" disabled={!!used} onClick={() => onDelete(p)}>
                Delete
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
