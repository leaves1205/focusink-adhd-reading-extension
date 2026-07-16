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

const FOCUS_CLASSES = [
  "focusink-focused--light",
  "focusink-focused--medium",
  "focusink-focused--strong",
];

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

let settings: ExtensionSettings =
  DEFAULT_SETTINGS;

let focusedElement: HTMLElement | null =
  null;

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

function hasMeaningfulText(
  element: HTMLElement,
): boolean {
  const text = element.textContent
    ?.replace(/\s+/g, " ")
    .trim();

  return Boolean(text);
}

function findReadableElement(
  target: Element,
): HTMLElement | null {
  const excludedElement =
    target.closest(EXCLUDED_SELECTOR);

  if (excludedElement) {
    return null;
  }

  const readableElement =
    target.closest<HTMLElement>(
      SUPPORTED_SELECTOR,
    );

  if (!readableElement) {
    return null;
  }

  if (!hasMeaningfulText(readableElement)) {
    return null;
  }

  return readableElement;
}

function removeFocusClasses(
  element: HTMLElement,
): void {
  element.classList.remove(
    ...FOCUS_CLASSES,
  );
}

function applyFocusStyle(
  element: HTMLElement,
): void {
  removeFocusClasses(element);

  element.classList.add(
    `focusink-focused--${settings.intensity}`,
  );
}

function clearFocusedElement(): void {
  if (!focusedElement) {
    return;
  }

  removeFocusClasses(focusedElement);
  focusedElement = null;
}

function handlePointerOver(
  event: PointerEvent,
): void {
  if (!settings.enabled) {
    return;
  }

  const target = event.target;

  if (!(target instanceof Element)) {
    return;
  }

  const nextElement =
    findReadableElement(target);

  if (nextElement === focusedElement) {
    return;
  }

  clearFocusedElement();

  if (!nextElement) {
    return;
  }

  applyFocusStyle(nextElement);
  focusedElement = nextElement;
}

function handlePointerOut(
  event: PointerEvent,
): void {
  if (!focusedElement) {
    return;
  }

  const previousTarget = event.target;

  if (!(previousTarget instanceof Node)) {
    return;
  }

  if (
    !focusedElement.contains(previousTarget)
  ) {
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

function handleStorageChange(
  changes: {
    [key: string]:
      chrome.storage.StorageChange;
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

  if (!settings.enabled) {
    clearFocusedElement();
    return;
  }

  if (focusedElement) {
    applyFocusStyle(focusedElement);
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
  document.addEventListener(
    "pointerover",
    handlePointerOver,
  );

  document.addEventListener(
    "pointerout",
    handlePointerOut,
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

