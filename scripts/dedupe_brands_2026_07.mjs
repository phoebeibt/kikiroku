// One-shot: merge 8 duplicate brand pairs (category 1+2 — case, whitespace,
// old-form vs new-form kanji, non-standard variants).
// Reassigns any sake_awards.brand_id → keep_id, then deletes drop_id rows.
// Verified: zero sake_entries.brand strings reference the drop names.

import fs from 'node:fs'

const env = fs.readFileSync('.env.local', 'utf8')
const SUPABASE_URL = env.match(/VITE_SUPABASE_URL=(.+)/)[1].trim()
const SERVICE_KEY  = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim()

const pairs = [
  // [ brewery_id, keep_id, drop_id, keep_name, drop_name, note ]
  [800,  2816, 2815, 'KISS of FIRE',   'KISS OF FIRE',   'case'],
  [102,  3394, 2150, 'ささのはさらさら',    'ささのは さらさら',    'whitespace'],
  [144,  217,  1642, '会津',             '會津',             '旧字体'],
  [185,  3277, 2190, '巖',              '巌',              '旧字体'],
  [1359, 3793, 3786, '出羽の富士',        '出羽の冨士',        '異体字'],
  [480,  651,  2873, '妙の華',           '妙の花',           '異体字'],
  [868,  1291, 1292, '日の出',           '日乃出',           '異体字'],
  [1159, 2692, 2780, '達磨正宗',          'ダルマ正宗',        'カナ→漢字'],
]

async function req(path, method, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${text}`)
  return text ? JSON.parse(text) : null
}

;(async () => {
  console.log(`Processing ${pairs.length} merge pairs...\n`)
  let awardsUpdated = 0, brandsDeleted = 0
  for (const [brew, keep, drop, keepName, dropName, note] of pairs) {
    // 1. Reassign any sake_awards.brand_id
    const awardsBefore = await req(`/sake_awards?select=id&brand_id=eq.${drop}`, 'GET')
    if (awardsBefore.length > 0) {
      await req(`/sake_awards?brand_id=eq.${drop}`, 'PATCH', { brand_id: keep })
      awardsUpdated += awardsBefore.length
      console.log(`  [awards] ${awardsBefore.length} rows reassigned: ${drop} → ${keep}`)
    }
    // 2. Delete duplicate brand
    await req(`/sake_brands?id=eq.${drop}`, 'DELETE')
    brandsDeleted++
    console.log(`  [brand] deleted id=${drop} "${dropName}" — kept id=${keep} "${keepName}" (brewery=${brew}, ${note})`)
  }
  console.log(`\n✓ ${brandsDeleted} brand rows deleted, ${awardsUpdated} award FKs reassigned`)
})().catch(e => { console.error('FAILED:', e.message); process.exit(1) })
