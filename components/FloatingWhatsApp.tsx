"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { useLang } from "@/lib/i18n";
import { WhatsAppIcon } from "./Icons";
import WhatsAppLink from "./WhatsAppLink";

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
    <WhatsAppLink
      className={`fab${show && !open ? " is-on" : ""}`}
      text={t("wa.hello")}
      aria-label={t("wa.fab")}
      tabIndex={show && !open ? 0 : -1}
    >
      <WhatsAppIcon size={26} />
    </WhatsAppLink>
  );
}
