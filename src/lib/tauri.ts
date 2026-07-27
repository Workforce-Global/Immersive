export function isTauri(): boolean {
  return typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;
}

export function requireTauri(): void {
  if (!isTauri()) {
    throw new Error('Tauri APIs are not available outside the Tauri webview. Run with `npm run tauri dev` instead.');
  }
}
