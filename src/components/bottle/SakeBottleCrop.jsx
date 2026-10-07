import { useState } from 'react'
import { normalizeCrop, cropTransform } from './crop'
import './bottle.css'

/**
 * A photo seen through the standard sake-bottle template (≈ 1 : 3.5).
 * The original photo is never altered; `crop` only says how it sits in the template.
 *
 * imageUrl  photo (pass the list thumbnail when there is one); missing/broken → silhouette
 * crop      { x, y, scale, rotation, maskType } — see ./crop.js. Omitted → centred, ×1.5
 * height    rendered height (any CSS length); width follows the template ratio
 */
export default function SakeBottleCrop({ imageUrl, crop, height = '100%', alt = '', className = '' }) {
  const [failed, setFailed] = useState(false)
  const c = normalizeCrop(crop)
  const showPhoto = imageUrl && !failed

  return (
    <span className={`kk-bottle ${className}`} style={{ height }} data-mask={c.maskType}>
      <span className={`kk-bottle__mask${showPhoto ? '' : ' is-empty'}`}>
        {showPhoto ? (
          <img src={imageUrl} alt={alt} loading="lazy" decoding="async" draggable="false"
            onError={() => setFailed(true)} style={{ transform: cropTransform(c) }} />
        ) : (<>
          <span className="kk-bottle__cap" aria-hidden="true" />
          <span className="kk-bottle__label" aria-hidden="true" />
        </>)}
      </span>
    </span>
  )
}
