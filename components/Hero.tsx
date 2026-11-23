"use client";

import { useLang } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { goTo } from "@/lib/smooth";
import { ArrowIcon, WhatsAppIcon } from "./Icons";
import WhatsAppLink from "./WhatsAppLink";

/** The hero background photo. It is set in CSS as `--hero-bg` and drawn with background-size: cover. */
const HERO_IMAGES = ["/img/hero-banner.webp", "/img/hero-banner-960.webp", "/img/hero-dry-fruits.png"];

export default function Hero() {
  const { t } = useLang();
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setSlide((index) => (index + 1) % HERO_IMAGES.length), 5200);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="hero" id="hero" aria-label="NutBytes">
      <div className="hero-banner" style={{ "--hero-bg": `url(${HERO_IMAGES[slide]})` } as React.CSSProperties}>
        <div className="hero-copy">
          <p className="hero-sub">Every celebration &amp; every gift</p>
          <h1 className="hero-word">NutBytes</h1>
          <p className="hero-tag">Traditional treats for celebrations, sharing and thoughtful gifting.</p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={() => goTo("menu")}>
              {t("hero.shop")} <ArrowIcon />
            </button>
            <WhatsAppLink className="btn btn-ghost btn-lg" text={t("wa.hello")}>
              <WhatsAppIcon size={18} /> {t("hero.wa")}
            </WhatsAppLink>
          </div>
          <ul className="hero-trust">
            <li>{t("trust.1")}</li>
            <li>{t("trust.2")}</li>
            <li>{t("trust.3")}</li>
            <li>{t("trust.4")}</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
