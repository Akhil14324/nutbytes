"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { useLang } from "@/lib/i18n";
import { goTo } from "@/lib/smooth";
import { BoxIcon } from "./Icons";

export default function Header() {
  const { t, lang, setLang } = useLang();
  const { count, setOpen } = useCart();
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const on = () => setSolid(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const link = (id: string, label: string) => (
    <a
      href={`#${id}`}
      onClick={(e) => {
        e.preventDefault();
        goTo(id);
      }}
    >
      {label}
    </a>
  );

  return (
    <header className={`site-header${solid ? " is-solid" : ""}`}>
      <a
        href="#hero"
        className="brand"
        aria-label="NutBytes"
        onClick={(e) => {
          e.preventDefault();
          goTo("hero");
        }}
      >
        <Image src="/img/logo-badge.png" alt="" width={44} height={44} priority />
        <span>NutBytes</span>
      </a>

      <nav className="nav" aria-label="Main">
        {link("menu", t("nav.menu"))}
        {link("occasions", t("nav.occasions"))}
        {link("gifting", t("nav.gifting"))}
        {link("contact", t("nav.contact"))}
      </nav>

      <div className="header-actions">
        <div className="lang" role="group" aria-label="Language">
          <button aria-pressed={lang === "en"} onClick={() => setLang("en")}>
            EN
          </button>
          <button aria-pressed={lang === "te"} onClick={() => setLang("te")} lang="te">
            తె
          </button>
        </div>
        <button className="box-btn" onClick={() => setOpen(true)} aria-label={t("nav.box")}>
          <BoxIcon />
          <span className="box-label">{t("nav.box")}</span>
          {count > 0 && (
            <b key={count} className="box-count">
              {count}
            </b>
          )}
        </button>
      </div>
    </header>
  );
}
