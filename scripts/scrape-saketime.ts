#!/usr/bin/env -S deno run --allow-net --allow-env
//
// Scrape sake product data from saketime.jp into Supabase sake_products table.
// Usage:
//   SUPABASE_SERVICE_ROLE_KEY=your_key deno run --allow-net --allow-env scripts/scrape-saketime.ts
//
// Respects robots.txt: ClaudeBot allowed, 1-second crawl delay.
// Run time: ~1-2 hours depending on number of products found.

import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? 'https://iqfgzxbwthdybokvafsi.supabase.co'
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const BASE = 'https://saketime.jp'
const DELAY = 1200  // 1.2s — respects robots.txt Crawl-delay: 1

if (!SUPABASE_KEY) {
  console.error('❌  Set SUPABASE_SERVICE_ROLE_KEY env var')
  Deno.exit(1)
}

const db = createClient(SUPABASE_URL, SUPABASE_KEY)
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function get(path: string): Promise<string | null> {
  await sleep(DELAY)
  try {
    const r = await fetch(`${BASE}${path}`, {
      headers: {
        'User-Agent': 'ClaudeBot/1.0 (+https://anthropic.com/claude)',
        'Accept-Language': 'ja,en;q=0.8',
        'Accept': 'text/html,application/xhtml+xml',
      }
    })
    if (!r.ok) { console.warn(`  HTTP ${r.status}: ${path}`); return null }
    return r.text()
  } catch (e) {
    console.warn(`  Fetch error ${path}:`, (e as Error).message)
    return null
  }
}

function dom(html: string) {
  return new DOMParser().parseFromString(html, 'text/html')
}

// Prefecture English slug → Japanese
const PREF_MAP: Record<string, string> = {
  hokkaido:'北海道', aomori:'青森県', iwate:'岩手県', miyagi:'宮城県',
  akita:'秋田県', yamagata:'山形県', fukushima:'福島県', ibaraki:'茨城県',
  tochigi:'栃木県', gunma:'群馬県', saitama:'埼玉県', chiba:'千葉県',
  tokyo:'東京都', kanagawa:'神奈川県', niigata:'新潟県', toyama:'富山県',
  ishikawa:'石川県', fukui:'福井県', yamanashi:'山梨県', nagano:'長野県',
  shizuoka:'静岡県', aichi:'愛知県', mie:'三重県', shiga:'滋賀県',
  kyoto:'京都府', osaka:'大阪府', hyogo:'兵庫県', nara:'奈良県',
  wakayama:'和歌山県', tottori:'鳥取県', shimane:'島根県', okayama:'岡山県',
  hiroshima:'広島県', yamaguchi:'山口県', tokushima:'徳島県', kagawa:'香川県',
  ehime:'愛媛県', kochi:'高知県', fukuoka:'福岡県', saga:'佐賀県',
  nagasaki:'長崎県', kumamoto:'熊本県', oita:'大分県', miyazaki:'宮崎県',
  kagoshima:'鹿児島県', okinawa:'沖縄県',
}

const TYPE_PATTERNS = ['純米大吟醸','純米吟醸','大吟醸','吟醸','特別純米','純米','本醸造','普通酒']

// Extract all brand IDs from ranking pages
async function getBrandIds(): Promise<Set<number>> {
  const ids = new Set<number>()
  for (let page = 1; page <= 9; page++) {
    process.stdout.write(`Ranking page ${page}/9 ... `)
    const html = await get(`/ranking/page:${page}`)
    if (!html) { console.log('skipped'); continue }
    const doc = dom(html)
    let found = 0
    doc?.querySelectorAll('a[href]').forEach(a => {
      const m = (a.getAttribute('href') ?? '').match(/^\/brands\/(\d+)\/?$/)
      if (m) { ids.add(parseInt(m[1])); found++ }
    })
    console.log(`${found} brands`)
  }
  return ids
}

