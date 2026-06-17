import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { uploadPhoto, compressImage } from '../lib/upload'
import Nav from '../components/Nav'
import Stars, { StarsLight } from '../components/Stars'
import { BrandMarkFull } from '../components/BrandMark'
import { BreweryInput, BrandInput, RiceInput, NameInput } from '../components/Autocomplete'
import TastingTagPicker from '../components/TastingTagPicker'
import FlavorTagPicker from '../components/FlavorTagPicker'
import { useLang } from '../contexts/LangContext'
import { SAKE_TYPES, TASTING_TAGS, getTagLabel, getFlavorTagLabel } from '../lib/i18n'
import { WikiText, WikiIcon } from '../components/WikiTooltip'



const SpinIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    style={{ animation: 'spin 1s linear infinite' }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
)

function MarkSVG() {
  return (
    <svg style={{ position: 'absolute', right: -40, bottom: -40, width: 200, height: 200, opacity: .05, pointerEvents: 'none', zIndex: 0 }}
      viewBox="0 0 88 88" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(44,44)">
        <path d="M-15,-37 C-30,-30 -40,-14 -40,4 C-40,22 -32,36 -18,40 C-4,44 14,40 26,28 C36,18 40,2 36,-14 C32,-28 20,-38 4,-40" fill="none" style={{ stroke: 'var(--mark-outer)' }} strokeWidth="1.1" strokeLinecap="round" />
        <path d="M-10,-27 C-22,-22 -30,-10 -30,4 C-30,18 -22,28 -10,32 C2,36 16,30 24,20 C30,12 30,-2 24,-14 C18,-24 6,-30 -4,-30" fill="none" style={{ stroke: 'var(--mark-outer)' }} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M-6,-18 C-14,-14 -20,-6 -20,4 C-20,14 -14,20 -4,22 C6,24 16,18 20,10 C22,4 20,-6 14,-12 C8,-18 0,-20 -4,-20" fill="none" style={{ stroke: 'var(--mark-inner)' }} strokeWidth="2" strokeLinecap="round" />
        <circle r="10" style={{ fill: 'var(--mark-dot)' }} />
      </g>
    </svg>
  )
}

const EMPTY_FORM = {
  brand: '', name: '', brewery: '', region: '', type: '',
  alcohol: '', rice: '', polishing: '', smv: '', acidity: '', yeast: '',
  rating: 0, notes: '',
  tasted_at: new Date().toISOString().slice(0, 10),
  bottling_date: '',
  name_reading: '',
  is_public: false, contributor_name: '',
}

function TagInput({ tags, onChange, t }) {
  const [input, setInput] = useState('')
  const add = () => {
    const v = input.trim()
    if (v && !tags.includes(v)) onChange([...tags, v])
    setInput('')
  }
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {tags.map(tag => (
          <span key={tag} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, background: 'var(--accent-bg)', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 5 }}>
            {tag}
            <span onClick={() => onChange(tags.filter(x => x !== tag))} style={{ cursor: 'pointer', fontWeight: 700, fontSize: 11, opacity: .6 }}>×</span>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input style={{ flex: 1, padding: '9px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, outline: 'none' }}
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() } }}
          placeholder={t('form.tagPH')} />
        <button type="button" onClick={add}
          style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--accent)', fontSize: 13, cursor: 'pointer' }}>
          {t('form.tagAdd')}
        </button>
      </div>
    </div>
  )
}

function Toggle({ on, onChange }) {
  return (
    <div onClick={() => onChange(!on)}
      style={{ width: 44, height: 26, borderRadius: 13, background: on ? 'var(--accent)' : 'var(--border)', position: 'relative', cursor: 'pointer', transition: 'background .2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .18s', boxShadow: '0 1px 3px rgba(0,0,0,.25)' }} />
    </div>
  )
}

