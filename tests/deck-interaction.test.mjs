import assert from "node:assert/strict";
import test from "node:test";

import {
  createDeckKeyboardHandler,
  findDeckScrollRoot,
  getIntersectingSlideIndexes,
  getKeyboardAction,
  getVisibleSlideIndex,
  hasActiveSlideChanged,
  resolveScrollSynchronization,
  shouldIgnoreKeyboardEvent,
  updateAriaLiveSlideStatus,
} from "../deck.js";

test("maps forward navigation keys to the next slide", () => {
  for (const key of ["ArrowDown", "ArrowRight", "PageDown", " "]) {
    assert.equal(getKeyboardAction({ key, shiftKey: false }), "next");
  }
});

test("maps backward navigation keys to the previous slide", () => {
  for (const key of ["ArrowUp", "ArrowLeft", "PageUp"]) {
    assert.equal(getKeyboardAction({ key, shiftKey: false }), "previous");
  }

  assert.equal(getKeyboardAction({ key: " ", shiftKey: true }), "previous");
});

test("maps Home and End to presentation boundaries", () => {
  assert.equal(getKeyboardAction({ key: "Home" }), "first");
  assert.equal(getKeyboardAction({ key: "End" }), "last");
});

test("returns no action for unrelated keys", () => {
  assert.equal(getKeyboardAction({ key: "Enter" }), null);
  assert.equal(getKeyboardAction({ key: "Escape" }), null);
  assert.equal(getKeyboardAction({}), null);
});

test("ignores keyboard events from editable targets", () => {
  for (const tagName of ["INPUT", "TEXTAREA", "SELECT"]) {
    assert.equal(
      shouldIgnoreKeyboardEvent({ target: { tagName } }),
      true,
    );
  }

  assert.equal(
    shouldIgnoreKeyboardEvent({
      target: { tagName: "DIV", isContentEditable: true },
    }),
    true,
  );
});

test("allows presentation keys when a deck button retains focus", () => {
  assert.equal(
    shouldIgnoreKeyboardEvent({
      key: "ArrowRight",
      target: { tagName: "BUTTON" },
    }),
    false,
  );
  assert.equal(
    shouldIgnoreKeyboardEvent({
      key: "End",
      target: { tagName: "BUTTON" },
    }),
    false,
  );
});

test("preserves native Space activation for a focused button", () => {
  assert.equal(
    shouldIgnoreKeyboardEvent({
      key: " ",
      target: { tagName: "BUTTON" },
    }),
    true,
  );
});

test("ignores repeated keyboard events", () => {
  assert.equal(
    shouldIgnoreKeyboardEvent({
      key: "ArrowRight",
      repeat: true,
      target: { tagName: "BODY" },
    }),
    true,
  );
});

test("ignores keyboard shortcuts with command modifiers", () => {
  assert.equal(shouldIgnoreKeyboardEvent({ altKey: true }), true);
  assert.equal(shouldIgnoreKeyboardEvent({ ctrlKey: true }), true);
  assert.equal(shouldIgnoreKeyboardEvent({ metaKey: true }), true);
});

test("allows unmodified navigation events outside editable targets", () => {
  assert.equal(
    shouldIgnoreKeyboardEvent({
      target: { tagName: "BODY", isContentEditable: false },
    }),
    false,
  );
  assert.equal(shouldIgnoreKeyboardEvent({ shiftKey: true }), false);
});

test("button-focused ArrowRight advances exactly once through the controller", () => {
  const navigatedIndices = [];
  let preventedCount = 0;
  const handleKeydown = createDeckKeyboardHandler({
    getActiveIndex: () => 1,
    getSlideCount: () => 16,
    navigateTo: (index) => navigatedIndices.push(index),
  });

  const handled = handleKeydown({
    key: "ArrowRight",
    repeat: false,
    target: { tagName: "BUTTON" },
    preventDefault: () => {
      preventedCount += 1;
    },
  });

  assert.equal(handled, true);
  assert.deepEqual(navigatedIndices, [2]);
  assert.equal(preventedCount, 1);
});

