// Localize brand / brewery entity names for display.
//
// Rule (from kikiroku-sake-naming铁律):
// - Reading is ALWAYS romaji, never pinyin.
// - name_zh only for cases where Chinese has a different written form
//   (simplified variants, official Chinese trademark). Mostly empty.
// - name_en for official English trademark; empty means fall back to romaji.
// - When name_zh / name_en are empty, display Japanese kanji (entity.name).
//
// Usage:
//   const { kanji, reading } = displayName(brand, lang)
//   → kanji: main display text (獺祭 or Dassai etc.)
//   → reading: romaji reading for sub-line (Dassai)

export function displayName(entity, lang) {
  if (!entity) return { kanji: '', reading: '' }
  const isZh = lang === 'zh' || lang === 'zh-tw'
  const isEn = lang === 'en'
  const kanji =
    (isZh && entity.name_zh) ? entity.name_zh :
    (isEn && entity.name_en) ? entity.name_en :
    entity.name || ''
  return {
    kanji,
    reading: entity.romaji || '',
  }
}

// Simpler variant: just the display string. Uses ja→zh→en priority for
// context that doesn't need reading (e.g., inline mentions).
export function displayNameOnly(entity, lang) {
  return displayName(entity, lang).kanji
}
