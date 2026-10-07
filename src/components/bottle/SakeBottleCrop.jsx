import { useState } from 'react'
import { BOTTLE_ASPECT, normalizeCrop, cropTransform } from './crop'
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
  const [ratio, setRatio] = useState(null) // natural width / height, known after load
  const c = normalizeCrop(crop)
  const showPhoto = imageUrl && !failed

  // Same geometry as BottleCropEditor: the WHOLE photo at cover-fit size, centred, then
  // translate (in % of the template box) · scale · rotate. Sizing the <img> to the box with
  // object-fit would clip the photo to the box before moving it and expose the backdrop.
  let imgStyle = { transform: cropTransform(c) }
  if (ratio) {
    const boxRatio = 1 / BOTTLE_ASPECT
    const wp = ratio >= boxRatio ? (ratio / boxRatio) * 100 : 100 // img width in % of box width
    const hp = ratio >= boxRatio ? 100 : (boxRatio / ratio) * 100 // img height in % of box height
    imgStyle = {
      position: 'absolute', left: '50%', top: '50%', width: `${wp}%`, height: `${hp}%`, maxWidth: 'none', objectFit: 'fill',
      transform: `translate(-50%, -50%) translate(${(c.x * 100) / wp}%, ${(c.y * 100) / hp}%) scale(${c.scale}) rotate(${c.rotation}deg)`,
    }
  }

  return (
    <span className={`kk-bottle ${className}`} style={{ height }} data-mask={c.maskType}>
      <span className={`kk-bottle__mask${showPhoto ? '' : ' is-empty'}`}>
        {showPhoto ? (
          <img src={imageUrl} alt={alt} loading="lazy" decoding="async" draggable="false"
            onError={() => setFailed(true)} style={imgStyle}
            onLoad={e => { const { naturalWidth: w, naturalHeight: h } = e.currentTarget; if (w && h) setRatio(w / h) }} />
        ) : (<>
          <span className="kk-bottle__cap" aria-hidden="true" />
          <span className="kk-bottle__label" aria-hidden="true" />
        </>)}
      </span>
    </span>
  )
}
