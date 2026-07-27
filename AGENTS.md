# Immersive — Ebook reader desktop app

## Stack

- **Frontend**: Angular 20 (standalone, no NgModules), Tailwind CSS v4, TypeScript
- **Backend**: Tauri 2 (Rust) — commands in `src-tauri/src/epub_backend.rs`
- **Plugins**: clipboard, dialog, fs, global-shortcut, http, notification, os, process, shell
- **Root entry**: `src/main.ts` → `App` (standalone, `bootstrapApplication`)
- **Routes**: `/` (splash), `/dashboard`, `/library`, `/read/:bookId` (with `BookResolver`), `/parallel/:leftBookId/:rightBookId`

## Commands

| Command | What it does |
|---|---|
| `npm run tauri dev` | Run desktop app in dev mode (Angular + Tauri). Dev server on `http://localhost:4200`. |
| `ng serve` | Frontend-only dev (no Tauri backend). Useful for UI iteration. |
| `ng build` | Build Angular frontend only. |

No test runner, linter, or formatter is configured.

## Tauri commands (Rust → frontend)

All in `src-tauri/src/epub_backend.rs`. Registered in `main.rs::invoke_handler`:

- `extract_metadata(file_path)` → `EpubMetadata { title, author, cover? }`
- `get_cover_base64(file_path)` → `data:image/jpeg;base64,...`
- `check_storage_path` → string path to app data dir
- `read_epub_content(file_path)` → raw bytes

## Storage

Books and metadata live in the Tauri app data directory under `books/` and `metadata/`.
Allowed paths are defined in `src-tauri/capabilities/migrated.json` under `fs:scope`.
Books are imported as binary files (epub/pdf), metadata as JSON.

## Key observations

- `useDefineForClassFields: false` in `tsconfig.json` — do not use class field initializers that conflict with Angular decorators.
- Window has `decorations: false` — custom title bar. The `.titlebar` CSS class handles drag regions.
- Dark mode toggled via `.dark` class on `<html>` (not Tailwind `prefers-color-scheme` media query). The `index.html` injects it from `prefers-color-scheme` on load.
- No existing test infrastructure. Angular CLI test schematics exist but no deps installed.
- Rust `edition = "2021"`, `rust-version = "1.77.2"`.
