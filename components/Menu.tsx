"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useLang } from "@/lib/i18n";
import { PRODUCTS, WEIGHTS, type Weight } from "@/lib/products";
import { scrollToTarget } from "@/lib/smooth";
import { ArrowIcon, MinusIcon, PlusIcon } from "./Icons";

const N = PRODUCTS.length;

export default function Menu() {
  const { t, lang } = useLang();
  const cart = useCart();
  const root = useRef<HTMLElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const st = useRef<ScrollTrigger | null>(null);
  const [active, setActive] = useState(0);
  const [sel, setSel] = useState<Record<string, { w: Weight; q: number }>>({});
  const [flash, setFlash] = useState<string | null>(null);

  useGSAP(
    () => {
      st.current = ScrollTrigger.create({
        id: "menu",
        trigger: root.current,
        start: "top top",
        end: `+=${N * 62}%`,
        pin: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          const i = Math.min(N - 1, Math.floor(self.progress * N));
          setActive((prev) => (prev === i ? prev : i));
        },
      });
      gsap.from(".menu-stage", {
        autoAlpha: 0,
        y: 60,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: root.current, start: "top 75%", once: true },
      });
    },
    { scope: root }
  );

  // keep the active thumbnail in view in the phone's scrolling strip
  useEffect(() => {
    const el = strip.current?.children[active] as HTMLElement | undefined;
    const box = strip.current;
    if (!el || !box || box.scrollWidth <= box.clientWidth + 2) return;
    box.scrollTo({ left: el.offsetLeft - box.clientWidth / 2 + el.clientWidth / 2, behavior: "smooth" });
  }, [active]);

  const go = useCallback((i: number) => {
    const s = st.current;
    if (!s) return;
    const clamped = Math.max(0, Math.min(N - 1, i));
    scrollToTarget(s.start + ((clamped + 0.5) / N) * (s.end - s.start));
  }, []);

  const p = PRODUCTS[active];
  const cur = sel[p.id] ?? { w: "500g" as Weight, q: 1 };
  const patch = (next: Partial<{ w: Weight; q: number }>) =>
    setSel((s) => ({ ...s, [p.id]: { ...cur, ...next } }));

  const add = () => {
    cart.add(p.id, cur.w, cur.q);
    setFlash(p.id);
    window.setTimeout(() => setFlash((f) => (f === p.id ? null : f)), 1400);
  };

  const name = (x: (typeof PRODUCTS)[number]) => (lang === "te" ? x.te : x.en);

  return (
    <section ref={root} id="menu" className="menu" style={{ backgroundColor: p.tint }} aria-label={t("nav.menu")}>
      <div className="menu-stage">
        {/* the whole photo, with the product's name written on it */}
        <div className="menu-card">
          {PRODUCTS.map((x, i) => (
            <Image
              key={x.id}
              src={x.img}
              alt={i === active ? name(x) : ""}
              fill
              quality={90}
              sizes="(max-width: 920px) 94vw, 860px"
              className={`card-img${i === active ? " is-on" : i < active ? " is-past" : ""}`}
              priority={i < 2}
            />
          ))}
          <div className="card-scrim" aria-hidden />
          <p className="card-count">
            {active + 1} {t("menu.of")} {N}
          </p>
          <div className="card-arrows">
            <button onClick={() => go(active - 1)} disabled={active === 0} aria-label="Previous">
              <ArrowIcon className="flip" />
            </button>
            <button onClick={() => go(active + 1)} disabled={active === N - 1} aria-label="Next">
              <ArrowIcon />
            </button>
          </div>
          <div className="card-text" key={p.id}>
            <h2 className="menu-title">{name(p)}</h2>
            <p className="menu-blurb">{lang === "te" ? p.blurbTe : p.blurbEn}</p>
          </div>
        </div>

        <div className="menu-panel">
          <div className="field">
            <span className="field-label" id="w-label">
              {t("menu.weight")}
            </span>
            <div className="chips" role="radiogroup" aria-labelledby="w-label">
              {WEIGHTS.map((w) => (
                <button
                  key={w}
                  role="radio"
                  aria-checked={cur.w === w}
                  className={`chip${cur.w === w ? " is-on" : ""}`}
                  onClick={() => patch({ w })}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          <div className="buy-row">
            <div className="stepper" role="group" aria-label={t("menu.qty")}>
              <button onClick={() => patch({ q: Math.max(1, cur.q - 1) })} aria-label="-">
                <MinusIcon />
              </button>
              <output>{cur.q}</output>
              <button onClick={() => patch({ q: Math.min(20, cur.q + 1) })} aria-label="+">
                <PlusIcon />
              </button>
            </div>
            <button className={`btn btn-primary add${flash === p.id ? " is-done" : ""}`} onClick={add}>
              {flash === p.id ? t("menu.added") : t("menu.add")}
            </button>
          </div>
          <p className="menu-note">{t("menu.price")}</p>

          <div className="index" ref={strip} role="tablist" aria-label={t("nav.menu")}>
            {PRODUCTS.map((x, i) => (
              <button
                key={x.id}
                role="tab"
                aria-selected={i === active}
                aria-label={name(x)}
                className={`index-item${i === active ? " is-on" : ""}`}
                onClick={() => go(i)}
              >
                <Image src={x.img} alt="" fill quality={70} sizes="160px" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
