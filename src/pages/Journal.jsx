import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { uploadPhoto, compressImage } from '../lib/upload'
import Nav from '../components/Nav'
import Stars, { StarsLight } from '../components/Stars'
import { BrandMarkFull } from '../components/BrandMark'
import { BreweryInput, BrandInput, RiceInput } from '../components/Autocomplete'
import TastingTagPicker from '../components/TastingTagPicker'
import { useLang } from '../contexts/LangContext'
import { SAKE_TYPES, TASTING_TAGS, getTagLabel } from '../lib/i18n'


const ScanIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/>
    <path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
  </svg>
)
const SpinIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    style={{ animation: 'spin 1s linear infinite' }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
)

const MARK_SVG_ABS = (
  <svg style={{ position: 'absolute', right: -40, bottom: -40, width: 200, height: 200, opacity: .065, pointerEvents: 'none', zIndex: 0 }}
    viewBox="0 0 88 88" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(44,44)">
      <path d="M-15,-37 C-30,-30 -40,-14 -40,4 C-40,22 -32,36 -18,40 C-4,44 14,40 26,28 C36,18 40,2 36,-14 C32,-28 20,-38 4,-40" fill="none" stroke="#7C3A28" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M-10,-27 C-22,-22 -30,-10 -30,4 C-30,18 -22,28 -10,32 C2,36 16,30 24,20 C30,12 30,-2 24,-14 C18,-24 6,-30 -4,-30" fill="none" stroke="#7C3A28" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M-6,-18 C-14,-14 -20,-6 -20,4 C-20,14 -14,20 -4,22 C6,24 16,18 20,10 C22,4 20,-6 14,-12 C8,-18 0,-20 -4,-20" fill="none" stroke="#7C3A28" strokeWidth="2" strokeLinecap="round" />
      <circle r="10" fill="#4A7A35" />
    </g>
  </svg>
)

