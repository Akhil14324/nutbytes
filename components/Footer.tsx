"use client";

import Image from "next/image";
import { useLang } from "@/lib/i18n";
import { SITE, waLink } from "@/lib/site";
import { InstagramIcon, WhatsAppIcon } from "./Icons";

export default function Footer() {
  const { t } = useLang();
  return (
    <footer id="contact" className="footer">
      <div className="footer-top">
        <Image src="/img/logo-wreath.png" alt="NutBytes" width={168} height={168} className="footer-logo" />
        <div className="footer-lead">
          <p className="footer-line">{t("foot.line")}</p>
          <p className="footer-deliver">{t("foot.deliver")}</p>
        </div>
        <ul className="footer-links">
          <li>
            <a href={waLink(t("wa.hello"))} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon size={18} /> <span>{SITE.waDisplay}</span>
            </a>
          </li>
          <li>
            <a href={`https://wa.me/${SITE.phone2}`} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon size={18} /> <span>{SITE.phone2Display}</span>
            </a>
          </li>
          <li>
            <a href={SITE.instagram} target="_blank" rel="noopener noreferrer">
              <InstagramIcon size={18} /> <span>{SITE.handle}</span>
            </a>
          </li>
        </ul>
      </div>
      <div className="footer-bottom">
        <p>
          {SITE.place}. {t("foot.fssai")} {SITE.fssai}
        </p>
        <p>
          &copy; {new Date().getFullYear()} NutBytes. {t("foot.rights")}
        </p>
      </div>
    </footer>
  );
}
