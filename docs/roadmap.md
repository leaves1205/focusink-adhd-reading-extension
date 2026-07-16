# Development Roadmap

## Milestone 0: Project Definition

- [x] Define the product problem
- [x] Define the MVP
- [x] Define non-goals
- [x] Design the initial architecture
- [ ] Initialise Git
- [ ] Initialise npm
- [ ] Install TypeScript

## Milestone 1: Loadable Browser Extension

- [ ] Create a valid Manifest V3 file
- [ ] Create a basic popup
- [ ] Compile TypeScript
- [ ] Build the extension directory
- [ ] Load the extension through chrome://extensions
- [ ] Confirm that the extension icon appears

Definition of done:

- Chrome loads the extension without an error
- Clicking the extension icon opens a popup
- The browser console shows no unexpected errors

## Milestone 2: Basic Text Focus

- [ ] Add pointer event listeners
- [ ] Detect supported text elements
- [ ] Add a focus CSS class
- [ ] Remove the class after pointer exit
- [ ] Ignore empty elements
- [ ] Ignore form controls

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