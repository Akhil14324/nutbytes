"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useLang, type Key } from "@/lib/i18n";
import { waLink } from "@/lib/site";
import { ArrowIcon, WhatsAppIcon } from "./Icons";

const ROWS: { t: Key; d: Key }[] = [
  { t: "occ.1.t", d: "occ.1.d" },
  { t: "occ.2.t", d: "occ.2.d" },
  { t: "occ.3.t", d: "occ.3.d" },
];

export default function Occasions() {
  const { t } = useLang();
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.utils.toArray<HTMLElement>(".occ-row").forEach((row) => {
        gsap.from(row, {
          autoAlpha: 0,
          y: 40,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: row, start: "top 88%", once: true },
        });
      });
      gsap.to(".gift-photo", {
        yPercent: -8,
        ease: "none",
        scrollTrigger: { trigger: ".gifting", start: "top bottom", end: "bottom top", scrub: true },
      });
      gsap.to(".gift-chip", {
        yPercent: 22,
        ease: "none",
        scrollTrigger: { trigger: ".gifting", start: "top bottom", end: "bottom top", scrub: true },
      });
    },
    { scope: root }
  );

  return (
    <div ref={root}>
      <section id="occasions" className="occasions">
        <h2 className="section-title">{t("occ.title")}</h2>
        <ul className="occ-list">
          {ROWS.map((r) => (
            <li key={r.t} className="occ-row">
              <h3>{t(r.t)}</h3>
              <p>{t(r.d)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="gifting" className="gifting">
        <div className="gift-copy">
          <h2 className="section-title">{t("gift.title")}</h2>
          <p className="gift-body">{t("gift.body")}</p>
          <a className="btn btn-primary" href={waLink(t("gift.msg"))} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon size={18} /> {t("gift.cta")} <ArrowIcon />
          </a>
        </div>
        <div className="gift-visual">
          <div className="gift-photo">
            <Image
              src="/img/gift-box-v2.jpg"
              alt="NutBytes gift box with laddus and spiced nuts"
              fill
              sizes="(max-width: 900px) 92vw, 640px"
            />
          </div>
          <div className="gift-chip">
            <Image src="/img/laddu-2.jpg" alt="" fill sizes="200px" />
          </div>
        </div>
      </section>
    </div>
  );
}
