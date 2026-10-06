// Canonical sake type ids (= sake_tags rows with category 'type').
// Label scans and the product catalogue hand us raw kanji like 「純米吟醸」;
// everything written to sake_entries.type must go through normalizeType.
const KANJI_TO_ID = {
  '純米': 'junmai',
  '特別純米': 'tokubetsu-junmai',
  '純米吟醸': 'junmai-ginjo',
  '純米大吟醸': 'junmai-daiginjo',
  '本醸造': 'honjozo',
  '特別本醸造': 'tokubetsu-honjozo',
  '吟醸': 'ginjo',
  '大吟醸': 'daiginjo',
  '普通酒': 'futsushu',
  'その他': 'other',
}

export const SAKE_TYPE_IDS = Object.values(KANJI_TO_ID)

export function normalizeType(raw) {
  if (!raw) return ''
  const v = String(raw).trim()
  if (SAKE_TYPE_IDS.includes(v)) return v
  const kanji = v.replace(/[（(].*?[）)]/g, '').replace(/\s+/g, '')
  // Older catalogue rows sometimes use 釀 (traditional) for 醸.
  const unified = kanji.replace(/釀/g, '醸')
  return KANJI_TO_ID[unified] || ''
}
