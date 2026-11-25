(function () {
  const root = document.querySelector("[data-video-carousel]");
  if (!root) return;

  const track = root.querySelector(".story-carousel-track");
  const viewport = root.querySelector(".story-carousel-viewport");
  const slides = [...root.querySelectorAll(".story-slide")];
  const dots = [...root.querySelectorAll("[data-slide-to]")];
  const toggle = root.querySelector("[data-carousel-toggle]");
  const toggleLabel = root.querySelector("[data-toggle-label]");
  const status = root.querySelector("[data-carousel-status]");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const imageDuration = 5000;

  let index = 0;
  let inView = false;
  let userPaused = reduceMotion;
  let pointerStart = null;
  let imageTimer = null;

  function currentVideo() {
    return slides[index].querySelector("video");
  }

  function loadVideo(video) {
    if (!video || video.src) return;
    video.src = video.dataset.src;
    video.load();
  }

  function clearImageTimer() {
    window.clearTimeout(imageTimer);
    imageTimer = null;
  }

  function setPausedState(paused) {
    root.classList.toggle("is-paused", paused);
    toggleLabel.textContent = paused ? "Play" : "Pause";
    toggle.setAttribute("aria-label", paused ? "Play hero carousel" : "Pause hero carousel");
  }

  function pauseCurrent() {
    clearImageTimer();
    currentVideo()?.pause();
    setPausedState(true);
  }

  function playCurrent() {
    clearImageTimer();
    if (!inView || userPaused) {
      setPausedState(true);
      return;
    }

    const video = currentVideo();
    if (!video) {
      imageTimer = window.setTimeout(() => show(index + 1), imageDuration);
      setPausedState(false);
      return;
    }

    loadVideo(video);
    video.play().then(() => setPausedState(false)).catch(() => {
      userPaused = true;
      setPausedState(true);
    });
  }

  function show(nextIndex) {
    clearImageTimer();
    const previousVideo = currentVideo();
    previousVideo?.pause();
    if (previousVideo?.ended) previousVideo.currentTime = 0;

    index = (nextIndex + slides.length) % slides.length;
    track.style.setProperty("--story-slide", index);

    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === index;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
    });
    dots.forEach((dot, dotIndex) => {
      const active = dotIndex === index;
      dot.classList.toggle("is-active", active);
      if (active) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });

    status.textContent = `Slide ${index + 1} of ${slides.length}`;
    loadVideo(currentVideo());
    playCurrent();
  }

  root.querySelector("[data-carousel-prev]").addEventListener("click", () => show(index - 1));
  root.querySelector("[data-carousel-next]").addEventListener("click", () => show(index + 1));
  dots.forEach((dot) => dot.addEventListener("click", () => show(Number(dot.dataset.slideTo))));

  toggle.addEventListener("click", () => {
    userPaused = !userPaused;
    if (userPaused) pauseCurrent();
    else playCurrent();
  });

  slides.forEach((slide, slideIndex) => {
    const video = slide.querySelector("video");
    if (!video) return;
    video.addEventListener("ended", () => slideIndex === index && show(index + 1));
    video.addEventListener("click", () => {
      userPaused = !video.paused;
      if (userPaused) pauseCurrent();
      else playCurrent();
    });
  });

  root.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      show(index - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      show(index + 1);
    }
  });

  viewport.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse") return;
    pointerStart = { x: event.clientX, y: event.clientY };
  });
  viewport.addEventListener("pointerup", (event) => {
    if (!pointerStart) return;
    const dx = event.clientX - pointerStart.x;
    const dy = event.clientY - pointerStart.y;
    pointerStart = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.2) show(index + (dx < 0 ? 1 : -1));
  });
  viewport.addEventListener("pointercancel", () => (pointerStart = null));

  const observer = new IntersectionObserver(
    ([entry]) => {
      inView = entry.isIntersecting;
      if (inView) playCurrent();
      else pauseCurrent();
    },
    { threshold: 0.35 }
  );
  observer.observe(root);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseCurrent();
    else playCurrent();
  });

  setPausedState(userPaused);
})();
