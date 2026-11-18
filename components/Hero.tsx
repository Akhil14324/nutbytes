"use client";

import { useLang } from "@/lib/i18n";
import { goTo } from "@/lib/smooth";
import { ArrowIcon, WhatsAppIcon } from "./Icons";
import WhatsAppLink from "./WhatsAppLink";

/** The hero background photo. It is set in CSS as `--hero-bg` and drawn with background-size: cover. */
const HERO_BG = "/img/hero-dry-fruits.png";

export default function Hero() {
  const { t } = useLang();

  return (
    <section className="hero" id="hero" aria-label="NutBytes">
      <div className="hero-banner" style={{ "--hero-bg": `url(${HERO_BG})` } as React.CSSProperties}>
        <div className="hero-copy">
          <p className="hero-sub">{t("hero.sub")}</p>
          <h1 className="hero-word">NutBytes</h1>
          <p className="hero-tag">{t("hero.tag")}</p>
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
