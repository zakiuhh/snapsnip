# Changelog

All notable changes to **SnapSnip** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.1] — 2026-09-01

### Fixed
- Version conflict with marketplace — bumped to `1.0.1` for clean publish.

---

## [1.0.0] — 2026-09-01

### 🎉 Initial Release

The first public release of **SnapSnip** — your personal code snippet vault inside VS Code.

### Added
- **Save Snippet** — Select any code, press `Ctrl+Alt+S`, name it and it's stored instantly.
- **Auto Language Detection** — Language is read automatically from the active editor (`languageId`). No manual selection needed.
- **Sidebar Tree View** — A dedicated activity bar panel that shows all snippets grouped by language, sorted alphabetically.
- **Insert Snippet** — Click any snippet in the sidebar to insert it at the cursor, or use the Command Palette for a searchable pick list.
- **Preview Snippet** — Right-click → Preview Snippet opens a Webview with Highlight.js syntax highlighting and a Copy to Clipboard button.
- **Delete Snippet** — Right-click → Delete Snippet with a confirmation dialog to prevent accidents.
- **Refresh Button** — Manual refresh button in the sidebar title bar.
- **Empty-state message** — Helpful onboarding message when no snippets are saved yet.
- **Global Persistent Storage** — Snippets are stored in VS Code's `globalState` and survive restarts, updates, and workspace changes.
- **Keyboard Shortcut** — `Ctrl+Alt+S` / `Cmd+Alt+S` (only fires when code is selected in the editor).

### Technical
- Built with TypeScript targeting ES2020 / CommonJS
- Uses `uuid` v11 for unique snippet IDs
- Uses Highlight.js 11.9 for Webview syntax highlighting
- Zero external runtime dependencies beyond `uuid`

---

## [Unreleased]

### Planned
- Export / Import snippets as JSON
- Inline snippet editing
- Full-text search across all snippets
- Custom tags for snippets
- Per-workspace snippet mode
- Offline syntax highlighting in Webview
- Optimised icon size

---

[1.0.1]: https://github.com/zakiuhh/snapsnip/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/zakiuhh/snapsnip/releases/tag/v1.0.0
[Unreleased]: https://github.com/zakiuhh/snapsnip/compare/v1.0.1...HEAD
