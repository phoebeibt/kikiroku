import { useCallback, useEffect, useRef, useState } from 'react'
import Sheet, { CloseIcon } from '../ui/Sheet'
import { BOTTLE_ASPECT, BOTTLE_POINTS, DEFAULT_CROP, MAX_SCALE, MIN_SCALE, normalizeCrop } from './crop'
import './bottle.css'
import './editor.css'


/**
 * Manual alignment of a photo to the bottle template. No detection — the user
 * drags / pinches / rotates until the bottle roughly fills the outline.
 * The rendering maths match SakeBottleCrop (cover-fit, then translate % · scale · rotate),
 * so what is saved here is exactly what lists show.
 * Mount it per photo (key={src}) so it starts from that photo's `initial` crop.
 */
export default function BottleCropEditor({ open, src, initial, onSave, onSkip, onClose, lang = 'ja', sideLabel, title, extraActions, saving = false }) {
  const L = (ja, zh, en) => (lang === 'ja' ? ja : lang === 'zh' ? zh : en)
  const [crop, setCrop] = useState(() => normalizeCrop(initial))
  const [nat, setNat] = useState(null)        // natural image size
  const [box, setBox] = useState({ w: 0, h: 0 })
  const frameRef = useRef(null)
  const pointers = useRef(new Map())
  const gesture = useRef(null)

  // Template box: as tall as the frame allows, width from the bottle ratio.
  useEffect(() => {
    if (!open) return
    const el = frameRef.current
    if (!el) return
    const measure = () => {
      const h = Math.max(200, el.clientHeight - 64)
      setBox({ w: h / BOTTLE_ASPECT, h })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [open])

  const set = useCallback(fn => setCrop(c => normalizeCrop(typeof fn === 'function' ? fn(c) : fn)), [])

  const onPointerDown = e => {
    e.currentTarget.setPointerCapture?.(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    gesture.current = null
  }
  const onPointerMove = e => {
    if (!pointers.current.has(e.pointerId) || !box.w) return
    const prev = pointers.current.get(e.pointerId)
    const cur = { x: e.clientX, y: e.clientY }
    if (pointers.current.size === 1) {
      const dx = cur.x - prev.x, dy = cur.y - prev.y
      set(c => ({ ...c, x: c.x + (dx / box.w) * 100, y: c.y + (dy / box.h) * 100 }))
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.entries()].map(([id, p]) => (id === e.pointerId ? cur : p))
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      if (gesture.current) set(c => ({ ...c, scale: c.scale * (dist / gesture.current) }))
      gesture.current = dist
    }
    pointers.current.set(e.pointerId, cur)
  }
  const onPointerUp = e => { pointers.current.delete(e.pointerId); gesture.current = null }
  const onWheel = e => { e.preventDefault(); set(c => ({ ...c, scale: c.scale * (e.deltaY < 0 ? 1.06 : 1 / 1.06) })) }

  const onKeyDown = e => {
    const step = e.shiftKey ? 5 : 1
    const map = {
      ArrowLeft: c => ({ ...c, x: c.x - step }), ArrowRight: c => ({ ...c, x: c.x + step }),
      ArrowUp: c => ({ ...c, y: c.y - step }), ArrowDown: c => ({ ...c, y: c.y + step }),
      '+': c => ({ ...c, scale: c.scale + 0.1 }), '=': c => ({ ...c, scale: c.scale + 0.1 }), '-': c => ({ ...c, scale: c.scale - 0.1 }),
    }
    if (map[e.key]) { e.preventDefault(); set(map[e.key]) }
  }

  // Cover-fit size of the image for the template box, before the user's transform.
  const k = nat && box.w ? Math.max(box.w / nat.w, box.h / nat.h) : 0
  const imgStyle = nat && k ? {
    width: nat.w * k, height: nat.h * k,
    transform: `translate(-50%, -50%) translate(${(crop.x / 100) * box.w}px, ${(crop.y / 100) * box.h}px) scale(${crop.scale}) rotate(${crop.rotation}deg)`,
  } : { opacity: 0 }

  return (
    <Sheet open={open} onClose={onClose} className="kk-panel--full kk-crop-editor" label={L('瓶身を合わせる', '對齊瓶身', 'Align the bottle')}
      header={<>
        <button type="button" className="kk-icon-btn" onClick={onClose} aria-label={L('閉じる', '關閉', 'Close')}><CloseIcon /></button>
        <h2 className="kk-panel__title">{title || L('ラベルを撮る', '拍酒標', 'Photograph the label')}</h2>
        <span className="kk-crop-editor__side">{sideLabel || L('正面', '正面', 'Front')}</span>
      </>}
      footer={<div className="kk-crop-editor__foot">
        <div className="kk-crop-editor__tools">
          <button type="button" className="kk-btn kk-btn--sm" onClick={() => set(c => ({ ...c, rotation: c.rotation + 90 }))}>{L('回転', '旋轉', 'Rotate')}</button>
          <button type="button" className="kk-btn kk-btn--sm" onClick={() => set(DEFAULT_CROP)}>{L('リセット', '重設', 'Reset')}</button>
          <button type="button" className="kk-btn kk-btn--sm" onClick={() => set(c => ({ ...c, scale: c.scale >= MAX_SCALE - 0.01 ? MIN_SCALE : c.scale + 0.25 }))}>{L('拡大', '放大', 'Zoom')}</button>
        </div>
        <label className="kk-crop-editor__zoom">
          <span className="visually-hidden">{L('拡大率', '放大倍率', 'Zoom level')}</span>
          <input type="range" min={MIN_SCALE} max={MAX_SCALE} step="0.01" value={crop.scale} onChange={e => set(c => ({ ...c, scale: Number(e.target.value) }))} />
        </label>
        <div className="kk-crop-editor__actions">
          {extraActions}
          {onSkip && <button type="button" className="kk-btn kk-btn--ghost" onClick={onSkip} disabled={saving}>{L('スキップ', '略過', 'Skip')}</button>}
          <button type="button" className="kk-btn kk-btn--primary" data-autofocus onClick={() => onSave(crop)} disabled={saving}>{saving ? L('保存中…', '儲存中…', 'Saving…') : L('この位置で保存', '以這個位置保存', 'Use this position')}</button>
        </div>
      </div>}
    >
      <div className="kk-crop-editor__body">
        <div ref={frameRef} className="kk-crop-frame">
          <div
            className="kk-crop-box" style={{ width: box.w, height: box.h }}
            role="application" tabIndex={0}
            aria-label={L('瓶を枠に合わせる：ドラッグで移動、2本指で拡大。矢印キーで移動、＋−で拡大縮小', '把酒瓶對進框內：拖動移動、雙指縮放；方向鍵移動、＋−縮放', 'Fit the bottle in the outline: drag to move, pinch to zoom; arrow keys move, + / − zoom')}
            onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
            onWheel={onWheel} onKeyDown={onKeyDown}
          >
            {/* Context: the whole photo, dimmed */}
            <div className="kk-crop-box__context" aria-hidden="true">
              {src && <img src={src} alt="" draggable="false" style={imgStyle} onLoad={e => setNat({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })} />}
            </div>
            {/* The part that will show in lists */}
            <div className="kk-crop-box__window" aria-hidden="true">
              {src && <img src={src} alt="" draggable="false" style={imgStyle} />}
            </div>
            <svg className="kk-crop-box__outline" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <polygon points={BOTTLE_POINTS} vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
          <p className="kk-crop-guidance">{L('だいたい瓶が入ればOK · あとで調整できます', '大致放進酒瓶就好 · 之後還能調整', 'Roughly inside is fine · you can adjust later')}</p>
        </div>
        <div className="kk-note-card kk-crop-editor__note">
          <div className="kk-note-card__mark" aria-hidden="true">瓶</div>
          <div>
            <strong>{L('瓶身テンプレートに合わせる', '對齊瓶身模板', 'Fit the bottle template')}</strong>
            <div className="kk-helper">{L('AI判定なし。原図はそのまま保存します。', '不使用 AI 判斷。原圖會原樣保存。', 'No AI detection. The original photo is kept as is.')}</div>
          </div>
        </div>
      </div>
    </Sheet>
  )
}
