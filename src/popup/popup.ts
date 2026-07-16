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

const enabledInput =
  getRequiredElement<HTMLInputElement>(
    "#enabled",
  );

const intensitySelect =
  getRequiredElement<HTMLSelectElement>(
    "#intensity",
  );

const statusElement =
  getRequiredElement<HTMLParagraphElement>(
    "#status",
  );

function renderSettings(
  settings: ExtensionSettings,
): void {
  enabledInput.checked = settings.enabled;
  intensitySelect.value = settings.intensity;
  intensitySelect.disabled = !settings.enabled;

  statusElement.textContent = settings.enabled
    ? `${settings.intensity} focus is active.`
    : "FocusInk is disabled.";
}

async function loadSettings(): Promise<void> {
  try {
    const stored =
      await chrome.storage.sync.get({
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
  };

  intensitySelect.disabled = !settings.enabled;
  statusElement.textContent =
    "Saving settings...";

  try {
    await chrome.storage.sync.set({
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

intensitySelect.addEventListener(
  "change",
  () => {
    void saveSettings();
  },
);

void loadSettings();
})();