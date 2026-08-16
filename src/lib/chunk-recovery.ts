// After a new deploy, old HTML references chunk filenames that no longer exist.
// The lazy route import then fails with "Failed to fetch dynamically imported
// module" and the screen goes blank. Reload once to pick up the new manifest.
const KEY = "chunk-reload-at";
const COOLDOWN_MS = 30_000;

function isChunkLoadError(value: unknown): boolean {
  const message =
    value instanceof Error ? value.message : typeof value === "string" ? value : "";
  return (
    /Failed to fetch dynamically imported module/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message)
  );
}

export function reloadOnce() {
  try {
    const last = Number(sessionStorage.getItem(KEY) ?? 0);
    if (Date.now() - last < COOLDOWN_MS) return;
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    // sessionStorage unavailable — still attempt a single reload
  }
  window.location.reload();
}

export function installChunkRecovery() {
  if (typeof window === "undefined") return;
  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    reloadOnce();
  });
  window.addEventListener("unhandledrejection", (event) => {
    if (isChunkLoadError(event.reason)) reloadOnce();
  });
  window.addEventListener("error", (event) => {
    if (isChunkLoadError(event.error ?? event.message)) reloadOnce();
  });
}

export { isChunkLoadError };
