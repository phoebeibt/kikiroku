#!/usr/bin/env node
// Annotate sake_breweries and sake_brands with furigana + romaji using kuromoji.
// Requires: kuromoji, wanakana (npm install kuromoji wanakana)
// Run: SUPABASE_SERVICE_ROLE_KEY=... node scripts/annotate-readings.mjs

import { createClient } from '@supabase/supabase-js'
import kuromoji from 'kuromoji'
import { toRomaji, toHiragana } from 'wanakana'

const SUPABASE_URL = 'https://iqfgzxbwthdybokvafsi.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_KEY) { console.error('❌  Set SUPABASE_SERVICE_ROLE_KEY'); process.exit(1) }

const db = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── Romaji helpers ──────────────────────────────────────────────────────────
// wanakana toRomaji with Hepburn + long-vowel compression (ou→o, uu→u)
function kata2romaji(kata) {
  if (!kata) return ''
  const raw = toRomaji(kata, { upcaseKatakana: false })
  return raw
    .replace(/ou/g, 'o')
    .replace(/uu/g, 'u')
    .replace(/\s+/g, '')
}

function kata2hira(kata) {
  return kata ? toHiragana(kata) : ''
}

// Build kuromoji tokenizer (resolves once)
function buildTokenizer() {
  return new Promise((resolve, reject) => {
    kuromoji.builder({ dicPath: 'node_modules/kuromoji/dict' }).build((err, tok) => {
      err ? reject(err) : resolve(tok)
    })
  })
}

// Tokenize a name → reading in katakana (fall back to surface_form)
function getReading(tokenizer, name) {
  const tokens = tokenizer.tokenize(name)
  const kata = tokens.map(t => t.reading || t.surface_form).join('')
  // If result is all ASCII / no kana, kuromoji had no data — return null
  if (/^[a-zA-Z\s\-・]+$/.test(kata)) return null
  return kata
}

// ── DB helpers ──────────────────────────────────────────────────────────────
async function fetchAll(table, cols) {
  const rows = []
  const PAGE = 1000
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db.from(table).select(cols).range(from, from + PAGE - 1)
    if (error) throw error
    rows.push(...(data || []))
    if ((data || []).length < PAGE) break
  }
  return rows
}

async function batchUpdate(table, rows) {
  // Update in parallel batches of 50 — avoids the NOT NULL constraint issue with upsert
  const PARALLEL = 50
  for (let i = 0; i < rows.length; i += PARALLEL) {
    const chunk = rows.slice(i, i + PARALLEL)
    await Promise.all(chunk.map(r => {
      const { id, furigana, romaji } = r
      return db.from(table).update({ furigana, romaji }).eq('id', id)
    }))
    process.stdout.write('.')
  }
  console.log()
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔤  Building kuromoji tokenizer…')
  const tok = await buildTokenizer()
  console.log('✓  Tokenizer ready\n')

  // ── 1. sake_breweries ──
  console.log('📍  Fetching sake_breweries…')
  const breweries = await fetchAll('sake_breweries', 'id,name')
  console.log(`    ${breweries.length} rows`)

  let bSkipped = 0
  const breweryUpdates = breweries.map(b => {
    const kata = getReading(tok, b.name)
    if (!kata) { bSkipped++; return null }
    return { id: b.id, furigana: kata2hira(kata), romaji: kata2romaji(kata) }
  }).filter(Boolean)

  console.log(`    Annotated ${breweryUpdates.length} / ${breweries.length}  (${bSkipped} skipped — no reading)`)
  process.stdout.write('    Saving ')
  await batchUpdate('sake_breweries', breweryUpdates)

  // ── 2. sake_brands ──
  console.log('🍶  Fetching sake_brands…')
  const brands = await fetchAll('sake_brands', 'id,name')
  console.log(`    ${brands.length} rows`)

  let brSkipped = 0
  const brandUpdates = brands.map(b => {
    const kata = getReading(tok, b.name)
    if (!kata) { brSkipped++; return null }
    return { id: b.id, furigana: kata2hira(kata), romaji: kata2romaji(kata) }
  }).filter(Boolean)

  console.log(`    Annotated ${brandUpdates.length} / ${brands.length}  (${brSkipped} skipped)`)
  process.stdout.write('    Saving ')
  await batchUpdate('sake_brands', brandUpdates)

  console.log('\n✅  Done.')
}

main().catch(e => { console.error(e); process.exit(1) })
