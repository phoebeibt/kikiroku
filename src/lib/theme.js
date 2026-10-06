// The 2026-10 redesign ships a single light theme (tokens in index.css).
// Clear the old per-device theme choice so no stale data-theme lingers.
export function initTheme() {
  delete document.documentElement.dataset.theme
  try { localStorage.removeItem('kikiroku-theme') } catch { /* storage blocked */ }
}
