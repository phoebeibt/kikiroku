import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { normalizeRegion } from './region'
import { typeKanji } from './sakeType'

const num = v => {
  const n = parseFloat(String(v ?? '').replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : null
}
const txt = v => (v == null ? '' : String(v)).trim() || null

/**
 * The 事典 product (sake_products) for a sake: its own product_id, a same-name catalogue row,
 * or — when `create` — a new row contributed from these fields. Returns the id or null.
 */
export async function ensureProduct(src, { create = true } = {}) {
  if (src.product_id) return src.product_id
  const fullName = [src.brand, src.name].map(txt).filter(Boolean).join(' ')
  if (!fullName) return null
  const { data: found } = await supabase.from('sake_products').select('id').ilike('name', fullName).limit(1)
  if (found?.[0]?.id) return found[0].id
  if (!create) return null
  const { data: made } = await supabase.from('sake_products').insert({
    name:         fullName,
    brewery_name: txt(src.brewery),
    region:       normalizeRegion(src.region) || null,
    type:         typeKanji(src.type),
    rice:         txt(src.rice),
    yeast:        txt(src.yeast),
    polishing:    num(src.polishing),
    alcohol:      num(src.alcohol),
    smv:          txt(src.smv),
    acidity:      num(src.acidity),
  }).select('id').single()
  return made?.id || null
}

/**
 * The signed-in user's 飲みたい. A wish belongs to a 事典 product; the 酒札 it was saved from is
 * kept as its source. An entry counts as wished when its own row or its product is on the list.
 */
export function useWishes(session) {
  const uid = session?.user?.id
  const [rows, setRows] = useState([])
  useEffect(() => {
    if (!uid) return
    supabase.from('sake_wishes').select('id,entry_id,product_id').eq('user_id', uid)
      .then(({ data }) => setRows(data || []))
  }, [uid])

  const rowsFor = useCallback((entry, productId) => rows.filter(r =>
    (entry && r.entry_id === entry.id) || (productId && r.product_id === productId)), [rows])
  const isWished = useCallback(entry => rowsFor(entry, entry?.product_id).length > 0, [rowsFor])
  const isWishedProduct = useCallback(productId => !!productId && rows.some(r => r.product_id === productId), [rows])

  // Returns the product id when a wish was added (the 事典 row may have just been created).
  // `entry` is the source 酒札 (null when adding from 事典); `sake` is the sake in forwardFrom()
  // shape (product_id, brand, name, brewery, …) and defaults to the entry itself.
  const toggleWish = useCallback(async (entry, sake = entry) => {
    if (!uid || !sake) return
    const hits = rowsFor(entry, sake.product_id)
    if (hits.length) {
      const ids = new Set(hits.map(r => r.id))
      setRows(prev => prev.filter(r => !ids.has(r.id)))
      const { error } = await supabase.from('sake_wishes').delete().in('id', [...ids])
      if (error) setRows(prev => [...prev, ...hits])
      return null
    }
    const temp = { id: `tmp-${Date.now()}`, entry_id: entry?.id || null, product_id: sake.product_id || null }
    setRows(prev => [...prev, temp])
    const productId = await ensureProduct(sake)
    const { data, error } = await supabase.from('sake_wishes')
      .insert({ user_id: uid, entry_id: entry?.id || null, product_id: productId }).select('id,entry_id,product_id').single()
    setRows(prev => (error ? prev.filter(r => r !== temp) : prev.map(r => (r === temp ? data : r))))
    return error ? null : productId
  }, [uid, rowsFor])

  return { isWished, isWishedProduct, toggleWish }
}
