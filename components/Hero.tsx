"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useLang } from "@/lib/i18n";
import { waLink } from "@/lib/site";
import { goTo } from "@/lib/smooth";
import { ArrowIcon, WhatsAppIcon } from "./Icons";

const NutScene = dynamic(() => import("./NutScene"), { ssr: false });

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function Hero() {
  const { t } = useLang();
  const root = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const [active, setActive] = useState(true);
  // the page cannot show the 3D scene at all (no WebGL): fall back to the photo
  const [flat, setFlat] = useState(false);
  // people who asked for less motion keep the scroll-driven story,
  // but the idle drifting and tilting is turned way down
  const [calm, setCalm] = useState(false);

  useGSAP(
    () => {
      setCalm(window.matchMedia("(prefers-reduced-motion: reduce)").matches);

      if (!hasWebGL()) {
        setFlat(true);
        return;
      }

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          id: "hero",
          trigger: root.current,
          start: "top top",
          end: "+=560%",
          pin: true,
          scrub: 0.7,
          anticipatePin: 1,
          onUpdate: (self) => {
            progress.current = self.progress;
          },
          // pause rendering only once the hero has been scrolled past
          onLeave: () => setActive(false),
          onEnterBack: () => setActive(true),
        },
      });

      // opening: wordmark and cue step aside as the nuts start to travel
      tl.to(".hero-cue", { autoAlpha: 0, duration: 0.05 }, 0.02)
        .to(".hero-front", { scale: 1.06, autoAlpha: 0, y: -24, duration: 0.2 }, 0.12);

      // three short captions
      const cap = (sel: string, a: number, b: number) =>
        tl
          .fromTo(sel, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.06 }, a)
          .to(sel, { autoAlpha: 0, y: -18, duration: 0.05 }, b);
      cap(".cap-1", 0.07, 0.17);
      cap(".cap-2", 0.3, 0.44);
      cap(".cap-3", 0.5, 0.63);

      // the ball sits on a soft shadow while it forms
      tl.fromTo(".hero-ground", { autoAlpha: 0, scaleX: 0.6 }, { autoAlpha: 1, scaleX: 1, duration: 0.14 }, 0.44)
        .to(".hero-ground", { autoAlpha: 0, duration: 0.05 }, 0.77);

      // the ball becomes the real laddu. A warm flash of light covers the swap, so the
      // two pictures never sit on top of each other as a ghosted blend.
      tl.fromTo(".hero-glow", { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.06, ease: "power1.out" }, 0.7)
        .to(".hero-canvas", { autoAlpha: 0, scale: 0.97, duration: 0.05, ease: "power1.in" }, 0.745)
        .fromTo(
          ".hero-photo",
          { autoAlpha: 0, scale: 0.95, y: 14 },
          { autoAlpha: 1, scale: 1, y: 0, duration: 0.1, ease: "power2.out" },
          0.76
        )
        .to(".hero-glow", { autoAlpha: 0, scale: 1.12, duration: 0.09, ease: "power1.in" }, 0.79)
        .fromTo(".hero-final > *", { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.08, stagger: 0.04 }, 0.84)
        .set({}, {}, 1);
    },
    { scope: root }
  );

  return (
    <section ref={root} className={`hero${flat ? " is-flat" : ""}`} id="hero" aria-label="NutBytes">
      <div className="hero-front">
        <h1 className="hero-word">NutBytes</h1>
        <p className="hero-tag">{t("hero.tag")}</p>
        <div className="hero-actions">
          <button className="btn btn-primary btn-lg" onClick={() => goTo("menu")}>
            {t("hero.shop")} <ArrowIcon />
          </button>
          <a className="btn btn-ghost btn-lg" href={waLink(t("wa.hello"))} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon size={18} /> {t("hero.wa")}
          </a>
        </div>
        <ul className="hero-trust">
          <li>{t("trust.1")}</li>
          <li>{t("trust.2")}</li>
          <li>{t("trust.3")}</li>
          <li>{t("trust.4")}</li>
        </ul>
      </div>

      <div className="hero-canvas" aria-hidden>
        {!flat && <NutScene progress={progress} host={root} active={active} calm={calm} />}
      </div>

      <div className="hero-ground" aria-hidden />

      <div className="hero-photo" aria-hidden>
        <Image src="/img/hero-laddu.webp" alt="" width={1298} height={971} sizes="(max-width: 700px) 92vw, 760px" />
      </div>

      <div className="hero-glow" aria-hidden />

      <div className="hero-caps" aria-live="polite">
        <p className="hero-cap cap-1">{t("hero.cap1")}</p>
        <p className="hero-cap cap-2">{t("hero.cap2")}</p>
        <p className="hero-cap cap-3">{t("hero.cap3")}</p>
      </div>

      <div className="hero-final">
        <h2>{t("hero.final")}</h2>
        <button className="btn btn-primary" onClick={() => goTo("menu")}>
          {t("hero.cta")} <ArrowIcon />
        </button>
      </div>

      <div className="hero-cue" aria-hidden>
        <span>{t("hero.scroll")}</span>
        <i />
      </div>
    </section>
  );
}
