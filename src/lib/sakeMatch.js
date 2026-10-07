import { supabase } from './supabase'

// 事典 ↔ 酒札: the catalog (sake_products) and people's records are typed independently,
// so a record belongs to a product when the brewery is the same and the names agree after
// normalising (spaces, 中黒, case, 火入/火入れ). A shorter product name contained in the
// record's full name also counts ("而今 特別純米 火入れ" ⊂ "而今 特別純米 火入").
export const normName = s => (s || '')
  .normalize('NFKC').toLowerCase()
  .replace(/[\s・･·.]/g, '')
  .replace(/火入れ/g, '火入')

export const entryFullName = e => normName(`${e.brand || ''}${e.name || ''}`)

export function entryMatchesProduct(entry, product) {
  if (!product?.name) return false
  if (entry.product_id) return entry.product_id === product.id // linked when recorded (or by the backfill)
  if (product.brewery_name && entry.brewery && entry.brewery !== product.brewery_name) return false
  const p = normName(product.name)
  const full = entryFullName(entry)
  const bare = normName(entry.name)
  if (!p || !full) return false
  if (p === full || p === bare) return true
  return p.length >= 4 && full.includes(p) && !!entry.brewery
}

// Public, published 酒札 — small enough (hundreds) to load once and match client-side.
const PUBLIC_COLS = 'id,user_id,product_id,brand,name,brewery,region,type,polishing,alcohol,smv,acidity,rice,yeast,rating,photo_url,thumb_url,photo_crop,contributor_name,created_at'
let publicCache = null
export function loadPublicEntries() {
  if (!publicCache) {
    publicCache = supabase.from('sake_entries').select(PUBLIC_COLS)
      .eq('is_public', true).eq('status', 'published')
      .order('created_at', { ascending: false }).limit(1000)
      .then(({ data }) => data || [])
    publicCache.catch(() => { publicCache = null })
  }
  return publicCache
}

// The first public bottle photo for a product, if any.
export const coverFor = (product, publicEntries) =>
  publicEntries.find(e => (e.thumb_url || e.photo_url) && entryMatchesProduct(e, product)) || null

// A recorded sake that has no catalogue row: its 酒款 page is assembled from the public records.
export const recordedKey = e => entryFullName(e)
export const recordedPath = e => `/wiki/sake/recorded?${new URLSearchParams({ brand: e.brand || '', name: e.name || '', brewery: e.brewery || '' })}`
