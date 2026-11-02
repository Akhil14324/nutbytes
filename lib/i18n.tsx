"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Lang = "en" | "te";

const dict = {
  en: {
    "nav.menu": "Menu",
    "nav.occasions": "Occasions",
    "nav.gifting": "Gifting",
    "nav.contact": "Contact",
    "nav.box": "My box",
    "hero.tag": "Nuts and dry fruit in every bite",
    "hero.sub": "Healthy snacking",
    "hero.scroll": "Scroll",
    "hero.cap1": "Cashews, almonds, pistachios, figs. Chosen one by one.",
    "hero.cap2": "No processed sugar. No maida.",
    "hero.cap3": "Made slowly, the traditional way.",
    "hero.final": "Our Signature Dry Fruit Ladoo",
    "hero.cta": "See the menu",
    "marquee.1": "Traditional sweets",
    "marquee.2": "Nuts and dry fruit in every bite",
    "marquee.3": "No processed sugar",
    "marquee.4": "No maida",
    "menu.add": "Add to box",
    "menu.added": "Added",
    "menu.weight": "Weight",
    "menu.qty": "Quantity",
    "menu.price": "Price confirmed on WhatsApp",
    "menu.of": "of",
    "occ.title": "A sweet for every day, and every occasion.",
    "occ.1.t": "Festival special treats",
    "occ.1.d": "Made for the days the whole family sits down together.",
    "occ.2.t": "Daily healthy snacking",
    "occ.2.d": "A small, wholesome bite for the rest of the year.",
    "occ.3.t": "Corporate gifting",
    "occ.3.d": "Occasion-based boxes for teams, clients and celebrations.",
    "gift.title": "Planning a gift?",
    "gift.body":
      "Tell us the occasion, how many boxes and the date. We will suggest a box and confirm everything on WhatsApp.",
    "gift.cta": "Plan a gift order",
    "gift.msg":
      "Hello NutBytes! I would like to plan a gift order.\nOccasion:\nNumber of boxes:\nDelivery date:\nArea:",
    "cart.title": "My box",
    "cart.empty": "Your box is empty. Add something sweet from the menu.",
    "cart.browse": "Browse the menu",
    "cart.close": "Close",
    "cart.remove": "Remove",
    "cart.note": "Price is confirmed on WhatsApp before we pack your order.",
    "cart.delivery": "We deliver in Ongole and nearby areas.",
    "cart.name": "Your name",
    "cart.phone": "Phone number",
    "cart.area": "Area or pincode",
    "cart.date": "Needed by (optional)",
    "cart.msg": "Note (optional)",
    "cart.order": "Order on WhatsApp",
    "cart.ig": "Message on Instagram",
    "cart.copy": "Copy my order",
    "cart.copied": "Copied",
    "cart.errName": "Enter your name.",
    "cart.errArea": "Enter your area or pincode.",
    "cart.sent": "WhatsApp opened with your order. Send the message to confirm.",
    "cart.igHint": "Order copied. Paste it into your Instagram message.",
    "foot.line": "Crafted with quality. Made with purity.",
    "foot.deliver": "Delivering in Ongole and nearby areas.",
    "foot.order": "Order on WhatsApp",
    "foot.fssai": "FSSAI Reg. No.",
    "foot.rights": "All rights reserved.",
    "wa.fab": "Order on WhatsApp",
    "wa.hello": "Hello NutBytes! I would like to order.",
  },
  te: {
    "nav.menu": "మెనూ",
    "nav.occasions": "సందర్భాలు",
    "nav.gifting": "బహుమతులు",
    "nav.contact": "సంప్రదించండి",
    "nav.box": "నా బాక్స్",
    "hero.tag": "ప్రతి ముక్కలో నట్స్, డ్రై ఫ్రూట్స్",
    "hero.sub": "ఆరోగ్యకరమైన స్నాకింగ్",
    "hero.scroll": "స్క్రోల్",
    "hero.cap1": "జీడిపప్పు, బాదం, పిస్తా, అంజీర్. ఒక్కొక్కటి ఎంపిక చేసినవే.",
    "hero.cap2": "ప్రాసెస్ చేసిన చక్కెర లేదు. మైదా లేదు.",
    "hero.cap3": "సంప్రదాయ పద్ధతిలో, నెమ్మదిగా తయారు.",
    "hero.final": "మా సిగ్నేచర్ డ్రై ఫ్రూట్ లడ్డూ",
    "hero.cta": "మెనూ చూడండి",
    "marquee.1": "సంప్రదాయ స్వీట్లు",
    "marquee.2": "ప్రతి ముక్కలో నట్స్, డ్రై ఫ్రూట్స్",
    "marquee.3": "ప్రాసెస్ చేసిన చక్కెర లేదు",
    "marquee.4": "మైదా లేదు",
    "menu.add": "బాక్స్‌లో చేర్చండి",
    "menu.added": "చేర్చాము",
    "menu.weight": "బరువు",
    "menu.qty": "సంఖ్య",
    "menu.price": "ధర వాట్సాప్‌లో తెలియజేస్తాము",
    "menu.of": "/",
    "occ.title": "ప్రతిరోజూ, ప్రతి సందర్భానికీ ఒక తీపి.",
    "occ.1.t": "పండుగ ప్రత్యేక స్వీట్లు",
    "occ.1.d": "కుటుంబమంతా కలిసే రోజుల కోసం తయారు.",
    "occ.2.t": "రోజువారీ ఆరోగ్యకరమైన స్నాక్స్",
    "occ.2.d": "ఏడాది పొడవునా తినదగిన చిన్న, ఆరోగ్యకరమైన రుచి.",
    "occ.3.t": "కార్పొరేట్ బహుమతులు",
    "occ.3.d": "టీమ్‌లు, క్లయింట్లు, వేడుకల కోసం సందర్భానుసార బాక్స్‌లు.",
    "gift.title": "బహుమతి ఇవ్వాలనుకుంటున్నారా?",
    "gift.body":
      "సందర్భం, ఎన్ని బాక్స్‌లు, తేదీ చెప్పండి. తగిన బాక్స్ సూచించి వాట్సాప్‌లో అన్నీ ధృవీకరిస్తాము.",
    "gift.cta": "బహుమతి ఆర్డర్ ప్లాన్ చేయండి",
    "gift.msg":
      "Hello NutBytes! I would like to plan a gift order.\nOccasion:\nNumber of boxes:\nDelivery date:\nArea:",
    "cart.title": "నా బాక్స్",
    "cart.empty": "మీ బాక్స్ ఖాళీగా ఉంది. మెనూ నుండి స్వీట్లు చేర్చండి.",
    "cart.browse": "మెనూ చూడండి",
    "cart.close": "మూసివేయి",
    "cart.remove": "తొలగించు",
    "cart.note": "ఆర్డర్ ప్యాక్ చేసే ముందు ధర వాట్సాప్‌లో ధృవీకరిస్తాము.",
    "cart.delivery": "ఒంగోలు మరియు చుట్టుపక్కల ప్రాంతాలకు డెలివరీ.",
    "cart.name": "మీ పేరు",
    "cart.phone": "ఫోన్ నంబర్",
    "cart.area": "ప్రాంతం లేదా పిన్‌కోడ్",
    "cart.date": "కావాల్సిన తేదీ (ఐచ్ఛికం)",
    "cart.msg": "గమనిక (ఐచ్ఛికం)",
    "cart.order": "వాట్సాప్‌లో ఆర్డర్ చేయండి",
    "cart.ig": "ఇన్‌స్టాగ్రామ్‌లో సందేశం",
    "cart.copy": "ఆర్డర్ కాపీ చేయండి",
    "cart.copied": "కాపీ అయింది",
    "cart.errName": "మీ పేరు నమోదు చేయండి.",
    "cart.errArea": "మీ ప్రాంతం లేదా పిన్‌కోడ్ నమోదు చేయండి.",
    "cart.sent": "మీ ఆర్డర్‌తో వాట్సాప్ తెరుచుకుంది. నిర్ధారించడానికి సందేశం పంపండి.",
    "cart.igHint": "ఆర్డర్ కాపీ అయింది. ఇన్‌స్టాగ్రామ్ సందేశంలో పేస్ట్ చేయండి.",
    "foot.line": "నాణ్యతతో తయారు. స్వచ్ఛతతో రూపొందించబడింది.",
    "foot.deliver": "ఒంగోలు మరియు చుట్టుపక్కల ప్రాంతాలకు డెలివరీ.",
    "foot.order": "వాట్సాప్‌లో ఆర్డర్ చేయండి",
    "foot.fssai": "FSSAI రిజిస్ట్రేషన్ నం.",
    "foot.rights": "అన్ని హక్కులూ ఉన్నాయి.",
    "wa.fab": "వాట్సాప్‌లో ఆర్డర్",
    "wa.hello": "Hello NutBytes! I would like to order.",
  },
} as const;

export type Key = keyof (typeof dict)["en"];

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: Key) => string };
const LangCtx = createContext<Ctx | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("nb-lang");
      // restore the saved choice after mount so server and client markup match
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved === "te" || saved === "en") setLangState(saved);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("nb-lang", l);
    } catch {}
  }, []);

  const value = useMemo<Ctx>(
    () => ({ lang, setLang, t: (k) => dict[lang][k] }),
    [lang, setLang]
  );
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export function useLang() {
  const c = useContext(LangCtx);
  if (!c) throw new Error("useLang must be used inside LangProvider");
  return c;
}
