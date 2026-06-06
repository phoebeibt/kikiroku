#!/usr/bin/env node
// Scrape National New Sake Competition (全国新酒鑑評会) award data from NRIB.
// Covers H14–R07 (2002–2025), ~400 breweries/year, gold + award status.
//
// Requires: pdftotext (brew install poppler), @supabase/supabase-js
// Usage:
//   SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/scrape-nrib-awards.mjs

import { createClient } from '@supabase/supabase-js'
import { execSync } from 'child_process'
import { writeFileSync, unlinkSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

const SUPABASE_URL = 'https://iqfgzxbwthdybokvafsi.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BASE = 'https://www.nrib.go.jp/data/kan/shinshu/award'
const DELAY = 1500

if (!SUPABASE_KEY) { console.error('❌  Set SUPABASE_SERVICE_ROLE_KEY'); process.exit(1) }

const db = createClient(SUPABASE_URL, SUPABASE_KEY)
const sleep = ms => new Promise(r => setTimeout(r, ms))

// All available years: H14..H30, R01..R07
const YEARS = [
  'H14','H15','H16','H17','H18','H19','H20','H21','H22','H23','H24',
  'H25','H26','H27','H28','H29','H30',
  'R01','R02','R03','R04','R05','R06',
]

// Convert JP era year to Western year
function eraToYear(era) {
  const m = era.match(/^([HR])(\d+)$/)
  if (!m) return null
  const n = parseInt(m[2])
  return m[1] === 'H' ? 1988 + n : 2018 + n
}

// PDF URL for a given year code
function pdfUrl(year) {
  const code = year.toLowerCase()
  return `${BASE}/pdf/${code}by_moku.pdf`
}

const PREF_SET = new Set(['北海道','青森','岩手','宮城','秋田','山形','福島','茨城','栃木',
  '群馬','埼玉','千葉','東京','神奈川','新潟','富山','石川','福井','山梨','長野',
  '静岡','愛知','三重','滋賀','京都','大阪','兵庫','奈良','和歌山','鳥取','島根',
  '岡山','広島','山口','徳島','香川','愛媛','高知','福岡','佐賀','長崎','熊本',
  '大分','宮崎','鹿児島','沖縄'])

const TAX_OFFICE_RE = /^(札幌|仙台|関東信越|東京|金沢|名古屋|大阪|広島|高松|福岡|熊本|沖縄)/

// New format (H27+): has 13-digit corp number as column anchor
function parsePdfNew(lines) {
  const records = []
  let currentPref = ''
  for (const rawLine of lines) {
    if (!rawLine.trim()) continue
    const corpMatch = rawLine.match(/(\d{13})/)
    if (!corpMatch) continue
    const corpNum = corpMatch[1]
    const corpIdx = rawLine.indexOf(corpNum)
    const leftTokens = rawLine.slice(0, corpIdx).split(/\s{2,}/).map(t => t.trim()).filter(Boolean)
    for (const tok of leftTokens) { if (PREF_SET.has(tok)) { currentPref = tok; break } }
    const brewery = leftTokens.findLast(t => !PREF_SET.has(t) && !TAX_OFFICE_RE.test(t))
      ?? leftTokens[leftTokens.length - 1]
    if (!brewery || brewery.length < 2) continue
    const afterCorp = rawLine.slice(corpIdx + 13).trim()
    const isGold = afterCorp.includes('☆')
    const brand = afterCorp.replace('☆', '').trim()
    if (!brand) continue
    records.push({ brewery_name: brewery, brand_name: brand, prefecture: currentPref, corp_number: corpNum, is_gold: isGold })
  }
  return records
}

// Old format (H14-H26): no corp number; columns are brewery name and brand separated by large spaces
function parsePdfOld(lines) {
  const records = []
  let currentPref = ''
  const SKIP = new Set(['国税局','都道府県','製造場名','商標名','金賞','入賞酒','金賞酒','商標名   金賞'])
  for (const rawLine of lines) {
    if (!rawLine.trim()) continue
    // Split by 4+ spaces to identify columns
    const tokens = rawLine.trim().split(/\s{4,}/).map(t => t.trim()).filter(t => t && !SKIP.has(t))
    if (tokens.length < 2) {
      // Single token: might be prefecture appearing on its own line
      if (tokens.length === 1 && PREF_SET.has(tokens[0])) currentPref = tokens[0]
      continue
    }
    // Determine if last token is ☆ (gold marker)
    const isGold = tokens[tokens.length - 1] === '☆' || rawLine.includes('☆')
    const withoutStar = tokens.filter(t => t !== '☆')
    // Last remaining token = brand name
    const brand = withoutStar[withoutStar.length - 1]
    // Tokens before brand: tax office, maybe prefecture, brewery name
    const leftTokens = withoutStar.slice(0, -1)
    // Update prefecture
    for (const tok of leftTokens) {
      // Prefecture may be embedded: "札幌   北海道 田中酒造" → after split "札幌   北海道 田中酒造" is one token
      for (const pref of PREF_SET) {
        if (tok.includes(pref)) { currentPref = pref; break }
      }
    }
    // Brewery = strip tax office and prefecture from the left token
    let breweryRaw = leftTokens[leftTokens.length - 1] ?? ''
    // Remove leading tax office
    breweryRaw = breweryRaw.replace(TAX_OFFICE_RE, '').trim()
    // Remove leading prefecture
    for (const pref of PREF_SET) {
      if (breweryRaw.startsWith(pref)) { breweryRaw = breweryRaw.slice(pref.length).trim(); break }
    }
    if (!breweryRaw || breweryRaw.length < 2 || SKIP.has(breweryRaw)) continue
    if (!brand || brand.length < 1 || SKIP.has(brand)) continue
    records.push({ brewery_name: breweryRaw, brand_name: brand, prefecture: currentPref, corp_number: null, is_gold: isGold })
  }
  return records
}

// Parse -layout pdftotext output into records — auto-detects format
function parsePdf(text) {
  const lines = text.split('\n')
  // Detect format by whether corp numbers (13 digits) appear in data rows
  const hasCorpNums = lines.some(l => /\d{13}/.test(l) && l.trim().length > 20)
  return hasCorpNums ? parsePdfNew(lines) : parsePdfOld(lines)
}

async function fetchPdf(url) {
  await sleep(DELAY)
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'ClaudeBot/1.0 (+https://anthropic.com/claude)' }
  })
  if (!resp.ok) return null
  return Buffer.from(await resp.arrayBuffer())
}

