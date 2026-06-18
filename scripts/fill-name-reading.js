// Batch-fills name_reading (romaji) for sake_entries missing it.
// Usage: node scripts/fill-name-reading.js

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

async function main() {
  const { data: entries, error } = await db
    .from('sake_entries')
    .select('id, brand, name, brewery, region, type, rice, yeast, polishing, alcohol, smv, acidity')
    .is('name_reading', null)
    .not('name', 'is', null)
    .neq('name', '')

  if (error) throw error
  if (!entries?.length) { console.log('Nothing to fill.'); return }

  console.log(`Filling name_reading for ${entries.length} entries...\n`)

  for (const entry of entries) {
    try {
      // Pass all known fields so search-sake only needs to find name_reading
      const body = Object.fromEntries(
        Object.entries({
          brand: entry.brand, name: entry.name,
          brewery: entry.brewery, region: entry.region, type: entry.type,
          rice: entry.rice, yeast: entry.yeast,
          polishing: entry.polishing, alcohol: entry.alcohol,
          smv: entry.smv, acidity: entry.acidity,
        }).filter(([, v]) => v != null && v !== '')
      )

      const { data, error: fnErr } = await db.functions.invoke('search-sake', { body })
      if (fnErr) throw new Error(fnErr.message)
      if (!data?.name_reading) {
        console.log(`  skip  ${entry.id} (${[entry.brand, entry.name].filter(Boolean).join(' ')}): no reading returned`)
        continue
      }

      await db.from('sake_entries').update({ name_reading: data.name_reading }).eq('id', entry.id)
      console.log(`  ✓  ${entry.id}: "${[entry.brand, entry.name].filter(Boolean).join(' ')}" → "${data.name_reading}"`)
    } catch (e) {
      console.error(`  ✗  ${entry.id}: ${e.message}`)
    }
  }

  console.log('\nDone.')
}

main().catch(err => { console.error(err); process.exit(1) })
