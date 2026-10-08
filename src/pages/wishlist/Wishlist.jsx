import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Nav from '../../components/Nav'
import Sheet from '../../components/ui/Sheet'
import SakeBottleCrop from '../../components/bottle/SakeBottleCrop'
import { useLang } from '../../contexts/LangContext'
import { useTagResolver } from '../../contexts/TagsContext'
import { cleanLabel } from '../../lib/labels'
import { formatRating } from '../../lib/rating'
import { pressable } from '../../lib/a11y'
import { normalizeType } from '../../lib/sakeType'
import { forwardFrom } from '../../lib/plaza'
import { coverFor, loadPublicEntries } from '../../lib/sakeMatch'
import { PREFECTURES, normalizeRegion, shortPref } from '../../lib/region'
import '../journal/ledger.css'
import '../plaza/plaza.css'
import './wishlist.css'

const FORWARD_SKIP_KEY = 'kikiroku_forward_confirm_skip'
const NOTE_MAX = 60
const ENTRY_COLS = 'id,user_id,product_id,brand,name,brewery,region,type,rating,photo_url,thumb_url,photo_crop,contributor_name,is_public,status'

/**
 * 飲みたい — not a bookmark folder but the queue of what to record next.
 * Each wish is a 事典 product; the 酒札 it came from (if any) is only its source and its bottle photo.
 * ★優先 floats to the top, a one-line メモ says where or when, 記録する starts a record and takes it off.
 */
