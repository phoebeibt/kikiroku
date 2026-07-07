// Round 2: 7 more brand duplicate pairs (safe-only — okurigana / の-乃-ノ,
// kana↔kanji cases where research confirms same brand, not product-line split).

import fs from 'node:fs'

const env = fs.readFileSync('.env.local', 'utf8')
const SUPABASE_URL = env.match(/VITE_SUPABASE_URL=(.+)/)[1].trim()
const SERVICE_KEY  = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim()

const pairs = [
  // [ brewery, keep_id, drop_id, keep_name, drop_name, note ]
  [786,   805,   1513,  '梅乃宿',   '梅の宿',    '乃/の 傳統寫法'],
  [982,   1538,  1539,  '飛び切り',  '飛切り',    '送り仮名'],
  [1123,  1772,  2884,  '松乃井',   '松の井',    '乃/の 傳統寫法'],
  [605,   993,   3660,  '角の井',   '角ノ井',    'の/ノ'],
  [231,   323,   1677,  'いづみ橋',  '泉橋',     '假名→漢字（官方いづみ橋）'],
  [134,   3629,  1641,  '喜多の華',  'きたのはな',  '假名→漢字'],
  [1321,  3562,  73784, '月吉野',   'つきよしの',  '假名→漢字'],
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
    // 1. Reassign sake_awards.brand_id if any
    const aw = await req(`/sake_awards?select=id&brand_id=eq.${drop}`, 'GET')
    if (aw.length > 0) {
      await req(`/sake_awards?brand_id=eq.${drop}`, 'PATCH', { brand_id: keep })
      awardsUpdated += aw.length
      console.log(`  [awards] ${aw.length} rows reassigned: ${drop} → ${keep}`)
    }
    // 2. Delete the duplicate brand
    await req(`/sake_brands?id=eq.${drop}`, 'DELETE')
    brandsDeleted++
    console.log(`  [brand] deleted id=${drop} "${dropName}" — kept id=${keep} "${keepName}" (brewery=${brew}, ${note})`)
  }
  console.log(`\n✓ ${brandsDeleted} brand rows deleted, ${awardsUpdated} award FKs reassigned`)
})().catch(e => { console.error('FAILED:', e.message); process.exit(1) })
