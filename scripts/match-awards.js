#!/usr/bin/env node
// Multi-pass fuzzy matching for sake_awards → sake_breweries / sake_brands.
// Uses prefecture to disambiguate homonym breweries (there are 122 duplicate-name groups).

import { readFile, writeFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

const BACKUPS = join(process.cwd(), 'backups')
const dirs = (await readdir(BACKUPS)).filter(d => /^\d{4}-/.test(d)).sort()
const src = join(BACKUPS, dirs.at(-1))
console.log(`Reading from ${src}\n`)

const [awards, breweries, brands, areas] = await Promise.all([
  readFile(join(src, 'sake_awards.json'),   'utf8').then(JSON.parse),
  readFile(join(src, 'sake_breweries.json'),'utf8').then(JSON.parse),
  readFile(join(src, 'sake_brands.json'),   'utf8').then(JSON.parse),
  readFile(join(src, 'sake_areas.json'),    'utf8').then(JSON.parse),
])

const areaById = new Map(areas.map(a => [a.id, a.name]))

// ---------- Normalization helpers ----------
const CORP_RE = /(株式会社|有限会社|合資会社|合名会社|合同会社|㈱|㈲|㈾|㈹)/g
const KANJI_MAP = {
  '國': '国', '髙': '高', '櫻': '桜', '﨑': '崎', '德': '徳', '澤': '沢',
  '瀧': '滝', '藏': '蔵', '眞': '真', '齋': '斎', '龜': '亀', '壽': '寿',
  '禮': '礼', '學': '学', '樂': '楽', '龍': '竜', '將': '将', '會': '会',
  '團': '団', '譽': '誉', '栁': '柳', '嶋': '島',
}
const normalizeKanji = s => (s || '').replace(/[國髙櫻﨑德澤瀧藏眞齋龜壽禮學樂龍將會團譽栁嶋]/g, ch => KANJI_MAP[ch] || ch)
const zenkakuAsciiToHan = s => (s || '').replace(/[！-～]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
const norm = s => normalizeKanji(zenkakuAsciiToHan((s || '').replace(/[\s　]/g, '').trim()))
const stripCorp = s => norm((s || '').replace(CORP_RE, ''))
const firstToken = s => (s || '').split(/[\s　]+/)[0]
const splitPipe = s => (s || '').split('|').map(x => x.trim()).filter(Boolean)

// ---------- Brewery index: stripped → [{ id, pref }] ----------
const brewByExact = new Map()          // exact raw name → id (unambiguous)
const brewGroups  = new Map()          // stripped norm → [{ id, pref }]
for (const b of breweries) {
  brewByExact.set(b.name, b.id)
  const key = stripCorp(b.name)
  if (!key) continue
  if (!brewGroups.has(key)) brewGroups.set(key, [])
  brewGroups.get(key).push({ id: b.id, pref: areaById.get(b.area_id) })
}

// Awards use short prefecture ("青森"), catalog uses long ("青森県"). Normalize both.
const normPref = s => (s || '').replace(/(県|府|都|道)$/, '')

function resolveBrew(candidates, awardPref) {
  if (!candidates || candidates.length === 0) return null
  if (candidates.length === 1) return candidates[0].id
  const p = normPref(awardPref)
  const byPref = candidates.filter(c => normPref(c.pref) === p)
  if (byPref.length === 1) return byPref[0].id
  // multiple candidates in same prefecture (catalog duplicates) → pick lowest id
  if (byPref.length > 1) return byPref.map(c => c.id).sort((a, b) => a - b)[0]
  // no prefecture match — ambiguous, leave NULL
  return null
}

// ---------- Brand index ----------
const brandByName     = new Map()  // exact raw
const brandByNormName = new Map()  // norm → brand
const brandsSorted    = [...brands].sort((a, b) => b.name.length - a.name.length)
for (const br of brands) {
  brandByName.set(br.name, br)
  brandByNormName.set(norm(br.name), br)
}

// ---------- Match brewery ----------
function matchBrewery(rawName, awardPref) {
  if (!rawName) return null
  if (brewByExact.has(rawName)) return { id: brewByExact.get(rawName), via: 'exact' }
  const s1 = stripCorp(rawName)
  if (brewGroups.has(s1)) {
    const id = resolveBrew(brewGroups.get(s1), awardPref)
    if (id) return { id, via: 'strip_corp' }
  }
  const noSpace = rawName.replace(/[　\s].*$/, '')
  const s2 = stripCorp(noSpace)
  if (brewGroups.has(s2)) {
    const id = resolveBrew(brewGroups.get(s2), awardPref)
    if (id) return { id, via: 'strip_trailing' }
  }
  for (const seg of splitPipe(rawName)) {
    const ss = stripCorp(seg)
    if (brewGroups.has(ss)) {
      const id = resolveBrew(brewGroups.get(ss), awardPref)
      if (id) return { id, via: 'pipe_seg' }
    }
    const ft = stripCorp(firstToken(seg))
    if (brewGroups.has(ft)) {
      const id = resolveBrew(brewGroups.get(ft), awardPref)
      if (id) return { id, via: 'pipe_first' }
    }
  }
  const rawStripped = stripCorp(rawName)
  for (const [bStripped, group] of brewGroups) {
    if (bStripped.length >= 3 && rawStripped.includes(bStripped)) {
      const id = resolveBrew(group, awardPref)
      if (id) return { id, via: 'contains' }
    }
  }
  return null
}

// ---------- Match brand ----------
function matchBrand(rawName, breweryId) {
  if (!rawName) return null
  if (brandByName.has(rawName)) {
    const b = brandByName.get(rawName)
    return { id: b.id, via: 'exact' }
  }
  const nRaw = norm(rawName)
  if (brandByNormName.has(nRaw)) {
    const b = brandByNormName.get(nRaw)
    return { id: b.id, via: 'norm_exact' }
  }
  const first = firstToken(rawName)
  const nFirst = norm(first)
  if (first !== rawName && brandByNormName.has(nFirst)) {
    const b = brandByNormName.get(nFirst)
    return { id: b.id, via: 'first_token' }
  }
  if (breweryId) {
    const byBrewery = brandsSorted.filter(b => b.brewery_id === breweryId)
    for (const b of byBrewery) {
      if (b.name.length >= 2 && (rawName.startsWith(b.name) || nRaw.startsWith(norm(b.name)))) {
        return { id: b.id, via: 'prefix_scoped' }
      }
    }
  }
  for (const b of brandsSorted) {
    if (b.name.length >= 3 && (rawName.startsWith(b.name) || nRaw.startsWith(norm(b.name)))) {
      return { id: b.id, via: 'prefix_global' }
    }
  }
  return null
}

// ---------- Run ----------
const plan = []
const stats = { brewery: {}, brand: {} }
const unmatchedBrewery = new Set()
const unmatchedBrand = new Set()

for (const a of awards) {
  const bm  = matchBrewery(a.brewery_name, a.prefecture)
  const brm = matchBrand(a.brand_name, bm?.id)
  plan.push({
    award_id: a.id,
    brewery_id: bm?.id ?? null,
    brand_id: brm?.id ?? null,
    _via_brewery: bm?.via,
    _via_brand: brm?.via,
  })
  stats.brewery[bm?.via ?? 'UNMATCHED']  = (stats.brewery[bm?.via ?? 'UNMATCHED']  || 0) + 1
  stats.brand  [brm?.via ?? 'UNMATCHED'] = (stats.brand  [brm?.via ?? 'UNMATCHED'] || 0) + 1
  if (!bm)  unmatchedBrewery.add(a.brewery_name)
  if (!brm) unmatchedBrand.add(a.brand_name)
}

console.log('=== BREWERY match ===')
for (const [k, v] of Object.entries(stats.brewery)) console.log(`  ${k.padEnd(15)} ${v}`)
console.log(`  → linked: ${awards.length - (stats.brewery.UNMATCHED || 0)} / ${awards.length}`)
console.log()

console.log('=== BRAND match ===')
for (const [k, v] of Object.entries(stats.brand)) console.log(`  ${k.padEnd(15)} ${v}`)
console.log(`  → linked: ${awards.length - (stats.brand.UNMATCHED || 0)} / ${awards.length}`)
console.log()

// Coverage of catalog breweries
const linkedBrewIds = new Set(plan.filter(p => p.brewery_id).map(p => p.brewery_id))
console.log(`=== Catalog brewery coverage: ${linkedBrewIds.size} / ${breweries.length} ===`)
console.log()

console.log('=== Unmatched brewery samples (20) ===')
;[...unmatchedBrewery].slice(0, 20).forEach(n => console.log(`  ${JSON.stringify(n)}`))
console.log()

const outFile = join(src, 'match-plan.json')
await writeFile(outFile, JSON.stringify(plan, null, 0))
console.log(`Match plan written: ${outFile}`)
