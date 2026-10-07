// 廣場 rating tiers (design: kikiroku-plaza-tanuki-scene-cards-v3).
// Colour, tanuki scene and stamp follow the score band; the number itself always stays visible.
export const PLAZA_TIERS = [
  { id: 'treasure', min: 5,   stamp: 'bottle-paw', ja: '宝物札',         zh: '寶物札',   en: 'Treasure' },
  { id: 'again',    min: 4.5, stamp: 'bottle',     ja: 'また飲みたい',   zh: '還想再喝', en: 'Would drink again' },
  { id: 'good',     min: 4,   stamp: 'bottle',     ja: 'いい記録',       zh: '好記錄',   en: 'A good one' },
  { id: 'linger',   min: 3.5, stamp: 'tag',        ja: '余韻あり',       zh: '有餘韻',   en: 'Lingers' },
  { id: 'plain',    min: 3,   stamp: 'book',       ja: 'ふつうに記録',   zh: '普通記錄', en: 'Just noted' },
  { id: 'notmine',  min: 0,   stamp: 'tag',        ja: '好みではない',   zh: '不合口味', en: 'Not for me' },
]

// No rating (or a guest, who may not see ratings) → the neutral paper tier without a scene.
export function tierFor(rating) {
  const r = Number(rating)
  if (!(r > 0)) return null
  return PLAZA_TIERS.find(t => r >= t.min)
}

// ⚠️ TEMPORARY: round crops of the v3 concept board. Replace with the designer's 6 transparent
// tanuki (≥256×256, body cut at the lower edge) and switch the card to the peek-over-the-edge layout.
export const tanukiSrc = tier => `/plaza/tanuki-${tier.id}.webp`
