function normalizeTotal(total) {
  if (!Number.isFinite(total) || total <= 0) {
    return 0;
  }

  return Math.floor(total);
}

function normalizeIndex(index) {
  if (!Number.isFinite(index)) {
    return 0;
  }

  return Math.trunc(index);
}

export function clampSlideIndex(index, total) {
  const normalizedTotal = normalizeTotal(total);

  if (normalizedTotal === 0) {
    return 0;
  }

  return Math.min(Math.max(normalizeIndex(index), 0), normalizedTotal - 1);
}

export function calculateProgress(index, total) {
  const normalizedTotal = normalizeTotal(total);

  if (normalizedTotal === 0) {
    return 0;
  }

  return ((clampSlideIndex(index, normalizedTotal) + 1) / normalizedTotal) * 100;
}

export function formatSlideHash(index) {
  return `#slide-${Math.max(normalizeIndex(index), 0) + 1}`;
}

export function parseSlideHash(hash) {
  if (typeof hash !== "string") {
    return null;
  }

  const match = /^#slide-([1-9]\d*)$/.exec(hash);

  if (!match) {
    return null;
  }

  const slideNumber = Number(match[1]);

  if (!Number.isSafeInteger(slideNumber)) {
    return null;
  }

  return slideNumber - 1;
}
