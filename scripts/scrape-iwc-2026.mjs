#!/usr/bin/env node
// Scrape IWC 2026 Sake Competition results → sake_awards table + match against your sake_entries.
// Usage: node scripts/scrape-iwc-2026.mjs

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const env = Object.fromEntries(
  readFileSync(join(__dirname, '..', '.env.local'), 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)

const SUPABASE_URL = env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_KEY) { console.error('❌  Set SUPABASE_SERVICE_ROLE_KEY'); process.exit(1) }
const db = createClient(SUPABASE_URL, SUPABASE_KEY)

const sleep = ms => new Promise(r => setTimeout(r, ms))

const BASE   = 'https://www.internationalwinechallenge.com/canopy/search_results'
const PARAMS = 'wpcat=SakeTab.S&Challenge_Year=2026_993276'
const TOTAL_PAGES = 78
const DELAY_MS    = 800

// English prefecture → Japanese
const PREF = {
  'Hokkaido':'北海道','Aomori':'青森','Iwate':'岩手','Miyagi':'宮城','Akita':'秋田',
  'Yamagata':'山形','Fukushima':'福島','Ibaraki':'茨城','Tochigi':'栃木','Gunma':'群馬',
  'Saitama':'埼玉','Chiba':'千葉','Tokyo':'東京','Kanagawa':'神奈川','Niigata':'新潟',
  'Toyama':'富山','Ishikawa':'石川','Fukui':'福井','Yamanashi':'山梨','Nagano':'長野',
  'Shizuoka':'静岡','Aichi':'愛知','Mie':'三重','Shiga':'滋賀','Kyoto':'京都',
  'Osaka':'大阪','Hyogo':'兵庫','Nara':'奈良','Wakayama':'和歌山','Tottori':'鳥取',
  'Shimane':'島根','Okayama':'岡山','Hiroshima':'広島','Yamaguchi':'山口',
  'Tokushima':'徳島','Kagawa':'香川','Ehime':'愛媛','Kochi':'高知','Fukuoka':'福岡',
  'Saga':'佐賀','Nagasaki':'長崎','Kumamoto':'熊本','Oita':'大分','Miyazaki':'宮崎',
  'Kagoshima':'鹿児島','Okinawa':'沖縄',
}

function parsePage(html) {
  const results = []
  // Each entry: <a class="result" href="beverage_details?...">...</a>; title in <h2>
  const blockRe = /<a\s[^>]*class="result"[^>]*>([\s\S]*?)<\/a>/g
  let m
  while ((m = blockRe.exec(html)) !== null) {
    const block = m[1]

    const name = (block.match(/<h2[^>]*>([\s\S]*?)<\/h2>/) || [])[1]?.replace(/\s+/g, ' ').trim() || ''
    const ps   = [...block.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map(x => x[1].replace(/\s+/g, ' ').trim())
    const producer  = (ps.find(p => p.startsWith('Produced by')) || '').replace(/^Produced by\s*/, '').trim()
    const regionRaw = (ps.find(p => p.startsWith('From')) || '').replace(/^From\s*/, '').replace(/,?\s*Japan.*$/i, '').trim()
    const rice      = (ps.find(p => p.startsWith('Made with')) || '').replace(/^Made with\s*/, '').trim()

    const medals = [];
    [...block.matchAll(/\/([A-Za-z]+)_thumb\.png/g)].forEach(mx => medals.push(mx[1]))

    const sakeName  = name.replace(/,\s*\d{4}(\/\d{4})?$/, '').trim()
    const prefecture = PREF[regionRaw] || regionRaw

    if (sakeName && producer) {
      results.push({ sake_name: sakeName, producer, region_en: regionRaw, prefecture, rice, medals, is_gold: medals.some(m => m === 'Gold' || m === 'Trophy') })
    }
  }
  return results
}

async function fetchPage(page) {
  const url = `${BASE}?page=${page}&${PARAMS}`
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; kikiroku-research/1.0)' } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.text()
    } catch (e) {
      if (attempt === 3) throw e
      await sleep(2000 * attempt)
    }
  }
}

