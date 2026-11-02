"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { CartProvider } from "@/lib/cart";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { LangProvider } from "@/lib/i18n";
import { setLenis } from "@/lib/smooth";
import CartDrawer from "./CartDrawer";
import FloatingWhatsApp from "./FloatingWhatsApp";
import Footer from "./Footer";
import Header from "./Header";
import Hero from "./Hero";
import Marquee from "./Marquee";
import Menu from "./Menu";
import Occasions from "./Occasions";

function SmoothScroll() {
  // Keep the page layout steady: ignore the phone address bar sliding in and out, and
  // re-measure once fonts and images have loaded, so no blank strip is left at the end.
  useEffect(() => {
    ScrollTrigger.config({ ignoreMobileResize: true });
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener("load", refresh);
    return () => window.removeEventListener("load", refresh);
  }, []);

  // Chrome paints the strip behind a phone's bottom navigation bar with the page's
  // background colour. Keep that colour equal to whatever section is at the bottom edge.
  useEffect(() => {
    let raf = 0;
    const pick = () => {
      raf = 0;
      const root = document.documentElement;
      let n: Element | null = document.elementFromPoint(window.innerWidth / 2, window.innerHeight - 3);
      while (n && n !== root) {
        const bg = getComputedStyle(n).backgroundColor;
        if (bg && bg !== "transparent" && !/^rgba(s*0,s*0,s*0,s*0s*)$/.test(bg)) {
          root.style.backgroundColor = bg;
          return;
        }
        n = n.parentElement;
      }
      root.style.backgroundColor = "";
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(pick);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    const t = window.setInterval(on, 1200); // also follows the menu's fading tint
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      window.clearInterval(t);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
    setLenis(lenis);
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      setLenis(null);
    };
  }, []);
  return null;
}

export default function Experience() {
  return (
    <LangProvider>
      <CartProvider>
        <SmoothScroll />
        <Header />
        <main>
          <Hero />
          <Marquee />
          <Menu />
          <Occasions />
        </main>
        <Footer />
        <CartDrawer />
        <FloatingWhatsApp />
      </CartProvider>
    </LangProvider>
  );
}
