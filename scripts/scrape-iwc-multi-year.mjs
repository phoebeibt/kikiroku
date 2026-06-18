#!/usr/bin/env node
// Scrape IWC Sake results for multiple years and upsert into sake_awards.
// Usage: node scripts/scrape-iwc-multi-year.mjs [startYear] [endYear]
// Default: 2008–2025 (2026 already scraped)

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const env = Object.fromEntries(
  readFileSync(join(__dirname, '..', '.env.local'), 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const db = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const sleep = ms => new Promise(r => setTimeout(r, ms))
const BASE   = 'https://www.internationalwinechallenge.com/canopy/search_results'
const DELAY_MS = 600

// All years use _993276 suffix
const YEARS = []
const startYear = parseInt(process.argv[2] || 2008)
const endYear   = parseInt(process.argv[3] || 2025)
for (let y = startYear; y <= endYear; y++) YEARS.push(y)

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
  const blockRe = /<a\s[^>]*class="result"[^>]*>([\s\S]*?)<\/a>/g
  let m
  while ((m = blockRe.exec(html)) !== null) {
    const block = m[1]
    const name = (block.match(/<h2[^>]*>([\s\S]*?)<\/h2>/) || [])[1]?.replace(/\s+/g, ' ').trim() || ''
    const ps   = [...block.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map(x => x[1].replace(/\s+/g, ' ').trim())
    const producer  = (ps.find(p => p.startsWith('Produced by')) || '').replace(/^Produced by\s*/, '').trim()
    const regionRaw = (ps.find(p => p.startsWith('From')) || '').replace(/^From\s*/, '').replace(/,?\s*Japan.*$/i, '').trim()
    const medals = []
    ;[...block.matchAll(/\/([A-Za-z]+)_thumb\.png/g)].forEach(mx => medals.push(mx[1]))
    const sakeName = name.replace(/,\s*\d{4}(\/\d{4})?$/, '').trim()
    const prefecture = PREF[regionRaw] || regionRaw
    if (sakeName && producer) {
      results.push({ sake_name: sakeName, producer, prefecture, medals, is_gold: medals.some(m => m === 'Gold' || m === 'Trophy') })
    }
  }
  return results
}

function getMaxPage(html) {
  const nums = [...html.matchAll(/page=(\d+)/g)].map(m => parseInt(m[1]))
  return nums.length ? Math.max(...nums) : 1
}

async function fetchPage(year, page) {
  const url = `${BASE}?page=${page}&wpcat=SakeTab.S&Challenge_Year=${year}_993276`
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

async function scrapeYear(year) {
  // Get first page to detect total pages
  const firstHtml = await fetchPage(year, 1)
  const totalPages = getMaxPage(firstHtml)
  const firstEntries = parsePage(firstHtml)

  console.log(`  Year ${year}: ${totalPages} pages`)

  const all = [...firstEntries]
  process.stdout.write(`    [1/${totalPages}] ${firstEntries.length} entries\n`)

  for (let page = 2; page <= totalPages; page++) {
    await sleep(DELAY_MS)
    try {
      const html    = await fetchPage(year, page)
      const entries = parsePage(html)
      all.push(...entries)
      process.stdout.write(`    [${page}/${totalPages}] ${entries.length} entries\n`)
    } catch (e) {
      process.stdout.write(`    [${page}/${totalPages}] ❌ ${e.message}\n`)
    }
  }

  return all
}

async function upsertYear(year, entries) {
  const rows = entries.map(r => ({
    year,
    year_code: `IWC_${year}`,
    brand_name:   r.sake_name,
    brewery_name: r.producer,
    prefecture:   r.prefecture,
    is_gold:      r.is_gold,
  }))

  let upserted = 0
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100)
    const { error } = await db.from('sake_awards').upsert(chunk, { onConflict: 'year,brewery_name,brand_name' })
    if (error) console.warn(`  ⚠ upsert chunk ${i}: ${error.message}`)
    else upserted += chunk.length
  }
  return upserted
}

async function main() {
  console.log(`🍶  IWC Sake Scraper: ${startYear}–${endYear}\n`)

  const rawPath = join(__dirname, `iwc-multi-raw.json`)
  const allData = {}

  let totalEntries = 0
  let totalUpserted = 0

  for (const year of YEARS) {
    // Skip if already in sake_awards
    const { count } = await db.from('sake_awards').select('*', { count: 'exact', head: true })
      .eq('year_code', `IWC_${year}`)
    if (count > 0) {
      console.log(`⏭  ${year}: already in DB (${count} rows), skipping`)
      continue
    }

    console.log(`\n📥  Scraping ${year}...`)
    try {
      const entries = await scrapeYear(year)
      allData[year] = entries
      totalEntries += entries.length
      console.log(`  → ${entries.length} entries scraped`)

      const upserted = await upsertYear(year, entries)
      totalUpserted += upserted
      console.log(`  → ${upserted} rows upserted`)

      // Save progress after each year
      writeFileSync(rawPath, JSON.stringify(allData, null, 2))
    } catch (e) {
      console.error(`  ❌ ${year}: ${e.message}`)
    }

    await sleep(1000)
  }

  console.log(`\n✅  Done. ${totalEntries} entries scraped, ${totalUpserted} rows upserted.`)
  console.log(`Raw data → ${rawPath}`)
}

main().catch(e => { console.error(e); process.exit(1) })
