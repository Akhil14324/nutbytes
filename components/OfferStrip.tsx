"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import { isLive, OFFERS } from "@/lib/offers";

// Live offers from /admin, shown as a band between the hero and the menu.
// Expiry is checked in the browser so an offer disappears on its last day without a redeploy.
export default function OfferStrip() {
  const { lang } = useLang();
  const [today, setToday] = useState<string | null>(null);
  const [i, setI] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToday(new Date().toISOString().slice(0, 10));
  }, []);

  const live = today ? OFFERS.filter((o) => isLive(o, today)) : [];

  useEffect(() => {
    if (live.length < 2) return;
    const t = window.setInterval(() => setI((n) => n + 1), 4500);
    return () => window.clearInterval(t);
  }, [live.length]);

  // Always render the element (hidden when empty): the pinned menu below re-parents DOM nodes,
  // so mounting this late would break React's insert position.
  const o = live.length ? live[i % live.length] : null;
  const text = o ? (lang === "te" && o.te) || o.en : "";

  return (
    <aside className="offer-strip" aria-label="Offers" hidden={!o}>
      <span className="offer-tag">{lang === "te" ? "ఆఫర్" : "Offer"}</span>
      <p key={o?.id} className="offer-text">
        {text}
      </p>
      {live.length > 1 && (
        <span className="offer-count" aria-hidden="true">
          {(i % live.length) + 1}/{live.length}
        </span>
      )}
    </aside>
  );
}
