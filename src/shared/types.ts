type FocusIntensity = "light" | "medium" | "strong";

type FocusMode = "token" | "paragraph";

interface ExtensionSettings {
  enabled: boolean;
  intensity: FocusIntensity;
  color: string;
  saturation: number;
  mode: FocusMode;
}