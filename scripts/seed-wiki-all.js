#!/usr/bin/env node
// Read WIKI_TERMS from src/lib/wiki.js and generate a SQL seed file
// that inserts all 70 entries into wiki_articles with ON CONFLICT DO NOTHING.
//
// After seed:
// - Existing DB rows preserved (any manual Studio edits kept)
// - Missing rows filled from static WIKI_TERMS content
// - Wiki content becomes primarily DB-managed (Phase 4 goal)
// - Static WIKI_TERMS array still holds the term trigger keywords
//   (matched against page text for tooltip triggering) — that's kept in code

import { readFile, writeFile } from 'node:fs/promises'
import { WIKI_TERMS } from '../src/lib/wiki.js'

const OUT = new URL('../supabase/migrations/20260703_3100_seed_wiki_all.sql', import.meta.url).pathname

const escSQL = (s) => (s || '').replace(/'/g, "''")

const rows = WIKI_TERMS.map(t => {
  const title = t.title || {}
  const body = t.body || {}
  // summary — use title text (short label); user can edit richer summary in Studio later
  const summary_ja   = title.ja || null
  const summary_zh   = title.zh || null
  const summary_en   = title.en || null
  const summary_zhtw = null  // fallback to summary_zh in WikiContext
  const body_ja      = body.ja || null
  const body_zh      = body.zh || null
  const body_en      = body.en || null
  const body_zhtw    = null  // fallback to body_zh
  return { id: t.id, summary_ja, summary_zh, summary_zhtw, summary_en,
           body_ja, body_zh, body_zhtw, body_en }
})

const lines = []
lines.push(`-- Phase 4: Seed all 70 static WIKI_TERMS content into wiki_articles.`)
lines.push(`-- Run in Supabase SQL Editor. Idempotent — ON CONFLICT DO NOTHING`)
lines.push(`-- preserves any manual Studio edits and existing rows.`)
lines.push(``)
lines.push(`INSERT INTO wiki_articles (term_id, summary_ja, summary_zh, summary_zhtw, summary_en, body_ja, body_zh, body_zhtw, body_en) VALUES`)

const valueLines = rows.map(r => {
  const cells = [
    `'${escSQL(r.id)}'`,
    r.summary_ja   != null ? `'${escSQL(r.summary_ja)}'`   : 'NULL',
    r.summary_zh   != null ? `'${escSQL(r.summary_zh)}'`   : 'NULL',
    r.summary_zhtw != null ? `'${escSQL(r.summary_zhtw)}'` : 'NULL',
    r.summary_en   != null ? `'${escSQL(r.summary_en)}'`   : 'NULL',
    r.body_ja      != null ? `'${escSQL(r.body_ja)}'`      : 'NULL',
    r.body_zh      != null ? `'${escSQL(r.body_zh)}'`      : 'NULL',
    r.body_zhtw    != null ? `'${escSQL(r.body_zhtw)}'`    : 'NULL',
    r.body_en      != null ? `'${escSQL(r.body_en)}'`      : 'NULL',
  ]
  return `  (${cells.join(', ')})`
})
lines.push(valueLines.join(',\n'))
lines.push(`ON CONFLICT (term_id) DO NOTHING;`)
lines.push(``)
lines.push(`-- Verification: expect ~70 total rows`)
lines.push(`SELECT COUNT(*) AS total FROM wiki_articles;`)

await writeFile(OUT, lines.join('\n'))
const size = (lines.join('\n').length / 1024).toFixed(1)
console.log(`Wrote ${OUT}`)
console.log(`Rows: ${rows.length} · Size: ${size} KB`)
