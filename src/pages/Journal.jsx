import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { uploadPhoto } from '../lib/upload'
import Nav from '../components/Nav'
import Stars, { StarsLight } from '../components/Stars'
import { BrandMarkFull } from '../components/BrandMark'

const TYPES = ['純米', '純米吟醸', '純米大吟醸', '吟醸', '大吟醸', '特別純米', '本醸造', '普通酒', 'その他']
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
  rating: 0,
  aroma: '', taste: '', notes: '',
  tasted_at: new Date().toISOString().slice(0, 10),
  bottling_date: '', drinking_date: '',
  is_public: true,
}

function TagInput({ tags, onChange }) {
  const [input, setInput] = useState('')
  const add = () => {
    const t = input.trim()
    if (t && !tags.includes(t)) onChange([...tags, t])
    setInput('')
  }
  const remove = t => onChange(tags.filter(x => x !== t))
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {tags.map(t => (
          <span key={t} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, background: 'var(--accent-bg)', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 5 }}>
            {t}
            <span onClick={() => remove(t)} style={{ cursor: 'pointer', fontWeight: 700, fontSize: 11, opacity: .6 }}>×</span>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          style={{ flex: 1, padding: '9px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, outline: 'none' }}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() } }}
          placeholder="タグを入力 → Enter"
        />
        <button type="button" onClick={add}
          style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--accent)', fontSize: 13, cursor: 'pointer' }}>
          追加
        </button>
      </div>
    </div>
  )
}

const s = {
  page: { minHeight: '100svh', background: 'var(--bg)' },
  main: { maxWidth: 1100, margin: '0 auto', padding: '20px 16px 80px' },
  chips: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 },
  chip: (active) => ({
    padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13,
    background: active ? 'var(--accent)' : 'var(--surface)',
    color: active ? '#fff' : 'var(--text)',
    fontFamily: 'var(--font-sans)',
    boxShadow: active ? 'none' : '0 1px 4px rgba(26,22,20,.06)',
  }),
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12 },
  addCard: {
    borderRadius: 14, border: '2px dashed var(--border)', aspectRatio: '3/4',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', background: 'var(--surface)', color: 'var(--sub)', gap: 8,
  },
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
  // Detail overlay (full page)
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(26,22,20,.55)', zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  detModal: { background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '90svh', overflow: 'hidden auto', position: 'relative', padding: '32px 32px 28px' },
  detClose: { position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--sub)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  detTypeTags: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 },
  detTypeTag: { fontSize: 10, color: 'var(--accent)', letterSpacing: '.06em' },
  detName: { fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, marginBottom: 10, lineHeight: 1.3 },
  detTable: { width: '100%', borderCollapse: 'collapse', marginTop: 16, marginBottom: 20 },
  detTr: { borderBottom: '1px solid var(--border)' },
  detTh: { padding: '10px 0', fontSize: 12, color: 'var(--sub)', fontWeight: 400, textAlign: 'left', width: 90, verticalAlign: 'top' },
  detTd: { padding: '10px 0', fontSize: 14, color: 'var(--text)' },
  detTagsRow: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 },
  detTag: { fontSize: 12, padding: '4px 12px', borderRadius: 20, background: 'var(--accent-bg)', color: 'var(--accent)' },
  detActions: { display: 'flex', gap: 10 },
  editBtn: { flex: 1, padding: 12, borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: 14, cursor: 'pointer' },
  delBtn: { flex: 1, padding: 12, borderRadius: 12, border: '1px solid #e88', background: 'transparent', color: '#c0392b', fontSize: 14, cursor: 'pointer' },
  // Form sheet (bottom)
  formBackdrop: { position: 'fixed', inset: 0, background: 'rgba(26,22,20,.5)', zIndex: 30, display: 'flex', alignItems: 'flex-end' },
  formSheet: { background: 'var(--surface)', borderRadius: '22px 22px 0 0', width: '100%', maxWidth: 640, margin: '0 auto', maxHeight: '94svh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' },
  formInner: { overflow: 'hidden auto', flex: 1, padding: '0 24px 40px' },
  handle: { width: 38, height: 4, borderRadius: 2, background: 'var(--border)', margin: '12px auto 0', flexShrink: 0 },
  formHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 },
  formTitle: { fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 600 },
  closeBtn: { width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'var(--bg)', color: 'var(--sub)', fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  sec: { marginTop: 22 },
  secLabel: { fontSize: 11, color: 'var(--sub)', letterSpacing: '.08em', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid var(--border)' },
  field: { marginBottom: 14 },
  label: { display: 'block', fontSize: 12, color: 'var(--sub)', marginBottom: 5 },
  input: { width: '100%', padding: '10px 13px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, outline: 'none' },
  textarea: { width: '100%', padding: '10px 13px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, outline: 'none', resize: 'vertical', minHeight: 72 },
  select: { width: '100%', padding: '10px 13px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, outline: 'none', appearance: 'none' },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  row4: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 },
  photoBox: { border: '2px dashed var(--border)', borderRadius: 12, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', position: 'relative', marginBottom: 8 },
  photoImg: { width: '100%', height: '100%', objectFit: 'cover' },
  photoLbl: { color: 'var(--sub)', fontSize: 13, textAlign: 'center' },
  ratingRow: { display: 'flex', gap: 8, marginTop: 4 },
  ratingDot: (active) => ({
    width: 38, height: 38, borderRadius: '50%', border: '2px solid var(--border)', background: active ? 'var(--accent)' : 'transparent',
    borderColor: active ? 'var(--accent)' : 'var(--border)', color: active ? '#fff' : 'var(--sub)', fontSize: 13, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }),
  saveBtn: { width: '100%', padding: 13, borderRadius: 12, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 15, fontWeight: 500, marginTop: 16, cursor: 'pointer' },
}

export default function Journal({ session }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTag, setActiveTag] = useState('')
  const [tagsExp, setTagsExp] = useState(false)
  const [sheet, setSheet] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formTags, setFormTags] = useState([])
  const [editId, setEditId] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoFile2, setPhotoFile2] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoPreview2, setPhotoPreview2] = useState(null)
  const [saving, setSaving] = useState(false)
  const [detail, setDetail] = useState(null)
  const fileRef = useRef()
  const fileRef2 = useRef()

  useEffect(() => { fetchEntries() }, [])

  const fetchEntries = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('sake_entries').select('*')
      .eq('user_id', session.user.id)
      .order('tasted_at', { ascending: false })
    setEntries(data || [])
    setLoading(false)
  }

  const allTags = [...new Set(entries.flatMap(e => e.tags || []))]
  const topTags = allTags.slice(0, 8)
  const visibleTags = tagsExp ? allTags : topTags
  const filtered = activeTag ? entries.filter(e => e.tags?.includes(activeTag)) : entries

  const openAdd = () => {
    setForm(EMPTY_FORM); setFormTags([]); setEditId(null)
    setPhotoFile(null); setPhotoFile2(null); setPhotoPreview(null); setPhotoPreview2(null)
    setSheet('form')
  }
  const openEdit = e => {
    setForm({
      name: e.name || '', brewery: e.brewery || '', region: e.region || '', type: e.type || '',
      alcohol: e.alcohol || '', rice: e.rice || '', polishing: e.polishing || '',
      smv: e.smv || '', acidity: e.acidity || '', yeast: e.yeast || '',
      rating: e.rating || 0, aroma: e.aroma || '', taste: e.taste || '', notes: e.notes || '',
      tasted_at: e.tasted_at || new Date().toISOString().slice(0, 10),
      bottling_date: e.bottling_date || '', drinking_date: e.drinking_date || '',
      is_public: e.is_public ?? true,
    })
    setFormTags(e.tags || [])
    setEditId(e.id)
    setPhotoFile(null); setPhotoFile2(null)
    setPhotoPreview(e.photo_url || null); setPhotoPreview2(e.photo_url2 || null)
    setSheet('form')
  }
  const close = () => { setSheet(null); setDetail(null) }

  const onPhoto = e => { const f = e.target.files[0]; if (!f) return; setPhotoFile(f); setPhotoPreview(URL.createObjectURL(f)) }
  const onPhoto2 = e => { const f = e.target.files[0]; if (!f) return; setPhotoFile2(f); setPhotoPreview2(URL.createObjectURL(f)) }

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const prevEntry = editId ? entries.find(e => e.id === editId) : null
      let photo_url = prevEntry?.photo_url || null
      let photo_url2 = prevEntry?.photo_url2 || null
      if (photoFile) photo_url = await uploadPhoto(photoFile, session.user.id)
      if (photoFile2) photo_url2 = await uploadPhoto(photoFile2, session.user.id)
      const payload = {
        ...form,
        rating: form.rating || null,
        tags: formTags.length ? formTags : null,
        photo_url, photo_url2,
        user_id: session.user.id,
      }
      if (editId) {
        await supabase.from('sake_entries').update(payload).eq('id', editId)
      } else {
        await supabase.from('sake_entries').insert(payload)
      }
      await fetchEntries()
      close()
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  const deleteEntry = async () => {
    if (!editId || !confirm('この記録を削除しますか？')) return
    await supabase.from('sake_entries').delete().eq('id', editId)
    await fetchEntries(); close()
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const TableRow = ({ label, value }) => value ? (
    <tr style={s.detTr}>
      <th style={s.detTh}>{label}</th>
      <td style={s.detTd}>{value}</td>
    </tr>
  ) : null

  return (
    <div style={s.page}>
      <Nav session={session} />
      <BrandMarkFull />
      <div style={s.main}>
        {/* Tag filter chips */}
        {allTags.length > 0 && (
          <div style={s.chips}>
            <button style={s.chip(!activeTag)} onClick={() => setActiveTag('')}>すべて</button>
            {visibleTags.map(t => (
              <button key={t} style={s.chip(activeTag === t)} onClick={() => setActiveTag(activeTag === t ? '' : t)}>{t}</button>
            ))}
            {allTags.length > 8 && (
              <button style={s.chip(false)} onClick={() => setTagsExp(x => !x)}>
                {tagsExp ? '▲ 閉じる' : `▼ もっと見る`}
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        <div style={s.grid}>
          {/* Add card */}
          <div style={s.addCard} onClick={openAdd}>
            <span style={{ fontSize: 28, color: 'var(--border)' }}>+</span>
            <span style={{ fontSize: 13 }}>新しい記録</span>
          </div>

          {loading && null}
          {filtered.map(e => (
            <div key={e.id} style={s.card} onClick={() => setDetail(e)}>
              {e.photo_url ? <img style={s.cardImg} src={e.photo_url} alt={e.name} /> : <div style={s.cardNo}>🍶</div>}
              <div style={s.cardOverlay} />
              <div style={s.cardBody}>
                {e.type && <div style={s.cardType}>{e.type}</div>}
                <div style={s.cardName}>{e.name}</div>
                {e.brewery && <div style={s.cardBrewery}>{e.brewery}</div>}
                <StarsLight rating={e.rating} />
                <div style={s.cardMeta}>{[e.region, e.tasted_at].filter(Boolean).join(' · ')}</div>
                {e.tags?.length > 0 && (
                  <div style={s.cardTags}>
                    {e.tags.slice(0, 4).map(t => <span key={t} style={s.cardTag}>{t}</span>)}
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

            {detail.type && (
              <div style={s.detTypeTags}>
                {detail.type.split(/\s+/).map(t => <span key={t} style={s.detTypeTag}>{t}</span>)}
              </div>
            )}
            <div style={s.detName}>{detail.name}</div>
            <Stars rating={detail.rating} size={14} />

            <table style={s.detTable}>
              <tbody>
                <TableRow label="酒造" value={detail.brewery} />
                <TableRow label="産地" value={detail.region} />
                <TableRow label="種類" value={detail.type} />
                <TableRow label="原料米" value={detail.rice} />
                <TableRow label="精米歩合" value={detail.polishing} />
                <TableRow label="アルコール" value={detail.alcohol} />
                <TableRow label="日本酒度" value={detail.smv} />
                <TableRow label="酸度" value={detail.acidity} />
                <TableRow label="酵母" value={detail.yeast} />
                <TableRow label="装瓶日" value={detail.bottling_date} />
                <TableRow label="飲用日" value={detail.drinking_date || detail.tasted_at} />
                {detail.aroma && <TableRow label="香り" value={detail.aroma} />}
                {detail.taste && <TableRow label="味わい" value={detail.taste} />}
                {detail.notes && <TableRow label="メモ" value={detail.notes} />}
              </tbody>
            </table>

            {detail.tags?.length > 0 && (
              <div style={s.detTagsRow}>
                {detail.tags.map(t => <span key={t} style={s.detTag}>{t}</span>)}
              </div>
            )}

            <div style={s.detActions}>
              <button style={s.editBtn} onClick={() => { setDetail(null); openEdit(detail) }}>編集</button>
              <button style={s.delBtn} onClick={async () => {
                if (!confirm('削除しますか？')) return
                await supabase.from('sake_entries').delete().eq('id', detail.id)
                await fetchEntries(); close()
              }}>削除</button>
            </div>
          </div>
        </div>
      )}

      {/* Form sheet */}
      {sheet === 'form' && (
        <div style={s.formBackdrop} onClick={close}>
          <div style={s.formSheet} onClick={e => e.stopPropagation()}>
            <div style={s.handle} />
            <div style={s.formHead}>
              <span style={s.formTitle}>{editId ? '記録を編集' : '新しい記録'}</span>
              <button style={s.closeBtn} onClick={close}>✕</button>
            </div>
            <div style={s.formInner}>

              {/* Photos */}
              <div style={s.sec}>
                <div style={s.secLabel}>写真</div>
                <div style={s.row2}>
                  <div>
                    <div style={s.label}>メイン写真</div>
                    <div style={s.photoBox} onClick={() => fileRef.current.click()}>
                      {photoPreview ? <img style={s.photoImg} src={photoPreview} alt="" /> : <div style={s.photoLbl}>タップして追加</div>}
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={onPhoto} />
                  </div>
                  <div>
                    <div style={s.label}>サブ写真</div>
                    <div style={s.photoBox} onClick={() => fileRef2.current.click()}>
                      {photoPreview2 ? <img style={s.photoImg} src={photoPreview2} alt="" /> : <div style={s.photoLbl}>タップして追加</div>}
                    </div>
                    <input ref={fileRef2} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={onPhoto2} />
                  </div>
                </div>
              </div>

              {/* Basic */}
              <div style={s.sec}>
                <div style={s.secLabel}>基本情報</div>
                <div style={s.field}>
                  <label style={s.label}>酒名 *</label>
                  <input style={s.input} value={form.name} onChange={e => f('name', e.target.value)} placeholder="例：獺祭 純米大吟醸" />
                </div>
                <div style={s.row2}>
                  <div style={s.field}>
                    <label style={s.label}>蔵元</label>
                    <input style={s.input} value={form.brewery} onChange={e => f('brewery', e.target.value)} />
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>産地</label>
                    <input style={s.input} value={form.region} onChange={e => f('region', e.target.value)} />
                  </div>
                </div>
                <div style={s.row2}>
                  <div style={s.field}>
                    <label style={s.label}>種類</label>
                    <select style={s.select} value={form.type} onChange={e => f('type', e.target.value)}>
                      <option value="">選択</option>
                      {TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>飲用日</label>
                    <input style={s.input} type="date" value={form.tasted_at} onChange={e => f('tasted_at', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Specs */}
              <div style={s.sec}>
                <div style={s.secLabel}>スペック</div>
                <div style={s.row2}>
                  <div style={s.field}><label style={s.label}>原料米</label><input style={s.input} value={form.rice} onChange={e => f('rice', e.target.value)} /></div>
                  <div style={s.field}><label style={s.label}>酵母</label><input style={s.input} value={form.yeast} onChange={e => f('yeast', e.target.value)} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
                  <div style={s.field}><label style={s.label}>精米歩合</label><input style={s.input} value={form.polishing} onChange={e => f('polishing', e.target.value)} placeholder="60%" /></div>
                  <div style={s.field}><label style={s.label}>アルコール</label><input style={s.input} value={form.alcohol} onChange={e => f('alcohol', e.target.value)} placeholder="15%" /></div>
                  <div style={s.field}><label style={s.label}>日本酒度</label><input style={s.input} value={form.smv} onChange={e => f('smv', e.target.value)} placeholder="+1" /></div>
                  <div style={s.field}><label style={s.label}>酸度</label><input style={s.input} value={form.acidity} onChange={e => f('acidity', e.target.value)} placeholder="1.5" /></div>
                </div>
                <div style={s.row2}>
                  <div style={s.field}><label style={s.label}>装瓶日</label><input style={s.input} value={form.bottling_date} onChange={e => f('bottling_date', e.target.value)} placeholder="2026-03" /></div>
                  <div style={s.field}><label style={s.label}>飲用日</label><input style={s.input} value={form.drinking_date} onChange={e => f('drinking_date', e.target.value)} placeholder="2026-06-01" /></div>
                </div>
              </div>

              {/* Rating */}
              <div style={s.sec}>
                <div style={s.secLabel}>評価</div>
                <div style={s.ratingRow}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} type="button" style={s.ratingDot(form.rating >= n)}
                      onClick={() => f('rating', form.rating === n ? 0 : n)}>{n}</button>
                  ))}
                </div>
              </div>

              {/* Tasting notes */}
              <div style={s.sec}>
                <div style={s.secLabel}>テイスティングノート</div>
                <div style={s.field}><label style={s.label}>香り</label><textarea style={s.textarea} value={form.aroma} onChange={e => f('aroma', e.target.value)} placeholder="フルーティー、華やか…" /></div>
                <div style={s.field}><label style={s.label}>味わい</label><textarea style={s.textarea} value={form.taste} onChange={e => f('taste', e.target.value)} placeholder="甘み、旨味、余韻…" /></div>
                <div style={s.field}><label style={s.label}>メモ</label><textarea style={s.textarea} value={form.notes} onChange={e => f('notes', e.target.value)} placeholder="シーン、ペアリング…" /></div>
              </div>

              {/* Tags */}
              <div style={s.sec}>
                <div style={s.secLabel}>フレーバータグ</div>
                <TagInput tags={formTags} onChange={setFormTags} />
              </div>

              {/* Public */}
              <div style={{ ...s.sec, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 0 }}>
                <input type="checkbox" id="pub" checked={form.is_public} onChange={e => f('is_public', e.target.checked)} />
                <label htmlFor="pub" style={{ fontSize: 14, color: 'var(--sub)', cursor: 'pointer' }}>みんなの記録に公開する</label>
              </div>

              <button style={s.saveBtn} onClick={save} disabled={saving}>{saving ? '保存中…' : '保存する'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
