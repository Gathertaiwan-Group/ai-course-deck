import assert from "node:assert/strict";
import test from "node:test";

import {
  getKeyboardAction,
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
