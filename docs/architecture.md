# Architecture

## 1. System Overview

ADHD Mouse Focus is a Manifest V3 browser extension.

It contains three main parts:

1. Content Script
2. Popup
3. Chrome Storage

## 2. Content Script

Files:

- `src/content/content.ts`
- `src/content/content.css`

Responsibilities:

- Listen for pointer events
- Identify readable HTML elements
- Add the extension focus class
- Remove the focus class
- Read the current extension settings
- Ignore unsupported elements

## 3. Popup

Files:

- `src/popup/popup.html`
- `src/popup/popup.ts`
- `src/popup/popup.css`

Responsibilities:

- Display the enabled/disabled switch
- Display intensity options
- Save changes to Chrome Storage
- Display the currently saved settings

## 4. Shared Types

File:

- `src/shared/types.ts`

Responsibilities:

- Define the settings interface
- Define the available intensity values
- Prevent inconsistent settings between the popup and content script

## 5. Storage

The extension will store:

- Whether the extension is enabled
- The selected intensity

Initial data model:

```ts
type FocusIntensity = "light" | "medium" | "strong";

interface ExtensionSettings {
  enabled: boolean;
  intensity: FocusIntensity;
}