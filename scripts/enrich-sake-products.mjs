#!/usr/bin/env node
// Enrich existing sake_products with SMV (日本酒度), acidity (酸度), yeast (酵母).
// Re-visits product pages from saketime.jp and updates NULL fields only.
//
// Usage:
//   SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/enrich-sake-products.mjs
//
// Estimated time: ~90 min for 4,353 products (1.2s crawl delay).
// Safe to re-run — only updates rows where smv IS NULL.

import { createClient } from '@supabase/supabase-js'
import { parse as parseHtml } from 'node-html-parser'

const SUPABASE_URL = 'https://iqfgzxbwthdybokvafsi.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const DELAY = 1200   // ms — respects robots.txt Crawl-delay: 1

if (!SUPABASE_KEY) {
  console.error('❌  Set SUPABASE_SERVICE_ROLE_KEY env var')
  process.exit(1)
}

const db = createClient(SUPABASE_URL, SUPABASE_KEY)
const sleep = ms => new Promise(r => setTimeout(r, ms))

async function fetchPage(url) {
  await sleep(DELAY)
  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'ClaudeBot/1.0 (+https://anthropic.com/claude)',
        'Accept-Language': 'ja,en;q=0.8',
        'Accept': 'text/html,application/xhtml+xml',
      }
    })
    if (!r.ok) { process.stdout.write(` HTTP${r.status}`); return null }
    return r.text()
  } catch (e) {
    process.stdout.write(` err:${e.message.slice(0, 30)}`)
    return null
  }
}

function parseFields(html) {
  const body = parseHtml(html).text ?? ''

  // SMV (日本酒度): +12, -3, ±0 etc.
  const smvM = body.match(/日本酒度[：:]\s*([±+\-]?\d+(?:\.\d+)?)/)
  const smv = smvM ? smvM[1].trim() : null

  // Acidity (酸度)
  const acidM = body.match(/酸度[：:]\s*(\d+(?:\.\d+)?)/)
  const acidity = acidM ? parseFloat(acidM[1]) : null

  // Yeast (酵母 or 使用酵母)
  const yeastM = body.match(/(?:使用)?酵母[：:]\s*([^\n\r、,，・]+)/)
  const yeast = yeastM ? yeastM[1].trim().slice(0, 60) : null

  // Also re-parse polishing / alcohol in case original missed them
  const polishM = body.match(/精米歩合[：:]\s*(\d+)/)
  const polishing = polishM ? parseFloat(polishM[1]) : null

  const alcM = body.match(/アルコール度(?:数)?[：:]\s*(\d+(?:\.\d+)?)/)
  const alcohol = alcM ? parseFloat(alcM[1]) : null

  return { smv, acidity, yeast, polishing, alcohol }
}

async function main() {
  // Fetch all products that still need enrichment (smv IS NULL)
  const { data: rows, error } = await db
    .from('sake_products')
    .select('id, source_url, smv, acidity, yeast, polishing, alcohol')
    .is('smv', null)
    .not('source_url', 'is', null)
    .order('created_at', { ascending: true })

  if (error) { console.error('DB error:', error.message); process.exit(1) }
  console.log(`\n🍶 Enriching ${rows.length} products (smv IS NULL)...\n`)

  let updated = 0, skipped = 0, failed = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    process.stdout.write(`[${i + 1}/${rows.length}] ${row.source_url} ...`)

    const html = await fetchPage(row.source_url)
    if (!html) { failed++; console.log(' skip'); continue }

    const fields = parseFields(html)

    // Build update payload — only overwrite NULL fields
    const update = {}
    if (fields.smv     !== null)                          update.smv      = fields.smv
    if (fields.acidity !== null && !row.acidity)          update.acidity  = fields.acidity
    if (fields.yeast   !== null && !row.yeast)            update.yeast    = fields.yeast
    if (fields.polishing !== null && !row.polishing)      update.polishing = fields.polishing
    if (fields.alcohol  !== null && !row.alcohol)         update.alcohol  = fields.alcohol

    if (Object.keys(update).length === 0) {
      skipped++
      console.log(' (no new data)')
      continue
    }

    const { error: upErr } = await db
      .from('sake_products')
      .update(update)
      .eq('id', row.id)

    if (upErr) {
      failed++
      console.log(` ⚠ ${upErr.message}`)
    } else {
      updated++
      const summary = Object.entries(update)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ')
      console.log(` ✓ ${summary}`)
    }
  }

  console.log(`\n✅  Done: ${updated} updated, ${skipped} no-data, ${failed} failed.\n`)
}

main().catch(e => { console.error(e); process.exit(1) })
