import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { WIKI_TERMS } from '../lib/wiki'

const WikiContext = createContext({ articles: [], reload: () => {} })

export function WikiProvider({ children }) {
  const [dbMap, setDbMap] = useState({})

  const load = useCallback(async () => {
    const { data } = await supabase.from('wiki_articles').select('*')
    if (!data) return
    const map = {}
    for (const row of data) map[row.term_id] = row
    setDbMap(map)
  }, [])

  useEffect(() => { load() }, [load])

  // Merge static terms with DB content (DB wins for summary/body)
  // zh uses Traditional Chinese (zhtw) as primary, falling back to zh
  const articles = WIKI_TERMS.map(term => {
    const db = dbMap[term.id] || {}
    return {
      ...term,
      summary: {
        ja: db.summary_ja || null,
        zh: db.summary_zhtw || db.summary_zh || null,
        en: db.summary_en  || null,
      },
      body: {
        ja: db.body_ja   || term.body.ja,
        zh: db.body_zhtw || db.body_zh || term.body.zh,
        en: db.body_en   || term.body.en,
      },
    }
  })

  return (
    <WikiContext.Provider value={{ articles, reload: load }}>
      {children}
    </WikiContext.Provider>
  )
}

export const useWiki = () => useContext(WikiContext)
