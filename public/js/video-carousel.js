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
  const imageDuration = 5000;

  let index = 0;
  let inView = false;
  // starts playing on every device (also with "reduce motion" on: the owner wants the videos to run)
  let userPaused = false;
  // set when the browser refuses to autoplay (e.g. iPhone Low Power Mode); the first tap anywhere retries
  let autoplayBlocked = false;
  let pointerStart = null;
  let imageTimer = null;

  function currentVideo() {
    return slides[index].querySelector("video");
  }

  function loadVideo(video) {
    if (!video || video.getAttribute("src")) return;
    // muted + inline are what phones require before they allow a video to play by itself
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.preload = "auto";
    video.src = video.dataset.src;
    video.load();
  }

  /** Start loading the slide after this one, so the next video is ready when its turn comes. */
  function preloadNext() {
    const next = slides[(index + 1) % slides.length].querySelector("video");
    loadVideo(next);
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
    const attempt = video.play();
    if (!attempt || !attempt.then) return setPausedState(false);
    attempt
      .then(() => {
        autoplayBlocked = false;
        setPausedState(false);
        preloadNext();
      })
      .catch(() => {
        // the browser would not autoplay: keep the slideshow going on the poster image,
        // and play for real as soon as the visitor taps anywhere on the page
        autoplayBlocked = true;
        setPausedState(false);
        imageTimer = window.setTimeout(() => show(index + 1), imageDuration);
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

  // the first tap / click / key anywhere counts as permission to play: retry a blocked video then
  const unlock = () => {
    if (autoplayBlocked && !userPaused) playCurrent();
  };
  ["touchstart", "pointerdown", "keydown"].forEach((type) =>
    document.addEventListener(type, unlock, { passive: true, capture: true })
  );

  // load the first video straight away so it is ready the moment the slideshow reaches it
  loadVideo(slides.map((s) => s.querySelector("video")).find(Boolean));

  setPausedState(userPaused);
})();
