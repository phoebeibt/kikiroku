import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { uploadPhoto, compressImage } from '../lib/upload'
import Nav from '../components/Nav'
import Stars from '../components/Stars'
import { BreweryInput, RiceInput, NameInput } from '../components/Autocomplete'
import TastingTagPicker from '../components/TastingTagPicker'
import FlavorTagPicker from '../components/FlavorTagPicker'
import { useLang } from '../contexts/LangContext'
import { useTags, useTagResolver } from '../contexts/TagsContext'
import { WikiText } from '../components/WikiTooltip'
import { normalizeType } from '../lib/sakeType'
import { saveDraftPhotos, loadDraftPhotos, clearDraftPhotos } from '../lib/draftPhotos'
import { uploadPhotoWithThumb } from '../lib/upload'
import BottleCropEditor from '../components/bottle/BottleCropEditor'
import Sheet, { CloseIcon } from '../components/ui/Sheet'
import RatingPicker from '../components/record/RatingPicker'
import Toast from '../components/ui/Toast'
import '../components/record/record.css'
import Ledger from './journal/Ledger'
import SakeBottleCrop from '../components/bottle/SakeBottleCrop'

const EMPTY_FORM = {
  brand: '', name: '', brewery: '', region: '', type: '',
  alcohol: '', rice: '', polishing: '', smv: '', acidity: '', yeast: '',
  rating: 0, notes: '',
  tasted_at: new Date().toISOString().slice(0, 10),
  bottling_date: '',
  name_reading: '',
  is_public: false, contributor_name: '',
  photo_crop: null,
  product_id: null, // sake_products row picked from autocomplete / 事典 (cleared when the name is retyped)
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
    <Sheet open onClose={onCancel} variant="viewer" label="Crop">
    <div style={{ position: 'absolute', inset: 0, background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
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
    </Sheet>
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
  const title = lang === 'ja' ? '記録しますか？' : lang === 'zh' ? '確認記錄？' : 'Log this sake?'
  const name = [entry.brand, entry.name].filter(Boolean).join(' ')
  return (
    <Sheet open onClose={onCancel} variant="dialog" label={title}>
      <h2 className="kk-confirm__title">{title}</h2>
      <p className="kk-confirm__note">
        {lang === 'ja' ? `「${name}」を記録すると、飲みたいリストから外れます。`
          : lang === 'zh' ? `記錄「${name}」後，將從想喝清單中移除。`
          : `"${name}" will be removed from your wish list after logging.`}
      </p>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted)', margin: '-6px 0 18px', cursor: 'pointer' }}>
        <input type="checkbox" checked={skip} onChange={e => setSkip(e.target.checked)} style={{ accentColor: 'var(--green)' }} />
        {lang === 'ja' ? '次から表示しない' : lang === 'zh' ? '下次不再提示' : "Don't show again"}
      </label>
      <div className="kk-confirm__actions">
        <button type="button" className="kk-btn" onClick={onCancel}>{lang === 'ja' ? 'キャンセル' : lang === 'zh' ? '取消' : 'Cancel'}</button>
        <button type="button" className="kk-btn kk-btn--primary" data-autofocus onClick={() => onConfirm(skip)}>{lang === 'ja' ? '記録する' : lang === 'zh' ? '確認' : 'Confirm'}</button>
      </div>
    </Sheet>
  )
}

const TODAY = () => new Date().toISOString().slice(0, 10)
const DRAFT_KEY = 'kikiroku-draft'
const draftHasContent = (form, aroma = [], taste = [], photos = {}) =>
  !!(form.brand.trim() || form.name.trim() || form.notes.trim() || form.rating > 0 || aroma.length || taste.length || photos.main || photos.back)
// Text in localStorage, photos in IndexedDB (lib/draftPhotos). Returns whether anything was kept.
const saveDraft = (form, tags, aroma, taste, dates, method, photos = {}) => {
  if (!draftHasContent(form, aroma, taste, photos)) { localStorage.removeItem(DRAFT_KEY); clearDraftPhotos(); return false }
  localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, tags, aroma, taste, dates, method, hasPhotos: !!(photos.main || photos.back) }))
  if (photos.main || photos.back) saveDraftPhotos({ main: photos.main || null, back: photos.back || null })
  else clearDraftPhotos()
  return true
}
const loadDraft = () => { try { return JSON.parse(localStorage.getItem(DRAFT_KEY)) } catch { return null } }
const clearDraft = () => { localStorage.removeItem(DRAFT_KEY); clearDraftPhotos() }

