// Bundle bust marker for cache invalidation after DB summary refresh (2026-07-06)
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

const firstSentence = t => (t ? (t.match(/^.+?(?:。|\. )/) || [t])[0].trim() : null)

const WikiContext = createContext({ articles: [], reload: () => {}, ensure: () => {} })

// The term list (lib/wiki.js, ~135 KB) and the DB articles are loaded the first time a page asks
// for them (useWiki), not at app start — 廣場 and マイ帳 never need them (2026-10-21).
export function WikiProvider({ children }) {
  const [terms, setTerms] = useState([])
  const [dbMap, setDbMap] = useState({})
  const started = useRef(false)

  const load = useCallback(async () => {
    const { data } = await supabase.from('wiki_articles').select('*')
    if (!data) return
    const map = {}
    for (const row of data) map[row.term_id] = row
    setDbMap(map)
  }, [])

  const ensure = useCallback(() => {
    if (started.current) return
    started.current = true
    import('../lib/wiki').then(m => setTerms(m.WIKI_TERMS))
    load()
  }, [load])

  // Merge static terms with DB content (DB wins for summary/body)
  // zh uses Traditional Chinese (zhtw) as primary, falling back to zh
  const articles = terms.map(term => {
    const db = dbMap[term.id] || {}
    return {
      ...term,
      // Entries without a written summary show their first sentence when folded.
      summary: {
        ja: db.summary_ja || firstSentence(term.body.ja),
        zh: db.summary_zhtw || db.summary_zh || firstSentence(term.body.zh),
        en: db.summary_en  || firstSentence(term.body.en),
      },
      body: {
        ja: db.body_ja   || term.body.ja,
        zh: db.body_zhtw || db.body_zh || term.body.zh,
        en: db.body_en   || term.body.en,
      },
    }
  })

  return (
    <WikiContext.Provider value={{ articles, reload: load, ensure }}>
      {children}
    </WikiContext.Provider>
  )
}

export const useWiki = () => {
  const ctx = useContext(WikiContext)
  const { ensure } = ctx
  useEffect(() => { ensure() }, [ensure])
  return ctx
}