// Get brewery info + product IDs from a brand page
async function getBrandPage(brandId: number) {
  const html = await get(`/brands/${brandId}/`)
  if (!html) return null
  const doc = dom(html)

  // Region from /ranking/<slug>/ link
  let region = ''
  doc?.querySelectorAll('a[href]').forEach(a => {
    const m = (a.getAttribute('href') ?? '').match(/^\/ranking\/([a-z]+)\/$/)
    if (m && PREF_MAP[m[1]]) region = PREF_MAP[m[1]]
  })

  // Brewery name: text of anchor pointing to #maker, or a h2 near top
  let breweryName = ''
  doc?.querySelectorAll('a[href]').forEach(a => {
    if ((a.getAttribute('href') ?? '').includes('#maker') && !breweryName) {
      breweryName = a.textContent?.trim() ?? ''
    }
  })

  // Product links /products/{id}/
  const productIds = new Set<number>()
  doc?.querySelectorAll('a[href]').forEach(a => {
    const m = (a.getAttribute('href') ?? '').match(/^\/products\/(\d+)\/?$/)
    if (m) productIds.add(parseInt(m[1]))
  })

  return { breweryName, region, productIds }
}

// Get specs from an individual product page
async function getProductPage(productId: number) {
  const html = await get(`/products/${productId}/`)
  if (!html) return null
  const doc = dom(html)
  const body = doc?.body?.textContent ?? ''

  // Product name from h1 or <title>
  const h1 = doc?.querySelector('h1')?.textContent?.trim()
  let name = h1 ?? ''
  if (!name) {
    const title = doc?.querySelector('title')?.textContent ?? ''
    // Title format: "十四代 純米大吟醸 龍泉 高木酒造/山形県 | 日本酒評価SAKETIME"
    name = title.split('|')[0].trim().split('/')[0].split('　')[0].trim()
  }
  if (!name) return null

  // Parse spec line: 原料米：山田錦、精米歩合：35%、アルコール度：16%
  const rice = body.match(/原料米[：:]\s*([^、\s\n（(]+)/)?.[1]?.trim() ?? null
  const polishing = body.match(/精米歩合[：:]\s*(\d+)/)?.[1] ? parseFloat(body.match(/精米歩合[：:]\s*(\d+)/)![1]) : null
  const alcohol = body.match(/アルコール度(?:数)?[：:]\s*(\d+(?:\.\d+)?)/)?.[1] ? parseFloat(body.match(/アルコール度(?:数)?[：:]\s*(\d+(?:\.\d+)?)/)![1]) : null
  const smvM = body.match(/日本酒度[：:]\s*([±+\-]?\d+(?:\.\d+)?)/)
  const smv = smvM ? smvM[1].trim() : null
  const acidM = body.match(/酸度[：:]\s*(\d+(?:\.\d+)?)/)
  const acidity = acidM ? parseFloat(acidM[1]) : null
  const yeastM = body.match(/(?:使用)?酵母[：:]\s*([^\n\r、,，・]{1,60})/)
  const yeast = yeastM ? yeastM[1].trim() : null

  const type = TYPE_PATTERNS.find(t => name.includes(t) || body.includes(t)) ?? null

  return { name, type, rice, polishing, alcohol, smv, acidity, yeast }
}

async function main() {
  console.log('🍶 Starting saketime.jp scrape...\n')

  const brandIds = await getBrandIds()
  console.log(`\n✓ ${brandIds.size} brands to process\n`)

  let done = 0, skipped = 0
  const brandArr = [...brandIds]

  for (let bi = 0; bi < brandArr.length; bi++) {
    const brandId = brandArr[bi]
    process.stdout.write(`[${bi + 1}/${brandArr.length}] Brand ${brandId} ... `)

    const brand = await getBrandPage(brandId)
    if (!brand || brand.productIds.size === 0) { console.log('skipped'); skipped++; continue }

    console.log(`${brand.breweryName} (${brand.region}) — ${brand.productIds.size} products`)

    for (const productId of brand.productIds) {
      process.stdout.write(`    /products/${productId}/ `)
      const prod = await getProductPage(productId)
      if (!prod) { console.log('skip'); continue }

      console.log(`→ ${prod.name}`)

      const { error } = await db.from('sake_products').upsert({
        name:         prod.name,
        brewery_name: brand.breweryName || null,
        region:       brand.region || null,
        type:         prod.type || null,
        rice:         prod.rice || null,
        polishing:    prod.polishing,
        alcohol:      prod.alcohol,
        smv:          prod.smv,
        acidity:      prod.acidity,
        yeast:        prod.yeast,
        source_url:   `${BASE}/products/${productId}/`,
      }, { onConflict: 'source_url' })

      if (error) console.warn(`    ⚠ DB: ${error.message}`)
      else done++
    }
  }

  console.log(`\n✅  Done: ${done} products saved, ${skipped} brands skipped.`)
}

main().catch(e => { console.error(e); Deno.exit(1) })
