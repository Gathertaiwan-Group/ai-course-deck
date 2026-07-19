import {
  calculateProgress,
  clampSlideIndex,
  formatSlideHash,
  parseSlideHash,
} from "./deck-state.js";

const EDITABLE_TAGS = new Set(["INPUT", "SELECT", "TEXTAREA"]);
const NATIVE_BUTTON_KEYS = new Set([" ", "Enter", "Spacebar"]);

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
  if (event?.altKey || event?.ctrlKey || event?.metaKey || event?.repeat) {
    return true;
  }

  const target = event?.target;

  if (!target) {
    return false;
  }

  if (EDITABLE_TAGS.has(target.tagName) || target.isContentEditable) {
    return true;
  }

  const isInsideEditableTarget = Boolean(
    target.closest?.(
      '[contenteditable]:not([contenteditable="false"]), input, textarea, select',
    ),
  );

  if (isInsideEditableTarget) {
    return true;
  }

  const isButton =
    target.tagName === "BUTTON" ||
    Boolean(target.closest?.("button"));

  return isButton && NATIVE_BUTTON_KEYS.has(event?.key);
}

export function createDeckKeyboardHandler({
  getActiveIndex,
  getSlideCount,
  navigateTo,
}) {
  return (event) => {
    if (shouldIgnoreKeyboardEvent(event)) {
      return false;
    }

    const action = getKeyboardAction(event);

    if (!action) {
      return false;
    }

    const activeIndex = getActiveIndex();
    const slideCount = getSlideCount();
    let targetIndex = activeIndex;

    if (action === "first") {
      targetIndex = 0;
    } else if (action === "last") {
      targetIndex = slideCount - 1;
    } else if (action === "previous") {
      targetIndex = activeIndex - 1;
    } else {
      targetIndex = activeIndex + 1;
    }

    event.preventDefault?.();
    navigateTo(clampSlideIndex(targetIndex, slideCount));
    return true;
  };
}

export function hasActiveSlideChanged(currentIndex, nextIndex) {
  return currentIndex !== nextIndex;
}

export function updateAriaLiveSlideStatus(
  statusElement,
  currentIndex,
  nextIndex,
) {
  if (
    !statusElement ||
    !hasActiveSlideChanged(currentIndex, nextIndex)
  ) {
    return false;
  }

  statusElement.textContent = String(nextIndex + 1).padStart(2, "0");
  return true;
}

export function findDeckScrollRoot(documentRoot) {
  return documentRoot?.querySelector?.(".deck") ?? null;
}

export function getIntersectingSlideIndexes(slideBounds, rootBounds) {
  if (!Array.isArray(slideBounds) || !rootBounds) {
    return [];
  }

  const rootTop = rootBounds.top;
  const rootBottom = rootTop + rootBounds.height;

  return slideBounds.flatMap((bounds, index) => {
    const slideBottom = bounds.top + bounds.height;
    const intersects = bounds.top < rootBottom && slideBottom > rootTop;

    return intersects ? [index] : [];
  });
}

