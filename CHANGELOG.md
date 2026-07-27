# Changelog

## v0.1.0 (2026-07-27)

### Initial setup (2025-01-03)
- Initialize project with Tauri + Angular foundation

### Angular UI development (2025-01-10 — 2025-03-15)
- Build initial UI, custom title bar, splash screen
- Rust API for epub metadata extraction and cover serving
- Book import, deletion, library display with recently opened section
- Epub reader with TOC support, settings modal, reading interface
- Component overhaul, navigation, custom title bar for reader page

### Framework upgrades (2025-09-15 — 2025-09-23)
- Tauri v2 migration: plugin API changes, function updates, scope fixes
- Angular 18 → 19 → 20 upgrades
- Tailwind CSS v4 migration
- Code structure refactor for readability

### Next.js migration (2026-07-27)
- Scaffold Next.js 16 project (App Router, React 19, Tailwind v4, Zustand)
- Port all components: title-bar, reader-view, toc-panel, settings-modal,
  search-panel, lookup-panel, excerpt-panel, loading-screen, library-settings
- Rewrite state management from RxJS BehaviorSubjects to Zustand stores
- Migrate icons from `@ng-icons/heroicons/outline` to `lucide-react`
- Adapt Tauri v2 plugin-fs API (`readBinaryFile` → `readFile`, `createDir` → `mkdir`, etc.)
- Add `generateStaticParams` for dynamic routes with static export
- Guard all Tauri API calls with `isTauri()` + dynamic imports;
  browser dev uses localStorage fallback via `browser-storage.ts`
- Remove old Angular source (`src/`, `angular.json`, etc.)
- Move frontend from `immersive-next/` subdirectory to project root