export default function Wishlist({ session }) {
  const navigate = useNavigate()
  const { lang } = useLang()
  const L = (ja, zh, en) => (lang === 'ja' ? ja : lang === 'zh' ? zh : en)
  const rawTag = useTagResolver()
  const typeLabel = raw => { const id = normalizeType(raw); return id ? cleanLabel(rawTag(id, 'type')) : null }
  const uid = session.user.id

  const [rows, setRows] = useState(null)
  const [error, setError] = useState(null)
  const [publicEntries, setPublicEntries] = useState([])
  const [view, setView] = useState('all') // all | priority | region
  const [noteFor, setNoteFor] = useState(null) // { wish, text }
  const [removeFor, setRemoveFor] = useState(null)
  const [forwardFor, setForwardFor] = useState(null)
  const [skipNext, setSkipNext] = useState(false)

  useEffect(() => {
    supabase.from('sake_wishes')
      .select(`id,entry_id,product_id,priority,note,created_at,product:sake_products(*),entry:sake_entries(${ENTRY_COLS})`)
      .eq('user_id', uid).order('created_at', { ascending: false })
      .then(({ data, error: err }) => { if (err) setError(err.message); setRows(data || []) })
    loadPublicEntries().then(setPublicEntries)
  }, [uid])

  // One shape for the list: 事典 facts first, the source 酒札 as fallback.
  const items = useMemo(() => (rows || []).map(w => {
    const p = w.product, e = w.entry
    const mineEntry = e && e.user_id === uid
    const photoFrom = (e && (e.thumb_url || e.photo_url)) ? e : (p ? coverFor(p, publicEntries) : null)
    let source
    if (mineEntry) source = { kind: 'mine', label: L('自分の酒札から', '來自自己的酒札', 'From your record'), detail: Number(e.rating) > 0 ? formatRating(e.rating) : '' }
    else if (e) source = { kind: 'plaza', label: L('廣場から', '來自廣場', 'From Discover'), detail: [e.contributor_name, Number(e.rating) > 0 && formatRating(e.rating)].filter(Boolean).join(' ') }
    else if (w.entry_id || (!w.product_id)) source = { kind: 'plaza', label: L('廣場から', '來自廣場', 'From Discover'), detail: '' }
    else source = { kind: 'wiki', label: L('事典から', '來自事典', 'From the library'), detail: '' }
    return {
      w, source,
      title: p?.name || [e?.brand, e?.name].filter(Boolean).join(' ') || L('（名前なし）', '（無名稱）', '(no name)'),
      brewery: p?.brewery_name || e?.brewery || '',
      region: normalizeRegion(p?.region || e?.region || ''),
      type: p?.type || e?.type || null,
      photo: photoFrom ? { url: photoFrom.thumb_url || photoFrom.photo_url, crop: photoFrom.photo_crop } : null,
    }
  }), [rows, publicEntries, uid, lang]) // eslint-disable-line react-hooks/exhaustive-deps

  const priorityCount = items.filter(i => i.w.priority).length
  const sections = useMemo(() => {
    if (view === 'priority') return [{ key: 'p', items: items.filter(i => i.w.priority) }]
    if (view === 'region') {
      const order = r => { const i = PREFECTURES.indexOf(r); return i < 0 ? 999 : i }
      const groups = new Map()
      ;[...items].sort((a, b) => order(a.region) - order(b.region)).forEach(i => {
        const k = i.region || ''
        if (!groups.has(k)) groups.set(k, [])
        groups.get(k).push(i)
      })
      return [...groups].map(([k, list]) => ({ key: k || '-', title: k ? shortPref(k) : L('産地不明', '產地不明', 'Unknown region'), items: list }))
    }
    const top = items.filter(i => i.w.priority), rest = items.filter(i => !i.w.priority)
    if (!top.length) return [{ key: 'all', items: rest }]
    return [{ key: 'p', title: L('優先', '優先', 'Priority'), items: top }, ...(rest.length ? [{ key: 'r', title: L('そのほか', '其他', 'Everything else'), items: rest }] : [])]
  }, [items, view, lang]) // eslint-disable-line react-hooks/exhaustive-deps

  const patch = async (wish, fields) => {
    setRows(prev => prev.map(r => (r.id === wish.id ? { ...r, ...fields } : r)))
    const { error: err } = await supabase.from('sake_wishes').update(fields).eq('id', wish.id)
    if (err) { setError(err.message); setRows(prev => prev.map(r => (r.id === wish.id ? wish : r))) }
  }
  const remove = async wish => {
    setRows(prev => prev.filter(r => r.id !== wish.id))
    const { error: err } = await supabase.from('sake_wishes').delete().eq('id', wish.id)
    if (err) { setError(err.message); setRows(prev => [wish, ...prev]) }
  }
  // 記録する: start a record with this sake's facts; it leaves the list (unchanged behaviour).
  const forward = item => {
    const { w } = item, p = w.product, e = w.entry
    const sake = e
      ? forwardFrom({ ...e, product_id: w.product_id || e.product_id })
      : forwardFrom({ product_id: p?.id, brand: '', name: p?.name, brewery: p?.brewery_name, region: p?.region, type: p?.type, alcohol: p?.alcohol, rice: p?.rice, polishing: p?.polishing, smv: p?.smv, acidity: p?.acidity, yeast: p?.yeast })
    remove(w)
    navigate('/journal', { state: { forward: sake } })
  }
  const askForward = item => {
    let skip = false
    try { skip = localStorage.getItem(FORWARD_SKIP_KEY) === '1' } catch { /* storage blocked */ }
    if (skip) forward(item)
    else { setSkipNext(false); setForwardFor(item) }
  }
  const openItem = ({ w }) => {
    if (w.product_id) navigate(`/wiki/sake/${w.product_id}`)
    else if (w.entry) navigate(`/journal/${w.entry.id}`)
  }

  const Star = ({ on }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3.5 2.6 5.3 5.9.9-4.25 4.1 1 5.8L12 16.9l-5.25 2.7 1-5.8L3.5 9.7l5.9-.9z" />
    </svg>
  )

  return (
    <div className="kk-wish-page">
      <Nav session={session} topbar={false} />
      <div className="kk-ledger">
        <div className="kk-ledger__head">
          <button type="button" className="kk-icon-btn" onClick={() => navigate('/journal')} aria-label={L('マイ帳に戻る', '回到酒帳', 'Back to ledger')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <h1 className="kk-ledger__title kk-wish__title">
            {L('飲みたい', '想喝', 'Want to try')}
            {rows && rows.length > 0 && <small>{rows.length}{L('件', ' 筆', '')}</small>}
          </h1>
        </div>

        {error && <p className="kk-banner kk-banner--error" role="alert">{error}</p>}

        {rows && rows.length > 0 && (
          <div className="kk-tabs" role="tablist" aria-label={L('並べ方', '排列方式', 'View')}>
            {[['all', L('すべて', '全部', 'All')], ['priority', `${L('優先', '優先', 'Priority')} ${priorityCount}`], ['region', L('産地順', '依產地', 'By region')]].map(([k, label]) => (
              <button key={k} type="button" role="tab" aria-selected={view === k} className={`kk-chip${view === k ? ' is-active' : ''}`} onClick={() => setView(k)}>{label}</button>
            ))}
          </div>
        )}

        {rows === null && <div className="kk-skeleton" aria-hidden="true"><div className="kk-skeleton__row"><span /><span /><span /></div></div>}

        {rows && rows.length === 0 && (
          <div className="kk-empty">
            <img src="/plaza/tanuki-plain.webp" alt="" width="96" height="96" />
            <strong>{L('飲みたいお酒はまだありません', '還沒有想喝的酒', 'Nothing on your list yet')}</strong>
            <span>{L('廣場や事典で気になるお酒に「飲みたい」を付けよう', '在廣場或事典看到感興趣的酒，按下「想喝」', 'Tap “Want to try” on a sake in Discover or the library')}</span>
            <button type="button" className="kk-btn" onClick={() => navigate('/')}>{L('廣場を見る', '去逛廣場', 'Go to Discover')}</button>
          </div>
        )}

        {rows && rows.length > 0 && view === 'priority' && priorityCount === 0 && (
          <div className="kk-empty kk-empty--quiet"><span>{L('☆ を押すと優先に入ります', '按下 ☆ 就會加入優先', 'Tap ☆ to mark a priority')}</span></div>
        )}

        {sections.map(sec => sec.items.length > 0 && (
          <section key={sec.key} className="kk-wish__section" aria-label={sec.title}>
            {sec.title && <h2 className="kk-wish__sec">{sec.title}<span>{sec.items.length}</span></h2>}
            <ul className="kk-wish__list">
              {sec.items.map(item => {
                const { w } = item
                return (
                  <li key={w.id}>
                    <article className="kk-wcard">
                      <div className="kk-wcard__bottle" aria-hidden="true" onClick={() => openItem(item)}>
                        <SakeBottleCrop imageUrl={item.photo?.url} crop={item.photo?.crop} height="84px" />
                      </div>
                      <div className="kk-wcard__body">
                        <div className="kk-wcard__main" {...pressable(() => openItem(item), item.title)}>
                          <p className={`kk-reason kk-reason--${item.source.kind}`}>
                            <span className="kk-reason__label">{item.source.label}</span>
                            {item.source.detail && <span className="kk-reason__detail">{item.source.detail}</span>}
                          </p>
                          <h3 className="kk-wcard__title">{item.title}</h3>
                          <p className="kk-wcard__meta">{[item.brewery, item.region && shortPref(item.region), typeLabel(item.type)].filter(Boolean).join(' · ')}</p>
                        </div>
                        {w.note && <p className="kk-wcard__note">{w.note}</p>}
                        <div className="kk-wcard__actions">
                          <button type="button" className="kk-act kk-act--go" onClick={() => askForward(item)}>{L('記録する', '記錄', 'Record')}</button>
                          <button type="button" className="kk-act" onClick={() => setNoteFor({ wish: w, text: w.note || '' })}>{L('メモ', '備註', 'Note')}</button>
                          <button type="button" className="kk-act" onClick={() => setRemoveFor(item)}>{L('外す', '移除', 'Remove')}</button>
                        </div>
                      </div>
                      <button type="button" className={`kk-wcard__star${w.priority ? ' is-on' : ''}`} aria-pressed={!!w.priority}
                        aria-label={L(`${item.title}を優先にする`, `把「${item.title}」設為優先`, `Mark ${item.title} as a priority`)}
                        onClick={() => patch(w, { priority: !w.priority })}>
                        <Star on={!!w.priority} />
                      </button>
                    </article>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>

      <Sheet open={!!noteFor} onClose={() => setNoteFor(null)} variant="dialog" label={L('メモ', '備註', 'Note')}>
        {noteFor && (<>
          <h2 className="kk-confirm__title">{L('ひとことメモ', '一句備註', 'A short note')}</h2>
          <p className="kk-confirm__note">{L('いつ・どこで飲みたいか、など', '想在什麼時候、哪裡喝之類', 'When or where you want to try it')}</p>
          <input className="kk-input kk-wish__note-input" data-autofocus value={noteFor.text} maxLength={NOTE_MAX}
            placeholder={L('例：夏のうちに。酒屋で探す', '例：趁夏天。去酒舖找', 'e.g. Before summer ends; ask the shop')}
            onChange={e => setNoteFor(n => ({ ...n, text: e.target.value }))}
            onKeyDown={e => { if (e.key === 'Enter') { patch(noteFor.wish, { note: noteFor.text.trim() || null }); setNoteFor(null) } }} />
          <p className="kk-wish__count">{noteFor.text.length}/{NOTE_MAX}</p>
          <div className="kk-confirm__actions">
            <button type="button" className="kk-btn" onClick={() => setNoteFor(null)}>{L('キャンセル', '取消', 'Cancel')}</button>
            <button type="button" className="kk-btn kk-btn--primary" onClick={() => { patch(noteFor.wish, { note: noteFor.text.trim() || null }); setNoteFor(null) }}>{L('保存', '儲存', 'Save')}</button>
          </div>
        </>)}
      </Sheet>

      <Sheet open={!!removeFor} onClose={() => setRemoveFor(null)} variant="dialog" label={L('外す', '移除', 'Remove')}>
        {removeFor && (<>
          <h2 className="kk-confirm__title">{L('飲みたいから外しますか？', '要從想喝清單移除嗎？', 'Remove from your list?')}</h2>
          <p className="kk-confirm__note">{L(`「${removeFor.title}」`, `「${removeFor.title}」`, `“${removeFor.title}”`)}{removeFor.w.note ? L('とメモ', '和備註', ' and its note') : ''}{L('を外します。', '將被移除。', ' will be removed.')}</p>
          <div className="kk-confirm__actions">
            <button type="button" className="kk-btn" data-autofocus onClick={() => setRemoveFor(null)}>{L('キャンセル', '取消', 'Cancel')}</button>
            <button type="button" className="kk-btn kk-btn--danger" onClick={() => { remove(removeFor.w); setRemoveFor(null) }}>{L('外す', '移除', 'Remove')}</button>
          </div>
        </>)}
      </Sheet>

      <Sheet open={!!forwardFor} onClose={() => setForwardFor(null)} variant="dialog" label={L('記録しますか？', '確認記錄？', 'Record this sake?')}>
        {forwardFor && (<>
          <h2 className="kk-confirm__title">{L('記録しますか？', '確認記錄？', 'Record this sake?')}</h2>
          <p className="kk-confirm__note">{L(`「${forwardFor.title}」を記録すると、飲みたいから外れます。`, `記錄「${forwardFor.title}」後，將從想喝清單中移除。`, `“${forwardFor.title}” will leave your list once you record it.`)}</p>
          <label className="kk-wish__skip">
            <input type="checkbox" checked={skipNext} onChange={e => setSkipNext(e.target.checked)} />
            {L('次から表示しない', '下次不再提示', "Don't ask again")}
          </label>
          <div className="kk-confirm__actions">
            <button type="button" className="kk-btn" onClick={() => setForwardFor(null)}>{L('キャンセル', '取消', 'Cancel')}</button>
            <button type="button" className="kk-btn kk-btn--primary" data-autofocus onClick={() => {
              if (skipNext) { try { localStorage.setItem(FORWARD_SKIP_KEY, '1') } catch { /* storage blocked */ } }
              const item = forwardFor; setForwardFor(null); forward(item)
            }}>{L('記録する', '記錄', 'Record')}</button>
          </div>
        </>)}
      </Sheet>
    </div>
  )
}
