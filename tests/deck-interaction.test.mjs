import assert from "node:assert/strict";
import test from "node:test";

import {
  findDeckScrollRoot,
  getIntersectingSlideIndexes,
  getKeyboardAction,
  getVisibleSlideIndex,
  resolveScrollSynchronization,
  shouldIgnoreKeyboardEvent,
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

test("ignores keyboard events handled by interactive controls", () => {
  for (const tagName of ["BUTTON", "A"]) {
    assert.equal(
      shouldIgnoreKeyboardEvent({ target: { tagName } }),
      true,
    );
  }
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