const s = {
  page: { minHeight: '100svh', background: 'var(--bg)' },
  main: { maxWidth: 1100, margin: '0 auto', padding: '20px 16px 80px' },
  searchRow: { display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' },
  searchInput: { flex: 1, padding: '9px 14px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--surface-card)', color: 'var(--text)', fontSize: 14, outline: 'none' },
  statsRow: { display: 'flex', gap: 16, fontSize: 12, color: 'var(--sub)', marginBottom: 16, flexWrap: 'wrap' },
  statNum: { color: 'var(--text)', fontWeight: 600 },
  chips: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 },
  chip: (active) => ({ padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, background: active ? 'var(--accent)' : 'var(--surface)', color: active ? '#fff' : 'var(--text)', fontFamily: 'var(--font-sans)', boxShadow: active ? 'none' : '0 1px 4px rgba(0,10,30,.15)' }),
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 },
  addCard: { borderRadius: 14, border: '2px dashed var(--border)', aspectRatio: '3/4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--surface)', color: 'var(--sub)', gap: 8 },
  card: { borderRadius: 14, overflow: 'hidden', cursor: 'pointer', position: 'relative', aspectRatio: '3/4' },
  cardImg: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' },
  cardOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,.05) 0%, rgba(0,0,0,.25) 40%, rgba(0,0,0,.75) 75%, rgba(0,0,0,.88) 100%)' },
  cardNo: { position: 'absolute', inset: 0, background: '#2d2520', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: 'rgba(255,245,230,.15)' },
  cardBody: { position: 'absolute', inset: 0, padding: '10px 11px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', color: '#fff' },
  cardType: { fontSize: 9, letterSpacing: '.08em', color: 'rgba(255,245,230,.7)', marginBottom: 3 },
  cardReading: { fontSize: 9, letterSpacing: '.06em', color: 'rgba(255,245,230,.55)', marginBottom: 2, fontFamily: 'var(--font-sans)' },
  cardName: { fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 600, lineHeight: 1.35, marginBottom: 3 },
  cardBrewery: { fontSize: 11, color: 'rgba(255,245,230,.75)', marginBottom: 5 },
  cardMeta: { fontSize: 9, color: 'rgba(255,245,230,.5)', marginTop: 4 },
  cardTags: { display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 7 },
  cardTag: { fontSize: 9, padding: '2px 7px', borderRadius: 20, background: 'rgba(255,245,230,.1)', color: 'rgba(255,245,230,.85)', border: '1px solid rgba(255,245,230,.12)' },
  publicBadge: { position: 'absolute', top: 8, right: 8, fontSize: 9, padding: '2px 8px', borderRadius: 20, background: 'rgba(74,122,53,.85)', color: '#fff', zIndex: 1, letterSpacing: '.04em' },
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(3,10,20,.7)', zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  detModal: { background: 'var(--surface-card)', borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '90svh', overflow: 'hidden auto', position: 'relative', padding: '32px 32px 28px' },
  detClose: { position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--sub)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  detName: { fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, marginBottom: 10, lineHeight: 1.3 },
  detTable: { width: '100%', borderCollapse: 'collapse', marginTop: 16, marginBottom: 20 },
  detTr: { borderBottom: '1px solid var(--border)' },
  detTh: { padding: '10px 0', fontSize: 12, color: 'var(--sub)', fontWeight: 400, textAlign: 'left', width: 90, verticalAlign: 'top' },
  detTd: { padding: '10px 0', fontSize: 14, color: 'var(--text)' },
  detTagsRow: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 },
  detTag: { fontSize: 12, padding: '4px 12px', borderRadius: 20, background: 'var(--accent-bg)', color: 'var(--accent)' },
  detTastingRow: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 },
  detTastingTag: { fontSize: 12, padding: '4px 12px', borderRadius: 20, background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' },
  detActions: { display: 'flex', gap: 10, marginTop: 20 },
  editBtn: { flex: 1, padding: 12, borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: 14, cursor: 'pointer' },
  delBtn: { flex: 1, padding: 12, borderRadius: 12, border: '1px solid #e88', background: 'transparent', color: '#c0392b', fontSize: 14, cursor: 'pointer' },
  formBackdrop: { position: 'fixed', inset: 0, background: 'rgba(3,10,20,.65)', zIndex: 30, display: 'flex', alignItems: 'flex-end' },
  formSheet: { background: 'var(--surface)', borderRadius: '22px 22px 0 0', width: '100%', maxWidth: 640, margin: '0 auto', maxHeight: '94svh', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  formInner: { overflow: 'hidden auto', flex: 1, padding: '0 24px 96px' },
  handle: { width: 38, height: 4, borderRadius: 2, background: 'var(--border)', margin: '12px auto 0', flexShrink: 0 },
  formHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 },
  formTitle: { fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 600 },
  closeBtn: { width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'var(--bg)', color: 'var(--sub)', fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  sec: { marginTop: 22 },
  secLabel: { fontSize: 11, color: 'var(--sub)', letterSpacing: '.08em', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid var(--border)' },
  field: { marginBottom: 14 },
  label: { display: 'block', fontSize: 12, color: 'var(--sub)', marginBottom: 5 },
  input: { width: '100%', padding: '10px 13px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '10px 13px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, outline: 'none', resize: 'vertical', minHeight: 72, boxSizing: 'border-box' },
  select: { width: '100%', padding: '10px 13px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, outline: 'none', appearance: 'none' },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  row4: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  photoBox: { border: '2px dashed var(--border)', borderRadius: 12, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', position: 'relative', marginBottom: 8 },
  photoImg: { width: '100%', height: '100%', objectFit: 'cover' },
  photoLbl: { color: 'var(--sub)', fontSize: 13, textAlign: 'center' },
  ratingRow: { display: 'flex', gap: 8, marginTop: 4 },
  ratingDot: (active) => ({ width: 38, height: 38, borderRadius: '50%', border: '2px solid var(--border)', background: active ? 'var(--accent)' : 'transparent', borderColor: active ? 'var(--accent)' : 'var(--border)', color: active ? '#fff' : 'var(--sub)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }),
  shareRow: { display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--border)' },
  shareText: { flex: 1 },
  shareLabel: { fontSize: 14, color: 'var(--text)', marginBottom: 2 },
  shareDesc: { fontSize: 12, color: 'var(--sub)' },
  saveBtn: { width: '100%', padding: 13, borderRadius: 12, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 15, fontWeight: 500, marginTop: 16, cursor: 'pointer' },
  empty: { textAlign: 'center', color: 'var(--sub)', paddingTop: 60, fontSize: 14 },
}

function CropModal({ src, onConfirm, onCancel }) {
  const imgRef = useRef(null)
  const [box, setBox] = useState({ x: 0.05, y: 0.1, w: 0.9, h: 0.8 })
  const [ready, setReady] = useState(false)
  const sizeRef = useRef({ w: 0, h: 0 })
  const dragRef = useRef(null)

  const onLoad = () => {
    const img = imgRef.current
    sizeRef.current = { w: img.offsetWidth, h: img.offsetHeight }
    setReady(true)
  }

  const getPos = (e) => {
    const rect = imgRef.current.getBoundingClientRect()
    const pt = e.touches?.[0] ?? e
    return { x: pt.clientX - rect.left, y: pt.clientY - rect.top }
  }

  const onDown = (e) => {
    const { w, h } = sizeRef.current
    if (!w || !h) return
    const { x, y } = getPos(e)
    const b = box
    const bx = b.x * w, by = b.y * h, bw = b.w * w, bh = b.h * h
    const HS = 26
    let type = null, corner = null
    if      (Math.abs(x - bx) < HS && Math.abs(y - by) < HS)           { type = 'corner'; corner = 'nw' }
    else if (Math.abs(x - (bx + bw)) < HS && Math.abs(y - by) < HS)    { type = 'corner'; corner = 'ne' }
    else if (Math.abs(x - bx) < HS && Math.abs(y - (by + bh)) < HS)    { type = 'corner'; corner = 'sw' }
    else if (Math.abs(x - (bx + bw)) < HS && Math.abs(y - (by + bh)) < HS) { type = 'corner'; corner = 'se' }
    else if (x >= bx && x <= bx + bw && y >= by && y <= by + bh)        { type = 'move' }
    if (type) { e.preventDefault(); dragRef.current = { type, corner, startX: x, startY: y, startBox: { ...b } } }
  }

  const onMove = (e) => {
    if (!dragRef.current) return
    e.preventDefault()
    const { w, h } = sizeRef.current
    const { x, y } = getPos(e)
    const { type, corner, startX, startY, startBox: sb } = dragRef.current
    const dx = (x - startX) / w, dy = (y - startY) / h
    const MIN = 0.05
    let { x: bx, y: by, w: bw, h: bh } = sb
    if (type === 'move') {
      bx = Math.max(0, Math.min(1 - bw, bx + dx))
      by = Math.max(0, Math.min(1 - bh, by + dy))
    } else {
      const r = bx + bw, bot = by + bh
      if (corner === 'nw') {
        bx = Math.max(0, Math.min(r - MIN, bx + dx)); bw = r - bx
        by = Math.max(0, Math.min(bot - MIN, by + dy)); bh = bot - by
      } else if (corner === 'ne') {
        by = Math.max(0, Math.min(bot - MIN, by + dy)); bh = bot - by
        bw = Math.max(MIN, Math.min(1 - bx, bw + dx))
      } else if (corner === 'sw') {
        bx = Math.max(0, Math.min(r - MIN, bx + dx)); bw = r - bx
        bh = Math.max(MIN, Math.min(1 - by, bh + dy))
      } else if (corner === 'se') {
        bw = Math.max(MIN, Math.min(1 - bx, bw + dx))
        bh = Math.max(MIN, Math.min(1 - by, bh + dy))
      }
    }
    setBox({ x: bx, y: by, w: bw, h: bh })
  }

  const onUp = () => { dragRef.current = null }

  const confirm = () => {
    const img = imgRef.current
    const { w, h } = sizeRef.current
    const sx = img.naturalWidth / w, sy = img.naturalHeight / h
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(box.w * w * sx)
    canvas.height = Math.round(box.h * h * sy)
    canvas.getContext('2d').drawImage(img, box.x * w * sx, box.y * h * sy, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(blob => onConfirm(blob), 'image/jpeg', 0.92)
  }

  const { w, h } = sizeRef.current
  const bx = box.x * w, by = box.y * h, bw = box.w * w, bh = box.h * h
  const HH = 20

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
      <div style={{ position: 'relative', touchAction: 'none', cursor: 'crosshair', lineHeight: 0 }}
        onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
        onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}>
        <img ref={imgRef} src={src} onLoad={onLoad} draggable={false}
          style={{ maxWidth: '100vw', maxHeight: 'calc(100vh - 110px)', display: 'block', userSelect: 'none' }} />
        {ready && <>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: by, background: 'rgba(0,0,0,.55)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: by + bh, left: 0, width: '100%', height: h - by - bh, background: 'rgba(0,0,0,.55)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: by, left: 0, width: bx, height: bh, background: 'rgba(0,0,0,.55)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: by, left: bx + bw, width: w - bx - bw, height: bh, background: 'rgba(0,0,0,.55)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: by, left: bx, width: bw, height: bh, border: '1.5px solid rgba(255,255,255,.85)', boxSizing: 'border-box', pointerEvents: 'none' }}>
            {[['nw',{top:-HH/2,left:-HH/2}],['ne',{top:-HH/2,right:-HH/2}],['sw',{bottom:-HH/2,left:-HH/2}],['se',{bottom:-HH/2,right:-HH/2}]].map(([id,pos])=>(
              <div key={id} style={{ position: 'absolute', width: HH, height: HH, background: '#fff', borderRadius: 3, ...pos }} />
            ))}
          </div>
        </>}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onCancel} style={{ padding: '9px 22px', borderRadius: 20, border: '1px solid rgba(255,255,255,.3)', background: 'transparent', color: '#fff', fontSize: 13, cursor: 'pointer' }}>取消</button>
        <button onClick={confirm} style={{ padding: '9px 22px', borderRadius: 20, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 13, cursor: 'pointer' }}>確認裁剪</button>
      </div>
    </div>
  )
}

