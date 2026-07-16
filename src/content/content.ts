const FOCUS_CLASS = "focusink-focused";

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
  "article",
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
  "[contenteditable='true']",
].join(",");

let focusedElement: HTMLElement | null = null;

/**
 * Check whether an element contains visible, meaningful text.
 */
function hasMeaningfulText(element: HTMLElement): boolean {
  const text = element.textContent
    ?.replace(/\s+/g, " ")
    .trim();

  return Boolean(text);
}

/**
 * Find the nearest readable element from the pointer target.
 */
function findReadableElement(target: Element): HTMLElement | null {
  const excludedElement = target.closest(EXCLUDED_SELECTOR);

  if (excludedElement) {
    return null;
  }

  const readableElement =
    target.closest<HTMLElement>(SUPPORTED_SELECTOR);

  if (!readableElement) {
    return null;
  }

  if (!hasMeaningfulText(readableElement)) {
    return null;
  }

  return readableElement;
}

/**
 * Remove FocusInk styling from the current element.
 */
function clearFocusedElement(): void {
  if (!focusedElement) {
    return;
  }

  focusedElement.classList.remove(FOCUS_CLASS);
  focusedElement = null;
}

/**
 * Handle the pointer entering a webpage element.
 */
function handlePointerOver(event: PointerEvent): void {
  const target = event.target;

  if (!(target instanceof Element)) {
    return;
  }

  const nextElement = findReadableElement(target);

  if (nextElement === focusedElement) {
    return;
  }

  clearFocusedElement();

  if (!nextElement) {
    return;
  }

  nextElement.classList.add(FOCUS_CLASS);
  focusedElement = nextElement;
}

/**
 * Handle the pointer leaving the focused element.
 */
function handlePointerOut(event: PointerEvent): void {
  if (!focusedElement) {
    return;
  }

  const previousTarget = event.target;

  if (!(previousTarget instanceof Node)) {
    return;
  }

  if (!focusedElement.contains(previousTarget)) {
    return;
  }

  const nextTarget = event.relatedTarget;

  if (
    nextTarget instanceof Node &&
    focusedElement.contains(nextTarget)
  ) {
    return;
  }

  clearFocusedElement();
}

document.addEventListener(
  "pointerover",
  handlePointerOver,
);

document.addEventListener(
  "pointerout",
  handlePointerOut,
);

console.log("[FocusInk] Text focus is active.");