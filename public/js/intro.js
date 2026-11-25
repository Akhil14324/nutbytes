/* NutBytes logo intro (home page only), in the style of a cinematic preloader:
 *   1. the hero photo (bites on a pink cake stand) pushes in and washes out to cream
 *   2. the badge's ring of nuts swirls into place and the centre pops in, with a soft shine
 *   3. the badge flies up into the header logo while the page fades in underneath
 * Plays on every load of the home page (the owner wants it every time, even with reduced
 * motion switched on). It can be skipped with a click or any key; ?nointro turns it off for testing. */
(function () {
  const NB = (window.NB = window.NB || {});
  const params = new URLSearchParams(location.search);

  const play = !params.has("nointro");
  if (!play || !("animate" in Element.prototype)) return;

  // hide the page until the overlay is up, so it never flashes
  document.documentElement.classList.add("intro-pending");

  let finish;
  NB.introDone = new Promise((res) => (finish = res));

  // wait for layout.js to put the header in place (the badge lands on its logo)
  document.addEventListener("nb:ready", () => {

    const el = document.createElement("div");
    el.className = "intro";
    el.setAttribute("role", "img");
    el.setAttribute("aria-label", "NutBytes – Healthy Snacking");
    el.innerHTML = `
      <div class="intro-scene" aria-hidden="true">
        <picture>
          <source media="(max-width: 860px)" srcset="img/hero-rose-brown-mobile.webp" />
          <img class="intro-photo" src="img/hero-rose-brown.webp" srcset="img/hero-rose-brown-960.webp 960w, img/hero-rose-brown.webp 1671w" sizes="100vw" alt="" />
        </picture>
        <div class="intro-sun"></div>
      </div>
      <div class="intro-wash" aria-hidden="true"></div>
      <div class="intro-badge" aria-hidden="true">
        <span class="intro-glow"></span>
        <img class="intro-ring" src="img/logo-ring.webp" alt="" />
        <span class="intro-core"><img src="img/logo-core.webp" alt="" /><span class="intro-shine"></span></span>
      </div>
      <button class="intro-skip" type="button">Skip intro</button>`;
    document.body.appendChild(el);
    document.body.classList.add("no-scroll");
    document.documentElement.classList.remove("intro-pending");

    const headerLogo = document.querySelector(".site-header .brand-logo");
    headerLogo && headerLogo.classList.add("is-intro-hidden");

    const $ = (s) => el.querySelector(s);
    const anims = [];
    const run = (node, frames, opts) => {
      const a = node.animate(frames, { fill: "both", easing: "cubic-bezier(.22,.61,.36,1)", ...opts });
      anims.push(a);
      return a;
    };

    /* 1 — the photo pushes in towards the cake stand and washes out */
    run($(".intro-scene"), [
      { transform: "scale(1)", filter: "brightness(1) blur(0px)" },
      { transform: "scale(1.9)", filter: "brightness(1.3) blur(10px)" },
    ], { duration: 1350, easing: "cubic-bezier(.55,0,.75,.35)" });
    run($(".intro-sun"), [
      { transform: "translate(-50%,-50%) scale(.6)", opacity: 0.85 },
      { transform: "translate(-50%,-50%) scale(9)", opacity: 1 },
    ], { duration: 1250, delay: 250, easing: "cubic-bezier(.5,0,.8,.4)" });
    run($(".intro-wash"), [{ opacity: 0 }, { opacity: 1 }], { duration: 450, delay: 900 });

    /* 2 — the badge forms */
    run($(".intro-ring"), [
      { opacity: 0, transform: "scale(1.6) rotate(-140deg)" },
      { opacity: 1, offset: 0.4 },
      { opacity: 1, transform: "scale(1) rotate(0deg)" },
    ], { duration: 1100, delay: 1000, easing: "cubic-bezier(.16,1,.3,1)" });
    run($(".intro-core"), [
      { opacity: 0, transform: "translate(-50%,-50%) scale(.3)" },
      { opacity: 1, transform: "translate(-50%,-50%) scale(1.08)", offset: 0.65 },
      { opacity: 1, transform: "translate(-50%,-50%) scale(1)" },
    ], { duration: 700, delay: 1300 });
    run($(".intro-glow"), [
      { opacity: 0, transform: "scale(.6)" },
      { opacity: 0.9, transform: "scale(1.15)", offset: 0.5 },
      { opacity: 0.35, transform: "scale(1)" },
    ], { duration: 1400, delay: 1200 });
    run($(".intro-shine"), [{ transform: "translateX(-130%) rotate(20deg)" }, { transform: "translateX(130%) rotate(20deg)" }], {
      duration: 800,
      delay: 2050,
      easing: "ease-in-out",
    });

    /* 3 — the badge lands in the header and the page appears */
    const badge = $(".intro-badge");
    let landed = false;
    function land(fast) {
      if (landed) return;
      landed = true;
      const from = badge.getBoundingClientRect();
      const to = headerLogo ? headerLogo.getBoundingClientRect() : null;
      const t = fast ? 350 : 800;
      if (to && to.width) {
        const dx = to.left + to.width / 2 - (from.left + from.width / 2);
        const dy = to.top + to.height / 2 - (from.top + from.height / 2);
        const s = to.width / from.width;
        badge.animate(
          [{ transform: "translate(0,0) scale(1)" }, { transform: `translate(${dx}px,${dy}px) scale(${s})` }],
          { duration: t, easing: "cubic-bezier(.7,0,.2,1)", fill: "both" }
        );
      } else {
        badge.animate([{ opacity: 1 }, { opacity: 0 }], { duration: t, fill: "both" });
      }
      $(".intro-glow").animate([{ opacity: 0.35 }, { opacity: 0 }], { duration: t * 0.5, fill: "both" });
      el.animate([{ backgroundColor: "rgba(254,245,240,1)" }, { backgroundColor: "rgba(254,245,240,0)" }], {
        duration: t,
        delay: t * 0.25,
        fill: "both",
      });
      [".intro-wash", ".intro-scene", ".intro-skip"].forEach((s) =>
        $(s).animate([{ opacity: getComputedStyle($(s)).opacity }, { opacity: 0 }], { duration: t * 0.6, fill: "both" })
      );
      setTimeout(done, t + t * 0.25);
    }

    function done() {
      headerLogo && headerLogo.classList.remove("is-intro-hidden");
      document.body.classList.remove("no-scroll");
      el.remove();
      finish();
    }

    // skip: hurry the timeline to the formed badge, then land
    function skip() {
      if (landed) return;
      anims.forEach((a) => a.finish());
      land(true);
    }
    const timer = setTimeout(() => land(false), 3000);
    $(".intro-skip").addEventListener("click", (e) => {
      e.stopPropagation();
      clearTimeout(timer);
      skip();
    });
    el.addEventListener("click", () => {
      clearTimeout(timer);
      skip();
    });
    window.addEventListener(
      "keydown",
      () => {
        clearTimeout(timer);
        skip();
      },
      { once: true }
    );
  });
})();
