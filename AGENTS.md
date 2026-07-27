# Immersive — Ebook reader desktop app

## Stack

- **Frontend**: Next.js 16 (App Router, React 19), Tailwind CSS v4, TypeScript, Zustand
- **Backend**: Tauri 2 (Rust) — commands in `src-tauri/src/epub_backend.rs`
- **Plugins**: clipboard, dialog, fs, global-shortcut, http, notification, os, process, shell
- **Root entry**: `src/app/layout.tsx` (App Router root layout)
- **Routes**: `/` (splash), `/dashboard`, `/library`, `/read/[bookId]`, `/parallel/[leftBookId]/[rightBookId]`

## Commands

| Command | What it does |
|---|---|
| `npm run tauri dev` | Run desktop app in dev mode (Next.js + Tauri). Dev server on `http://localhost:3000`. |
| `npm run dev` | Frontend-only dev (no Tauri backend). Useful for UI iteration. |
| `npm run build` | Build Next.js frontend to `out/` directory. |

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

In browser-only dev mode, books are stored in localStorage as a fallback.

## Key observations

- Window has `decorations: false` — custom title bar. The `.titlebar` CSS class handles drag regions.
- Dark mode toggled via `.dark` class on `<html>` (not Tailwind `prefers-color-scheme` media query). The root layout injects it from `prefers-color-scheme` on load.
- Tauri APIs (`invoke`, `plugin-fs`, `plugin-dialog`) are only available in the Tauri desktop app. All calls are guarded by `isTauri()` check from `src/lib/tauri.ts` with lazy dynamic imports; browser dev uses localStorage via `src/lib/browser-storage.ts`.
- Rust `edition = "2021"`, `rust-version = "1.77.2"`.
- Dynamic routes (`/read/[bookId]`, `/parallel/[leftBookId]/[rightBookId]`) use `generateStaticParams` for `output: 'export'`.
- Icon library: `lucide-react` (replaced `@ng-icons/heroicons/outline`).
- State management: Zustand stores in `src/stores/` replace RxJS BehaviorSubjects.

## Project structure

```
src/
├── app/           # Next.js App Router pages
│   ├── layout.tsx
│   ├── page.tsx   # Splash (/)
│   ├── dashboard/
│   ├── library/
│   ├── read/[bookId]/
│   └── parallel/[leftBookId]/[rightBookId]/
├── components/    # Shared React components
├── hooks/         # React hooks (use-search, use-lookup)
├── lib/           # Utilities (tauri.ts, browser-storage.ts)
├── stores/        # Zustand stores (book-store, settings-store, excerpt-store)
└── types/         # TypeScript type definitions
```
