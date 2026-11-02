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
