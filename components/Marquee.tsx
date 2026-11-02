"use client";

import { useLang, type Key } from "@/lib/i18n";
import { AlmondMark } from "./Icons";

const KEYS: Key[] = ["marquee.1", "marquee.2", "marquee.3", "marquee.4"];

export default function Marquee() {
  const { t } = useLang();
  const row = (hidden: boolean) => (
    <ul className="marquee-row" aria-hidden={hidden || undefined}>
      {KEYS.map((k) => (
        <li key={k}>
          <span>{t(k)}</span>
          <AlmondMark className="marquee-mark" />
        </li>
      ))}
    </ul>
  );
  return (
    <div className="marquee">
      <div className="marquee-track">
        {row(false)}
        {row(true)}
        {row(true)}
      </div>
    </div>
  );
}
