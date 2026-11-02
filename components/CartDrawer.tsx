"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useCart, type Details } from "@/lib/cart";
import { useLang } from "@/lib/i18n";
import { productById, WEIGHTS, type Weight } from "@/lib/products";
import { SITE } from "@/lib/site";
import { goTo, lockScroll } from "@/lib/smooth";
import { CloseIcon, InstagramIcon, MinusIcon, PlusIcon, WhatsAppIcon } from "./Icons";

const EMPTY: Details = { name: "", phone: "", area: "", date: "", note: "" };

export default function CartDrawer() {
  const { t, lang } = useLang();
  const cart = useCart();
  const { open, setOpen, items } = cart;
  const [d, setD] = useState<Details>(EMPTY);
  const [errors, setErrors] = useState<{ name?: boolean; area?: boolean }>({});
  const [toast, setToast] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("nb-details");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setD({ ...EMPTY, ...(JSON.parse(raw) as Partial<Details>), date: "", note: "" });
    } catch {}
  }, []);

  useEffect(() => {
    lockScroll(open);
    if (open) closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const say = (m: string) => {
    setToast(m);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3600);
  };

  const validate = () => {
    const e = { name: !d.name.trim(), area: !d.area.trim() };
    setErrors(e);
    return !e.name && !e.area;
  };

  const persist = () => {
    try {
      localStorage.setItem("nb-details", JSON.stringify({ name: d.name, phone: d.phone, area: d.area }));
    } catch {}
  };

  const order = () => {
    if (!validate()) return;
    persist();
    window.open(cart.buildLink(d), "_blank", "noopener,noreferrer");
    say(t("cart.sent"));
  };

  const copy = async (alsoOpenInstagram: boolean) => {
    if (!validate()) return;
    persist();
    try {
      await navigator.clipboard.writeText(cart.buildMessage(d));
      say(alsoOpenInstagram ? t("cart.igHint") : t("cart.copied"));
    } catch {
      say(cart.buildMessage(d));
    }
    if (alsoOpenInstagram) window.open(SITE.instagram, "_blank", "noopener,noreferrer");
  };

  const set = (k: keyof Details) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setD((s) => ({ ...s, [k]: e.target.value }));
    if (k === "name" || k === "area") setErrors((s) => ({ ...s, [k]: false }));
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <div className={`scrim${open ? " is-open" : ""}`} onClick={() => setOpen(false)} aria-hidden />
      <aside
        className={`drawer${open ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={t("cart.title")}
        aria-hidden={!open}
        inert={!open}
        data-lenis-prevent
      >
        <div className="drawer-head">
          <h2>{t("cart.title")}</h2>
          <button ref={closeRef} className="icon-btn" onClick={() => setOpen(false)} aria-label={t("cart.close")}>
            <CloseIcon />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="drawer-empty">
            <p>{t("cart.empty")}</p>
            <button
              className="btn btn-ghost"
              onClick={() => {
                setOpen(false);
                window.setTimeout(() => goTo("menu"), 350);
              }}
            >
              {t("cart.browse")}
            </button>
          </div>
        ) : (
          <>
            <ul className="lines">
              {items.map((i) => {
                const p = productById(i.id);
                if (!p) return null;
                return (
                  <li key={i.id + i.weight} className="line">
                    <div className="line-img">
                      <Image src={p.img} alt="" fill sizes="64px" />
                    </div>
                    <div className="line-main">
                      <p className="line-name">{lang === "te" ? p.te : p.en}</p>
                      <div className="line-ctl">
                        <select
                          value={i.weight}
                          onChange={(e) => cart.setWeight(i.id, i.weight, e.target.value as Weight)}
                          aria-label={t("menu.weight")}
                        >
                          {WEIGHTS.map((w) => (
                            <option key={w} value={w}>
                              {w}
                            </option>
                          ))}
                        </select>
                        <div className="stepper small">
                          <button onClick={() => cart.setQty(i.id, i.weight, i.qty - 1)} aria-label="-">
                            <MinusIcon size={14} />
                          </button>
                          <output>{i.qty}</output>
                          <button onClick={() => cart.setQty(i.id, i.weight, i.qty + 1)} aria-label="+">
                            <PlusIcon size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                    <button className="line-remove" onClick={() => cart.remove(i.id, i.weight)}>
                      {t("cart.remove")}
                    </button>
                  </li>
                );
              })}
            </ul>

            <form className="order-form" onSubmit={(e) => e.preventDefault()} noValidate>
              <p className="form-note">{t("cart.delivery")}</p>
              <label className={errors.name ? "has-error" : ""}>
                <span>{t("cart.name")}</span>
                <input value={d.name} onChange={set("name")} autoComplete="name" />
                {errors.name && <em>{t("cart.errName")}</em>}
              </label>
              <label>
                <span>{t("cart.phone")}</span>
                <input value={d.phone} onChange={set("phone")} inputMode="tel" autoComplete="tel" />
              </label>
              <label className={errors.area ? "has-error" : ""}>
                <span>{t("cart.area")}</span>
                <input value={d.area} onChange={set("area")} autoComplete="street-address" />
                {errors.area && <em>{t("cart.errArea")}</em>}
              </label>
              <label>
                <span>{t("cart.date")}</span>
                <input type="date" min={today} value={d.date} onChange={set("date")} />
              </label>
              <label>
                <span>{t("cart.msg")}</span>
                <textarea rows={2} value={d.note} onChange={set("note")} />
              </label>
            </form>

            <div className="foot-row">
              <button className="btn btn-ghost" onClick={() => copy(true)}>
                <InstagramIcon size={18} /> {t("cart.ig")}
              </button>
              <button className="btn btn-ghost" onClick={() => copy(false)}>
                {t("cart.copy")}
              </button>
            </div>

            <div className="drawer-foot">
              <p className="form-note">{t("cart.note")}</p>
              <button className="btn btn-wa" onClick={order}>
                <WhatsAppIcon size={20} /> {t("cart.order")}
              </button>
            </div>
          </>
        )}
        <div className={`toast${toast ? " is-on" : ""}`} role="status">
          {toast}
        </div>
      </aside>
    </>
  );
}
