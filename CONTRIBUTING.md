# Contributing to Flipper NFC Maker Plus

Thanks for your interest in contributing! This guide covers the repo layout,
coding conventions, and how to add new features.

## Repo Layout

```
src/
├── index.html              # Main HTML — all UI structure
├── css/styles.css          # All styles (CSS custom properties for theming)
└── js/
    ├── app.js              # UI logic, event handlers, theme management
    ├── nfc-generator.js    # NFC/NDEF byte-level generation (NfcNtag class)
    ├── vcard-parser.js     # vCard validation, parsing, preview rendering
    ├── background.js       # Particle canvas animation
    └── serial.js           # WebSerial communication with Flipper Zero
```

Scripts are loaded as classic `<script>` tags (not ES modules) so the app
works with `file://` protocol. Order matters — `nfc-generator.js` and
`vcard-parser.js` must load before `app.js`.

## Testing Locally

1. Open `src/index.html` in a browser — that's it
2. No build step, no server, no `npm install` required
3. For WebSerial (Send to Flipper), use Chrome on desktop

## Coding Conventions

- **Vanilla JS only** — no frameworks, no bundlers, no npm dependencies
- **JSDoc comments** on all functions (params, returns, description)
- **GPL license header** at the top of every JS file
- **Small, single-purpose functions** — important for AI context windows
- **CSS custom properties** for theming — never hardcode colours
- **Relative paths only** — no leading `/`, no absolute URLs
- **`.editorconfig`** — 4-space indentation, UTF-8, LF line endings

## Adding a New NFC Record Type

1. **`nfc-generator.js`**: Add a `generateXxxTag(data)` method to `NfcNtag`:
   - Call `this._generateUid()`, `this._writeHeaderPages()`
   - Use `buildNdefRecord()` with the correct TNF and type bytes
   - Wrap in `wrapInTlv()` and call `this._writeNdefData()`
   - Call `this._writeEndPages()`

2. **`src/index.html`**: Add a `<option>` to `#tagType` select and
   matching `data-field` input groups in `#inputFields`

3. **`src/js/app.js`**: Add the type to:
   - `generateNFCData()` data collection (input → inputData)
   - `isValidInput()` validation
   - The tag type routing section (which generator method to call)

4. **Test** with all three NTAG types (213/215/216)

## AI-Development-Friendly

This repo is intentionally structured for AI-assisted development:

- **Clear file boundaries** — each file has a single, documented purpose
- **JSDoc annotations** — AI tools can understand function contracts
- **Small functions** — fit within typical AI context windows
- **Section headers** — `/* SECTION: ... */` comments for navigation
- **`.editorconfig`** — consistent formatting regardless of editor/AI tool
- **No build step** — changes are instantly testable

### 🛑 AI Workflow Requirement
**All AI agents MUST update `CHANGELOG.md` before committing or pushing changes to any branch.** Do not leave changelog updates as an afterthought.

## License

All contributions must be compatible with **GNU GPL v3**. Add the GPL header
to any new source files. Do not introduce dependencies with incompatible licenses.
