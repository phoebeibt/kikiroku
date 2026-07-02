import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { TASTING_TAGS, FLAVOR_TAGS, SAKE_TYPES } from '../lib/i18n'
import { useLang } from './LangContext'

const CACHE_KEY = 'kikiroku-tags-v1'
const TTL_MS = 24 * 60 * 60 * 1000

// Cold-start fallback: build from i18n.js constants (offline / first-load).
// Once DB fetch succeeds, this is replaced entirely.
function buildFallback() {
  const rows = []
  TASTING_TAGS.aroma.forEach((t, i) => rows.push({ ...t, category: 'aroma', sort_order: i }))
  TASTING_TAGS.taste.forEach((t, i) => rows.push({ ...t, category: 'taste', sort_order: i }))
  FLAVOR_TAGS.forEach((t, i) => rows.push({ ...t, category: 'flavor', sort_order: i }))
  SAKE_TYPES.forEach((t, i) => rows.push({ ...t, ja: t.ja || t.id, category: 'type', sort_order: i }))
  return rows
}

function groupByCategory(rows) {
  const grouped = { aroma: [], taste: [], flavor: [], method: [], type: [] }
  for (const r of rows) {
    if (grouped[r.category]) grouped[r.category].push(r)
  }
  for (const cat of Object.keys(grouped)) {
    grouped[cat].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  }
  return grouped
}

const TagsContext = createContext({ tags: groupByCategory([]) })

export function TagsProvider({ children }) {
  const [tags, setTags] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const { data, ts } = JSON.parse(cached)
        if (Date.now() - ts < TTL_MS && Array.isArray(data) && data.length > 0) {
          return groupByCategory(data)
        }
      }
    } catch { /* corrupted cache, ignore */ }
    return groupByCategory(buildFallback())
  })

  useEffect(() => {
    let cancelled = false
    supabase
      .from('sake_tags')
      .select('id,category,ja,zh,en,sort_order')
      .order('sort_order')
      .then(({ data, error }) => {
        if (cancelled || error || !data?.length) return
        setTags(groupByCategory(data))
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }))
        } catch { /* quota exceeded, ignore */ }
      })
    return () => { cancelled = true }
  }, [])

  return (
    <TagsContext.Provider value={{ tags }}>
      {children}
    </TagsContext.Provider>
  )
}

// Return all tags for a category (sorted), or all tags grouped if no category.
export function useTags(category) {
  const { tags } = useContext(TagsContext)
  return category ? (tags[category] || []) : tags
}

// Resolve id → language-specific label. Falls back to ja then id.
export function useTagLabel(id, category) {
  const resolve = useTagResolver()
  return resolve(id, category)
}

// Returns a plain (id, category) => label function usable inside .map() callbacks.
// Falls back to legacy i18n.js constants so historical entries render correctly
// before Step 3.5 backfill remaps their ids.
export function useTagResolver() {
  const { tags } = useContext(TagsContext)
  const { lang } = useLang()
  return (id, category) => {
    const found = tags[category]?.find(t => t.id === id)
    if (found) return found[lang] || found.ja || id
    // Legacy fallback
    if (category === 'aroma' || category === 'taste') {
      const legacy = TASTING_TAGS[category]?.find(t => t.id === id)
      if (legacy) return legacy[lang] || legacy.ja || id
    }
    if (category === 'flavor') {
      const legacy = FLAVOR_TAGS.find(t => t.id === id)
      if (legacy) return legacy[lang] || legacy.ja || id
    }
    if (category === 'type') {
      const legacy = SAKE_TYPES.find(t => t.id === id)
      if (legacy) return lang === 'ja' ? id : (legacy[lang] || legacy.en || id)
    }
    return id
  }
}
