(() => {
  const DEFAULT_SETTINGS: ExtensionSettings = {
    enabled: true,
    intensity: "medium",
    color: "#ffe564",
    saturation: 100,
    mode: "token",
  };

  const VALID_INTENSITIES: FocusIntensity[] = [
    "light",
    "medium",
    "strong",
  ];

  const VALID_MODES: FocusMode[] = ["token", "paragraph"];

  const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
function getRequiredElement<T extends Element>(
  selector: string,
): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(
      `FocusInk could not find element: ${selector}`,
    );
  }

  return element;
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

const enabledInput =
  getRequiredElement<HTMLInputElement>(
    "#enabled",
  );

const modeTokenInput =
  getRequiredElement<HTMLInputElement>(
    "#modeToken",
  );

const modeParagraphInput =
  getRequiredElement<HTMLInputElement>(
    "#modeParagraph",
  );

const intensitySelect =
  getRequiredElement<HTMLSelectElement>(
    "#intensity",
  );

const colorInput =
  getRequiredElement<HTMLInputElement>(
    "#color",
  );

const saturationInput =
  getRequiredElement<HTMLInputElement>(
    "#saturation",
  );

const saturationValueElement =
  getRequiredElement<HTMLSpanElement>(
    "#saturationValue",
  );

const statusElement =
  getRequiredElement<HTMLParagraphElement>(
    "#status",
  );

const SAVE_DEBOUNCE_MS = 250;
let saveDebounceHandle: number | undefined;

/**
 * Coalesce rapid-fire "input" events (dragging the color picker or the
 * saturation slider) into a single write, to avoid spamming storage
 * while the user is still adjusting a value.
 */
function scheduleSave(): void {
  if (saveDebounceHandle !== undefined) {
    window.clearTimeout(saveDebounceHandle);
  }

  saveDebounceHandle = window.setTimeout(() => {
    saveDebounceHandle = undefined;
    void saveSettings();
  }, SAVE_DEBOUNCE_MS);
}

function renderSettings(
  settings: ExtensionSettings,
): void {
  enabledInput.checked = settings.enabled;

  modeTokenInput.checked = settings.mode === "token";
  modeTokenInput.disabled = !settings.enabled;

  modeParagraphInput.checked =
    settings.mode === "paragraph";
  modeParagraphInput.disabled = !settings.enabled;

  intensitySelect.value = settings.intensity;
  intensitySelect.disabled = !settings.enabled;

  colorInput.value = settings.color;
  colorInput.disabled = !settings.enabled;

  saturationInput.value = String(settings.saturation);
  saturationInput.disabled = !settings.enabled;
  saturationValueElement.textContent = `${settings.saturation}%`;

  statusElement.textContent = settings.enabled
    ? `${settings.intensity} focus is active.`
    : "FocusInk is disabled.";
}

async function loadSettings(): Promise<void> {
  try {
    const stored =
      await chrome.storage.local.get({
        settings: DEFAULT_SETTINGS,
      });

    const settings = normaliseSettings(
      stored.settings,
    );

    renderSettings(settings);
  } catch (error) {
    console.error(
      "[FocusInk] Failed to load settings:",
      error,
    );

    statusElement.textContent =
      "Unable to load settings.";
  }
}

async function saveSettings(): Promise<void> {
  const settings: ExtensionSettings = {
    enabled: enabledInput.checked,
    intensity:
      intensitySelect.value as FocusIntensity,
    color: colorInput.value,
    saturation: Number(saturationInput.value),
    mode: modeParagraphInput.checked
      ? "paragraph"
      : "token",
  };

  modeTokenInput.disabled = !settings.enabled;
  modeParagraphInput.disabled = !settings.enabled;
  intensitySelect.disabled = !settings.enabled;
  colorInput.disabled = !settings.enabled;
  saturationInput.disabled = !settings.enabled;
  saturationValueElement.textContent = `${settings.saturation}%`;
  statusElement.textContent =
    "Saving settings...";

  try {
    await chrome.storage.local.set({
      settings,
    });

    renderSettings(settings);
  } catch (error) {
    console.error(
      "[FocusInk] Failed to save settings:",
      error,
    );

    statusElement.textContent =
      "Unable to save settings.";
  }
}

enabledInput.addEventListener(
  "change",
  () => {
    void saveSettings();
  },
);

modeTokenInput.addEventListener(
  "change",
  () => {
    void saveSettings();
  },
);

modeParagraphInput.addEventListener(
  "change",
  () => {
    void saveSettings();
  },
);

intensitySelect.addEventListener(
  "change",
  () => {
    void saveSettings();
  },
);

colorInput.addEventListener(
  "input",
  () => {
    scheduleSave();
  },
);

saturationInput.addEventListener(
  "input",
  () => {
    saturationValueElement.textContent = `${saturationInput.value}%`;
    scheduleSave();
  },
);

void loadSettings();
})();