test("controller preserves button Space and suppresses held keys", () => {
  const navigatedIndices = [];
  let preventedCount = 0;
  const handleKeydown = createDeckKeyboardHandler({
    getActiveIndex: () => 1,
    getSlideCount: () => 16,
    navigateTo: (index) => navigatedIndices.push(index),
  });
  const button = { tagName: "BUTTON" };

  assert.equal(
    handleKeydown({
      key: " ",
      repeat: false,
      target: button,
      preventDefault: () => {
        preventedCount += 1;
      },
    }),
    false,
  );
  assert.equal(
    handleKeydown({
      key: "ArrowRight",
      repeat: true,
      target: button,
      preventDefault: () => {
        preventedCount += 1;
      },
    }),
    false,
  );

  assert.deepEqual(navigatedIndices, []);
  assert.equal(preventedCount, 0);
});

test("active-slide status updates only when the index changes", () => {
  assert.equal(hasActiveSlideChanged(2, 2), false);
  assert.equal(hasActiveSlideChanged(2, 3), true);
  assert.equal(hasActiveSlideChanged(null, 0), true);
});

test("aria-live status writes exactly once for a newly active slide", () => {
  let statusText = "03";
  let writeCount = 0;
  const statusElement = {
    get textContent() {
      return statusText;
    },
    set textContent(value) {
      statusText = value;
      writeCount += 1;
    },
  };

  assert.equal(updateAriaLiveSlideStatus(statusElement, 2, 2), false);
  assert.equal(writeCount, 0);
  assert.equal(statusText, "03");

  assert.equal(updateAriaLiveSlideStatus(statusElement, 2, 3), true);
  assert.equal(writeCount, 1);
  assert.equal(statusText, "04");
});

test("uses the deck element as the presentation scroll root", () => {
  const deck = { id: "deck" };
  const documentRoot = {
    querySelector(selector) {
      return selector === ".deck" ? deck : null;
    },
  };

  assert.equal(findDeckScrollRoot(documentRoot), deck);
  assert.equal(findDeckScrollRoot({ querySelector: () => null }), null);
});

test("finds the visible slide relative to the deck viewport", () => {
  const rootBounds = { top: 120, height: 600 };
  const slideBounds = [
    { top: -480, height: 600 },
    { top: 120, height: 600 },
    { top: 720, height: 600 },
  ];

  assert.equal(getVisibleSlideIndex(slideBounds, rootBounds), 1);
});

test("reveals every slide intersecting the deck viewport during scrolling", () => {
  const rootBounds = { top: 100, height: 600 };
  const slideBounds = [
    { top: -400, height: 600 },
    { top: 200, height: 600 },
    { top: 800, height: 600 },
  ];

  assert.deepEqual(
    getIntersectingSlideIndexes(slideBounds, rootBounds),
    [0, 1],
  );
});

test("keeps a navigation target locked through intermediate slides", () => {
  assert.deepEqual(
    resolveScrollSynchronization({
      visibleIndex: 7,
      navigationTargetIndex: 15,
      targetHasArrived: false,
    }),
    {
      activeIndex: 15,
      navigationTargetIndex: 15,
    },
  );
});

test("releases a navigation target only after that exact slide arrives", () => {
  assert.deepEqual(
    resolveScrollSynchronization({
      visibleIndex: 14,
      navigationTargetIndex: 15,
      targetHasArrived: false,
    }),
    {
      activeIndex: 15,
      navigationTargetIndex: 15,
    },
  );

  assert.deepEqual(
    resolveScrollSynchronization({
      visibleIndex: 15,
      navigationTargetIndex: 15,
      targetHasArrived: true,
    }),
    {
      activeIndex: 15,
      navigationTargetIndex: null,
    },
  );
});

test("manual scrolling activates the newly visible slide without a lock", () => {
  assert.deepEqual(
    resolveScrollSynchronization({
      visibleIndex: 2,
      navigationTargetIndex: null,
      targetHasArrived: false,
    }),
    {
      activeIndex: 2,
      navigationTargetIndex: null,
    },
  );
});
