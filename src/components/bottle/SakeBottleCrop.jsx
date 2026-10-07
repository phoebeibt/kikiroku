import { useState } from 'react'
import './bottle.css'

/**
 * Shows a photo cut to the outline of a standard 一升瓶 (≈ 1 : 2.75),
 * so list thumbnails read as "a bottle" rather than a whole bar scene.
 *
 * imageUrl  photo to crop; missing or broken → deep-green bottle silhouette
 * position  where the bottle sits in the photo, as object-position percentages
 *           { x: 0–100, y: 0–100 } (default centre). Stored per record later.
 * scale     zoom ≥ 1 applied around `position`, for manual alignment later.
 * height    rendered height (any CSS length); width follows the aspect ratio.
 */
export default function SakeBottleCrop({ imageUrl, position, scale = 1, height = '100%', alt = '', className = '' }) {
  const [failed, setFailed] = useState(false)
  const x = clamp(position?.x ?? 50, 0, 100)
  const y = clamp(position?.y ?? 50, 0, 100)
  const s = Math.max(1, Number(scale) || 1)
  const showPhoto = imageUrl && !failed

  return (
    <span className={`kk-bottle ${className}`} style={{ height }}>
      <span className={`kk-bottle__mask${showPhoto ? '' : ' is-empty'}`}>
        {showPhoto ? (
          <img
            src={imageUrl} alt={alt} loading="lazy" decoding="async" draggable="false"
            onError={() => setFailed(true)}
            style={{ objectPosition: `${x}% ${y}%`, transform: s !== 1 ? `scale(${s})` : undefined, transformOrigin: `${x}% ${y}%` }}
          />
        ) : (
          <span className="kk-bottle__label" aria-hidden="true" />
        )}
      </span>
    </span>
  )
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, Number(v)))
