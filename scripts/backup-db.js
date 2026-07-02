#!/usr/bin/env node
// Data-only backup via Supabase REST (service_role).
// Reads SUPABASE_URL and SUPABASE_SERVICE_KEY from env.
// Writes one JSON file per table to backups/<timestamp>/.

import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const URL = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_KEY
if (!URL || !KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const TABLES = [
  'sake_entries',
  'sake_brands',
  'sake_breweries',
  'sake_areas',
  'sake_awards',
  'sake_wishes',
  'sake_products',
  'wiki_articles',
  'invite_codes',
]

const PAGE = 1000
const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const outDir = join(process.cwd(), 'backups', ts)
await mkdir(outDir, { recursive: true })

async function dumpTable(name) {
  const rows = []
  let from = 0
  while (true) {
    const to = from + PAGE - 1
    const res = await fetch(`${URL}/rest/v1/${name}?select=*`, {
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        Range: `${from}-${to}`,
        Prefer: 'count=exact',
      },
    })
    if (!res.ok) {
      const body = await res.text()
      return { name, ok: false, error: `${res.status} ${body.slice(0, 200)}` }
    }
    const chunk = await res.json()
    rows.push(...chunk)
    if (chunk.length < PAGE) break
    from += PAGE
  }
  await writeFile(join(outDir, `${name}.json`), JSON.stringify(rows, null, 2))
  return { name, ok: true, count: rows.length }
}

console.log(`Backing up to ${outDir}\n`)
const results = []
for (const t of TABLES) {
  process.stdout.write(`  ${t.padEnd(20)} ... `)
  const r = await dumpTable(t)
  results.push(r)
  console.log(r.ok ? `${r.count} rows` : `SKIP (${r.error})`)
}

const summary = {
  timestamp: ts,
  supabase_url: URL,
  results,
}
await writeFile(join(outDir, '_summary.json'), JSON.stringify(summary, null, 2))
console.log(`\nDone. ${results.filter(r => r.ok).length}/${TABLES.length} tables backed up.`)
console.log(`Summary: ${join(outDir, '_summary.json')}`)