async function main() {
  console.log('🍶  IWC 2026 Sake Scraper\n')

  // ── 1. Scrape ───────────────────────────────────────────────
  const all = []
  for (let page = 1; page <= TOTAL_PAGES; page++) {
    process.stdout.write(`  [${page}/${TOTAL_PAGES}] `)
    try {
      const html    = await fetchPage(page)
      const entries = parsePage(html)
      all.push(...entries)
      process.stdout.write(`${entries.length} entries\n`)
    } catch (e) {
      process.stdout.write(`❌ ${e.message}\n`)
    }
    if (page < TOTAL_PAGES) await sleep(DELAY_MS)
  }
  console.log(`\nTotal scraped: ${all.length} entries`)

  const rawPath = join(__dirname, 'iwc-2026-raw.json')
  writeFileSync(rawPath, JSON.stringify(all, null, 2))
  console.log(`Raw data → ${rawPath}`)

  // ── 2. Upsert into sake_awards ──────────────────────────────
  console.log('\nUpserting into sake_awards...')
  const rows = all.map(r => ({
    year:         2026,
    brand_name:   r.sake_name,
    brewery_name: r.producer,
    prefecture:   r.prefecture,
    is_gold:      r.is_gold,
  }))

  let upserted = 0
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100)
    const { error } = await db.from('sake_awards').upsert(chunk, { onConflict: 'year,brewery_name,brand_name' })
    if (error) console.warn(`  ⚠ chunk ${i}: ${error.message}`)
    else upserted += chunk.length
  }
  console.log(`Upserted ${upserted} award records.`)

  // ── 3. Match against sake_entries ──────────────────────────
  console.log('\nMatching against your sake_entries...')
  const { data: entries } = await db.from('sake_entries')
    .select('id, brand, name, name_reading, brewery, region')

  const normalize = s => (s || '').toLowerCase().replace(/[\s\-_,.()]/g, '')

  const matches = []
  for (const award of all) {
    const aNorm = normalize(award.sake_name)
    const pNorm = normalize(award.producer)

    for (const e of entries || []) {
      let score = 0

      // Region (exact prefecture match = strong signal)
      if (e.region && e.region === award.prefecture) score += 2

      // Name: IWC English name vs romaji name_reading
      const readNorm = normalize(e.name_reading)
      if (readNorm.length >= 4 && aNorm.includes(readNorm.slice(0, 5))) score += 3
      if (readNorm.length >= 4 && readNorm.includes(aNorm.slice(0, 5))) score += 3

      // Brand: IWC name contains brand name (in case brand romaji is embedded)
      const brandNorm = normalize(e.brand)
      if (brandNorm.length >= 3 && aNorm.includes(brandNorm)) score += 2

      // Brewery partial match
      const brewNorm = normalize(e.brewery || '')
      if (brewNorm.length >= 4 && pNorm.includes(brewNorm.slice(0, 4))) score += 1

      if (score >= 4) {
        matches.push({
          score,
          entry_id:      e.id,
          entry_brand:   e.brand,
          entry_name:    e.name,
          entry_brewery: e.brewery,
          entry_region:  e.region,
          iwc_sake_name: award.sake_name,
          iwc_producer:  award.producer,
          iwc_prefecture: award.prefecture,
          iwc_medals:    award.medals,
          is_gold:       award.is_gold,
        })
      }
    }
  }

  matches.sort((a, b) => b.score - a.score)
  const matchesPath = join(__dirname, 'iwc-2026-matches.json')
  writeFileSync(matchesPath, JSON.stringify(matches, null, 2))

  if (matches.length === 0) {
    console.log('\nNo high-confidence matches found (score ≥ 4).')
    console.log('Your entries may need name_reading values, or try the raw data manually.')
  } else {
    console.log(`\n✨  ${matches.length} match(es) with your entries:\n`)
    matches.forEach(m => {
      console.log(`  [score ${m.score}] 📖  ${m.entry_brand || ''} ${m.entry_name || ''} (${m.entry_region || ''})`)
      console.log(`           🏅  ${m.iwc_sake_name} — ${m.iwc_medals.join(' + ')} — ${m.iwc_producer}`)
      console.log()
    })
  }

  console.log(`Matches saved → ${matchesPath}`)
  console.log('\n✅  Done.')
}

main().catch(e => { console.error(e); process.exit(1) })
