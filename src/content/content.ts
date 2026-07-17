(() => {
const DEFAULT_SETTINGS: ExtensionSettings = {
  enabled: true,
  intensity: "medium",
  color: "#ffe564",
  saturation: 100,
  mode: "token",
};

const INTENSITY_ALPHA: Record<FocusIntensity, number> = {
  light: 16,
  medium: 28,
  strong: 42,
};

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

const VALID_INTENSITIES: FocusIntensity[] = [
  "light",
  "medium",
  "strong",
];

const VALID_MODES: FocusMode[] = ["token", "paragraph"];

const HIGHLIGHT_NAME = "focusink-highlight";

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

const activeHighlight = new Highlight();
CSS.highlights.set(HIGHLIGHT_NAME, activeHighlight);

// Token mode state: the exact text node/offsets currently highlighted.
let highlightedNode: Node | null = null;
let highlightedStart = -1;
let highlightedEnd = -1;

// Paragraph mode state: the whole element currently highlighted.
let highlightedElement: HTMLElement | null = null;

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

/**
 * Find the nearest readable ancestor element for paragraph mode.
 */
function findReadableElement(
  target: Element,
): HTMLElement | null {
  if (target.closest(EXCLUDED_SELECTOR)) {
    return null;
  }

  const readableElement =
    target.closest<HTMLElement>(SUPPORTED_SELECTOR);

  if (!readableElement) {
    return null;
  }

  const text =
    readableElement.textContent
      ?.replace(/\s+/g, " ")
      .trim() ?? "";

  if (text.length === 0) {
    return null;
  }

  return readableElement;
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

function isFocusMode(value: unknown): value is FocusMode {
  return (
    typeof value === "string" &&
    VALID_MODES.includes(value as FocusMode)
  );
}

function isHexColor(value: unknown): value is string {
  return (
    typeof value === "string" &&
    HEX_COLOR_PATTERN.test(value)
  );
}

function clampSaturation(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_SETTINGS.saturation;
  }

  return Math.min(100, Math.max(0, value));
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

    color: isHexColor(candidate.color)
      ? candidate.color
      : DEFAULT_SETTINGS.color,

    saturation: clampSaturation(
      candidate.saturation,
    ),

    mode: isFocusMode(candidate.mode)
      ? candidate.mode
      : DEFAULT_SETTINGS.mode,
  };
}

/**
 * Convert a "#rrggbb" hex string into hue/lightness (0-360, 0-100).
 * Saturation is intentionally omitted: the user's saturation setting
 * always overrides it.
 */
function hexToHueAndLightness(
  hex: string,
): { h: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;

  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }

    h *= 60;

    if (h < 0) {
      h += 360;
    }
  }

  const l = ((max + min) / 2) * 100;

  return { h: Math.round(h), l: Math.round(l) };
}

/**
 * Reflect the current color and saturation onto the document as a CSS
 * variable so content.css can style the highlight background.
 */
function applyColor(current: ExtensionSettings): void {
  const { h, l } = hexToHueAndLightness(current.color);
  const alpha = INTENSITY_ALPHA[current.intensity];

  document.documentElement.style.setProperty(
    "--focusink-bg",
    `hsl(${h} ${current.saturation}% ${l}% / ${alpha}%)`,
  );
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
 * Remove the current highlight, in whichever mode set it.
 */
function clearActiveHighlight(): void {
  if (!highlightedNode && !highlightedElement) {
    return;
  }

  activeHighlight.clear();
  highlightedNode = null;
  highlightedStart = -1;
  highlightedEnd = -1;
  highlightedElement = null;
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
  const caret = getCaretPosition(x, y);

  if (!caret || caret.node.nodeType !== Node.TEXT_NODE) {
    clearActiveHighlight();
    return;
  }

  const textNode = caret.node;
  const parentElement = textNode.parentElement;

  if (!parentElement) {
    clearActiveHighlight();
    return;
  }

  if (parentElement.closest(EXCLUDED_SELECTOR)) {
    clearActiveHighlight();
    return;
  }

  if (!parentElement.closest(SUPPORTED_SELECTOR)) {
    clearActiveHighlight();
    return;
  }

  const bounds = findTokenBounds(
    textNode.textContent ?? "",
    caret.offset,
  );

  if (!bounds) {
    clearActiveHighlight();
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

  activeHighlight.clear();
  activeHighlight.add(range);

  highlightedNode = textNode;
  highlightedStart = bounds.start;
  highlightedEnd = bounds.end;
}

/**
 * Highlight the whole readable element under a pointer target.
 */
function updateParagraphHighlight(target: Element): void {
  const nextElement = findReadableElement(target);

  if (nextElement === highlightedElement) {
    return;
  }

  clearActiveHighlight();

  if (!nextElement) {
    return;
  }

  const range = document.createRange();
  range.selectNodeContents(nextElement);

  activeHighlight.add(range);
  highlightedElement = nextElement;
}

let pendingX = 0;
let pendingY = 0;
let updateScheduled = false;

/**
 * Handle pointer movement in token mode, throttled to one update per
 * animation frame.
 */
function handlePointerMove(event: PointerEvent): void {
  if (!settings.enabled || settings.mode !== "token") {
    return;
  }

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
 * Handle the pointer entering an element in paragraph mode.
 */
function handlePointerOver(event: PointerEvent): void {
  if (!settings.enabled || settings.mode !== "paragraph") {
    return;
  }

  const target = event.target;

  if (!(target instanceof Element)) {
    return;
  }

  updateParagraphHighlight(target);
}

/**
 * Clear the highlight when the pointer leaves the relevant scope: the
 * whole document in token mode, or the highlighted element in
 * paragraph mode.
 */
function handlePointerOut(event: PointerEvent): void {
  if (settings.mode === "paragraph") {
    if (!highlightedElement) {
      return;
    }

    const previousTarget = event.target;

    if (!(previousTarget instanceof Node)) {
      return;
    }

    if (!highlightedElement.contains(previousTarget)) {
      return;
    }

    const nextTarget = event.relatedTarget;

    if (
      nextTarget instanceof Node &&
      highlightedElement.contains(nextTarget)
    ) {
      return;
    }

    clearActiveHighlight();
    return;
  }

  if (event.relatedTarget !== null) {
    return;
  }

  clearActiveHighlight();
}

function handleWindowBlur(): void {
  clearActiveHighlight();
}

function handleVisibilityChange(): void {
  if (document.hidden) {
    clearActiveHighlight();
  }
}

function handleStorageChange(
  changes: {
    [key: string]: chrome.storage.StorageChange;
  },
  areaName: string,
): void {
  if (
    areaName !== "local" ||
    !changes.settings
  ) {
    return;
  }

  settings = normaliseSettings(
    changes.settings.newValue,
  );

  applyIntensity(settings.intensity);
  applyColor(settings);
  clearActiveHighlight();
}

async function initialise(): Promise<void> {
  try {
    const stored =
      await chrome.storage.local.get({
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
  applyColor(settings);

  document.addEventListener(
    "pointermove",
    handlePointerMove,
  );

  document.addEventListener(
    "pointerover",
    handlePointerOver,
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
