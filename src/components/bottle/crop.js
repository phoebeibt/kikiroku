// Shared crop model for the bottle template (stored in sake_entries.photo_crop).
//   x, y      translate in % of the template box (0 = centred)
//   scale     zoom relative to cover-fit (≥ 1)
//   rotation  degrees
//   maskType  template id; only 'standard' for now
export const BOTTLE_ASPECT = 3.5 // height / width — close to real 一升瓶 / 四合瓶
export const DEFAULT_CROP = Object.freeze({ x: 0, y: 0, scale: 1.5, rotation: 0, maskType: 'standard' })
// Abstracted standard sake bottle (四合瓶 / 一升瓶 proportions): cap, straight neck ≈35% of the
// body, a long gentle shoulder that reaches full width just before mid-height, straight body,
// slightly wide base with small heel radius. Points are (x%, y%) of the 1:3.5 box.
export const BOTTLE_POINTS = '35,0 65,0 66,3.6 66,27 68,30 72.5,33 79,36.3 86,39.6 91.5,42.8 94.8,45.6 96,48.5 96,96.5 94.6,98.9 91.5,100 8.5,100 5.4,98.9 4,96.5 4,48.5 5.2,45.6 8.5,42.8 14,39.6 21,36.3 27.5,33 32,30 34,27 34,3.6'
export const BOTTLE_CLIP = 'polygon(35% 0%, 65% 0%, 66% 3.6%, 66% 27%, 68% 30%, 72.5% 33%, 79% 36.3%, 86% 39.6%, 91.5% 42.8%, 94.8% 45.6%, 96% 48.5%, 96% 96.5%, 94.6% 98.9%, 91.5% 100%, 8.5% 100%, 5.4% 98.9%, 4% 96.5%, 4% 48.5%, 5.2% 45.6%, 8.5% 42.8%, 14% 39.6%, 21% 36.3%, 27.5% 33%, 32% 30%, 34% 27%, 34% 3.6%)'
export const MIN_SCALE = 1
export const MAX_SCALE = 4

export function normalizeCrop(c) {
  const n = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d)
  return {
    x: n(c?.x, DEFAULT_CROP.x),
    y: n(c?.y, DEFAULT_CROP.y),
    scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, n(c?.scale, DEFAULT_CROP.scale))),
    rotation: ((n(c?.rotation, 0) % 360) + 360) % 360,
    maskType: c?.maskType || DEFAULT_CROP.maskType,
  }
}

export const cropTransform = c => `translate(${c.x}%, ${c.y}%) scale(${c.scale}) rotate(${c.rotation}deg)`
