// One-time migration: extract brand (銘柄) from existing sake_entries.name
// Uses the existing search-sake edge function — no extra API key needed.
// Usage: node scripts/migrate-brand-data.js

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const env = Object.fromEntries(
  readFileSync(join(__dirname, '..', '.env.local'), 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)

const db = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }

async function main() {
  const { data: entries, error } = await db
    .from('sake_entries')
    .select('id, name')
    .is('brand', null)
    .not('name', 'is', null)
    .neq('name', '')

  if (error) throw error
  if (!entries?.length) { console.log('Nothing to migrate.'); return }

  console.log(`Migrating ${entries.length} entries...\n`)

  for (const entry of entries) {
    try {
      const { data, error: fnErr } = await db.functions.invoke('search-sake', {
        body: { name: entry.name }
      })
      if (fnErr) throw new Error(fnErr.message)
      if (!data?.brand) { console.log(`  skip  ${entry.id}: no brand returned`); continue }

      const brand = data.brand.trim()
      const newName = entry.name
        .replace(new RegExp('^' + escapeRegex(brand) + '\\s*'), '')
        .trim() || null

      await db.from('sake_entries').update({ brand, name: newName }).eq('id', entry.id)
      console.log(`  ✓  ${entry.id}: brand="${brand}"  name="${newName || ''}"`)
    } catch (e) {
      console.error(`  ✗  ${entry.id} (${entry.name}): ${e.message}`)
    }
  }

  console.log('\nDone.')
}

main().catch(err => { console.error(err); process.exit(1) })
