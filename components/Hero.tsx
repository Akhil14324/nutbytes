"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useLang } from "@/lib/i18n";
import { goTo } from "@/lib/smooth";
import { ArrowIcon } from "./Icons";

const NutScene = dynamic(() => import("./NutScene"), { ssr: false });

export default function Hero() {
  const { t } = useLang();
  const root = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const [active, setActive] = useState(true);
  const [reduced, setReduced] = useState(false);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        setReduced(false);
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
          .to(".hero-word", { scale: 1.1, autoAlpha: 0, duration: 0.2 }, 0.14)
          .to(".hero-tag", { autoAlpha: 0, y: -12, duration: 0.08 }, 0.1);

        // three short captions
        const cap = (sel: string, a: number, b: number) =>
          tl
            .fromTo(sel, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.06 }, a)
            .to(sel, { autoAlpha: 0, y: -18, duration: 0.05 }, b);
        cap(".cap-1", 0.07, 0.17);
        cap(".cap-2", 0.3, 0.44);
        cap(".cap-3", 0.5, 0.63);

        // the ball becomes the real laddu
        tl.to(".hero-canvas", { autoAlpha: 0, scale: 0.94, duration: 0.12 }, 0.74)
          .fromTo(
            ".hero-photo",
            { autoAlpha: 0, scale: 0.86, rotate: -8 },
            { autoAlpha: 1, scale: 1, rotate: 0, duration: 0.14 },
            0.7
          )
          .fromTo(".hero-final > *", { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.08, stagger: 0.04 }, 0.82)
          .set({}, {}, 1);

        return () => setReduced(false);
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        setReduced(true);
        progress.current = 0.8;
        ScrollTrigger.create({ trigger: root.current, onLeave: () => setActive(false), onEnterBack: () => setActive(true) });
      });

      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section ref={root} className={`hero${reduced ? " is-reduced" : ""}`} id="hero" aria-label="NutBytes">
      <div className="hero-word-wrap">
        <h1 className="hero-word">NutBytes</h1>
        <p className="hero-tag">{t("hero.tag")}</p>
      </div>

      <div className="hero-canvas" aria-hidden>
        <NutScene progress={progress} host={root} active={active && !reduced} />
      </div>

      <div className="hero-photo" aria-hidden>
        <Image src="/img/hero-laddu.jpg" alt="" fill sizes="(max-width: 700px) 90vw, 640px" priority />
      </div>

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