function WishlistView({ entries, loading, lang, typeLabel, onForward, onRemove }) {
  if (loading) return <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--sub)', fontSize: 14 }}>…</div>
  if (!entries.length) return (
    <div style={{ textAlign: 'center', padding: '60px 16px', color: 'var(--sub)' }}>
      <div style={{ fontSize: 28, marginBottom: 12 }}>🔖</div>
      <div style={{ fontSize: 14 }}>{lang === 'ja' ? '想喝リストは空です' : lang === 'zh' ? '想喝清單是空的' : 'Your wish list is empty'}</div>
      <div style={{ fontSize: 12, marginTop: 6, opacity: .7 }}>{lang === 'ja' ? '廣場で気になるお酒をブックマークしよう' : lang === 'zh' ? '在廣場收藏感興趣的酒款' : 'Bookmark sakes in the Plaza'}</div>
    </div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {entries.map(e => (
        <div key={e.id} style={{ display: 'flex', gap: 12, background: 'var(--surface-card)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--card-border)' }}>
          {e.photo_url
            ? <img src={e.photo_url} style={{ width: 64, height: 80, objectFit: 'cover', flexShrink: 0 }} />
            : <div style={{ width: 64, height: 80, flexShrink: 0, background: 'var(--photo-ph)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: 'var(--photo-ph-icon)' }}>🍶</div>}
          <div style={{ flex: 1, padding: '10px 0', minWidth: 0 }}>
            {e.type && <div style={{ fontSize: 9, color: 'var(--accent)', letterSpacing: '.06em', marginBottom: 2 }}>{typeLabel(e.type)}</div>}
            <div style={{ fontSize: 14, fontFamily: 'var(--font-serif)', color: 'var(--text)', lineHeight: 1.3, marginBottom: 2 }}>{[e.brand, e.name].filter(Boolean).join(' ')}</div>
            {e.brewery && <div style={{ fontSize: 11, color: 'var(--sub)' }}>{e.brewery}</div>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6, padding: '10px 12px 10px 0', flexShrink: 0 }}>
            <button onClick={() => onForward(e)} style={{ padding: '5px 12px', borderRadius: 20, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap' }}>
              {lang === 'ja' ? '記録する' : lang === 'zh' ? '記錄' : 'Log'}
            </button>
            <button onClick={() => onRemove(e.id)} style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid var(--border)', background: 'transparent', color: 'var(--sub)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
              {lang === 'ja' ? '削除' : lang === 'zh' ? '移除' : 'Remove'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function ForwardConfirmDialog({ entry, lang, onConfirm, onCancel }) {
  const [skip, setSkip] = React.useState(false)
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(3,10,20,.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'var(--surface-card)', borderRadius: 16, padding: '24px 20px', maxWidth: 340, width: '100%' }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, marginBottom: 10, color: 'var(--text)' }}>
          {lang === 'ja' ? '記録しますか？' : lang === 'zh' ? '確認記錄？' : 'Log this sake?'}
        </div>
        <div style={{ fontSize: 13, color: 'var(--sub)', lineHeight: 1.6, marginBottom: 18 }}>
          {lang === 'ja'
            ? `「${[entry.brand, entry.name].filter(Boolean).join(' ')}」を記録すると、想喝リストから削除されます。`
            : lang === 'zh'
            ? `記錄「${[entry.brand, entry.name].filter(Boolean).join(' ')}」後，將從想喝清單中移除。`
            : `"${[entry.brand, entry.name].filter(Boolean).join(' ')}" will be removed from your wish list after logging.`}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--sub)', marginBottom: 20, cursor: 'pointer' }}>
          <input type="checkbox" checked={skip} onChange={e => setSkip(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
          {lang === 'ja' ? '次から表示しない' : lang === 'zh' ? '下次不再提示' : "Don't show again"}
        </label>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: 13, cursor: 'pointer' }}>
            {lang === 'ja' ? 'キャンセル' : lang === 'zh' ? '取消' : 'Cancel'}
          </button>
          <button onClick={() => onConfirm(skip)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 13, cursor: 'pointer' }}>
            {lang === 'ja' ? '記録する' : lang === 'zh' ? '確認' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

const TODAY = () => new Date().toISOString().slice(0, 10)
const DRAFT_KEY = 'kikiroku-draft'
const saveDraft = (form, tags, aroma, taste, dates) => {
  if (form.brand.trim() || form.name.trim()) localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, tags, aroma, taste, dates }))
  else localStorage.removeItem(DRAFT_KEY)
}
const loadDraft = () => { try { return JSON.parse(localStorage.getItem(DRAFT_KEY)) } catch { return null } }
const clearDraft = () => localStorage.removeItem(DRAFT_KEY)

export default function Journal({ session }) {
  const { lang, t } = useLang()
  const location = useLocation()
  const navigate = useNavigate()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState('')
  const [tagsExp, setTagsExp] = useState(false)
  const [sheet, setSheet] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formTags, setFormTags] = useState([])
  const [aromaTags, setAromaTags] = useState([])
  const [tasteTags, setTasteTags] = useState([])
  const [editId, setEditId] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoFile2, setPhotoFile2] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoPreview2, setPhotoPreview2] = useState(null)
  const [saving, setSaving] = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)
  const [draftRestored, setDraftRestored] = useState(false)
  const [hasDraft, setHasDraft] = useState(() => !!loadDraft())
  const [awardYears, setAwardYears] = useState([])

  const [formDates, setFormDates] = useState([TODAY()])
  const [cropSrc, setCropSrc] = useState(null)
  const [forwardSource, setForwardSource] = useState(null)
  const [wishlistMode, setWishlistMode] = useState(false)
  const [wishedEntries, setWishedEntries] = useState([])
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [forwardConfirmEntry, setForwardConfirmEntry] = useState(null)
  const FORWARD_SKIP_KEY = 'kikiroku_forward_confirm_skip'
  const [specsOpen, setSpecsOpen] = useState(false)
  const [brandMap, setBrandMap] = useState({})
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('kk_view') || 'grid')
  const [typeFilter, setTypeFilter] = useState('')

  // ── Auto-save draft (debounced 1s) ──────────────────────────
  const draftTimerRef = useRef()
  const pendingOpenIdRef = useRef(null)
  useEffect(() => {
    if (sheet !== 'form' || editId) return
    clearTimeout(draftTimerRef.current)
    draftTimerRef.current = setTimeout(() => {
      saveDraft(form, formTags, aromaTags, tasteTags, formDates)
      if (form.brand?.trim() || form.name?.trim()) setHasDraft(true)
    }, 1000)
    return () => clearTimeout(draftTimerRef.current)
  }, [form, formTags, aromaTags, tasteTags, formDates, sheet, editId])

  // ── Swipe-down to save/dismiss ──────────────────────────────
  const [sheetDragY, setSheetDragY] = useState(0)
  const [sheetDragging, setSheetDragging] = useState(false)
  const sheetDragStart = useRef(0)
  const DRAG_CLOSE_THRESHOLD = 90

  const onSheetDragStart = e => {
    sheetDragStart.current = e.touches[0].clientY
    setSheetDragging(true)
  }
  const onSheetDragMove = e => {
    const dy = Math.max(0, e.touches[0].clientY - sheetDragStart.current)
    setSheetDragY(dy)
  }
  const onSheetDragEnd = () => {
    setSheetDragging(false)
    if (sheetDragY >= DRAG_CLOSE_THRESHOLD) {
      setSheetDragY(0)
      close()
    } else {
      setSheetDragY(0)
    }
  }
  const [searchLoading, setSearchLoading] = useState(false)
  const [lightbox, setLightbox] = useState(null)
  const [detail, setDetail] = useState(null)
  const fileRef = useRef()
  const fileRef2 = useRef()
  const fileRefBoth = useRef()

  useEffect(() => {
    fetchEntries()
    supabase.from('sake_brands').select('name,furigana,romaji').limit(3000)
      .then(({ data }) => {
        const m = {}
        ;(data || []).forEach(b => { if (b.name) m[b.name] = { furigana: b.furigana || '', romaji: b.romaji || '' } })
        setBrandMap(m)
      })
  }, [])
  useEffect(() => { if (wishlistMode) fetchWishlist() }, [wishlistMode])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('new') === '1') {
      navigate('/journal', { replace: true })
      openAdd()
    }
  }, [location.search])

  useEffect(() => {
    if (location.state?.forward) {
      const fwd = location.state.forward
      navigate('/journal', { replace: true, state: {} })
      openForward(fwd)
    }
    if (location.state?.openEntryId) {
      pendingOpenIdRef.current = location.state.openEntryId
      navigate('/journal', { replace: true, state: {} })
    }
  }, [location.state])

  useEffect(() => {
    const brewery = form.brewery?.trim()
    if (!brewery || brewery.length < 2) { setAwardYears([]); return }
    const keyword = brewery.replace(/(株式会社|有限会社|合資会社|合名会社|㈱|㈲)/g, '').trim().split(/[\s　]+/)[0]
    if (!keyword || keyword.length < 2) { setAwardYears([]); return }
    supabase
      .from('sake_awards')
      .select('year,year_code,brand_name,is_gold')
      .ilike('brewery_name', `%${keyword}%`)
      .eq('is_gold', true)
      .gte('year', 2019)
      .order('year', { ascending: false })
      .limit(6)
      .then(({ data }) => setAwardYears(data || []))
  }, [form.brewery])

  const fetchEntries = async () => {
    setLoading(true)
    const { data } = await supabase.from('sake_entries').select('*')
      .eq('user_id', session.user.id).order('tasted_at', { ascending: false })
    setEntries(data || [])
    setLoading(false)
    if (pendingOpenIdRef.current) {
      const entry = (data || []).find(e => e.id === pendingOpenIdRef.current)
      if (entry) setDetail(entry)
      pendingOpenIdRef.current = null
    }
  }

  const fetchWishlist = async () => {
    setWishlistLoading(true)
    const { data: wishes } = await supabase.from('sake_wishes').select('entry_id').eq('user_id', session.user.id)
    if (!wishes?.length) { setWishedEntries([]); setWishlistLoading(false); return }
    const ids = wishes.map(w => w.entry_id)
    const { data } = await supabase.from('sake_entries').select('*').in('id', ids).eq('is_public', true)
    setWishedEntries(data || [])
    setWishlistLoading(false)
  }

  const removeWish = async (entryId) => {
    setWishedEntries(prev => prev.filter(e => e.id !== entryId))
    await supabase.from('sake_wishes').delete().eq('user_id', session.user.id).eq('entry_id', entryId)
  }

  const handleWishForward = (entry) => {
    const skip = localStorage.getItem(FORWARD_SKIP_KEY) === '1'
    if (skip) { removeWish(entry.id); doForward(entry) }
    else setForwardConfirmEntry(entry)
  }

  const doForward = (entry) => {
    const fwd = { brand: entry.brand, name: entry.name, brewery: entry.brewery, region: entry.region, type: entry.type, alcohol: entry.alcohol, rice: entry.rice, polishing: entry.polishing, smv: entry.smv, acidity: entry.acidity, yeast: entry.yeast }
    setWishlistMode(false)
    openForward(fwd)
  }

  const allTags = [...new Set(entries.flatMap(e => e.tags || []))]
  const visibleTags = tagsExp ? allTags : allTags.slice(0, 8)
  const typeCounts = {}
  entries.forEach(e => { if (e.type) typeCounts[e.type] = (typeCounts[e.type] || 0) + 1 })
  const entryTypes = Object.keys(typeCounts).sort((a, b) => typeCounts[b] - typeCounts[a])
  const toggleView = (m) => { setViewMode(m); localStorage.setItem('kk_view', m) }
  const filtered = entries.filter(e => {
    if (activeTag && !e.tags?.includes(activeTag)) return false
    if (typeFilter && e.type !== typeFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (e.brand || '').toLowerCase().includes(q) ||
        (e.name || '').toLowerCase().includes(q) ||
        (e.brewery || '').toLowerCase().includes(q) ||
        (e.region || '').toLowerCase().includes(q) ||
        e.tags?.some(tag => tag.toLowerCase().includes(q))
    }
    return true
  })

  const ratedEntries = entries.filter(e => e.rating)
  const avgRating = ratedEntries.length ? (ratedEntries.reduce((s, e) => s + e.rating, 0) / ratedEntries.length).toFixed(1) : null
  const breweryCount = entries.reduce((acc, e) => { if (e.brewery) acc[e.brewery] = (acc[e.brewery] || 0) + 1; return acc }, {})
  const topBrewery = Object.keys(breweryCount).sort((a, b) => breweryCount[b] - breweryCount[a])[0]
  const sharedCount = entries.filter(e => e.is_public).length
  const defaultName = session.user.user_metadata?.display_name || session.user.email.split('@')[0]

  const openAdd = () => {
    const draft = loadDraft()
    if (draft) {
      setForm(draft.form); setFormTags(draft.tags || [])
      setAromaTags(draft.aroma || []); setTasteTags(draft.taste || [])
      setFormDates(draft.dates?.length ? draft.dates : [TODAY()])
      setDraftRestored(true)
    } else {
      setForm({ ...EMPTY_FORM, contributor_name: defaultName }); setFormTags([]); setAromaTags([]); setTasteTags([])
      setFormDates([TODAY()])
      setDraftRestored(false)
    }
    setEditId(null)
    setPhotoFile(null); setPhotoFile2(null)
    setPhotoPreview(null); setPhotoPreview2(null)
    setSpecsOpen(false)
    setSheet('form')
  }
  const openForward = fwd => {
    setForm({
      ...EMPTY_FORM,
      brand: fwd.brand || '', name: fwd.name || '', brewery: fwd.brewery || '', region: fwd.region || '', type: fwd.type || '',
      alcohol: fwd.alcohol || '', rice: fwd.rice || '', polishing: fwd.polishing || '',
      smv: fwd.smv || '', acidity: fwd.acidity || '', yeast: fwd.yeast || '',
      contributor_name: defaultName,
    })
    setFormTags([]); setAromaTags([]); setTasteTags([])
    setFormDates([TODAY()])
    setEditId(null); setDraftRestored(false)
    setForwardSource(fwd.name || '')
    setPhotoFile(null); setPhotoFile2(null)
    setPhotoPreview(null); setPhotoPreview2(null)
    setSpecsOpen(!!(fwd.type || fwd.rice || fwd.yeast || fwd.polishing || fwd.alcohol || fwd.smv || fwd.acidity))
    setSheet('form')
  }

  const openEdit = e => {
    setForm({
      brand: e.brand || '', name: e.name || '', brewery: e.brewery || '', region: e.region || '', type: e.type || '',
      alcohol: e.alcohol || '', rice: e.rice || '', polishing: e.polishing || '',
      smv: e.smv || '', acidity: e.acidity || '', yeast: e.yeast || '',
      rating: e.rating || 0, notes: e.notes || '',
      tasted_at: e.tasted_at || TODAY(),
      bottling_date: e.bottling_date || '',
      name_reading: e.name_reading || '',
      is_public: e.is_public ?? false, contributor_name: e.contributor_name || '',
    })
    setFormTags(e.tags || [])
    setAromaTags(e.aroma_tags || [])
    setTasteTags(e.taste_tags || [])
    setFormDates(e.tasted_dates?.length ? [...e.tasted_dates].sort().reverse() : [e.tasted_at || TODAY()])
    setEditId(e.id)
    setPhotoFile(null); setPhotoFile2(null)
    setPhotoPreview(e.photo_url || null); setPhotoPreview2(e.photo_url2 || null)
    setSpecsOpen(!!(e.type || e.rice || e.yeast || e.polishing || e.alcohol || e.smv || e.acidity || e.bottling_date))
    setSheet('form')
  }
  const close = () => {
    if (sheet === 'form' && !editId && !forwardSource) {
      saveDraft(form, formTags, aromaTags, tasteTags, formDates)
      setHasDraft(!!form.name.trim())
    }
    setForwardSource(null)
    setSheet(null); setDetail(null)
  }
  const closeClean = () => { setForwardSource(null); setSheet(null); setDetail(null) }

  const readExifDate = async (file) => {
    try {
      const buf = await file.arrayBuffer()
      const text = new TextDecoder('ascii', { fatal: false }).decode(new Uint8Array(buf))
      const m = text.match(/(\d{4}):(\d{2}):(\d{2}) \d{2}:\d{2}:\d{2}/)
      return m ? `${m[1]}-${m[2]}-${m[3]}` : null
    } catch { return null }
  }

  const onPhoto = async e => {
    const file = e.target.files[0]; if (!file) return
    const [blob, date] = await Promise.all([compressImage(file), readExifDate(file)])
    setPhotoFile(blob); setPhotoPreview(URL.createObjectURL(blob))
    if (date) setFormDates(prev => [...new Set([date, ...prev])].sort().reverse())
  }
  const onPhoto2 = (e) => {
    const f = e.target.files[0]; if (!f) return
    setCropSrc(URL.createObjectURL(f))
    e.target.value = ''
  }
  const onPhotoBoth = async e => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    const [blob1, date] = await Promise.all([compressImage(files[0]), readExifDate(files[0])])
    setPhotoFile(blob1); setPhotoPreview(URL.createObjectURL(blob1))
    if (date) setFormDates(prev => [...new Set([date, ...prev])].sort().reverse())
    if (files[1]) setCropSrc(URL.createObjectURL(files[1]))
    e.target.value = ''
  }

  const onCropConfirm = async (croppedBlob) => {
    setCropSrc(null)
    const compressed = await compressImage(croppedBlob)
    setPhotoFile2(compressed)
    setPhotoPreview2(URL.createObjectURL(compressed))
  }
  const onCropCancel = () => { setCropSrc(null) }

  const save = async () => {
    if (!form.brand.trim() && !form.name.trim()) return
    setSaving(true)
    try {
      // Always fetch a fresh, validated user to avoid stale session issues
      const { data: { user }, error: authErr } = await supabase.auth.getUser()
      if (authErr || !user) throw new Error('認証エラー。再ログインしてください。')
      const uid = user.id

      const prev = editId ? entries.find(e => e.id === editId) : null
      let photo_url = prev?.photo_url || null
      let photo_url2 = prev?.photo_url2 || null
      if (photoFile) photo_url = await uploadPhoto(photoFile, uid)
      if (photoFile2) photo_url2 = await uploadPhoto(photoFile2, uid)
      const sortedDates = [...formDates].filter(Boolean).sort().reverse()
      const tasted_at = sortedDates[0] || TODAY()
      const payload = {
        ...form, tasted_at,
        tasted_dates: sortedDates.length ? sortedDates : null,
        rating: form.rating || null,
        tags: formTags.length ? formTags : null,
        aroma_tags: aromaTags.length ? aromaTags : null,
        taste_tags: tasteTags.length ? tasteTags : null,
        photo_url, photo_url2, user_id: uid,
        contributor_name: form.is_public ? (form.contributor_name.trim() || defaultName) : null,
      }
      if (editId) {
        await supabase.from('sake_entries').update(payload).eq('id', editId)
      } else {
        await supabase.from('sake_entries').insert(payload)
        // Contribute new sake to the product database if it doesn't exist yet
        if (form.name.trim()) {
          const fullName = [form.brand, form.name].filter(Boolean).join(' ').trim()
          const { count } = await supabase
            .from('sake_products')
            .select('id', { count: 'exact', head: true })
            .ilike('name', fullName)
          if (count === 0) {
            await supabase.from('sake_products').insert({
              name:         fullName,
              brewery_name: form.brewery.trim() || null,
              region:       form.region.trim()  || null,
              type:         form.type           || null,
              rice:         form.rice.trim()    || null,
              yeast:        form.yeast.trim()   || null,
              polishing:    form.polishing ? parseFloat(form.polishing) : null,
              alcohol:      form.alcohol  ? parseFloat(form.alcohol)   : null,
              smv:          form.smv.trim()     || null,
              acidity:      form.acidity  ? parseFloat(form.acidity)   : null,
            })
          }
        }
      }
      clearDraft(); setHasDraft(false)
      await fetchEntries(); closeClean()
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const SAKE_TYPE_IDS = ['純米','純米吟醸','純米大吟醸','吟醸','大吟醸','特別純米','本醸造','普通酒','その他']


  const runSearch = async (currentForm) => {
    const src = currentForm ?? form
    if (!src.name && !src.brewery) return
    setSearchLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('search-sake', { body: src })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      setForm(prev => ({
        ...prev,
        ...(data.brand        && !prev.brand        ? { brand: data.brand }               : {}),
        ...(data.name         && !prev.name         ? { name: data.name }                 : {}),
        ...(data.name_reading && !prev.name_reading ? { name_reading: data.name_reading } : {}),
        ...(data.brewery   && !prev.brewery   ? { brewery: data.brewery }     : {}),
        ...(data.region    && !prev.region    ? { region: data.region }       : {}),
        ...(data.type && !prev.type && SAKE_TYPE_IDS.includes(data.type) ? { type: data.type } : {}),
        ...(data.rice      && !prev.rice      ? { rice: data.rice }           : {}),
        ...(data.yeast     && !prev.yeast     ? { yeast: data.yeast }         : {}),
        ...(data.polishing != null && !prev.polishing ? { polishing: String(data.polishing) } : {}),
        ...(data.alcohol   != null && !prev.alcohol   ? { alcohol: String(data.alcohol) }   : {}),
        ...(data.smv       != null && !prev.smv       ? { smv: String(data.smv) }           : {}),
        ...(data.acidity   != null && !prev.acidity   ? { acidity: String(data.acidity) }   : {}),
      }))
      if (data.type || data.rice || data.yeast || data.polishing != null || data.alcohol != null || data.smv != null || data.acidity != null) {
        setSpecsOpen(true)
      }
    } catch (e) { console.warn('search-sake:', e.message) }
    finally { setSearchLoading(false) }
  }

  const inferBreweryFromBrand = async () => {
    const brandVal = form.brand?.trim()
    if (!brandVal || form.brewery) return
    const tokens = [...new Set(
      brandVal.split(/[\s　・\/「」【】（）()\-]+/).filter(s => s.length >= 2)
    )]
    for (const token of tokens) {
      const { data } = await supabase
        .from('sake_brands')
        .select('name, sake_breweries(name, sake_areas(name))')
        .ilike('name', `${token}%`)
        .limit(10)
      const match = data?.find(r => brandVal.includes(r.name))
      if (match?.sake_breweries?.name) {
        setForm(p => ({
          ...p,
          brewery: match.sake_breweries.name,
          ...(match.sake_breweries.sake_areas?.name ? { region: match.sake_breweries.sake_areas.name } : {}),
        }))
        return
      }
    }
  }

  const TableRow = ({ label, value, wiki }) => value ? (
    <tr style={s.detTr}><th style={s.detTh}>{label}</th><td style={s.detTd}>{wiki ? <WikiText text={value} /> : value}</td></tr>
  ) : null

  const typeLabel = (typeId) => {
    if (!typeId) return null
    const found = SAKE_TYPES.find(t => t.id === typeId)
    if (!found) return typeId
    return lang === 'ja' ? typeId : (found[lang] || typeId)
  }

  return (
    <div style={s.page}>
      <Nav session={session} />
      <BrandMarkFull />
      <div style={s.main}>
        {/* Tab toggle: 記録 | 想喝 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          <button onClick={() => setWishlistMode(false)} style={{ ...s.chip(!wishlistMode), fontSize: 13 }}>
            {lang === 'ja' ? '記録' : lang === 'zh' ? '記錄' : 'Journal'}
          </button>
          <button onClick={() => setWishlistMode(true)} style={{ ...s.chip(wishlistMode), fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill={wishlistMode ? '#fff' : 'none'} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            {lang === 'ja' ? '想喝リスト' : lang === 'zh' ? '想喝清單' : 'Wish List'}
            {wishedEntries.length > 0 && !wishlistLoading && <span style={{ background: 'rgba(255,255,255,.25)', borderRadius: 20, padding: '0 6px', fontSize: 11 }}>{wishedEntries.length}</span>}
          </button>
        </div>

        {wishlistMode ? (
          <WishlistView
            entries={wishedEntries} loading={wishlistLoading} lang={lang}
            typeLabel={typeLabel} onForward={handleWishForward} onRemove={removeWish}
          />
        ) : (<>

        <div style={s.searchRow}>
          <input style={s.searchInput} value={search} onChange={e => setSearch(e.target.value)} placeholder={t('search')} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--sub)', cursor: 'pointer', fontSize: 18 }}>×</button>}
          <div style={{ display: 'flex', gap: 2, background: 'var(--surface-card)', borderRadius: 8, padding: 3, border: '1px solid var(--border)', flexShrink: 0 }}>
            <button onClick={() => toggleView('grid')} title="Grid" style={{ width: 30, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: viewMode === 'grid' ? 'rgba(255,245,230,.1)' : 'transparent', color: viewMode === 'grid' ? 'var(--text)' : 'var(--sub)' }}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></svg>
            </button>
            <button onClick={() => toggleView('list')} title="List" style={{ width: 30, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: viewMode === 'list' ? 'rgba(255,245,230,.1)' : 'transparent', color: viewMode === 'list' ? 'var(--text)' : 'var(--sub)' }}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="2" width="14" height="3" rx="1"/><rect x="1" y="7" width="14" height="3" rx="1"/><rect x="1" y="12" width="14" height="3" rx="1"/></svg>
            </button>
          </div>
        </div>

        {entries.length > 0 && (
          <div style={s.statsRow}>
            <span><span style={s.statNum}>{entries.length}</span> {t('stats.bottles')}</span>
            {avgRating && <span>{t('stats.avg')} <span style={s.statNum}>{avgRating}</span> ★</span>}
            {topBrewery && <span>{t('stats.most')} <span style={s.statNum}>{topBrewery}</span></span>}
            {sharedCount > 0 && <span>{t('stats.shared')} <span style={s.statNum}>{sharedCount}</span></span>}
          </div>
        )}

        {entryTypes.length > 0 && (
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 12, paddingBottom: 2 }}>
            <button style={{ flexShrink: 0, padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-sans)', background: !typeFilter ? 'var(--accent)' : 'var(--surface)', color: !typeFilter ? '#fff' : 'var(--sub)' }} onClick={() => setTypeFilter('')}>
              {lang === 'ja' ? 'すべて' : lang === 'zh' ? '全部' : 'All'}
            </button>
            {entryTypes.map(type => (
              <button key={type} style={{ flexShrink: 0, padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-sans)', background: typeFilter === type ? 'var(--accent)' : 'var(--surface)', color: typeFilter === type ? '#fff' : 'var(--sub)' }} onClick={() => setTypeFilter(typeFilter === type ? '' : type)}>
                {typeLabel(type)}
              </button>
            ))}
          </div>
        )}

        {allTags.length > 0 && (
          <div style={s.chips}>
            <button style={s.chip(!activeTag)} onClick={() => setActiveTag('')}>{t('all')}</button>
            {visibleTags.map(tag => (
              <button key={tag} style={s.chip(activeTag === tag)} onClick={() => setActiveTag(activeTag === tag ? '' : tag)}>{getFlavorTagLabel(tag, lang)}</button>
            ))}
            {allTags.length > 8 && (
              <button style={s.chip(false)} onClick={() => setTagsExp(x => !x)}>{tagsExp ? t('less') : t('more')}</button>
            )}
          </div>
        )}

        {viewMode === 'list' ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: '1px solid rgba(255,245,230,.05)', cursor: 'pointer' }} onClick={openAdd}>
              <div style={{ width: 52, height: 52, borderRadius: 10, flexShrink: 0, border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: 'var(--border)' }}>+</div>
              <div style={{ flex: 1, fontSize: 13, color: 'var(--sub)', display: 'flex', alignItems: 'center', gap: 8 }}>
                {hasDraft ? (lang === 'ja' ? '草稿を続ける' : lang === 'zh' ? '繼續草稿' : 'Continue Draft') : t('form.newEntry')}
                {hasDraft && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />}
              </div>
            </div>
            {!loading && filtered.length === 0 && (search || typeFilter) && (
              <div style={{ ...s.empty, paddingTop: 40 }}>
                {search ? t('noResults', { q: search }) : (lang === 'ja' ? '該当なし' : lang === 'zh' ? '無符合結果' : 'No matches')}
              </div>
            )}
            {(() => {
              let lastMonth = null
              return filtered.map(e => {
                const month = e.tasted_at?.slice(0, 7)
                const isNew = month !== lastMonth
                if (isNew) lastMonth = month
                const mLabel = month ? new Date(month + '-01').toLocaleDateString(lang === 'en' ? 'en-US' : lang === 'zh' ? 'zh-TW' : 'ja-JP', { year: 'numeric', month: 'long' }) : ''
                return (
                  <React.Fragment key={e.id}>
                    {isNew && month && (
                      <div style={{ fontSize: 10, color: 'rgba(255,245,230,.25)', letterSpacing: '.07em', padding: '14px 0 4px', fontWeight: 500 }}>
                        {mLabel.toUpperCase()}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: '1px solid rgba(255,245,230,.05)', cursor: 'pointer' }} onClick={() => setDetail(e)}>
                      <div style={{ width: 52, height: 52, borderRadius: 10, flexShrink: 0, overflow: 'hidden', background: '#2d2520' }}>
                        {e.photo_url
                          ? <img src={e.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, color: 'rgba(255,245,230,.15)', fontFamily: 'var(--font-serif)', writingMode: 'vertical-rl', letterSpacing: '-.04em' }}>
                              {(e.brand || e.name)?.slice(0, 2)}
                            </div>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontFamily: 'var(--font-serif)' }}>
                            {e.brand || e.name}
                          </div>
                          {e.type && <span style={{ flexShrink: 0, fontSize: 9, padding: '2px 7px', borderRadius: 20, background: 'rgba(255,245,230,.06)', color: 'rgba(255,245,230,.45)', border: '1px solid rgba(255,245,230,.1)', letterSpacing: '.04em', whiteSpace: 'nowrap' }}>{typeLabel(e.type)}</span>}
                        </div>
                        {e.name && (
                          <div style={{ fontSize: 11, color: 'var(--sub)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                            {e.name}
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <StarsLight rating={e.rating} />
                          {(e.brewery || e.region) && (
                            <span style={{ fontSize: 10, color: 'rgba(255,245,230,.25)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {e.rating ? ' · ' : ''}{[e.brewery, e.region].filter(Boolean).join(' · ')}
                            </span>
                          )}
                        </div>
                      </div>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,245,230,.18)" strokeWidth="2.5" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>
                    </div>
                  </React.Fragment>
                )
              })
            })()}
          </div>
        ) : (
        <div style={s.grid}>
          <div style={{ ...s.addCard, position: 'relative' }} onClick={openAdd}>
            {hasDraft && <span style={{ position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />}
            <span style={{ fontSize: 28, color: 'var(--border)' }}>+</span>
            <span style={{ fontSize: 13 }}>{hasDraft ? (lang === 'ja' ? '草稿を続ける' : lang === 'zh' ? '繼續草稿' : 'Continue Draft') : t('form.newEntry')}</span>
          </div>
          {!loading && filtered.length === 0 && search && (
            <div style={{ ...s.empty, gridColumn: '1/-1' }}>{t('noResults', { q: search })}</div>
          )}
          {filtered.map(e => (
            <div key={e.id} style={s.card} onClick={() => setDetail(e)}>
              {e.is_public && <div style={s.publicBadge}>{t('public')}</div>}
              {e.photo_url ? <img style={s.cardImg} src={e.photo_url} alt={e.name} /> : <div style={s.cardNo}>🍶</div>}
              <div style={s.cardOverlay} />
              <div style={s.cardBody}>
                {e.type && <div style={s.cardType}>{typeLabel(e.type)}</div>}
                {e.brand && (lang === 'ja' ? brandMap[e.brand]?.furigana : brandMap[e.brand]?.romaji) && (
                  <div style={s.cardReading}>{lang === 'ja' ? brandMap[e.brand].furigana : brandMap[e.brand].romaji}</div>
                )}
                <div style={s.cardName}>{[e.brand, e.name].filter(Boolean).join(' ')}</div>
                {e.brewery && <div style={s.cardBrewery}>{e.brewery}</div>}
                <StarsLight rating={e.rating} />
                <div style={s.cardMeta}>{[e.region, e.tasted_at].filter(Boolean).join(' · ')}{e.tasted_dates?.length > 1 && <span style={{ opacity: .7 }}> ×{e.tasted_dates.length}</span>}</div>
                {e.tags?.length > 0 && (
                  <div style={s.cardTags}>
                    {e.tags.slice(0, 3).map(tag => <span key={tag} style={s.cardTag}>{getFlavorTagLabel(tag, lang)}</span>)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        )}
        </>)}
      </div>

      {/* Forward confirmation dialog */}
      {forwardConfirmEntry && (
        <ForwardConfirmDialog
          entry={forwardConfirmEntry} lang={lang}
          onConfirm={(skipNext) => {
            if (skipNext) localStorage.setItem(FORWARD_SKIP_KEY, '1')
            removeWish(forwardConfirmEntry.id)
            doForward(forwardConfirmEntry)
            setForwardConfirmEntry(null)
          }}
          onCancel={() => setForwardConfirmEntry(null)}
        />
      )}

      {/* Detail modal */}
      {sheet !== 'form' && detail && (
        <div style={s.backdrop} onClick={close}>
          <div style={s.detModal} onClick={e => e.stopPropagation()}>
            <MarkSVG />
            <button style={s.detClose} onClick={close}>✕</button>
            {detail.type && <div style={{ fontSize: 10, color: 'var(--accent)', letterSpacing: '.06em', marginBottom: 4 }}>{typeLabel(detail.type)}</div>}
            {detail.brand && (lang === 'ja' ? brandMap[detail.brand]?.furigana : brandMap[detail.brand]?.romaji) && (
              <div style={{ fontSize: 11, color: 'var(--sub)', letterSpacing: '.08em', marginBottom: 3 }}>
                {lang === 'ja' ? brandMap[detail.brand].furigana : brandMap[detail.brand].romaji}
              </div>
            )}
            <div style={s.detName}>{[detail.brand, detail.name].filter(Boolean).join(' ')}</div>
            {detail.name_reading && <div style={{ fontSize: 13, color: 'var(--sub)', marginBottom: 6, letterSpacing: '.05em' }}>{detail.name_reading}</div>}
            <Stars rating={detail.rating} size={14} />
            <table style={s.detTable}>
              <tbody>
                <TableRow label={t('detail.brewery')} value={detail.brewery} />
                <TableRow label={t('detail.region')} value={detail.region} />
                <TableRow label={t('detail.rice')} value={detail.rice} wiki />
                <TableRow label={t('detail.polishing')} value={detail.polishing} />
                <TableRow label={t('detail.alcohol')} value={detail.alcohol} />
                <TableRow label={t('detail.smv')} value={detail.smv} />
                <TableRow label={t('detail.acidity')} value={detail.acidity} />
                <TableRow label={t('detail.yeast')} value={detail.yeast} wiki />
                <TableRow label={t('detail.bottling')} value={detail.bottling_date} />
                {detail.tasted_dates?.length > 1 ? (
                  <tr style={s.detTr}>
                    <th style={s.detTh}>{t('detail.drinking')}</th>
                    <td style={s.detTd}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {detail.tasted_dates.map((d, i) => (
                          <span key={d}>
                            {d}{i === 0 && <span style={{ fontSize: 10, color: 'var(--sub)', marginLeft: 5 }}>{lang === 'zh' ? '最近' : lang === 'ja' ? '最近' : 'latest'}</span>}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ) : (
                  <TableRow label={t('detail.drinking')} value={detail.tasted_at} />
                )}
              </tbody>
            </table>

            {detail.aroma_tags?.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--sub)', marginBottom: 6 }}>{t('detail.aroma')}</div>
                <div style={s.detTastingRow}>
                  {detail.aroma_tags.map(id => <span key={id} style={s.detTastingTag}>{getTagLabel(id, 'aroma', lang)}</span>)}
                </div>
              </div>
            )}
            {detail.taste_tags?.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--sub)', marginBottom: 6 }}>{t('detail.taste')}</div>
                <div style={s.detTastingRow}>
                  {detail.taste_tags.map(id => <span key={id} style={s.detTastingTag}>{getTagLabel(id, 'taste', lang)}</span>)}
                </div>
              </div>
            )}
            {detail.notes && (
              <div style={{ fontSize: 14, color: 'var(--sub)', lineHeight: 1.7, marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--sub)', marginBottom: 4 }}>{t('detail.notes')}</div>
                {detail.notes}
              </div>
            )}
            {detail.tags?.length > 0 && (
              <div style={s.detTagsRow}>{detail.tags.map(tag => <span key={tag} style={s.detTag}>{getFlavorTagLabel(tag, lang)}</span>)}</div>
            )}
            {detail.is_public && (
              <div style={{ fontSize: 12, color: 'var(--sub)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4A7A35', display: 'inline-block' }} />
                {t('public')}{detail.contributor_name ? ` · ${detail.contributor_name}` : ''}
              </div>
            )}
            <div style={s.detActions}>
              <button style={s.editBtn} onClick={() => { setDetail(null); openEdit(detail) }}>{t('edit')}</button>
              <button style={s.delBtn} onClick={() => setConfirmDel(detail)}>{t('delete')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Back label crop */}
      {cropSrc && <CropModal src={cropSrc} onConfirm={onCropConfirm} onCancel={onCropCancel} />}

      {/* Photo lightbox */}
      {lightbox && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.92)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" style={{ maxWidth: '96vw', maxHeight: '92svh', objectFit: 'contain', borderRadius: 8 }} />
          <button onClick={() => setLightbox(null)}
            style={{ position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(255,255,255,.3)', background: 'rgba(0,0,0,.5)', color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ✕
          </button>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDel && (
        <div style={s.backdrop} onClick={() => setConfirmDel(null)}>
          <div style={{ background: 'var(--surface-card)', borderRadius: 16, padding: '28px 24px', width: '100%', maxWidth: 340, textAlign: 'center' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8, color: 'var(--text)' }}>{t('confirmDelete')}</div>
            <div style={{ fontSize: 13, color: 'var(--sub)', marginBottom: 24 }}>{[confirmDel.brand, confirmDel.name].filter(Boolean).join(' ')}</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={s.editBtn} onClick={() => setConfirmDel(null)}>{lang === 'ja' ? 'キャンセル' : lang === 'zh' ? '取消' : 'Cancel'}</button>
              <button style={s.delBtn} onClick={async () => {
                await supabase.from('sake_entries').delete().eq('id', confirmDel.id)
                setConfirmDel(null); await fetchEntries(); closeClean()
              }}>{t('delete')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Form sheet */}
      {sheet === 'form' && (
        <div style={s.formBackdrop} onClick={close}>
          <div
            style={{
              ...s.formSheet,
              transform: `translateY(${sheetDragY}px)`,
              transition: sheetDragging ? 'none' : 'transform .35s cubic-bezier(.32,0,.67,0)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{ ...s.handle, touchAction: 'none', cursor: 'grab',
                background: sheetDragY >= DRAG_CLOSE_THRESHOLD ? 'var(--accent)' : 'var(--border)',
                transition: 'background .15s',
              }}
              onTouchStart={onSheetDragStart}
              onTouchMove={onSheetDragMove}
              onTouchEnd={onSheetDragEnd}
            />
            <div
              style={s.formHead}
              onTouchStart={onSheetDragStart}
              onTouchMove={onSheetDragMove}
              onTouchEnd={onSheetDragEnd}
            >
              <span style={s.formTitle}>{editId ? t('form.editEntry') : t('form.newEntry')}</span>
              <button style={s.closeBtn} onClick={close}>✕</button>
            </div>
            <div style={s.formInner}>

              {forwardSource && (
                <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', marginBottom: 4, marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--sub)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                  </svg>
                  <span>{lang === 'ja' ? `「${forwardSource}」をもとに記録中` : lang === 'zh' ? `基於「${forwardSource}」記錄` : `Based on "${forwardSource}"`}</span>
                </div>
              )}

              {draftRestored && (
                <div style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent)', borderRadius: 10, padding: '10px 14px', marginBottom: 4, marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--accent)' }}>{lang === 'ja' ? '草稿を復元しました' : lang === 'zh' ? '已恢復草稿' : 'Draft restored'}</span>
                  <button onClick={() => { setForm(EMPTY_FORM); setFormTags([]); setAromaTags([]); setTasteTags([]); clearDraft(); setDraftRestored(false); setHasDraft(false) }}
                    style={{ background: 'none', border: 'none', color: 'var(--sub)', fontSize: 12, cursor: 'pointer' }}>
                    {lang === 'ja' ? '破棄' : lang === 'zh' ? '放棄草稿' : 'Discard'}
                  </button>
                </div>
              )}

              {/* Photos */}
              <div style={s.sec}>
                <div style={s.secLabel}>{t('form.photos')}</div>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '9px 0', borderRadius: 10, border: '1.5px dashed var(--border)', color: 'var(--sub)', fontSize: 13, cursor: 'pointer', background: 'var(--bg)', marginBottom: 10, boxSizing: 'border-box' }}>
                  <span>📷</span>{t('form.selectBoth')}
                  <input ref={fileRefBoth} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={onPhotoBoth} />
                </label>
                <div style={s.row2}>
                  <div>
                    <div style={s.label}>{t('form.mainPhoto')}</div>
                    <div style={s.photoBox} onClick={() => photoPreview ? setLightbox(photoPreview) : fileRef.current.click()}>
                      {photoPreview
                        ? <>
                            <img style={s.photoImg} src={photoPreview} alt="" />
                            <button type="button" onClick={e => { e.stopPropagation(); fileRef.current.click() }}
                              style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,.45)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, padding: '3px 8px', cursor: 'pointer', zIndex: 1 }}>
                              {t('form.tapToAdd')}
                            </button>
                          </>
                        : <div style={s.photoLbl}>{t('form.tapToAdd')}</div>}
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onPhoto} />
                  </div>
                  <div>
                    <div style={s.label}>{t('form.subPhoto')}</div>
                    <div style={s.photoBox} onClick={() => photoPreview2 ? setLightbox(photoPreview2) : fileRef2.current.click()}>
                      {photoPreview2
                        ? <>
                            <img style={s.photoImg} src={photoPreview2} alt="" />
                            <button type="button" onClick={e => { e.stopPropagation(); fileRef2.current.click() }}
                              style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,.45)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, padding: '3px 8px', cursor: 'pointer', zIndex: 1 }}>
                              {t('form.tapToAdd')}
                            </button>
                          </>
                        : <div style={s.photoLbl}>{t('form.tapToAdd')}</div>}
                    </div>
                    <input ref={fileRef2} type="file" accept="image/*" style={{ display: 'none' }} onChange={onPhoto2} />
                  </div>
                </div>
              </div>

              {/* Name / Brewery */}
              <div style={s.sec}>
                <div style={s.secLabel}>{t('form.basic')}</div>
                <div style={s.field}>
                  <label style={s.label}>{t('form.brand')}<WikiIcon termId="meigara" /></label>
                  <BrandInput style={{ ...s.input, maxWidth: 200 }} value={form.brand} onChange={v => f('brand', v)}
                    onBreweryFill={v => f('brewery', v)} onRegionFill={v => f('region', v)}
                    onBlur={inferBreweryFromBrand}
                    placeholder={t('form.brandPH')} />
                </div>
                <div style={s.field}>
                  <label style={s.label}>{t('form.name')}</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <NameInput style={{ ...s.input, flex: 1 }} value={form.name} onChange={v => f('name', v)}
                      brand={form.brand}
                      onBrandFill={v => f('brand', v)}
                      onProductFill={p => setForm(prev => ({
                        ...prev,
                        brewery:   prev.brewery   || p.brewery   || '',
                        region:    prev.region    || p.region    || '',
                        type:      prev.type      || p.type      || '',
                        rice:      prev.rice      || p.rice      || '',
                        yeast:     prev.yeast     || p.yeast     || '',
                        polishing: prev.polishing || p.polishing || '',
                        alcohol:   prev.alcohol   || p.alcohol   || '',
                        smv:       prev.smv       || p.smv       || '',
                        acidity:   prev.acidity   || p.acidity   || '',
                      }))}
                      onBreweryFill={v => f('brewery', v)} onRegionFill={v => f('region', v)}
                      placeholder={t('form.namePH')} />
                    <button type="button"
                      disabled={searchLoading || (!form.brand && !form.name && !form.brewery)}
                      onClick={() => runSearch(form)}
                      title={t('ocr.searching')}
                      style={{ flexShrink: 0, padding: '0 12px', borderRadius: 10, border: '1px solid var(--border)', background: searchLoading ? 'var(--accent-bg)' : 'var(--surface)', color: searchLoading ? 'var(--accent)' : 'var(--sub)', fontSize: 12, cursor: (searchLoading || (!form.brand && !form.name && !form.brewery)) ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                      {searchLoading ? <SpinIcon /> : '🔍'}{t('form.webSearch')}
                    </button>
                  </div>
                  {form.name_reading && <div style={{ fontSize: 11, color: 'var(--sub)', marginTop: 3, letterSpacing: '.04em' }}>{form.name_reading}</div>}
                </div>
                <div style={s.row2}>
                  <div style={s.field}>
                    <label style={s.label}>{t('form.brewery')}</label>
                    <BreweryInput style={s.input} value={form.brewery} onChange={v => f('brewery', v)}
                      onRegionFill={v => f('region', v)} placeholder={t('form.breweryPH')} />
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>{t('form.region')}</label>
                    <input style={s.input} value={form.region} onChange={e => f('region', e.target.value)} placeholder={t('form.regionPH')} />
                  </div>
                </div>
                <div style={s.field}>
                  <label style={s.label}>{t('form.date')}</label>
                  {formDates.map((d, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                      {i === 0 && formDates.length > 1 && (
                        <span style={{ fontSize: 9, color: 'var(--accent)', letterSpacing: '.04em', flexShrink: 0 }}>
                          {lang === 'zh' ? '最近' : lang === 'ja' ? '最近' : 'Latest'}
                        </span>
                      )}
                      <input
                        style={{ ...s.input, flex: 1, minWidth: 0, colorScheme: 'light' }}
                        type="date" value={d}
                        onChange={e => {
                          const val = e.target.value
                          setFormDates(prev => [...prev.slice(0, i), val, ...prev.slice(i + 1)].filter(Boolean).sort().reverse())
                        }}
                      />
                      {formDates.length > 1 && (
                        <button type="button" onClick={() => setFormDates(prev => prev.filter((_, idx) => idx !== i))}
                          style={{ flexShrink: 0, width: 32, height: 38, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--sub)', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)' }}>
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                    <button type="button"
                      onClick={() => setFormDates(prev => [...new Set([...prev, TODAY()])].sort().reverse())}
                      style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: '1px dashed var(--border)', background: 'none', color: 'var(--sub)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                      {lang === 'zh' ? '＋ 新增飲用日' : lang === 'ja' ? '＋ 飲用日を追加' : '+ Add date'}
                    </button>
                    <button type="button"
                      onClick={() => { setForm({ ...EMPTY_FORM, contributor_name: form.contributor_name }); setFormTags([]); setAromaTags([]); setTasteTags([]); setFormDates([TODAY()]); setPhotoFile(null); setPhotoFile2(null); setPhotoPreview(null); setPhotoPreview2(null); setAwardYears([]); clearDraft(); setDraftRestored(false); setHasDraft(false) }}
                      style={{ flexShrink: 0, padding: '0 13px', height: 38, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--sub)', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--font-sans)' }}>
                      {lang === 'ja' ? 'リセット' : lang === 'zh' ? '重置' : 'Reset'}
                    </button>
                  </div>
                </div>
                {awardYears.length > 0 && (
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 4 }}>
                    {awardYears.map((a, i) => {
                      const isSC = a.year_code?.startsWith('SC_')
                      const isIWC = a.year_code?.startsWith('IWC_')
                      const prefix = isSC ? 'SC' : isIWC ? 'IWC' : '鑑'
                      return (
                        <span key={i} title={a.brand_name} style={{ fontSize: 10, padding: '2px 9px', borderRadius: 12, background: 'rgba(180,140,0,.10)', color: '#8A6C00', border: '1px solid rgba(180,140,0,.25)', whiteSpace: 'nowrap' }}>
                          ★ {prefix} {a.year}
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Rating */}
              <div style={s.sec}>
                <div style={s.secLabel}>{t('form.rating')}</div>
                <div style={s.ratingRow}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} type="button" style={s.ratingDot(form.rating >= n)}
                      onClick={() => f('rating', form.rating === n ? 0 : n)}>{n}</button>
                  ))}
                </div>
              </div>

              {/* Tasting notes */}
              <div style={s.sec}>
                <div style={s.secLabel}>{t('form.tasting')}</div>
                <div style={s.field}>
                  <label style={s.label}>{t('form.aroma')}</label>
                  <TastingTagPicker category="aroma" selected={aromaTags} onChange={setAromaTags} lang={lang} />
                </div>
                <div style={{ ...s.field, marginTop: 14 }}>
                  <label style={s.label}>{t('form.taste')}</label>
                  <TastingTagPicker category="taste" selected={tasteTags} onChange={setTasteTags} lang={lang} />
                </div>
                <div style={{ ...s.field, marginTop: 14 }}>
                  <label style={s.label}>{t('form.notes')}</label>
                  <textarea style={s.textarea} value={form.notes} onChange={e => f('notes', e.target.value)} placeholder={t('form.notesPH')} />
                </div>
              </div>

              {/* Flavor tags */}
              <div style={s.sec}>
                <div style={s.secLabel}>{t('form.flavorTags')}</div>
                <FlavorTagPicker selected={formTags} onChange={setFormTags} lang={lang} t={t} />
              </div>

              {/* Specs — search auto-fills here */}
              {(() => {
                const hasSpecs = !!(form.type || form.rice || form.yeast || form.polishing || form.alcohol || form.smv || form.acidity || form.bottling_date)
                return (
                  <div style={s.sec}>
                    <button type="button" onClick={() => setSpecsOpen(o => !o)}
                      style={{ width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: specsOpen ? 12 : 0, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
                      <span style={{ flex: 1, fontSize: 11, color: 'var(--sub)', letterSpacing: '.08em', textAlign: 'left' }}>{t('form.specs')}</span>
                      {hasSpecs && !specsOpen && (
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', flexShrink: 0 }} />
                      )}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--sub)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        style={{ flexShrink: 0, transition: 'transform .2s', transform: specsOpen ? 'rotate(180deg)' : 'none' }}>
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </button>
                    {specsOpen && (
                      <>
                        <div style={s.row2}>
                          <div style={s.field}>
                            <label style={s.label}>{t('form.type')}</label>
                            <select style={s.select} value={form.type} onChange={e => f('type', e.target.value)}>
                              <option value="">{t('form.typeSelect')}</option>
                              {SAKE_TYPES.map(tp => (
                                <option key={tp.id} value={tp.id}>
                                  {lang === 'ja' ? tp.id : `${tp.id} · ${tp[lang] || tp.en}`}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div style={s.field}><label style={s.label}>{t('form.bottling')}</label><input style={s.input} type="text" maxLength="7" value={form.bottling_date} onChange={e => f('bottling_date', e.target.value)} placeholder="yyyy-mm" /></div>
                        </div>
                        <div style={s.row2}>
                          <div style={s.field}><label style={s.label}>{t('form.rice')}</label><RiceInput style={s.input} value={form.rice} onChange={v => f('rice', v)} placeholder={t('form.ricePH')} /></div>
                          <div style={s.field}><label style={s.label}>{t('form.yeast')}</label><input style={s.input} value={form.yeast} onChange={e => f('yeast', e.target.value)} /></div>
                        </div>
                        <div style={s.row4}>
                          <div style={s.field}><label style={s.label}>{t('form.polishing')}</label><input style={s.input} value={form.polishing} onChange={e => f('polishing', e.target.value)} placeholder="60%" /></div>
                          <div style={s.field}><label style={s.label}>{t('form.alcohol')}</label><input style={s.input} value={form.alcohol} onChange={e => f('alcohol', e.target.value)} placeholder="15%" /></div>
                          <div style={s.field}><label style={s.label}>{t('form.smv')}</label><input style={s.input} value={form.smv} onChange={e => f('smv', e.target.value)} placeholder="+1" /></div>
                          <div style={s.field}><label style={s.label}>{t('form.acidity')}</label><input style={s.input} value={form.acidity} onChange={e => f('acidity', e.target.value)} placeholder="1.5" /></div>
                        </div>
                      </>
                    )}
                  </div>
                )
              })()}

              {/* Share */}
              <div style={s.sec}>
                <div style={s.secLabel}>{t('form.share')}</div>
                <div style={s.shareRow}>
                  <Toggle on={form.is_public} onChange={v => f('is_public', v)} />
                  <div style={s.shareText}>
                    <div style={s.shareLabel}>{t('form.shareLabel')}</div>
                    <div style={s.shareDesc}>{t('form.shareDesc')}</div>
                  </div>
                </div>
                {form.is_public && (
                  <div style={{ ...s.field, marginTop: 12 }}>
                    <label style={s.label}>{t('form.displayName')}</label>
                    <input style={s.input} value={form.contributor_name}
                      onChange={e => f('contributor_name', e.target.value)} placeholder={defaultName} />
                  </div>
                )}
              </div>

              <button style={s.saveBtn} onClick={save} disabled={saving}>
                {saving ? t('saving') : t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
