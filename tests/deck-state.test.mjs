import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";

const deckStateUrl = new URL("../deck-state.js", import.meta.url);

async function loadDeckState() {
  try {
    await access(deckStateUrl);
  } catch (error) {
    if (error?.code === "ENOENT") {
      assert.fail("deck-state.js must exist before navigation behavior can pass");
    }

    throw error;
  }

  return import(deckStateUrl);
}

test("clamps slide indices to the available 19-slide range", async () => {
  const { clampSlideIndex } = await loadDeckState();

  assert.equal(clampSlideIndex(-1, 19), 0);
  assert.equal(clampSlideIndex(9, 19), 9);
  assert.equal(clampSlideIndex(19, 19), 18);
});

test("calculates progress for the first, middle, and last of 19 slides", async () => {
  const { calculateProgress } = await loadDeckState();

  assert.equal(calculateProgress(0, 19), (1 / 19) * 100);
  assert.equal(calculateProgress(9, 19), (10 / 19) * 100);
  assert.equal(calculateProgress(18, 19), 100);
});

test("calculates progress from clamped out-of-range slide indices", async () => {
  const { calculateProgress } = await loadDeckState();

  assert.equal(calculateProgress(-4, 19), (1 / 19) * 100);
  assert.equal(calculateProgress(42, 19), 100);
});

test("formats zero-based slide indices as one-based slide hashes", async () => {
  const { formatSlideHash } = await loadDeckState();

  assert.equal(formatSlideHash(0), "#slide-1");
  assert.equal(formatSlideHash(12), "#slide-13");
  assert.equal(formatSlideHash(15), "#slide-16");
});

test("parses valid slide hashes and rejects malformed hashes", async () => {
  const { parseSlideHash } = await loadDeckState();

  assert.equal(parseSlideHash("#slide-1"), 0);
  assert.equal(parseSlideHash("#slide-13"), 12);
  assert.equal(parseSlideHash("#slide-16"), 15);
  assert.equal(parseSlideHash("#slide-0"), null);
  assert.equal(parseSlideHash("#slide-seventeen"), null);
  assert.equal(parseSlideHash("#chapter-1"), null);
});
