(() => {
const DEFAULT_SETTINGS: ExtensionSettings = {
  enabled: true,
  intensity: "medium",
};

const VALID_INTENSITIES: FocusIntensity[] = [
  "light",
  "medium",
  "strong",
];

const HIGHLIGHT_NAME = "focusink-token";

const SUPPORTED_SELECTOR = [
  "p",
  "span",
  "li",
  "a",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "figcaption",
  "label",
  "td",
  "th",
  "dt",
  "dd",
].join(",");

const EXCLUDED_SELECTOR = [
  "input",
  "textarea",
  "select",
  "button",
  "script",
  "style",
  "code",
  "pre",
  "canvas",
  "svg",
  "video",
  "audio",
  "[contenteditable='true']",
  "[role='button']",
  "[aria-hidden='true']",
].join(",");

const WORD_CHAR_PATTERN = /[\p{L}\p{N}_'-]/u;

let settings: ExtensionSettings =
  DEFAULT_SETTINGS;

const tokenHighlight = new Highlight();
CSS.highlights.set(HIGHLIGHT_NAME, tokenHighlight);

let highlightedNode: Node | null = null;
let highlightedStart = -1;
let highlightedEnd = -1;

function isWordChar(character: string): boolean {
  return WORD_CHAR_PATTERN.test(character);
}

interface TokenBounds {
  start: number;
  end: number;
}

/**
 * Find the start/end offsets of the token surrounding a caret offset
 * within a single text node's data.
 */
function findTokenBounds(
  text: string,
  offset: number,
): TokenBounds | null {
  let index = Math.min(offset, text.length - 1);

  if (index < 0) {
    return null;
  }

  if (!isWordChar(text[index])) {
    if (index > 0 && isWordChar(text[index - 1])) {
      index -= 1;
    } else {
      return null;
    }
  }

  let start = index;

  while (start > 0 && isWordChar(text[start - 1])) {
    start -= 1;
  }

  let end = index + 1;

  while (end < text.length && isWordChar(text[end])) {
    end += 1;
  }

  return { start, end };
}

function isFocusIntensity(
  value: unknown,
): value is FocusIntensity {
  return (
    typeof value === "string" &&
    VALID_INTENSITIES.includes(
      value as FocusIntensity,
    )
  );
}

function normaliseSettings(
  value: unknown,
): ExtensionSettings {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return DEFAULT_SETTINGS;
  }

  const candidate =
    value as Partial<ExtensionSettings>;

  return {
    enabled:
      typeof candidate.enabled === "boolean"
        ? candidate.enabled
        : DEFAULT_SETTINGS.enabled,

    intensity: isFocusIntensity(
      candidate.intensity,
    )
      ? candidate.intensity
      : DEFAULT_SETTINGS.intensity,
  };
}

/**
 * Reflect the current intensity onto the document so content.css can
 * style the highlight pseudo-element per intensity level.
 */
function applyIntensity(
  intensity: FocusIntensity,
): void {
  document.documentElement.dataset.focusinkIntensity =
    intensity;
}

/**
 * Remove the current token highlight, if any.
 */
function clearTokenHighlight(): void {
  if (!highlightedNode) {
    return;
  }

  tokenHighlight.clear();
  highlightedNode = null;
  highlightedStart = -1;
  highlightedEnd = -1;
}

/**
 * Resolve the exact text node and character offset under a viewport point.
 */
function getCaretPosition(
  x: number,
  y: number,
): { node: Node; offset: number } | null {
  if (document.caretPositionFromPoint) {
    const position = document.caretPositionFromPoint(x, y);

    if (!position) {
      return null;
    }

    return { node: position.offsetNode, offset: position.offset };
  }

  if (document.caretRangeFromPoint) {
    const range = document.caretRangeFromPoint(x, y);

    if (!range) {
      return null;
    }

    return { node: range.startContainer, offset: range.startOffset };
  }

  return null;
}

/**
 * Recompute and apply the token highlight for a viewport point.
 */
function updateTokenHighlight(x: number, y: number): void {
  if (!settings.enabled) {
    clearTokenHighlight();
    return;
  }

  const caret = getCaretPosition(x, y);

  if (!caret || caret.node.nodeType !== Node.TEXT_NODE) {
    clearTokenHighlight();
    return;
  }

  const textNode = caret.node;
  const parentElement = textNode.parentElement;

  if (!parentElement) {
    clearTokenHighlight();
    return;
  }

  if (parentElement.closest(EXCLUDED_SELECTOR)) {
    clearTokenHighlight();
    return;
  }

  if (!parentElement.closest(SUPPORTED_SELECTOR)) {
    clearTokenHighlight();
    return;
  }

  const bounds = findTokenBounds(
    textNode.textContent ?? "",
    caret.offset,
  );

  if (!bounds) {
    clearTokenHighlight();
    return;
  }

  if (
    textNode === highlightedNode &&
    bounds.start === highlightedStart &&
    bounds.end === highlightedEnd
  ) {
    return;
  }

  const range = document.createRange();
  range.setStart(textNode, bounds.start);
  range.setEnd(textNode, bounds.end);

  tokenHighlight.clear();
  tokenHighlight.add(range);

  highlightedNode = textNode;
  highlightedStart = bounds.start;
  highlightedEnd = bounds.end;
}

let pendingX = 0;
let pendingY = 0;
let updateScheduled = false;

/**
 * Handle pointer movement, throttled to one update per animation frame.
 */
function handlePointerMove(event: PointerEvent): void {
  pendingX = event.clientX;
  pendingY = event.clientY;

  if (updateScheduled) {
    return;
  }

  updateScheduled = true;

  requestAnimationFrame(() => {
    updateScheduled = false;
    updateTokenHighlight(pendingX, pendingY);
  });
}

/**
 * Clear the highlight once the pointer leaves the page entirely.
 */
function handlePointerOut(event: PointerEvent): void {
  if (event.relatedTarget !== null) {
    return;
  }

  clearTokenHighlight();
}

function handleWindowBlur(): void {
  clearTokenHighlight();
}

function handleVisibilityChange(): void {
  if (document.hidden) {
    clearTokenHighlight();
  }
}

function handleStorageChange(
  changes: {
    [key: string]: chrome.storage.StorageChange;
  },
  areaName: string,
): void {
  if (
    areaName !== "sync" ||
    !changes.settings
  ) {
    return;
  }

  settings = normaliseSettings(
    changes.settings.newValue,
  );

  applyIntensity(settings.intensity);

  if (!settings.enabled) {
    clearTokenHighlight();
  }
}

async function initialise(): Promise<void> {
  try {
    const stored =
      await chrome.storage.sync.get({
        settings: DEFAULT_SETTINGS,
      });

    settings = normaliseSettings(
      stored.settings,
    );
  } catch (error) {
    console.error(
      "[FocusInk] Failed to load settings:",
      error,
    );

    settings = DEFAULT_SETTINGS;
  }

  applyIntensity(settings.intensity);

  document.addEventListener(
    "pointermove",
    handlePointerMove,
  );

  document.addEventListener(
    "pointerout",
    handlePointerOut,
  );

  window.addEventListener(
    "blur",
    handleWindowBlur,
  );

  document.addEventListener(
    "visibilitychange",
    handleVisibilityChange,
  );

  chrome.storage.onChanged.addListener(
    handleStorageChange,
  );

  console.log(
    "[FocusInk] Initialised with settings:",
    settings,
  );
}

void initialise();
})();
