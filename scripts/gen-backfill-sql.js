#!/usr/bin/env node
// Convert match-plan.json → SQL file for Supabase SQL Editor.
// Splits into chunks of 2000 rows per UPDATE to stay well under any statement-size limit.

import { readFile, writeFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

const BACKUPS = join(process.cwd(), 'backups')
const dirs = (await readdir(BACKUPS)).filter(d => /^\d{4}-/.test(d)).sort()
const src = join(BACKUPS, dirs.at(-1))
const plan = JSON.parse(await readFile(join(src, 'match-plan.json'), 'utf8'))

// Keep only rows with at least one non-null FK.
const rows = plan.filter(p => p.brewery_id != null || p.brand_id != null)
console.log(`Rows to update: ${rows.length} / ${plan.length}`)

const CHUNK = 2000
const chunks = []
for (let i = 0; i < rows.length; i += CHUNK) chunks.push(rows.slice(i, i + CHUNK))

const out = []
out.push('-- Phase 1 Step 1.2: Backfill sake_awards.brewery_id / brand_id')
out.push('-- Generated from match-plan.json — do not edit by hand.')
out.push('-- Run in Supabase SQL Editor. Idempotent (WHERE clauses only update NULL cells).')
out.push('-- Safe to re-run; will not overwrite manually-corrected FKs.')
out.push('')
out.push('BEGIN;')
out.push('')

chunks.forEach((chunk, idx) => {
  out.push(`-- Chunk ${idx + 1}/${chunks.length} (${chunk.length} rows)`)
  out.push('UPDATE sake_awards a SET')
  out.push('  brewery_id = COALESCE(a.brewery_id, m.brewery_id),')
  out.push('  brand_id   = COALESCE(a.brand_id,   m.brand_id)')
  out.push('FROM (VALUES')
  const values = chunk.map(r => {
    const bid = r.brewery_id == null ? 'NULL::int' : `${r.brewery_id}::int`
    const brid = r.brand_id   == null ? 'NULL::int' : `${r.brand_id}::int`
    return `  ('${r.award_id}'::uuid, ${bid}, ${brid})`
  }).join(',\n')
  out.push(values)
  out.push(') AS m(award_id, brewery_id, brand_id)')
  out.push('WHERE a.id = m.award_id;')
  out.push('')
})

out.push('-- Verification: expect linked_brewery ≈ 10117, linked_brand ≈ 5533')
out.push('SELECT')
out.push('  COUNT(*)                                       AS total,')
out.push('  COUNT(*) FILTER (WHERE brewery_id IS NOT NULL) AS linked_brewery,')
out.push('  COUNT(*) FILTER (WHERE brand_id   IS NOT NULL) AS linked_brand')
out.push('FROM sake_awards;')
out.push('')
out.push('COMMIT;')

const outPath = join(process.cwd(), 'supabase/migrations/20260702_1010_backfill_awards_fk.sql')
await writeFile(outPath, out.join('\n'))
const size = (out.join('\n').length / 1024).toFixed(1)
console.log(`\nWrote ${outPath}`)
console.log(`Size: ${size} KB, chunks: ${chunks.length}`)