const EMPTY_FORM = {
  name: '', brewery: '', region: '', type: '',
  alcohol: '', rice: '', polishing: '', smv: '', acidity: '', yeast: '',
  rating: 0, notes: '',
  tasted_at: new Date().toISOString().slice(0, 10),
  bottling_date: '',
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
  searchInput: { flex: 1, padding: '9px 14px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 14, outline: 'none' },
  statsRow: { display: 'flex', gap: 16, fontSize: 12, color: 'var(--sub)', marginBottom: 16, flexWrap: 'wrap' },
  statNum: { color: 'var(--text)', fontWeight: 600 },
  chips: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 },
  chip: (active) => ({ padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, background: active ? 'var(--accent)' : 'var(--surface)', color: active ? '#fff' : 'var(--text)', fontFamily: 'var(--font-sans)', boxShadow: active ? 'none' : '0 1px 4px rgba(26,22,20,.06)' }),
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 },
  addCard: { borderRadius: 14, border: '2px dashed var(--border)', aspectRatio: '3/4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--surface)', color: 'var(--sub)', gap: 8 },
  card: { borderRadius: 14, overflow: 'hidden', cursor: 'pointer', position: 'relative', aspectRatio: '3/4' },
  cardImg: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' },
  cardOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,.05) 0%, rgba(0,0,0,.25) 40%, rgba(0,0,0,.75) 75%, rgba(0,0,0,.88) 100%)' },
  cardNo: { position: 'absolute', inset: 0, background: '#2d2520', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: 'rgba(255,245,230,.15)' },
  cardBody: { position: 'absolute', inset: 0, padding: '10px 11px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', color: '#fff' },
  cardType: { fontSize: 9, letterSpacing: '.08em', color: 'rgba(255,245,230,.7)', marginBottom: 3 },
  cardName: { fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 600, lineHeight: 1.35, marginBottom: 3 },
  cardBrewery: { fontSize: 11, color: 'rgba(255,245,230,.75)', marginBottom: 5 },
  cardMeta: { fontSize: 9, color: 'rgba(255,245,230,.5)', marginTop: 4 },
  cardTags: { display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 7 },
  cardTag: { fontSize: 9, padding: '2px 7px', borderRadius: 20, background: 'rgba(255,245,230,.1)', color: 'rgba(255,245,230,.85)', border: '1px solid rgba(255,245,230,.12)' },
  publicBadge: { position: 'absolute', top: 8, right: 8, fontSize: 9, padding: '2px 8px', borderRadius: 20, background: 'rgba(74,122,53,.85)', color: '#fff', zIndex: 1, letterSpacing: '.04em' },
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(26,22,20,.55)', zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  detModal: { background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '90svh', overflow: 'hidden auto', position: 'relative', padding: '32px 32px 28px' },
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
  formBackdrop: { position: 'fixed', inset: 0, background: 'rgba(26,22,20,.5)', zIndex: 30, display: 'flex', alignItems: 'flex-end' },
  formSheet: { background: 'var(--surface)', borderRadius: '22px 22px 0 0', width: '100%', maxWidth: 640, margin: '0 auto', maxHeight: '94svh', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  formInner: { overflow: 'hidden auto', flex: 1, padding: '0 24px 40px' },
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

export default function Journal({ session }) {
  const { lang, t } = useLang()
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

  const [ocrLoading, setOcrLoading] = useState(false)
  const [lightbox, setLightbox] = useState(null)
  const [detail, setDetail] = useState(null)
  const fileRef = useRef()
  const fileRef2 = useRef()
  const fileRefMulti = useRef()

  useEffect(() => { fetchEntries() }, [])

  const fetchEntries = async () => {
    setLoading(true)
    const { data } = await supabase.from('sake_entries').select('*')
      .eq('user_id', session.user.id).order('tasted_at', { ascending: false })
    setEntries(data || [])
    setLoading(false)
  }

  const allTags = [...new Set(entries.flatMap(e => e.tags || []))]
  const visibleTags = tagsExp ? allTags : allTags.slice(0, 8)
  const filtered = entries.filter(e => {
    if (activeTag && !e.tags?.includes(activeTag)) return false
    if (search) {
      const q = search.toLowerCase()
      return (e.name || '').toLowerCase().includes(q) ||
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
    setForm(EMPTY_FORM); setFormTags([]); setAromaTags([]); setTasteTags([]); setEditId(null)
    setPhotoFile(null); setPhotoFile2(null); setPhotoPreview(null); setPhotoPreview2(null)
    setSheet('form')
  }
  const openEdit = e => {
    setForm({
      name: e.name || '', brewery: e.brewery || '', region: e.region || '', type: e.type || '',
      alcohol: e.alcohol || '', rice: e.rice || '', polishing: e.polishing || '',
      smv: e.smv || '', acidity: e.acidity || '', yeast: e.yeast || '',
      rating: e.rating || 0, notes: e.notes || '',
      tasted_at: e.tasted_at || new Date().toISOString().slice(0, 10),
      bottling_date: e.bottling_date || '',
      is_public: e.is_public ?? false, contributor_name: e.contributor_name || '',
    })
    setFormTags(e.tags || [])
    setAromaTags(e.aroma_tags || [])
    setTasteTags(e.taste_tags || [])
    setEditId(e.id)
    setPhotoFile(null); setPhotoFile2(null)
    setPhotoPreview(e.photo_url || null); setPhotoPreview2(e.photo_url2 || null)
    setSheet('form')
  }
  const close = () => { setSheet(null); setDetail(null) }

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
    if (date) setForm(p => ({ ...p, tasted_at: date }))
  }
  const onPhoto2 = async e => {
    const f = e.target.files[0]; if (!f) return
    const blob = await compressImage(f)
    setPhotoFile2(blob); setPhotoPreview2(URL.createObjectURL(blob))
  }

  const onPhotoMulti = async e => {
    const files = [...e.target.files].slice(0, 2)
    if (!files.length) return
    const [blobs, date] = await Promise.all([
      Promise.all(files.map(f => compressImage(f))),
      readExifDate(files[0]),
    ])
    if (date) setForm(p => ({ ...p, tasted_at: date }))
    if (blobs[0]) { setPhotoFile(blobs[0]); setPhotoPreview(URL.createObjectURL(blobs[0])) }
    if (blobs[1]) { setPhotoFile2(blobs[1]); setPhotoPreview2(URL.createObjectURL(blobs[1])) }
    e.target.value = ''
  }


  const save = async () => {
    if (!form.name.trim()) return
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
      const payload = {
        ...form, rating: form.rating || null,
        tags: formTags.length ? formTags : null,
        aroma_tags: aromaTags.length ? aromaTags : null,
        taste_tags: tasteTags.length ? tasteTags : null,
        photo_url, photo_url2, user_id: uid,
        contributor_name: form.is_public ? (form.contributor_name.trim() || defaultName) : null,
      }
      if (editId) await supabase.from('sake_entries').update(payload).eq('id', editId)
      else await supabase.from('sake_entries').insert(payload)
      await fetchEntries(); close()
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const SAKE_TYPE_IDS = ['純米','純米吟醸','純米大吟醸','吟醸','大吟醸','特別純米','本醸造','普通酒','その他']

  const toBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve({ base64: reader.result.split(',')[1], mimeType: blob.type || 'image/jpeg' })
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })

  const runOcr = async () => {
    setOcrLoading(true)
    try {
      // Collect blobs for both photo slots
      const getBlob = async (file, preview) => {
        if (file) return file
        if (preview) { const r = await fetch(preview); return r.blob() }
        return null
      }
      const [blob1, blob2] = await Promise.all([
        getBlob(photoFile, photoPreview),
        getBlob(photoFile2, photoPreview2),
      ])
      if (!blob1 && !blob2) return

      const [img1, img2] = await Promise.all([
        blob1 ? toBase64(blob1) : null,
        blob2 ? toBase64(blob2) : null,
      ])

      const body = {
        image_base64: (img1 ?? img2).base64,
        mime_type: (img1 ?? img2).mimeType,
        ...(img1 && img2 ? { image_base64_2: img2.base64, mime_type_2: img2.mimeType } : {}),
      }
      const { data, error } = await supabase.functions.invoke('ocr-sake', { body })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      setForm(prev => ({
        ...prev,
        ...(data.name      ? { name: data.name }           : {}),
        ...(data.brewery   ? { brewery: data.brewery }     : {}),
        ...(data.region    ? { region: data.region }       : {}),
        ...(data.type && SAKE_TYPE_IDS.includes(data.type) ? { type: data.type } : {}),
        ...(data.rice      ? { rice: data.rice }           : {}),
        ...(data.yeast     ? { yeast: data.yeast }         : {}),
        ...(data.polishing != null ? { polishing: String(data.polishing) } : {}),
        ...(data.alcohol   != null ? { alcohol: String(data.alcohol) }   : {}),
        ...(data.smv       != null ? { smv: String(data.smv) }           : {}),
        ...(data.acidity   != null ? { acidity: String(data.acidity) }   : {}),
        ...(data.bottling_date ? { bottling_date: data.bottling_date } : {}),
      }))
    } catch (e) { alert('識別失敗: ' + e.message) }
    finally { setOcrLoading(false) }
  }

  // On name blur: if brewery not yet filled, scan name for any known brand
  const inferBreweryFromName = async () => {
    const nameVal = form.name.trim()
    if (!nameVal || form.brewery) return
    // Split on spaces and punctuation, try each token as a brand prefix
    const tokens = [...new Set(
      nameVal.split(/[\s　・\/「」【】（）()\-]+/).filter(s => s.length >= 2)
    )]
    for (const token of tokens) {
      const { data } = await supabase
        .from('sake_brands')
        .select('name, sake_breweries(name, sake_areas(name))')
        .ilike('name', `${token}%`)
        .limit(10)
      const match = data?.find(r => nameVal.includes(r.name))
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

  const TableRow = ({ label, value }) => value ? (
    <tr style={s.detTr}><th style={s.detTh}>{label}</th><td style={s.detTd}>{value}</td></tr>
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
        <div style={s.searchRow}>
          <input style={s.searchInput} value={search} onChange={e => setSearch(e.target.value)} placeholder={t('search')} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--sub)', cursor: 'pointer', fontSize: 18 }}>×</button>}
        </div>

        {entries.length > 0 && (
          <div style={s.statsRow}>
            <span><span style={s.statNum}>{entries.length}</span> {t('stats.bottles')}</span>
            {avgRating && <span>{t('stats.avg')} <span style={s.statNum}>{avgRating}</span> ★</span>}
            {topBrewery && <span>{t('stats.most')} <span style={s.statNum}>{topBrewery}</span></span>}
            {sharedCount > 0 && <span>{t('stats.shared')} <span style={s.statNum}>{sharedCount}</span></span>}
          </div>
        )}

        {allTags.length > 0 && (
          <div style={s.chips}>
            <button style={s.chip(!activeTag)} onClick={() => setActiveTag('')}>{t('all')}</button>
            {visibleTags.map(tag => (
              <button key={tag} style={s.chip(activeTag === tag)} onClick={() => setActiveTag(activeTag === tag ? '' : tag)}>{tag}</button>
            ))}
            {allTags.length > 8 && (
              <button style={s.chip(false)} onClick={() => setTagsExp(x => !x)}>{tagsExp ? t('less') : t('more')}</button>
            )}
          </div>
        )}

        <div style={s.grid}>
          <div style={s.addCard} onClick={openAdd}>
            <span style={{ fontSize: 28, color: 'var(--border)' }}>+</span>
            <span style={{ fontSize: 13 }}>{t('form.newEntry')}</span>
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
                <div style={s.cardName}>{e.name}</div>
                {e.brewery && <div style={s.cardBrewery}>{e.brewery}</div>}
                <StarsLight rating={e.rating} />
                <div style={s.cardMeta}>{[e.region, e.tasted_at].filter(Boolean).join(' · ')}</div>
                {e.tags?.length > 0 && (
                  <div style={s.cardTags}>
                    {e.tags.slice(0, 3).map(tag => <span key={tag} style={s.cardTag}>{tag}</span>)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail modal */}
      {sheet !== 'form' && detail && (
        <div style={s.backdrop} onClick={close}>
          <div style={s.detModal} onClick={e => e.stopPropagation()}>
            {MARK_SVG_ABS}
            <button style={s.detClose} onClick={close}>✕</button>
            {detail.type && <div style={{ fontSize: 10, color: 'var(--accent)', letterSpacing: '.06em', marginBottom: 8 }}>{typeLabel(detail.type)}</div>}
            <div style={s.detName}>{detail.name}</div>
            <Stars rating={detail.rating} size={14} />
            <table style={s.detTable}>
              <tbody>
                <TableRow label={t('detail.brewery')} value={detail.brewery} />
                <TableRow label={t('detail.region')} value={detail.region} />
                <TableRow label={t('detail.rice')} value={detail.rice} />
                <TableRow label={t('detail.polishing')} value={detail.polishing} />
                <TableRow label={t('detail.alcohol')} value={detail.alcohol} />
                <TableRow label={t('detail.smv')} value={detail.smv} />
                <TableRow label={t('detail.acidity')} value={detail.acidity} />
                <TableRow label={t('detail.yeast')} value={detail.yeast} />
                <TableRow label={t('detail.bottling')} value={detail.bottling_date} />
                <TableRow label={t('detail.drinking')} value={detail.tasted_at} />
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
              <div style={s.detTagsRow}>{detail.tags.map(tag => <span key={tag} style={s.detTag}>{tag}</span>)}</div>
            )}
            {detail.is_public && (
              <div style={{ fontSize: 12, color: 'var(--sub)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4A7A35', display: 'inline-block' }} />
                {t('public')}{detail.contributor_name ? ` · ${detail.contributor_name}` : ''}
              </div>
            )}
            <div style={s.detActions}>
              <button style={s.editBtn} onClick={() => { setDetail(null); openEdit(detail) }}>{t('edit')}</button>
              <button style={s.delBtn} onClick={async () => {
                if (!confirm(t('confirmDelete'))) return
                await supabase.from('sake_entries').delete().eq('id', detail.id)
                await fetchEntries(); close()
              }}>{t('delete')}</button>
            </div>
          </div>
        </div>
      )}

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

      {/* Form sheet */}
      {sheet === 'form' && (
        <div style={s.formBackdrop} onClick={close}>
          <div style={s.formSheet} onClick={e => e.stopPropagation()}>
            <div style={s.handle} />
            <div style={s.formHead}>
              <span style={s.formTitle}>{editId ? t('form.editEntry') : t('form.newEntry')}</span>
              <button style={s.closeBtn} onClick={close}>✕</button>
            </div>
            <div style={s.formInner}>

              {/* Photos */}
              <div style={s.sec}>
                <div style={s.secLabel}>{t('form.photos')}</div>
                <button type="button" onClick={() => fileRefMulti.current.click()}
                  style={{ width: '100%', marginBottom: 10, padding: '8px 0', borderRadius: 8, border: '1px dashed var(--accent)', background: 'transparent', color: 'var(--accent)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                  {t('form.selectBoth')}
                </button>
                <input ref={fileRefMulti} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={onPhotoMulti} />
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
                    {(photoFile || photoPreview) && (
                      <button type="button" disabled={ocrLoading} onClick={() => runOcr()}
                        style={{ width: '100%', marginTop: 6, padding: '7px 0', borderRadius: 8, border: '1px solid var(--accent)', background: ocrLoading ? 'var(--accent-bg)' : 'transparent', color: 'var(--accent)', fontSize: 12, cursor: ocrLoading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                        {ocrLoading ? <><SpinIcon />{t('ocr.scanning')}</> : <><ScanIcon />{t('ocr.scan')}</>}
                      </button>
                    )}
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

              {/* Basic */}
              <div style={s.sec}>
                <div style={s.secLabel}>{t('form.basic')}</div>
                <div style={s.field}>
                  <label style={s.label}>{t('form.name')}</label>
                  <BrandInput style={s.input} value={form.name} onChange={v => f('name', v)}
                    onBreweryFill={v => f('brewery', v)} onRegionFill={v => f('region', v)}
                    onBlur={inferBreweryFromName}
                    placeholder={t('form.namePH')} />
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
                  <div style={s.field}>
                    <label style={s.label}>{t('form.date')}</label>
                    <input style={s.input} type="date" value={form.tasted_at} onChange={e => f('tasted_at', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Specs */}
              <div style={s.sec}>
                <div style={s.secLabel}>{t('form.specs')}</div>
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
                <div style={s.row2}>
                  <div style={s.field}><label style={s.label}>{t('form.bottling')}</label><input style={{ ...s.input, colorScheme: 'light' }} type="month" value={form.bottling_date} onChange={e => f('bottling_date', e.target.value)} /></div>
                </div>
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
                <TagInput tags={formTags} onChange={setFormTags} t={t} />
              </div>

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
