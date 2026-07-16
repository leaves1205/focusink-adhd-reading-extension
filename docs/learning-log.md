# Product Requirements

## 1. Product Name

ADHD Mouse Focus

## 2. Problem

Some users lose focus while reading long webpages because there is no clear
visual indicator showing which text they are currently reading.

## 3. Target Users

- Users who are easily distracted while reading
- Users with attention difficulties
- Users reading long articles, documentation or online discussions
- Users who want stronger visual feedback while moving the mouse

## 4. Product Goal

Enhance the visual weight of webpage text under the user's pointer without
permanently modifying the webpage or significantly changing its layout.

## 5. MVP Features

- [ ] The extension can be enabled and disabled
- [ ] Text is enhanced when the pointer enters a readable element
- [ ] Text returns to normal when the pointer leaves
- [ ] The user can select light, medium or strong intensity
- [ ] Settings remain after refreshing the page
- [ ] The extension does not modify input fields
- [ ] The extension does not collect reading content

## 6. Supported Elements

The MVP will support:

- `p`
- `span`
- `li`
- `a`
- `h1` to `h6`
- `blockquote`
- `article`

## 7. Excluded Elements

The MVP will ignore:

- `input`
- `textarea`
- `select`
- `button`
- `script`
- `style`
- `code`
- `pre`
- Elements without meaningful text

## 8. Non-goals

The first version will not support:

- Individual word detection
- PDF documents
- Canvas-rendered text
- AI summarisation
- User accounts
- Cloud databases
- Reading history collection

## 9. User Stories

### Enable the extension

As a user, I want to enable or disable the extension so that I can control
whether webpage text is modified.

### Focus on text

As a user, I want text under my pointer to become visually stronger so that I
can follow my current reading position.

### Select intensity

As a user, I want to select a visual intensity so that the effect is
comfortable for me.

## 10. Acceptance Criteria

### Pointer focus

Given that the extension is enabled,

when the pointer enters a supported text element,

then the element receives the extension's focus style.

### Pointer leaves

Given that an element currently has the focus style,

when the pointer leaves that element,

then the focus style is removed.

### Disabled state

Given that the extension is disabled,

when the pointer moves across webpage text,

then no focus style is applied.