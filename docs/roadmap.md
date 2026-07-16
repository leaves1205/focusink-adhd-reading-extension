# Development Roadmap

## Milestone 0: Project Definition

- [X] Define the product problem
- [X] Define the MVP
- [X] Define non-goals
- [X] Design the initial architecture
- [X] Initialise Git
- [X] Initialise npm
- [X] Install TypeScript

## Milestone 1: Loadable Browser Extension

- [X] Create a valid Manifest V3 file
- [X] Create a basic popup
- [X] Compile TypeScript
- [X] Build the extension directory
- [X] Load the extension through chrome://extensions
- [X] Confirm that the extension icon appears

Definition of done:

- Chrome loads the extension without an error
- Clicking the extension icon opens a popup
- The browser console shows no unexpected errors

## Milestone 2: Basic Text Focus

- [X] Add pointer event listeners
- [X] Detect supported text elements
- [X] Add a focus CSS class
- [X] Remove the class after pointer exit
- [X] Ignore empty elements
- [X] Ignore form controls

Definition of done:

- Hovering over a paragraph enhances its text
- Moving away restores the original style
- Images and input fields are not modified

## Milestone 3: Popup Settings

- [ ] Add enabled/disabled switch
- [ ] Add intensity selector
- [ ] Add light style
- [ ] Add medium style
- [ ] Add strong style

## Milestone 4: Persistent Settings

- [ ] Add the storage permission
- [ ] Save settings with `chrome.storage.sync`
- [ ] Load settings when the popup opens
- [ ] Load settings when the content script starts
- [ ] Respond to storage changes

## Milestone 5: Quality

- [ ] Test Wikipedia
- [ ] Test Reddit
- [ ] Test Medium or another article website
- [ ] Test a documentation website
- [ ] Check keyboard input fields
- [ ] Check dynamically loaded content
- [ ] Check performance
- [ ] Add error handling

## Milestone 6: Engineering Upgrade

- [ ] Introduce Vite
- [ ] Add ESLint
- [ ] Add Prettier
- [ ] Add Vitest
- [ ] Add automated build scripts
- [ ] Add extension icons
- [ ] Prepare Chrome Web Store materials
