// Tags this person picked recently, per category, kept on this device (newest first).
const key = cat => `kk-recent-tags-${cat}`
const MAX = 12

export function recentTags(cat) {
  try { return JSON.parse(localStorage.getItem(key(cat))) || [] } catch { return [] }
}

export function rememberTags(cat, ids = []) {
  if (!ids.length) return
  try {
    const next = [...ids, ...recentTags(cat).filter(x => !ids.includes(x))].slice(0, MAX)
    localStorage.setItem(key(cat), JSON.stringify(next))
  } catch { /* storage unavailable */ }
}
