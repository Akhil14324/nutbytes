import type Lenis from "lenis";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let instance: Lenis | null = null;
export const setLenis = (l: Lenis | null) => {
  instance = l;
};

function to(target: string | number) {
  if (instance) {
    instance.scrollTo(target, { duration: 1.5, easing: (t) => 1 - Math.pow(1 - t, 4) });
    return;
  }
  if (typeof target === "number") window.scrollTo({ top: target, behavior: "smooth" });
  else document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
}

/** Scroll to a pixel offset or selector. */
export const scrollToTarget = to;

/**
 * Jump to a section by id. Pinned sections (hero, menu) are measured from
 * their ScrollTrigger, because the element itself moves while it is pinned.
 */
export function goTo(id: string) {
  const st = ScrollTrigger.getById(id);
  if (st) return to(st.start);
  to(`#${id}`);
}

export function lockScroll(lock: boolean) {
  if (!instance) return;
  if (lock) instance.stop();
  else instance.start();
}