export function getVisibleSlideIndex(slideBounds, rootBounds) {
  if (!Array.isArray(slideBounds) || slideBounds.length === 0 || !rootBounds) {
    return 0;
  }

  const rootCenter = rootBounds.top + rootBounds.height / 2;
  let closestIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;

  slideBounds.forEach((bounds, index) => {
    const slideCenter = bounds.top + bounds.height / 2;
    const distance = Math.abs(slideCenter - rootCenter);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  return closestIndex;
}

export function resolveScrollSynchronization({
  visibleIndex,
  navigationTargetIndex,
  targetHasArrived,
}) {
  if (navigationTargetIndex !== null && !targetHasArrived) {
    return {
      activeIndex: navigationTargetIndex,
      navigationTargetIndex,
    };
  }

  return {
    activeIndex: visibleIndex,
    navigationTargetIndex: null,
  };
}

function initializeDeck() {
  const slides = Array.from(document.querySelectorAll(".slide"));
  const scrollRoot = findDeckScrollRoot(document);

  if (slides.length === 0 || !scrollRoot) {
    return;
  }

  document.documentElement.classList.add("js");

  const progressBar = document.querySelector("[data-progress-bar]");
  const dotNav = document.querySelector("[data-dot-nav]");
  const currentSlideStatus = document.querySelector("[data-current-slide]");
  const totalSlidesStatus = document.querySelector("[data-total-slides]");
  const reducedMotionQuery = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  );
  const dotButtons = [];
  let activeIndex = null;
  let navigationTargetIndex = null;
  let navigationFallbackTimer = 0;
  let scrollFrame = 0;

  const prefersReducedMotion = () => reducedMotionQuery?.matches ?? false;

  const releaseNavigationTarget = () => {
    navigationTargetIndex = null;
    window.clearTimeout(navigationFallbackTimer);
    navigationFallbackTimer = 0;
  };

  const updateActiveSlide = (index, revealedIndexes = [index]) => {
    const nextIndex = clampSlideIndex(index, slides.length);
    const revealedSlides = new Set([...revealedIndexes, nextIndex]);
    const previousActiveIndex = activeIndex;
    const activeSlideChanged = hasActiveSlideChanged(
      previousActiveIndex,
      nextIndex,
    );
    activeIndex = nextIndex;

    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", revealedSlides.has(slideIndex));
    });

    if (!activeSlideChanged) {
      return;
    }

    if (progressBar) {
      const progress = calculateProgress(nextIndex, slides.length) / 100;
      progressBar.style.transform = `scaleX(${progress})`;
    }

    updateAriaLiveSlideStatus(
      currentSlideStatus,
      previousActiveIndex,
      nextIndex,
    );

    if (totalSlidesStatus) {
      totalSlidesStatus.textContent = String(slides.length);
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

  const getScrollGeometry = () => {
    const rootBounds = scrollRoot.getBoundingClientRect();
    const slideBounds = slides.map((slide) => slide.getBoundingClientRect());

    return { rootBounds, slideBounds };
  };

  const targetHasArrived = (targetIndex, geometry) => {
    if (targetIndex === null) {
      return false;
    }

    const targetBounds = geometry.slideBounds[targetIndex];

    if (!targetBounds) {
      return false;
    }

    const tolerance = Math.max(2, geometry.rootBounds.height * 0.015);
    const isAtTargetOffset =
      Math.abs(targetBounds.top - geometry.rootBounds.top) <= tolerance;
    const visibleIndex = getVisibleSlideIndex(
      geometry.slideBounds,
      geometry.rootBounds,
    );

    return visibleIndex === targetIndex && isAtTargetOffset;
  };

  const synchronizeFromScroll = () => {
    scrollFrame = 0;
    const geometry = getScrollGeometry();
    const visibleIndex = getVisibleSlideIndex(
      geometry.slideBounds,
      geometry.rootBounds,
    );
    const revealedIndexes = getIntersectingSlideIndexes(
      geometry.slideBounds,
      geometry.rootBounds,
    );
    const synchronization = resolveScrollSynchronization({
      visibleIndex,
      navigationTargetIndex,
      targetHasArrived: targetHasArrived(navigationTargetIndex, geometry),
    });

    if (
      navigationTargetIndex !== null &&
      synchronization.navigationTargetIndex === null
    ) {
      releaseNavigationTarget();
    }

    navigationTargetIndex = synchronization.navigationTargetIndex;
    updateActiveSlide(synchronization.activeIndex, revealedIndexes);
  };

  const scheduleScrollSynchronization = () => {
    if (scrollFrame) {
      return;
    }

    scrollFrame = window.requestAnimationFrame(synchronizeFromScroll);
  };

  const enforceNavigationTarget = () => {
    if (navigationTargetIndex === null) {
      return;
    }

    const targetSlide = slides[navigationTargetIndex];

    if (!targetSlide) {
      releaseNavigationTarget();
      return;
    }

    targetSlide.scrollIntoView({ behavior: "auto", block: "start" });
    window.requestAnimationFrame(synchronizeFromScroll);
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
      window.requestAnimationFrame(synchronizeFromScroll);
      return;
    }

    navigationFallbackTimer = window.setTimeout(
      enforceNavigationTarget,
      1800,
    );
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

  const handleKeydown = createDeckKeyboardHandler({
    getActiveIndex: () => activeIndex,
    getSlideCount: () => slides.length,
    navigateTo,
  });
  document.addEventListener("keydown", handleKeydown);

  scrollRoot.addEventListener("scroll", scheduleScrollSynchronization, {
    passive: true,
  });
  scrollRoot.addEventListener("scrollend", () => {
    synchronizeFromScroll();

    if (navigationTargetIndex !== null) {
      enforceNavigationTarget();
    }
  });
  window.addEventListener("resize", scheduleScrollSynchronization, {
    passive: true,
  });
  window.addEventListener("hashchange", () => {
    navigateFromHash({ instant: prefersReducedMotion() });
  });

  if ("IntersectionObserver" in window) {
    const observer = new window.IntersectionObserver(
      scheduleScrollSynchronization,
      {
        root: scrollRoot,
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );
    slides.forEach((slide) => observer.observe(slide));
  }

  if (!navigateFromHash({ instant: true })) {
    const geometry = getScrollGeometry();
    const visibleIndex = getVisibleSlideIndex(
      geometry.slideBounds,
      geometry.rootBounds,
    );
    updateActiveSlide(
      visibleIndex,
      getIntersectingSlideIndexes(
        geometry.slideBounds,
        geometry.rootBounds,
      ),
    );
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
