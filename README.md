# ADHD Mouse Focus

A lightweight browser extension that enhances webpage text under the user's
pointer to support focused reading and reduce visual distraction.

## Status

The project is currently in the planning and initial development stage.

## Problem

Long webpages can make it difficult for some users to keep track of their
current reading position. This extension provides a visual focus indicator by
enhancing text under the pointer.

## MVP

The first version will provide:

- Enable and disable control
- Element-level text enhancement
- Light, medium and strong intensity settings
- Persistent user settings
- Performance-aware pointer event handling

## Technology

- TypeScript
- HTML
- CSS
- Chrome Extension Manifest V3
- Chrome Storage API
- Git
- npm

## Architecture

```text
Popup
  │
  ├── saves settings
  ▼
Chrome Storage
  │
  ├── provides settings
  ▼
Content Script
  │
  ├── listens for pointer events
  ├── detects readable elements
  └── applies CSS classes