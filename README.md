# Flipper NFC Maker Plus

> A fork of [jaylikesbunda/Flipper-NFC-Maker](https://github.com/jaylikesbunda/Flipper-NFC-Maker) — a client-side web app for generating Flipper Zero `.nfc` tag files.

**This fork adds:** iOS-compatible business card NFC tags, a visual refresh, bug fixes, multi-NTAG type support with correct specifications, and a modernised codebase.

**License:** [GNU General Public License v3](LICENSE) — see [Licensing](#licensing) below.

---

## ✨ What's New in This Fork

| Feature | Description |
|---------|-------------|
| **iOS Business Card (VCF/vCard)** | Dual-record NDEF tag: embeds full vCard for Android + URL record for iOS Safari |
| **Bug fixes** | Fixed BCC0 calculation, CC bytes, Mifare version per NTAG type, long-form NDEF records |
| **NTAG213/215/216 support** | Correct specifications for all three tag types with live capacity checking |
| **Visual refresh** | Navy + teal colour scheme, dark/light mode with system preference detection |
| **No external dependencies** | System fonts, no Google Fonts, no analytics — works fully offline |
| **Restructured codebase** | Modular JS files, JSDoc annotations, AI-development-friendly |

## 🚀 Quick Start

1. **Clone** the repo (or download the ZIP):
   ```bash
   git clone https://github.com/PBNZ/Flipper-NFC-Maker-Plus.git
   ```
2. **Open** `src/index.html` in any modern browser
3. **Done** — no build step, no server, no dependencies

## 📋 Features

### Standard NFC Tag Types
- **URL** — with efficient URI prefix compression
- **Phone, Email, SMS** — tel:, mailto:, sms: URI schemes
- **Wi-Fi Configuration** — SSID, password, auth type
- **Contact (vCard)** — paste raw vCard data
- **Geo Location** — latitude/longitude coordinates
- **Launch Application** — Android Application Records
- **Custom MIME** — arbitrary MIME type + payload
- **Social Media Links** — optimised URL records
- **FaceTime / FaceTime Audio** — iOS-specific
- **Apple Maps, HomeKit** — iOS-specific
- **Send to Flipper** — WebSerial direct transfer (Chrome desktop)

### iOS Compatible Business Card (NEW)
1. Enter a URL to your hosted `.vcf` file
2. App fetches and parses the vCard (with paste fallback for CORS)
3. Preview parsed contact fields
4. Select tag type with live capacity bar (NTAG213/215/216)
5. Generate a dual-record `.nfc` file:
   - Record 1: `text/vcard` MIME (Android reads directly)
   - Record 2: URL to hosted VCF (iOS opens in Safari)

## 🌐 Deployment Options

This app works in **all** of these scenarios without modification:

| Method | Instructions |
|--------|-------------|
| **Local file** | Open `src/index.html` directly (file:// protocol) |
| **Web server** | Copy `src/` contents to your web root |
| **GitHub Pages** | Enable Pages on the `main` branch, set source to `src/` |
| **S3 / CloudFront** | Upload `src/` contents to your bucket |
| **IIS** | Copy `src/` contents to `wwwroot` |

All paths are relative — no configuration needed.

## 🗂️ Project Structure

```
├── src/
│   ├── index.html              # Main application
│   ├── css/styles.css          # Styles (dark/light theme)
│   └── js/
│       ├── app.js              # UI logic, event handlers
│       ├── nfc-generator.js    # NFC/NDEF byte-level generation
│       ├── vcard-parser.js     # vCard parsing + preview
│       ├── background.js       # Particle canvas animation
│       └── serial.js           # WebSerial Flipper communication
├── .github/workflows/deploy.yml
├── .editorconfig
├── .gitignore
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE                     # GPL v3 (original, unmodified)
└── README.md
```

## 🗺️ Roadmap

Future improvements (tracked as TODO comments in code):
- [ ] Manual multi-record tag creation (arbitrary record types)
- [ ] Enhanced vCard creation/editing UI (full wizard)
- [ ] Direct VCF content creation without requiring a pre-hosted file

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for repo layout, coding conventions, and how to add new NFC record types.

## 📜 Licensing

This project is licensed under the **GNU General Public License v3**.

```
Original work Copyright (c) jaylikesbunda
Modifications Copyright (c) PBNZ 2026
```

The full license text is in the [LICENSE](LICENSE) file. All source files include a GPL header comment. This fork complies with GPL v3 requirements — source code is publicly available and the original license is preserved.

## ⚠️ Disclaimer

This tool is for educational and personal use only. Ensure you have the right to create and use NFC tags before deploying them. The creators are not responsible for any misuse.
