import {
  calculateProgress,
  clampSlideIndex,
  formatSlideHash,
  parseSlideHash,
} from "./deck-state.js";

const INTERACTIVE_TAGS = new Set([
  "A",
  "BUTTON",
  "INPUT",
  "SELECT",
  "TEXTAREA",
]);

export function getKeyboardAction(event) {
  switch (event?.key) {
    case "ArrowDown":
    case "ArrowRight":
    case "PageDown":
      return "next";
    case "ArrowUp":
    case "ArrowLeft":
    case "PageUp":
      return "previous";
    case "Home":
      return "first";
    case "End":
      return "last";
    case " ":
    case "Spacebar":
      return event.shiftKey ? "previous" : "next";
    default:
      return null;
  }
}

export function shouldIgnoreKeyboardEvent(event) {
  if (event?.altKey || event?.ctrlKey || event?.metaKey) {
    return true;
  }

  const target = event?.target;

  if (!target) {
    return false;
  }

  if (INTERACTIVE_TAGS.has(target.tagName) || target.isContentEditable) {
    return true;
  }

  return Boolean(
    target.closest?.(
      'a, button, [contenteditable]:not([contenteditable="false"]), input, textarea, select',
    ),
  );
}

function initializeDeck() {
  const slides = Array.from(document.querySelectorAll(".slide"));

  if (slides.length === 0) {
    return;
  }

  document.documentElement.classList.add("js");

  const progressBar = document.querySelector("[data-progress-bar]");
  const dotNav = document.querySelector("[data-dot-nav]");
  const currentSlideStatus = document.querySelector("[data-current-slide]");
  const totalSlidesStatus = document.querySelector("[data-total-slides]");
  const previousButton = document.querySelector("[data-deck-previous]");
  const nextButton = document.querySelector("[data-deck-next]");
  const reducedMotionQuery = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  );
  const dotButtons = [];
  let activeIndex = 0;
  let navigationTargetIndex = null;
  let navigationReleaseTimer = 0;
  let scrollFrame = 0;

  const prefersReducedMotion = () => reducedMotionQuery?.matches ?? false;

  const releaseNavigationTarget = () => {
    navigationTargetIndex = null;
    window.clearTimeout(navigationReleaseTimer);
    navigationReleaseTimer = 0;
  };

  const updateActiveSlide = (index) => {
    const nextIndex = clampSlideIndex(index, slides.length);
    activeIndex = nextIndex;

    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === nextIndex);
    });

    if (progressBar) {
      const progress = calculateProgress(nextIndex, slides.length) / 100;
      progressBar.style.transform = `scaleX(${progress})`;
    }

    if (currentSlideStatus) {
      currentSlideStatus.textContent = String(nextIndex + 1).padStart(2, "0");
    }

    if (totalSlidesStatus) {
      totalSlidesStatus.textContent = String(slides.length);
    }

    if (previousButton) {
      previousButton.disabled = nextIndex === 0;
    }

    if (nextButton) {
      nextButton.disabled = nextIndex === slides.length - 1;
    }

    dotButtons.forEach((button, buttonIndex) => {
      if (buttonIndex === nextIndex) {
        button.setAttribute("aria-current", "true");
      } else {
        button.removeAttribute("aria-current");
      }
    });

    const nextHash = formatSlideHash(nextIndex);

    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, "", nextHash);
    }
  };

  const closestSlideIndex = () => {
    const viewportCenter = window.innerHeight / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    slides.forEach((slide, index) => {
      const bounds = slide.getBoundingClientRect();
      const slideCenter = bounds.top + bounds.height / 2;
      const distance = Math.abs(slideCenter - viewportCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  };

  const synchronizeFromScroll = () => {
    scrollFrame = 0;
    const closestIndex = closestSlideIndex();

    if (navigationTargetIndex !== null) {
      if (closestIndex !== navigationTargetIndex) {
        return;
      }

      releaseNavigationTarget();
    }

    if (closestIndex !== activeIndex) {
      updateActiveSlide(closestIndex);
    }
  };

  const scheduleScrollSynchronization = () => {
    if (scrollFrame) {
      return;
    }

    scrollFrame = window.requestAnimationFrame(synchronizeFromScroll);
  };

  const navigateTo = (index, options = {}) => {
    const nextIndex = clampSlideIndex(index, slides.length);
    const targetSlide = slides[nextIndex];

    if (!targetSlide) {
      return;
    }

    releaseNavigationTarget();
    navigationTargetIndex = nextIndex;
    updateActiveSlide(nextIndex);

    const behavior =
      options.instant || prefersReducedMotion() ? "auto" : "smooth";

    targetSlide.scrollIntoView({ behavior, block: "start" });

    if (behavior === "auto") {
      releaseNavigationTarget();
      window.requestAnimationFrame(synchronizeFromScroll);
      return;
    }

    navigationReleaseTimer = window.setTimeout(() => {
      releaseNavigationTarget();
      scheduleScrollSynchronization();
    }, 900);
  };

  const navigateFromHash = (options = {}) => {
    const parsedIndex = parseSlideHash(window.location.hash);

    if (parsedIndex === null) {
      return false;
    }

    navigateTo(parsedIndex, options);
    return true;
  };

  if (dotNav) {
    const fragment = document.createDocumentFragment();

    slides.forEach((slide, index) => {
      const button = document.createElement("button");
      const label = slide.dataset.label?.trim() || `投影片 ${index + 1}`;

      button.type = "button";
      button.setAttribute(
        "aria-label",
        `前往第 ${index + 1} 張投影片：${label}`,
      );
      button.addEventListener("click", () => navigateTo(index));
      dotButtons.push(button);
      fragment.append(button);
    });

    dotNav.replaceChildren(fragment);
  }

  previousButton?.addEventListener("click", () => {
    navigateTo(activeIndex - 1);
  });

  nextButton?.addEventListener("click", () => {
    navigateTo(activeIndex + 1);
  });

  document.addEventListener("keydown", (event) => {
    if (shouldIgnoreKeyboardEvent(event)) {
      return;
    }

    const action = getKeyboardAction(event);

    if (!action) {
      return;
    }

    event.preventDefault();

    if (action === "first") {
      navigateTo(0);
    } else if (action === "last") {
      navigateTo(slides.length - 1);
    } else if (action === "previous") {
      navigateTo(activeIndex - 1);
    } else {
      navigateTo(activeIndex + 1);
    }
  });

  window.addEventListener("scroll", scheduleScrollSynchronization, {
    passive: true,
  });
  window.addEventListener("resize", scheduleScrollSynchronization, {
    passive: true,
  });
  window.addEventListener("hashchange", () => {
    navigateFromHash({ instant: prefersReducedMotion() });
  });

  if (!navigateFromHash({ instant: true })) {
    updateActiveSlide(closestSlideIndex());
  }
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeDeck, {
      once: true,
    });
  } else {
    initializeDeck();
  }
}
