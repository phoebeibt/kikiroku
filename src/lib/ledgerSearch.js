// マイ帳 search: every term must match somewhere in the record, and each match
// reports *where* it was found so the list can explain why a record appeared.
import { toJP } from './cjkNormalize.js'

const KATA_TO_HIRA = s => s.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60))

export const norm = s => KATA_TO_HIRA(toJP(String(s ?? '')).normalize('NFKC').toLowerCase()).replace(/\s+/g, ' ').trim()

export const splitTerms = q => norm(q).split(' ').filter(Boolean)

// Field order = priority when a term matches several places.
// `kind: 'tag'` fields hold tag ids; ctx.tagNames(id, category) returns every
// language's label so 「梨」, 「洋梨」 and "pear" all find the same tag.
const FIELDS = [
  { key: 'name',    get: e => [e.brand, e.name, e.name_reading] },
  { key: 'reading', get: (e, ctx) => ctx.readings?.(e) || [] },
  { key: 'brewery', get: e => [e.brewery] },
  { key: 'region',  get: e => [e.region] },
  { key: 'type',    get: e => [e.type], kind: 'tag', category: 'type' },
  { key: 'aroma',   get: e => e.aroma_tags || [], kind: 'tag', category: 'aroma' },
  { key: 'taste',   get: e => e.taste_tags || [], kind: 'tag', category: 'taste' },
  { key: 'tags',    get: e => e.tags || [], kind: 'tag', category: 'flavor' },
  { key: 'method',  get: e => e.method_tags || [], kind: 'tag', category: 'method' },
  { key: 'rice',    get: e => [e.rice] },
  { key: 'yeast',   get: e => [e.yeast] },
  { key: 'notes',   get: e => [e.notes] },
]

// Fields whose match is self-evident from the card, so no "found in …" line.
const SILENT = new Set(['name', 'reading'])

function snippet(text, term, radius = 10) {
  const n = norm(text)
  const i = n.indexOf(term)
  if (i < 0) return text.slice(0, radius * 2)
  // norm() keeps length for CJK/ASCII text closely enough to cut the original.
  const start = Math.max(0, i - radius)
  const end = Math.min(text.length, i + term.length + radius)
  return (start > 0 ? '…' : '') + text.slice(start, end).replace(/\s+/g, ' ') + (end < text.length ? '…' : '')
}

/**
 * @returns null when the entry does not match; otherwise an array of hits
 *          [{ field, value }] (value = display text: tag label or note snippet).
 */
export function matchEntry(entry, terms, ctx = {}) {
  if (!terms.length) return []
  const hits = []
  for (const term of terms) {
    let found = null
    for (const f of FIELDS) {
      const values = f.get(entry, ctx).filter(Boolean)
      for (const v of values) {
        if (f.kind === 'tag') {
          const names = ctx.tagNames ? ctx.tagNames(v, f.category) : [v]
          if ([v, ...names].some(x => norm(x).includes(term))) {
            found = { field: f.key, value: ctx.tagLabel ? ctx.tagLabel(v, f.category) : v }
            break
          }
        } else if (norm(v).includes(term)) {
          found = { field: f.key, value: f.key === 'notes' ? snippet(String(v), term) : String(v) }
          break
        }
      }
      if (found) break
    }
    if (!found) return null
    if (!SILENT.has(found.field) && !hits.some(h => h.field === found.field && h.value === found.value)) hits.push(found)
  }
  return hits
}
