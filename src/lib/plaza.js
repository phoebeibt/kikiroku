import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'

// The fields 自分も記録 copies into a new record (never notes, rating or photos).
export const forwardFrom = e => ({
  product_id: e.product_id || null,
  brand: e.brand, name: e.name, brewery: e.brewery, region: e.region, type: e.type,
  alcohol: e.alcohol, rice: e.rice, polishing: e.polishing, smv: e.smv, acidity: e.acidity, yeast: e.yeast,
})

// The signed-in user's 飲みたい set, with an optimistic toggle.
export function useWishes(session) {
  const [wishes, setWishes] = useState(() => new Set())
  const uid = session?.user?.id
  useEffect(() => {
    if (!uid) return
    supabase.from('sake_wishes').select('entry_id').eq('user_id', uid)
      .then(({ data }) => setWishes(new Set((data || []).map(w => w.entry_id))))
  }, [uid])
  const toggle = useCallback(async entryId => {
    if (!uid) return
    const on = wishes.has(entryId)
    setWishes(prev => { const s = new Set(prev); if (on) s.delete(entryId); else s.add(entryId); return s })
    const { error } = on
      ? await supabase.from('sake_wishes').delete().eq('user_id', uid).eq('entry_id', entryId)
      : await supabase.from('sake_wishes').insert({ user_id: uid, entry_id: entryId })
    if (error) setWishes(prev => { const s = new Set(prev); if (on) s.add(entryId); else s.delete(entryId); return s })
  }, [uid, wishes])
  return { wishes, toggle }
}

// 「12分前」-style time for public 酒札.
export function relativeTime(iso, lang) {
  if (!iso) return ''
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  const L = (ja, zh, en) => (lang === 'ja' ? ja : lang === 'zh' ? zh : en)
  if (diff < 3600) { const m = Math.max(1, Math.round(diff / 60)); return L(`${m}分前`, `${m} 分鐘前`, `${m}m ago`) }
  if (diff < 86400) { const h = Math.round(diff / 3600); return L(`${h}時間前`, `${h} 小時前`, `${h}h ago`) }
  if (diff < 86400 * 30) { const d = Math.round(diff / 86400); return L(`${d}日前`, `${d} 天前`, `${d}d ago`) }
  return iso.slice(0, 10).replaceAll('-', '.')
}
