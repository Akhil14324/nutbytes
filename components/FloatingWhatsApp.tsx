"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { useLang } from "@/lib/i18n";
import { waLink } from "@/lib/site";
import { WhatsAppIcon } from "./Icons";

export default function FloatingWhatsApp() {
  const { t } = useLang();
  const { open } = useCart();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const on = () => setShow(window.scrollY > window.innerHeight * 0.6);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <a
      className={`fab${show && !open ? " is-on" : ""}`}
      href={waLink(t("wa.hello"))}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("wa.fab")}
      tabIndex={show && !open ? 0 : -1}
    >
      <WhatsAppIcon size={26} />
    </a>
  );
}