async function main() {
  // sake_awards table was created via SQL migration

  console.log('🏆 NRIB 全国新酒鑑評会 scraper\n')

  let totalInserted = 0
  const tmpPath = join(tmpdir(), 'nrib_award.pdf')

  for (const yearCode of YEARS) {
    const westernYear = eraToYear(yearCode)
    const url = pdfUrl(yearCode)
    process.stdout.write(`${yearCode} (${westernYear}) ... `)

    const pdfBuf = await fetchPdf(url)
    if (!pdfBuf) {
      // Try alternate URL patterns
      const url2 = `${BASE}/pdf/${yearCode.toLowerCase()}by_pre.pdf`
      const pdfBuf2 = await fetchPdf(url2)
      if (!pdfBuf2) { console.log('skip (no PDF)'); continue }
      writeFileSync(tmpPath, pdfBuf2)
    } else {
      writeFileSync(tmpPath, pdfBuf)
    }

    let text
    try {
      text = execSync(`pdftotext -layout "${tmpPath}" -`, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 })
    } catch (e) {
      console.log(`pdftotext failed: ${e.message.slice(0, 50)}`); continue
    }

    const records = parsePdf(text)
    console.log(`${records.length} records`)

    if (!records.length) continue

    // Upsert into sake_awards
    // Deduplicate within batch by unique key (year+brewery+brand)
    const seen = new Set()
    const rows = records
      .map(r => ({
        year:         westernYear,
        year_code:    yearCode,
        brewery_name: r.brewery_name,
        brand_name:   r.brand_name,
        prefecture:   r.prefecture,
        corp_number:  r.corp_number,
        is_gold:      r.is_gold,
      }))
      .filter(r => {
        const key = `${r.year}|${r.brewery_name}|${r.brand_name}`
        if (seen.has(key)) return false
        seen.add(key); return true
      })

    const { error, count } = await db
      .from('sake_awards')
      .upsert(rows, { onConflict: 'year,brewery_name,brand_name' })
      .select('id', { count: 'exact', head: true })

    if (error) console.warn(`  ⚠ DB: ${error.message}`)
    else totalInserted += rows.length
  }

  if (existsSync(tmpPath)) unlinkSync(tmpPath)
  console.log(`\n✅  Done: ~${totalInserted} award records upserted.\n`)
}

main().catch(e => { console.error(e); process.exit(1) })
