// Tag hygiene pass 2026-07-07:
//   1. Add 3 new canonical tags: blend (method), lychee (aroma), local-sake (flavor)
//   2. Remap legacy free-text values in entries to canonical ids across
//      the correct category array. Also drop the orphan 'sweet-aroma' value.

import fs from 'node:fs'

const env = fs.readFileSync('.env.local', 'utf8')
const SUPABASE_URL = env.match(/VITE_SUPABASE_URL=(.+)/)[1].trim()
const SERVICE_KEY  = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim()

async function req(path, method, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation,resolution=merge-duplicates',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${text}`)
  return text ? JSON.parse(text) : null
}

// ── Step 1: Insert new canonical tags ────────────────────────────────
const NEW_TAGS = [
  { id: 'blend',      category: 'method', ja: 'ブレンド',  zh: '混釀',    en: 'Blend',       sort_order: 100, is_active: true },
  { id: 'lychee',     category: 'aroma',  ja: 'ライチ',    zh: '荔枝',    en: 'Lychee',      sort_order: 100, is_active: true },
  { id: 'local-sake', category: 'flavor', ja: '地酒',      zh: '地酒',    en: 'Local Sake',  sort_order: 100, is_active: true },
]

// ── Step 2: Per-entry remap plan ─────────────────────────────────────
// { id, aroma_tags, taste_tags, method_tags, tags } — new values
const ENTRY_UPDATES = [
  { id: '797f0ae0-ad70-4429-9573-89dd272f420c', method_tags: ['blend'],        tags: [] },
  { id: '36ed4954-d361-4fc4-9c75-a7b6dd6018b3', taste_tags: ['crisp'],          tags: [] },
  { id: '81041a8a-2da8-4494-b16f-80c690b8a2ad', taste_tags: ['long-finish'],    tags: [] },
  { id: '54d77295-093b-41dd-9a80-f967ff3ba615', taste_tags: ['long-finish'],    tags: [] },
  { id: '442cd64b-4a44-41c8-bb18-ed97aa6b1c49', taste_tags: ['sweet','light-body','crisp'], tags: ['osusume'] },
  { id: 'f176fd6a-f4f7-4e83-a151-06c542fdefdb', aroma_tags: ['lychee'],         tags: [] },
  { id: '63b54ec4-0bf8-4344-933e-957d9a94859a', tags: ['pairing'] },  // dedupe 寿司→pairing (pairing already present)
  { id: 'f6a83dae-d104-4209-b904-336d6edaf6f2', tags: ['discovery','local-sake'] },
  { id: '163e1f92-fdde-43e3-b3d3-9f6d7673fc19', aroma_tags: ['pear'] },  // drop 'sweet-aroma' orphan
]

;(async () => {
  console.log('Step 1 — inserting new canonical tags...')
  for (const t of NEW_TAGS) {
    await req(`/sake_tags?on_conflict=id`, 'POST', [t])
    console.log(`  ✓ ${t.id} (${t.category})`)
  }

  console.log('\nStep 2 — remapping entry tag arrays...')
  for (const u of ENTRY_UPDATES) {
    const { id, ...patch } = u
    await req(`/sake_entries?id=eq.${id}`, 'PATCH', patch)
    console.log(`  ✓ ${id.slice(0, 8)} — updated: ${Object.keys(patch).join(', ')}`)
  }

  console.log('\nDone.')
})().catch(e => { console.error('FAILED:', e.message); process.exit(1) })
