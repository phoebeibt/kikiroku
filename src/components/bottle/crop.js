// Shared crop model for the bottle template (stored in sake_entries.photo_crop).
//   x, y      translate in % of the template box (0 = centred)
//   scale     zoom relative to cover-fit (≥ 1)
//   rotation  degrees
//   maskType  template id; only 'standard' for now
export const BOTTLE_ASPECT = 3.5 // height / width — close to real 一升瓶 / 四合瓶
export const DEFAULT_CROP = Object.freeze({ x: 0, y: 0, scale: 1.5, rotation: 0, maskType: 'standard' })
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