export default function Journal({ session }) {
  const { lang, t } = useLang()
  const location = useLocation()
  const navigate = useNavigate()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [sheet, setSheet] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formTags, setFormTags] = useState([])
  const [methodTags, setMethodTags] = useState([])
  const [aromaTags, setAromaTags] = useState([])
  const [tasteTags, setTasteTags] = useState([])
  const [editId, setEditId] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoFile2, setPhotoFile2] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoPreview2, setPhotoPreview2] = useState(null)
  const [saving, setSaving] = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)
  const [deleting, setDeleting] = useState(false)
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
  const [feelTab, setFeelTab] = useState('aroma')
  const [formErrors, setFormErrors] = useState({})
  const [saveError, setSaveError] = useState('')
  const [editStatus, setEditStatus] = useState('published')
  const [toast, setToast] = useState(null)
  const [autoSaved, setAutoSaved] = useState(false)
  const [datesOpen, setDatesOpen] = useState(false)
  const [bottleEdit, setBottleEdit] = useState(null)     // { src, initial } while aligning the main photo
  const [pendingBackSrc, setPendingBackSrc] = useState(null)
  const [confirmPublic, setConfirmPublic] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const clearToast = useCallback(() => setToast(null), [])
  const [brandMap, setBrandMap] = useState({})

  // ── Auto-save draft (debounced 1s) ──────────────────────────
  const draftTimerRef = useRef()
  const pendingOpenIdRef = useRef(null)
  const pendingEditIdRef = useRef(null)
  const editReturnRef = useRef(null)
  const [initialRegion, setInitialRegion] = useState(null)
  const [initialBrewery, setInitialBrewery] = useState(null)
  useEffect(() => {
    if (sheet !== 'form' || editId) return
    clearTimeout(draftTimerRef.current)
    draftTimerRef.current = setTimeout(() => {
      const kept = saveDraft(form, formTags, aromaTags, tasteTags, formDates, methodTags, { main: photoFile, back: photoFile2 })
      setHasDraft(kept)
      setAutoSaved(kept)
    }, 1000)
    return () => clearTimeout(draftTimerRef.current)
  }, [form, formTags, aromaTags, tasteTags, formDates, methodTags, photoFile, photoFile2, sheet, editId])

  // ── Swipe-down to save/dismiss ──────────────────────────────
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
  // Also on mount, so the ledger can show how many are on the wish list.
  useEffect(() => { fetchWishlist() }, [wishlistMode])

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
    if (location.state?.editEntryId) {
      pendingEditIdRef.current = location.state.editEntryId
      editReturnRef.current = location.state.returnTo || null
      navigate('/journal', { replace: true, state: {} })
      const found = entries.find(e => e.id === location.state.editEntryId)
      if (found) { openEdit(found); pendingEditIdRef.current = null }
    }
    if (location.state?.region) {
      setInitialRegion(location.state.region)
      navigate('/journal', { replace: true, state: {} })
    }
    if (location.state?.brewery) {
      setInitialBrewery({ name: location.state.brewery, at: Date.now() })
      navigate('/journal', { replace: true, state: {} })
    }
    if (location.state?.toast === 'deleted') {
      setToast({ id: Date.now(), tone: 'draft', stamp: L3('削除', '刪除', 'Gone'), message: L3('記録を削除しました', '已刪除記錄', 'Record deleted') })
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
    setEntries((data || []).map(e => ({ ...e, type: normalizeType(e.type) || null })))
    setLoading(false)
    if (pendingOpenIdRef.current) {
      const entry = (data || []).find(e => e.id === pendingOpenIdRef.current)
      if (entry) setDetail(entry)
      pendingOpenIdRef.current = null
    }
    if (pendingEditIdRef.current) {
      const entry = (data || []).find(e => e.id === pendingEditIdRef.current)
      if (entry) openEdit({ ...entry, type: normalizeType(entry.type) || null })
      pendingEditIdRef.current = null
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

  const defaultName = session.user.user_metadata?.display_name || session.user.email.split('@')[0]

  const openAdd = () => {
    const draft = loadDraft()
    if (draft) {
      setForm(draft.form); setFormTags(draft.tags || [])
      setAromaTags(draft.aroma || []); setTasteTags(draft.taste || [])
      setMethodTags(draft.method || [])
      setFormDates(draft.dates?.length ? draft.dates : [TODAY()])
      setDraftRestored(true)
      if (draft.hasPhotos) loadDraftPhotos().then(p => {
        if (p?.main) { setPhotoFile(p.main); setPhotoPreview(URL.createObjectURL(p.main)) }
        if (p?.back) { setPhotoFile2(p.back); setPhotoPreview2(URL.createObjectURL(p.back)) }
      })
    } else {
      setForm({ ...EMPTY_FORM, contributor_name: defaultName }); setFormTags([]); setAromaTags([]); setTasteTags([]); setMethodTags([])
      setFormDates([TODAY()])
      setDraftRestored(false)
    }
    setEditId(null)
    setPhotoFile(null); setPhotoFile2(null)
    setPhotoPreview(null); setPhotoPreview2(null)
    setSpecsOpen(false); setDatesOpen(false)
    resetFormUi('published')
    setSheet('form')
  }
  const openForward = fwd => {
    setForm({
      ...EMPTY_FORM,
      brand: fwd.brand || '', name: fwd.name || '', brewery: fwd.brewery || '', region: fwd.region || '', type: normalizeType(fwd.type),
      alcohol: fwd.alcohol || '', rice: fwd.rice || '', polishing: fwd.polishing || '',
      smv: fwd.smv || '', acidity: fwd.acidity || '', yeast: fwd.yeast || '',
      product_id: fwd.product_id || null,
      contributor_name: defaultName,
    })
    setFormTags([]); setAromaTags([]); setTasteTags([]); setMethodTags([])
    setFormDates([TODAY()])
    setEditId(null); setDraftRestored(false)
    setForwardSource([fwd.brand, fwd.name].filter(Boolean).join(' '))
    setPhotoFile(null); setPhotoFile2(null)
    setPhotoPreview(null); setPhotoPreview2(null)
    setSpecsOpen(!!(fwd.type || fwd.rice || fwd.yeast || fwd.polishing || fwd.alcohol || fwd.smv || fwd.acidity))
    resetFormUi('published')
    setSheet('form')
  }

  const openEdit = e => {
    setForm({
      brand: e.brand || '', name: e.name || '', brewery: e.brewery || '', region: e.region || '', type: normalizeType(e.type),
      alcohol: e.alcohol || '', rice: e.rice || '', polishing: e.polishing || '',
      smv: e.smv || '', acidity: e.acidity || '', yeast: e.yeast || '',
      rating: e.rating || 0, notes: e.notes || '',
      tasted_at: e.tasted_at || TODAY(),
      bottling_date: e.bottling_date || '',
      name_reading: e.name_reading || '',
      is_public: e.is_public ?? false, contributor_name: e.contributor_name || '',
      photo_crop: e.photo_crop || null,
      product_id: e.product_id || null,
    })
    setFormTags(e.tags || [])
    setAromaTags(e.aroma_tags || [])
    setTasteTags(e.taste_tags || [])
    setMethodTags(e.method_tags || [])
    setFormDates(e.tasted_dates?.length ? [...e.tasted_dates].sort().reverse() : [e.tasted_at || TODAY()])
    setEditId(e.id)
    setPhotoFile(null); setPhotoFile2(null)
    setPhotoPreview(e.photo_url || null); setPhotoPreview2(e.photo_url2 || null)
    setSpecsOpen(!!(e.type || e.rice || e.yeast || e.polishing || e.alcohol || e.smv || e.acidity || e.bottling_date))
    setDatesOpen(false)
    resetFormUi(e.status || 'published')
    setSheet('form')
  }
  const resetForm = () => {
    setForm({ ...EMPTY_FORM, contributor_name: form.contributor_name || defaultName })
    setFormTags([]); setAromaTags([]); setTasteTags([]); setMethodTags([]); setFormDates([TODAY()])
    setPhotoFile(null); setPhotoFile2(null); setPhotoPreview(null); setPhotoPreview2(null); setAwardYears([])
    clearDraft(); setDraftRestored(false); setHasDraft(false); setFormErrors({}); setSaveError('')
  }
  const cleanJa = label => (label || '').replace(/（.*?）/g, '')

  // One 酒名 field for the user; brand / name stay separate in the data.
  const pendingBrandRef = useRef(null)
  const onSakeNameChange = text => {
    if (formErrors.name) setFormErrors(e => ({ ...e, name: null }))
    const picked = pendingBrandRef.current
    pendingBrandRef.current = null
    setForm(p => {
      if (picked) return { ...p, brand: picked, name: text, product_id: null }          // autocomplete resolved the brand
      if (p.brand && text.startsWith(p.brand)) return { ...p, name: text.slice(p.brand.length).trim(), product_id: null }
      return { ...p, brand: '', name: text, product_id: null }
    })
  }
  // On blur, peel a known 銘柄 off the front (longest match in sake_brands), then infer the brewery.
  const splitBrandFromName = async () => {
    const full = [form.brand, form.name].filter(Boolean).join(' ').trim()
    if (!full || form.brand) { if (form.brand && !form.brewery) inferBreweryFromBrand(); return }
    const { data } = await supabase.from('sake_brands').select('name').ilike('name', `${full.slice(0, 1)}%`).limit(80)
    const match = (data || []).filter(b => b.name && full.startsWith(b.name)).sort((a, b) => b.name.length - a.name.length)[0]
    if (!match) return
    setForm(p => ({ ...p, brand: match.name, name: full.slice(match.name.length).trim() }))
  }
  useEffect(() => { if (form.brand && !form.brewery && sheet === 'form') inferBreweryFromBrand() }, [form.brand]) // eslint-disable-line react-hooks/exhaustive-deps

  const askPublic = () => {
    let ok = false
    try { ok = localStorage.getItem('kk_public_ok') === '1' } catch { /* storage blocked */ }
    if (ok) f('is_public', true); else setConfirmPublic(true)
  }

  const resetFormUi = status => {
    setFeelTab('aroma'); setFormErrors({}); setSaveError(''); setEditStatus(status); setAutoSaved(false)
  }

  const close = () => {
    if (editReturnRef.current) { const back = editReturnRef.current; editReturnRef.current = null; setSheet(null); navigate(back, { replace: true }); return }
    if (sheet === 'form' && !editId && !forwardSource) {
      setHasDraft(saveDraft(form, formTags, aromaTags, tasteTags, formDates, methodTags, { main: photoFile, back: photoFile2 }))
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

  // A new main photo opens the bottle alignment step (skippable).
  const takeMainPhoto = async file => {
    const [blob, date] = await Promise.all([compressImage(file), readExifDate(file)])
    const url = URL.createObjectURL(blob)
    setPhotoFile(blob); setPhotoPreview(url)
    setForm(p => ({ ...p, photo_crop: null }))
    if (date) setFormDates(prev => [...new Set([date, ...prev])].sort().reverse())
    setBottleEdit({ src: url, initial: null })
  }
  const onPhoto = async e => {
    const file = e.target.files[0]; if (!file) return
    e.target.value = ''
    await takeMainPhoto(file)
  }
  const finishBottleEdit = crop => {
    if (crop) setForm(p => ({ ...p, photo_crop: crop }))
    setBottleEdit(null)
    if (pendingBackSrc) { setCropSrc(pendingBackSrc); setPendingBackSrc(null) }
  }
  const onPhoto2 = (e) => {
    const f = e.target.files[0]; if (!f) return
    setCropSrc(URL.createObjectURL(f))
    e.target.value = ''
  }
  const onPhotoBoth = async e => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    e.target.value = ''
    // Back label (2nd file) gets its rectangle crop after the bottle step.
    if (files[1]) setPendingBackSrc(URL.createObjectURL(files[1]))
    await takeMainPhoto(files[0])
  }

  const onCropConfirm = async (croppedBlob) => {
    setCropSrc(null)
    const compressed = await compressImage(croppedBlob)
    setPhotoFile2(compressed)
    setPhotoPreview2(URL.createObjectURL(compressed))
  }
  const onCropCancel = () => { setCropSrc(null) }

  const L3 = (ja, zh, en) => (lang === 'ja' ? ja : lang === 'zh' ? zh : en)

  // mode 'publish' → a finished 酒札 (needs a name and a rating).
  // mode 'draft'   → kept on the server as status 'draft', never public, anything goes.
  const save = async (mode = 'publish') => {
    const hasName = !!(form.brand.trim() || form.name.trim())
    const hasAnything = hasName || photoFile || photoFile2 || photoPreview || form.notes.trim() || form.rating > 0 || aromaTags.length || tasteTags.length
    if (mode === 'publish') {
      const errs = {}
      if (!hasName) errs.name = L3('酒名か銘柄を入れてください', '請填寫酒名或銘柄', 'Add a sake name or brand')
      if (!(form.rating > 0)) errs.rating = L3('評価を選んでください', '請選擇評分', 'Choose a rating')
      setFormErrors(errs)
      if (Object.keys(errs).length) {
        const target = document.getElementById(errs.name ? 'kk-field-brand' : 'kk-field-rating')
        target?.scrollIntoView({ block: 'center', behavior: 'smooth' })
        target?.focus({ preventScroll: true })
        return
      }
    } else if (!hasAnything) {
      closeClean(); return
    }
    setSaving(true); setSaveError('')
    try {
      // Always fetch a fresh, validated user to avoid stale session issues
      const { data: { user }, error: authErr } = await supabase.auth.getUser()
      if (authErr || !user) throw new Error(L3('ログインが切れました。再ログインしてください。', '登入已失效，請重新登入。', 'Your session expired. Please sign in again.'))
      const uid = user.id

      const prev = editId ? entries.find(e => e.id === editId) : null
      let photo_url = prev?.photo_url || null
      let photo_url2 = prev?.photo_url2 || null
      let thumb_url = prev?.thumb_url || null
      if (photoFile) ({ url: photo_url, thumbUrl: thumb_url } = await uploadPhotoWithThumb(photoFile, uid))
      if (!photoPreview) { photo_url = null; thumb_url = null }
      if (photoFile2) photo_url2 = await uploadPhoto(photoFile2, uid)
      const sortedDates = [...formDates].filter(Boolean).sort().reverse()
      const tasted_at = sortedDates[0] || TODAY()
      const isDraft = mode === 'draft'
      const payload = {
        ...form, tasted_at,
        type: normalizeType(form.type) || null,
        status: isDraft ? 'draft' : 'published',
        is_public: isDraft ? false : form.is_public,
        tasted_dates: sortedDates.length ? sortedDates : null,
        rating: form.rating > 0 ? form.rating : null,
        tags: formTags.length ? formTags : null,
        aroma_tags: aromaTags.length ? aromaTags : null,
        taste_tags: tasteTags.length ? tasteTags : null,
        method_tags: methodTags.length ? methodTags : null,
        photo_url, photo_url2, thumb_url, user_id: uid,
        photo_crop: photo_url ? (form.photo_crop || null) : null,
        contributor_name: !isDraft && form.is_public ? (form.contributor_name.trim() || defaultName) : null,
      }
      const { data: saved, error: writeErr } = editId
        ? await supabase.from('sake_entries').update(payload).eq('id', editId).select('id').single()
        : await supabase.from('sake_entries').insert(payload).select('id').single()
      if (writeErr) throw new Error(writeErr.message)

      // Link the record to the catalogue (事典). Reuse a same-name product, or contribute a new one.
      if (!isDraft && !form.product_id && form.name.trim()) {
        const fullName = [form.brand, form.name].filter(Boolean).join(' ').trim()
        const { data: found } = await supabase
          .from('sake_products').select('id').ilike('name', fullName).limit(1)
        let productId = found?.[0]?.id || null
        if (!productId && !editId) {
          const { data: made } = await supabase.from('sake_products').insert({
            name:         fullName,
            brewery_name: form.brewery.trim() || null,
            region:       form.region.trim()  || null,
            type:         normalizeType(form.type) || null,
            rice:         form.rice.trim()    || null,
            yeast:        form.yeast.trim()   || null,
            polishing:    form.polishing ? parseFloat(form.polishing) : null,
            alcohol:      form.alcohol  ? parseFloat(form.alcohol)   : null,
            smv:          form.smv.trim()     || null,
            acidity:      form.acidity  ? parseFloat(form.acidity)   : null,
          }).select('id').single()
          productId = made?.id || null
        }
        if (productId && saved?.id) await supabase.from('sake_entries').update({ product_id: productId }).eq('id', saved.id)
      }
      clearDraft(); setHasDraft(false)
      setToast(isDraft
        ? { id: Date.now(), tone: 'draft', stamp: L3('下書', '草稿', 'Draft'), message: L3('下書きとして残しました', '已存為草稿', 'Saved as a draft') }
        : { id: Date.now(), stamp: L3('保存', '保存', 'Saved'), message: L3('酒札を保存しました', '酒札已保存', 'Sake tag saved') })
      await fetchEntries(); closeClean()
      if (editReturnRef.current) { const back = editReturnRef.current; editReturnRef.current = null; navigate(back, { replace: true }) }
    } catch (e) {
      setSaveError(L3('保存できませんでした：', '儲存失敗：', 'Could not save: ') + e.message)
    } finally { setSaving(false) }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))



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
        ...(!prev.type && normalizeType(data.type) ? { type: normalizeType(data.type) } : {}),
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

  const tagLabel = useTagResolver()
  const sakeTypes = useTags('type')
  const typeLabel = (typeId) => typeId ? tagLabel(typeId, 'type') : null

  return (
    <div style={s.page}>
      <Nav session={session} topbar={false} />
      {wishlistMode ? (
        <div className="kk-ledger">
          <div className="kk-ledger__head">
            <button type="button" className="kk-icon-btn" onClick={() => setWishlistMode(false)} aria-label={L3('マイ帳に戻る', '回到酒帳', 'Back to ledger')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <h1 className="kk-ledger__title" style={{ flex: 1 }}>{L3('飲みたいリスト', '想喝清單', 'Wish list')}</h1>
          </div>
          <WishlistView
            entries={wishedEntries} loading={wishlistLoading} lang={lang}
            typeLabel={typeLabel} onForward={handleWishForward} onRemove={removeWish}
          />
        </div>
      ) : (
        <Ledger
          entries={entries} loading={loading} lang={lang}
          tagLabel={tagLabel} typeLabel={typeLabel} brandMap={brandMap}
          onOpen={e => e.status === 'draft' ? openEdit(e) : navigate(`/journal/${e.id}`)}
          initialRegion={initialRegion} initialBrewery={initialBrewery}
          onAdd={openAdd} hasDraft={hasDraft}
          wishCount={wishedEntries.length} onShowWishlist={() => setWishlistMode(true)}
        />
      )}

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
      <Sheet
        open={sheet !== 'form' && !!detail}
        onClose={close}
        className="kk-panel--fit"
        label={detail ? [detail.brand, detail.name].filter(Boolean).join(' ') : ''}
        header={<>
          <button type="button" className="kk-icon-btn" onClick={close} aria-label={(lang === 'ja' ? '閉じる' : lang === 'zh' ? '關閉' : 'Close')}><CloseIcon /></button>
          <span />
          <span className="kk-panel__head-spacer" />
        </>}
      >
        {detail && (<div style={{ position: 'relative', padding: '4px 8px 4px' }}>
            <div className="kk-bottle-col kk-bottle-col--detail">
              <div className="kk-bottle-stage">
                <SakeBottleCrop imageUrl={detail.photo_url} crop={detail.photo_crop} height="168px" alt={[detail.brand, detail.name].filter(Boolean).join(' ')} />
              </div>
              {(detail.photo_url || detail.photo_url2) && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {detail.photo_url && <button type="button" className="kk-btn kk-btn--ghost kk-btn--sm" onClick={() => setLightbox(detail.photo_url)}>{L3('元の写真を見る', '查看原圖', 'View original photo')}</button>}
                  {detail.photo_url2 && <button type="button" className="kk-btn kk-btn--ghost kk-btn--sm" onClick={() => setLightbox(detail.photo_url2)}>{L3('裏ラベル', '背標', 'Back label')}</button>}
                </div>
              )}
            </div>
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
                  {detail.aroma_tags.map(id => <span key={id} style={s.detTastingTag}>{tagLabel(id, 'aroma')}</span>)}
                </div>
              </div>
            )}
            {detail.taste_tags?.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--sub)', marginBottom: 6 }}>{t('detail.taste')}</div>
                <div style={s.detTastingRow}>
                  {detail.taste_tags.map(id => <span key={id} style={s.detTastingTag}>{tagLabel(id, 'taste')}</span>)}
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
              <div style={s.detTagsRow}>{detail.tags.map(tag => <span key={tag} style={s.detTag}>{tagLabel(tag, 'flavor')}</span>)}</div>
            )}
            {detail.is_public && (
              <div style={{ fontSize: 12, color: 'var(--sub)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4A7A35', display: 'inline-block' }} />
                {t('public')}{detail.contributor_name ? ` · ${detail.contributor_name}` : ''}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 20 }}>
              <button type="button" className="kk-btn kk-btn--primary kk-btn--block" onClick={() => { setDetail(null); openEdit(detail) }}>{t('edit')}</button>
              <button type="button" className="kk-btn kk-btn--danger-text kk-btn--sm" style={{ alignSelf: 'center' }} onClick={() => setConfirmDel(detail)}>
                {(lang === 'ja' ? 'この記録を削除' : lang === 'zh' ? '刪除這筆記錄' : 'Delete this record')}
              </button>
            </div>
        </div>)}
      </Sheet>

      {/* Back label crop */}
      {cropSrc && <CropModal src={cropSrc} onConfirm={onCropConfirm} onCancel={onCropCancel} />}

      {/* Photo lightbox */}
      <Sheet open={!!lightbox} onClose={() => setLightbox(null)} variant="viewer" label={lang === 'ja' ? '写真' : lang === 'zh' ? '照片' : 'Photo'}>
        <div onClick={() => setLightbox(null)} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={lightbox || ''} alt="" style={{ maxWidth: '96vw', maxHeight: '92svh', objectFit: 'contain', borderRadius: 8 }} />
        </div>
        <button type="button" className="kk-icon-btn" onClick={() => setLightbox(null)} aria-label={lang === 'ja' ? '閉じる' : lang === 'zh' ? '關閉' : 'Close'}
          style={{ position: 'absolute', top: 'calc(16px + env(safe-area-inset-top, 0px))', right: 16, background: 'rgba(0,0,0,.5)', borderColor: 'rgba(255,255,255,.3)', color: '#fff' }}>
          <CloseIcon />
        </button>
      </Sheet>

      {/* Delete confirmation */}
      <Sheet open={!!confirmDel} onClose={() => setConfirmDel(null)} variant="dialog" label={t('confirmDelete')}>
        {confirmDel && (<>
          <h2 className="kk-confirm__title kk-confirm__title--danger">{t('confirmDelete')}</h2>
          <p className="kk-confirm__target">{[confirmDel.brand, confirmDel.name].filter(Boolean).join(' ')}</p>
          <p className="kk-confirm__note">{(lang === 'ja' ? '写真・メモ・評価もすべて消え、元に戻せません。' : lang === 'zh' ? '照片、筆記和評分都會一併刪除，無法復原。' : 'Photos, notes and rating will be removed. This cannot be undone.')}</p>
          <div className="kk-confirm__actions">
            <button type="button" className="kk-btn" data-autofocus onClick={() => setConfirmDel(null)}>{(lang === 'ja' ? 'キャンセル' : lang === 'zh' ? '取消' : 'Cancel')}</button>
            <button type="button" className="kk-btn kk-btn--danger" disabled={deleting} onClick={async () => {
              setDeleting(true)
              await supabase.from('sake_entries').delete().eq('id', confirmDel.id)
              setDeleting(false)
              setConfirmDel(null); await fetchEntries(); closeClean()
            }}>{t('delete')}</button>
          </div>
        </>)}
      </Sheet>

      {/* Form sheet — 新しい記録 */}
      <Sheet
        open={sheet === 'form'}
        onClose={close}
        className="kk-panel--full"
        label={editId ? t('form.editEntry') : t('form.newEntry')}
        header={<>
          <button type="button" className="kk-icon-btn" onClick={close} aria-label={L3('閉じる', '關閉', 'Close')}><CloseIcon /></button>
          <h2 className="kk-panel__title">{editId ? t('form.editEntry') : t('form.newEntry')}</h2>
          {editId && editStatus === 'draft'
            ? <span className="kk-status kk-status--draft">{L3('下書き', '草稿', 'Draft')}</span>
            : !editId && autoSaved
              ? <span className="kk-save-state" title={L3('この端末に保存されています', '已保存在這台裝置', 'Kept on this device')}>{L3('下書き保存済み', '草稿已暫存', 'Draft kept')}</span>
              : <span className="kk-panel__head-spacer" />}
        </>}
        footer={<>
          <button type="button" role="switch" className="kk-foot-public" aria-checked={!!form.is_public}
            onClick={() => (form.is_public ? f('is_public', false) : askPublic())}
            title={L3('廣場への公開', '公開到廣場', 'Share to Discover')}>
            {form.is_public ? L3('公開する', '公開', 'Public') : L3('非公開', '不公開', 'Private')}
          </button>
          {(!editId || editStatus === 'draft') && (
            <button type="button" className="kk-btn" onClick={() => save('draft')} disabled={saving}>{L3('下書き', '存草稿', 'Draft')}</button>
          )}
          <button type="button" className="kk-btn kk-btn--primary" onClick={() => save('publish')} disabled={saving}>
            {saving ? t('saving') : editId && editStatus !== 'draft' ? L3('変更を保存', '儲存變更', 'Save changes') : L3('保存', '保存', 'Save')}
          </button>
        </>}
      >
        <div className="kk-form">
          <div className="kk-progress" aria-hidden="true">
            {[!!(photoPreview || photoPreview2), !!(form.brand.trim() || form.name.trim()), form.rating > 0, !!(aromaTags.length || tasteTags.length || form.notes.trim() || formTags.length)]
              .map((on, i) => <span key={i} className={`kk-progress__step${on ? ' is-on' : ''}`} />)}
          </div>

          {saveError && <div className="kk-banner kk-banner--error" role="alert">{saveError}</div>}

          {forwardSource && (
            <div className="kk-banner kk-banner--info">
              {L3(`「${forwardSource}」をもとに記録中`, `基於「${forwardSource}」記錄`, `Based on "${forwardSource}"`)}
            </div>
          )}

          {draftRestored && (
            <div className="kk-note-card">
              <div className="kk-note-card__mark" aria-hidden="true">札</div>
              <div>
                <strong>{L3('前回の続きがあります', '有上次未完成的記錄', 'Picking up where you left off')}</strong>
                <div className="kk-helper">{L3('写真だけの下書きも、このまま保存できます。', '只有照片的草稿也可以直接保存。', 'Even a photo-only draft can be saved as is.')}</div>
              </div>
              <button type="button" className="kk-label-action" style={{ color: 'var(--muted)', fontWeight: 700 }} onClick={() => setConfirmDiscard(true)}>{L3('破棄', '放棄', 'Discard')}</button>
            </div>
          )}

          {/* 1 · 写真 */}
          <section className="kk-section" aria-labelledby="kk-sec-photo">
            <h3 className="kk-section__title" id="kk-sec-photo">{t('form.photos')}</h3>
            {!photoPreview && !photoPreview2 ? (
              <button type="button" className="kk-upload" onClick={() => fileRefBoth.current.click()}>
                <div>
                  <strong>{L3('ラベルを撮る', '拍酒標', 'Photograph the label')}</strong>
                  <span>{L3('表と裏をまとめて選べます · スキップして酒名だけでも保存', '可一次選正面和背標 · 也可以略過，只填酒名', 'Front and back together · or skip and just type the name')}</span>
                </div>
              </button>
            ) : (<>
              <div className="kk-photo-main">
                <button type="button" className="kk-bottle-stage" onClick={() => photoPreview ? setBottleEdit({ src: photoPreview, initial: form.photo_crop }) : fileRef.current.click()}
                  aria-label={photoPreview ? L3('瓶身を調整', '調整瓶身', 'Adjust the bottle') : L3('瓶の写真を追加', '新增瓶身照片', 'Add a bottle photo')} style={{ border: 0 }}>
                  <SakeBottleCrop imageUrl={photoPreview} crop={form.photo_crop} height="136px" />
                </button>
                <div className="kk-photo-main__actions">
                  {photoPreview ? (<>
                    <button type="button" className="kk-btn kk-btn--sm" onClick={() => setBottleEdit({ src: photoPreview, initial: form.photo_crop })}>{L3('瓶身を調整', '調整瓶身', 'Adjust bottle')}</button>
                    <button type="button" className="kk-label-action" onClick={() => setLightbox(photoPreview)}>{L3('元の写真を見る', '查看原圖', 'View original')}</button>
                    <button type="button" className="kk-label-action" onClick={() => fileRef.current.click()}>{L3('撮り直す', '重拍', 'Retake')}</button>
                  </>) : (
                    <button type="button" className="kk-btn kk-btn--sm" onClick={() => fileRef.current.click()}>{L3('＋ 瓶の写真', '＋ 瓶身照片', '+ Bottle photo')}</button>
                  )}
                </div>
              </div>
              <div className="kk-photo-back">
                <button type="button" className="kk-photo" onClick={() => photoPreview2 ? setLightbox(photoPreview2) : fileRef2.current.click()}
                  aria-label={photoPreview2 ? `${L3('裏ラベル', '背標', 'Back label')} — ${L3('拡大', '放大', 'Enlarge')}` : `${L3('裏ラベル', '背標', 'Back label')} — ${t('form.tapToAdd')}`}>
                  {photoPreview2 ? <img src={photoPreview2} alt="" /> : <span>＋</span>}
                </button>
                <div className="kk-helper">
                  <strong style={{ display: 'block', color: 'var(--ink)', fontSize: 12 }}>{L3('裏ラベル', '背標', 'Back label')}</strong>
                  {photoPreview2
                    ? <button type="button" className="kk-label-action" onClick={() => fileRef2.current.click()}>{L3('撮り直す', '重拍', 'Retake')}</button>
                    : L3('スペック確認用（任意）', '用來確認規格（選填）', 'For checking specs (optional)')}
                </div>
              </div>
            </>)}
            <input ref={fileRefBoth} type="file" accept="image/*" multiple hidden onChange={onPhotoBoth} />
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPhoto} />
            <input ref={fileRef2} type="file" accept="image/*" hidden onChange={onPhoto2} />
          </section>

          {/* 2 · 酒名 */}
          <section className="kk-section" aria-labelledby="kk-sec-basic">
            <h3 className="kk-section__title" id="kk-sec-basic">
              <span>{L3('どのお酒？', '哪一瓶？', 'Which sake?')}</span>
              <span className="kk-required">{L3('保存に必要', '儲存必填', 'Required')}</span>
            </h3>
            <div className="kk-field">
              <span className="kk-field__label">
                <label htmlFor="kk-field-name">{L3('酒名', '酒名', 'Sake name')}</label>
                <button type="button" className="kk-label-action" disabled={searchLoading || (!form.brand && !form.name && !form.brewery)} onClick={() => runSearch(form)}>
                  {searchLoading ? t('ocr.searching') : L3('ネットで補完', '從網路補全', 'Fill from the web')}
                </button>
              </span>
              <NameInput id="kk-field-name" className="kk-input" aria-invalid={!!formErrors.name} aria-describedby="kk-name-meta"
                value={[form.brand, form.name].filter(Boolean).join(' ')}
                brand=""
                onChange={onSakeNameChange}
                onBrandFill={v => { pendingBrandRef.current = v }}
                onProductFill={p => setForm(prev => ({
                  ...prev,
                  product_id: p.id || null,
                  brewery:   prev.brewery   || p.brewery   || '',
                  region:    prev.region    || p.region    || '',
                  type:      prev.type      || normalizeType(p.type),
                  rice:      prev.rice      || p.rice      || '',
                  yeast:     prev.yeast     || p.yeast     || '',
                  polishing: prev.polishing || p.polishing || '',
                  alcohol:   prev.alcohol   || p.alcohol   || '',
                  smv:       prev.smv       || p.smv       || '',
                  acidity:   prev.acidity   || p.acidity   || '',
                }))}
                onBreweryFill={v => f('brewery', v)} onRegionFill={v => f('region', v)}
                onBlur={splitBrandFromName}
                placeholder={L3('十四代 本丸、獺祭 純米大吟醸 45…', '十四代 本丸、獺祭 純米大吟釀 45…', 'Juyondai Honmaru, Dassai 45…')} />
            </div>
            {formErrors.name && <p className="kk-field-error" role="alert" style={{ marginBottom: 10 }}>{formErrors.name}</p>}
            {(form.brand || form.brewery || form.name_reading) && (
              <p className="kk-name-meta" id="kk-name-meta">
                {[form.brand && <>{L3('銘柄', '銘柄', 'Brand')}：<b>{form.brand}</b></>, form.brewery && <>{L3('酒造', '酒造', 'Brewery')}：<b>{form.brewery}</b></>, form.name_reading]
                  .filter(Boolean).map((x, i) => <span key={i}>{i > 0 && ' · '}{x}</span>)}
              </p>
            )}
            <div className="kk-row2">
              <div className="kk-field">
                <label className="kk-field__label" htmlFor="kk-field-brewery">{L3('酒造', '酒造', 'Brewery')}</label>
                <BreweryInput id="kk-field-brewery" className="kk-input" value={form.brewery} onChange={v => f('brewery', v)}
                  onRegionFill={v => f('region', v)} placeholder={t('form.breweryPH')} />
              </div>
              <div className="kk-field">
                <label className="kk-field__label" htmlFor="kk-field-region">{t('form.region')}</label>
                <input id="kk-field-region" className="kk-input" value={form.region} onChange={e => f('region', e.target.value)} placeholder={t('form.regionPH')} />
              </div>
            </div>
            {awardYears.length > 0 && (
              <div className="kk-awards">
                {awardYears.map((a, i) => {
                  const prefix = a.year_code?.startsWith('SC_') ? 'SC' : a.year_code?.startsWith('IWC_') ? 'IWC' : '鑑'
                  return <span key={i} title={a.brand_name}>★ {prefix} {a.year}</span>
                })}
              </div>
            )}
            <div className="kk-field">
              <span className="kk-field__label" id="kk-dates-label">{L3('飲んだ日', '飲用日', 'Date tasted')}</span>
              {!datesOpen ? (
                <button type="button" className="kk-oneline" aria-labelledby="kk-dates-label" aria-expanded="false" onClick={() => setDatesOpen(true)}>
                  <span>{formDates[0] === TODAY() ? L3('今日', '今天', 'Today') : (formDates[0] || '').replaceAll('-', '.')}{formDates.length > 1 ? L3(` ほか${formDates.length - 1}日`, ` 等 ${formDates.length} 天`, ` +${formDates.length - 1}`) : ''}</span>
                  <span>{L3('変更', '更改', 'Change')}</span>
                </button>
              ) : (
              <div className="kk-dates" role="group" aria-labelledby="kk-dates-label">
                {formDates.map((d, i) => (
                  <div key={i} className="kk-dates__row">
                    {i === 0 && formDates.length > 1 && <span className="kk-dates__latest">{L3('最近', '最近', 'Latest')}</span>}
                    <input className="kk-input" type="date" value={d} aria-label={`${L3('飲んだ日', '飲用日', 'Date tasted')} ${i + 1}`}
                      onChange={e => {
                        const val = e.target.value
                        setFormDates(prev => [...prev.slice(0, i), val, ...prev.slice(i + 1)].filter(Boolean).sort().reverse())
                      }} />
                    {formDates.length > 1 && (
                      <button type="button" className="kk-icon-btn" onClick={() => setFormDates(prev => prev.filter((_, idx) => idx !== i))}
                        aria-label={L3('この日付を削除', '刪除這個日期', 'Remove this date')}><CloseIcon size={14} /></button>
                    )}
                  </div>
                ))}
                <button type="button" className="kk-btn kk-btn--ghost kk-btn--sm" style={{ justifySelf: 'start', padding: 0 }}
                  onClick={() => setFormDates(prev => [...new Set([...prev, TODAY()])].sort().reverse())}>
                  {L3('＋ 飲んだ日を追加', '＋ 新增飲用日', '+ Add a date')}
                </button>
              </div>
              )}
            </div>
          </section>

          {/* 3 · 私の評価 */}
          <section className="kk-section" aria-labelledby="kk-sec-rating">
            <h3 className="kk-section__title" id="kk-sec-rating">
              <span>{L3('私の評価', '我的評分', 'My rating')}</span>
              <span className="kk-required">{L3('保存に必要', '儲存必填', 'Required')}</span>
            </h3>
            <RatingPicker id="kk-field-rating" value={form.rating} label={L3('私の評価', '我的評分', 'My rating')} invalid={!!formErrors.rating}
              onChange={v => { f('rating', v); if (formErrors.rating) setFormErrors(e => ({ ...e, rating: null })) }} />
            {formErrors.rating
              ? <p className="kk-field-error" role="alert" style={{ marginTop: 6 }}>{formErrors.rating}</p>
              : <p className="kk-form-hint">{L3('酒名と評価だけで保存できます。迷ったら「下書き」へ。', '只要酒名和評分就能保存。還沒想好就先存草稿。', 'A name and a rating are enough. Not sure yet? Save a draft.')}</p>}
          </section>

          {/* 4 · 感想 */}
          <section className="kk-section" aria-labelledby="kk-sec-feel">
            <h3 className="kk-section__title" id="kk-sec-feel">{L3('感想', '感想', 'Impressions')}</h3>
            {(() => {
              const tabs = [
                ['aroma', t('form.aroma'), aromaTags.length],
                ['taste', t('form.taste'), tasteTags.length],
                ['notes', t('form.notes'), (form.notes.trim() ? 1 : 0) + formTags.length],
              ]
              return (<>
                <div className="kk-tabs" role="tablist" aria-label={L3('感想', '感想', 'Impressions')}>
                  {tabs.map(([id, label, n]) => (
                    <button key={id} type="button" role="tab" id={`kk-tab-${id}`} aria-controls={`kk-tabpanel-${id}`}
                      aria-selected={feelTab === id} className={`kk-chip${feelTab === id ? ' is-active' : ''}`}
                      onClick={() => setFeelTab(id)}>
                      {label}{n > 0 && id !== 'notes' && <span className="kk-tab__count">{n}</span>}{n > 0 && id === 'notes' && <span aria-hidden="true">✓</span>}
                    </button>
                  ))}
                </div>
                <div role="tabpanel" id={`kk-tabpanel-${feelTab}`} aria-labelledby={`kk-tab-${feelTab}`}>
                  {feelTab === 'aroma' && <TastingTagPicker category="aroma" selected={aromaTags} onChange={setAromaTags} lang={lang} />}
                  {feelTab === 'taste' && <TastingTagPicker category="taste" selected={tasteTags} onChange={setTasteTags} lang={lang} />}
                  {feelTab === 'notes' && (<>
                    <textarea className="kk-textarea" value={form.notes} onChange={e => f('notes', e.target.value)}
                      placeholder={t('form.notesPH')} aria-label={t('form.notes')} />
                    <div className="kk-field" style={{ marginTop: 12 }}>
                      <span className="kk-field__label">{L3('整理', '整理', 'Labels')}</span>
                      <FlavorTagPicker selected={formTags} onChange={setFormTags} lang={lang} t={t} />
                    </div>
                  </>)}
                </div>
              </>)
            })()}
          </section>

          {/* 5 · 規格 (collapsed) */}
          <section className="kk-section" style={{ paddingTop: 4 }}>
            {(() => {
              const summary = [typeLabel(form.type), form.polishing && `${L3('精米', '精米', 'Polish')} ${form.polishing}`, form.alcohol, form.rice, form.yeast]
                .filter(Boolean).map(v => String(v)).join(' · ')
              const n = methodTags.length
              return (
                <button type="button" className="kk-disclosure" aria-expanded={specsOpen} aria-controls="kk-specs" onClick={() => setSpecsOpen(o => !o)}>
                  <span className="kk-disclosure__text">
                    <span className="kk-disclosure__title">{L3('精米歩合・原料米など', '精米步合・原料米等', 'Polishing, rice & more')}</span>
                    <span className="kk-disclosure__summary">{summary || (n ? `${t('form.methodTags')} ${n}` : L3('任意 · 補完ボタンで自動入力されます', '選填 · 可用補全按鈕自動帶入', 'Optional · the fill button can complete these'))}</span>
                  </span>
                  <svg className="kk-disclosure__chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
                </button>
              )
            })()}
            {specsOpen && (
              <div className="kk-disclosure-panel" id="kk-specs">
                <div className="kk-row2">
                  <div className="kk-field">
                    <label className="kk-field__label" htmlFor="kk-field-type">{t('form.type')}</label>
                    <select id="kk-field-type" className="kk-select" value={form.type} onChange={e => f('type', e.target.value)}>
                      <option value="">{t('form.typeSelect')}</option>
                      {sakeTypes.map(tp => (
                        <option key={tp.id} value={tp.id}>{lang === 'ja' ? cleanJa(tp.ja) : `${cleanJa(tp.ja)} · ${tp[lang] || tp.en}`}</option>
                      ))}
                    </select>
                  </div>
                  <div className="kk-field">
                    <label className="kk-field__label" htmlFor="kk-field-bottling">{t('form.bottling')}</label>
                    <input id="kk-field-bottling" className="kk-input" type="text" inputMode="numeric" maxLength="7" value={form.bottling_date} onChange={e => f('bottling_date', e.target.value)} placeholder="yyyy-mm" />
                  </div>
                </div>
                <div className="kk-row2">
                  <div className="kk-field">
                    <label className="kk-field__label" htmlFor="kk-field-rice">{t('form.rice')}</label>
                    <RiceInput id="kk-field-rice" className="kk-input" value={form.rice} onChange={v => f('rice', v)} placeholder={t('form.ricePH')} />
                  </div>
                  <div className="kk-field">
                    <label className="kk-field__label" htmlFor="kk-field-yeast">{t('form.yeast')}</label>
                    <input id="kk-field-yeast" className="kk-input" value={form.yeast} onChange={e => f('yeast', e.target.value)} />
                  </div>
                </div>
                <div className="kk-row4">
                  {[['polishing', '60%', 'decimal'], ['alcohol', '15%', 'decimal'], ['smv', '+1', 'text'], ['acidity', '1.5', 'decimal']].map(([k, ph, mode]) => (
                    <div key={k} className="kk-field">
                      <label className="kk-field__label" htmlFor={`kk-field-${k}`}>{t(`form.${k}`)}</label>
                      <input id={`kk-field-${k}`} className="kk-input" inputMode={mode} value={form[k]} onChange={e => f(k, e.target.value)} placeholder={ph} />
                    </div>
                  ))}
                </div>
                <div className="kk-field">
                  <span className="kk-field__label">{t('form.methodTags')}</span>
                  <TastingTagPicker category="method" selected={methodTags} onChange={setMethodTags} lang={lang} />
                </div>
              </div>
            )}
          </section>

        </div>
      </Sheet>
      <Toast toast={toast} onDone={clearToast} />

      {bottleEdit && (
        <BottleCropEditor key={bottleEdit.src} open src={bottleEdit.src} initial={bottleEdit.initial} lang={lang}
          onSave={crop => finishBottleEdit(crop)} onSkip={() => finishBottleEdit(null)} onClose={() => finishBottleEdit(null)} />
      )}

      <Sheet open={confirmPublic} onClose={() => setConfirmPublic(false)} variant="dialog" label={L3('廣場に公開されます', '將公開到廣場', 'This will be shared')}>
        <h2 className="kk-confirm__title">{L3('廣場に公開されます', '將公開到廣場', 'This will appear in Discover')}</h2>
        <p className="kk-confirm__note">{L3('写真・評価・メモがみんなに見えます。あとで非公開に戻せます。', '照片、評分和筆記會讓大家看到；之後可以改回不公開。', 'Photo, rating and notes become visible. You can make it private again later.')}</p>
        <div className="kk-field">
          <label className="kk-field__label" htmlFor="kk-field-contributor">{t('form.displayName')}</label>
          <input id="kk-field-contributor" className="kk-input" value={form.contributor_name} onChange={e => f('contributor_name', e.target.value)} placeholder={defaultName} />
        </div>
        <div className="kk-confirm__actions">
          <button type="button" className="kk-btn" onClick={() => setConfirmPublic(false)}>{L3('やめる', '取消', 'Cancel')}</button>
          <button type="button" className="kk-btn kk-btn--primary" data-autofocus onClick={() => { f('is_public', true); setConfirmPublic(false); try { localStorage.setItem('kk_public_ok', '1') } catch { /* storage blocked */ } }}>{L3('公開する', '公開', 'Share')}</button>
        </div>
      </Sheet>

      <Sheet open={confirmDiscard} onClose={() => setConfirmDiscard(false)} variant="dialog" label={L3('この下書きを破棄しますか？', '要放棄這份草稿嗎？', 'Discard this draft?')}>
        <h2 className="kk-confirm__title kk-confirm__title--danger">{L3('この下書きを破棄しますか？', '要放棄這份草稿嗎？', 'Discard this draft?')}</h2>
        <p className="kk-confirm__note">{(photoPreview || photoPreview2)
          ? L3('入力した内容と写真がこの端末から消えます。', '輸入的內容和照片都會從這台裝置刪除。', 'Your input and photos will be removed from this device.')
          : L3('入力した内容がこの端末から消えます。', '輸入的內容會從這台裝置刪除。', 'Your input will be removed from this device.')}</p>
        <div className="kk-confirm__actions">
          <button type="button" className="kk-btn" data-autofocus onClick={() => setConfirmDiscard(false)}>{L3('残す', '保留', 'Keep')}</button>
          <button type="button" className="kk-btn kk-btn--danger" onClick={() => { resetForm(); setConfirmDiscard(false) }}>{L3('破棄する', '放棄', 'Discard')}</button>
        </div>
      </Sheet>
    </div>
  )
}
