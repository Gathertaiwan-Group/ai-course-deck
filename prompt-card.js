const COPY_IDLE_LABEL = "複製";
const COPY_DONE_LABEL = "已複製 ✓";
const COPY_FAIL_LABEL = "請手動選取";
const COPY_RESET_DELAY = 2000;
const SPEAKER_NOTE_STORAGE_KEY = "deck-speaker-notes";
const SPEAKER_NOTE_CLASS = "show-speaker-notes";

const EDITABLE_TAGS = new Set(["INPUT", "SELECT", "TEXTAREA"]);
const resetTimers = new WeakMap();

export function findPromptSource(button, root = document) {
  const targetId = button?.dataset?.copyTarget;

  if (!targetId) {
    return null;
  }

  return root.getElementById?.(targetId) ?? null;
}

export function readPromptText(source) {
  if (!source) {
    return "";
  }

  return (source.textContent ?? "").replace(/ /g, " ").trim();
}

function setButtonLabel(button, label) {
  button.textContent = label;

  const pending = resetTimers.get(button);

  if (pending) {
    clearTimeout(pending);
  }

  if (label === COPY_IDLE_LABEL) {
    return;
  }

  resetTimers.set(
    button,
    setTimeout(() => {
      button.textContent = COPY_IDLE_LABEL;
      button.classList.remove("is-copied");
      resetTimers.delete(button);
    }, COPY_RESET_DELAY),
  );
}

function selectSource(source) {
  const selection = window.getSelection?.();

  if (!selection || typeof document.createRange !== "function") {
    return;
  }

  const range = document.createRange();

  range.selectNodeContents(source);
  selection.removeAllRanges();
  selection.addRange(range);
}

function legacyCopy(source) {
  selectSource(source);

  try {
    return document.execCommand?.("copy") === true;
  } catch {
    return false;
  }
}

async function copyPrompt(button) {
  const source = findPromptSource(button);
  const text = readPromptText(source);

  if (!text) {
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    button.classList.add("is-copied");
    setButtonLabel(button, COPY_DONE_LABEL);
    return;
  } catch {
    /* 瀏覽器擋下剪貼簿 API 時，改走選取加舊版複製指令 */
  }

  if (legacyCopy(source)) {
    button.classList.add("is-copied");
    setButtonLabel(button, COPY_DONE_LABEL);
    return;
  }

  setButtonLabel(button, COPY_FAIL_LABEL);
}

export function shouldIgnoreShortcut(event) {
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

  return Boolean(
    target.closest?.(
      '[contenteditable]:not([contenteditable="false"]), input, textarea, select',
    ),
  );
}

function readStoredNoteState() {
  try {
    return window.localStorage?.getItem(SPEAKER_NOTE_STORAGE_KEY) === "on";
  } catch {
    return false;
  }
}

function writeStoredNoteState(isVisible) {
  try {
    window.localStorage?.setItem(
      SPEAKER_NOTE_STORAGE_KEY,
      isVisible ? "on" : "off",
    );
  } catch {
    /* 無痕視窗或封鎖儲存時忽略，僅影響記憶偏好 */
  }
}

function applySpeakerNoteState(isVisible) {
  document.body.classList.toggle(SPEAKER_NOTE_CLASS, isVisible);

  for (const note of document.querySelectorAll(".speaker-note")) {
    note.hidden = !isVisible;
  }
}

function initializePromptCards() {
  document.addEventListener("click", (event) => {
    const button = event.target?.closest?.(".prompt-card__copy");

    if (button) {
      copyPrompt(button);
    }
  });

  applySpeakerNoteState(readStoredNoteState());

  document.addEventListener("keydown", (event) => {
    if (shouldIgnoreShortcut(event)) {
      return;
    }

    if (event.key !== "n" && event.key !== "N") {
      return;
    }

    const next = !document.body.classList.contains(SPEAKER_NOTE_CLASS);

    applySpeakerNoteState(next);
    writeStoredNoteState(next);
  });
}

if (typeof document !== "undefined") {
  initializePromptCards();
}
