"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { useLang, type Key } from "@/lib/i18n";
import { waLink } from "@/lib/site";
import { goTo } from "@/lib/smooth";
import { BoxIcon, WhatsAppIcon } from "./Icons";

const LINKS: { id: string; key: Key }[] = [
  { id: "menu", key: "nav.menu" },
  { id: "occasions", key: "nav.occasions" },
  { id: "gifting", key: "nav.gifting" },
  { id: "contact", key: "nav.contact" },
];

export default function Header() {
  const { t, lang, setLang } = useLang();
  const { count, setOpen } = useCart();
  const [solid, setSolid] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const on = () => setSolid(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  // close the mobile menu with Escape, or when the screen grows to desktop size
  useEffect(() => {
    if (!menu) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    const mq = window.matchMedia("(min-width: 921px)");
    const grow = () => mq.matches && setMenu(false);
    window.addEventListener("keydown", key);
    mq.addEventListener("change", grow);
    return () => {
      window.removeEventListener("keydown", key);
      mq.removeEventListener("change", grow);
    };
  }, [menu]);

  const go = useCallback((id: string) => {
    setMenu(false);
    // let the panel close first, so the page scrolls from a stable layout
    window.setTimeout(() => goTo(id), 60);
  }, []);

  const langToggle = (
    <div className="lang" role="group" aria-label="Language">
      <button aria-pressed={lang === "en"} onClick={() => setLang("en")} aria-label="English">
        EN
      </button>
      <button aria-pressed={lang === "te"} onClick={() => setLang("te")} lang="te" aria-label="తెలుగు">
        తెలుగు
      </button>
    </div>
  );

  return (
    <header className={`site-header${solid || menu ? " is-solid" : ""}${menu ? " menu-open" : ""}`}>
      <a
        href="#hero"
        className="brand"
        aria-label="NutBytes"
        onClick={(e) => {
          e.preventDefault();
          go("hero");
        }}
      >
        <Image src="/img/logo-badge-v2.png" alt="" width={44} height={44} priority />
        <span>NutBytes</span>
      </a>

      <nav className="nav" aria-label="Main">
        {LINKS.map((l) => (
          <a
            key={l.id}
            href={`#${l.id}`}
            onClick={(e) => {
              e.preventDefault();
              go(l.id);
            }}
          >
            {t(l.key)}
          </a>
        ))}
      </nav>

      <div className="header-actions">
        <div className="lang-desktop">{langToggle}</div>
        <button className="box-btn" onClick={() => setOpen(true)} aria-label={t("nav.box")}>
          <BoxIcon />
          <span className="box-label">{t("nav.box")}</span>
          {count > 0 && (
            <b key={count} className="box-count">
              {count}
            </b>
          )}
        </button>
        <button
          className={`burger${menu ? " is-open" : ""}`}
          aria-label={menu ? "Close menu" : "Open menu"}
          aria-expanded={menu}
          aria-controls="mobile-nav"
          onClick={() => setMenu((m) => !m)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div id="mobile-nav" className={`mnav${menu ? " is-open" : ""}`} aria-hidden={!menu} inert={!menu}>
        <nav aria-label="Mobile">
          {LINKS.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              onClick={(e) => {
                e.preventDefault();
                go(l.id);
              }}
            >
              {t(l.key)}
            </a>
          ))}
        </nav>
        <div className="mnav-foot">
          {langToggle}
          <a className="btn btn-primary" href={waLink(t("wa.hello"))} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon size={18} /> {t("hero.wa")}
          </a>
        </div>
      </div>
    </header>
  );
}
