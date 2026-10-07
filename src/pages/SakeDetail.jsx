import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Nav from '../components/Nav'
import Sheet, { CloseIcon } from '../components/ui/Sheet'
import Toast from '../components/ui/Toast'
import Stars from '../components/Stars'
import SakeBottleCrop from '../components/bottle/SakeBottleCrop'
import BottleCropEditor from '../components/bottle/BottleCropEditor'
import { WikiText } from '../components/WikiTooltip'
import { useLang } from '../contexts/LangContext'
import { useTagResolver } from '../contexts/TagsContext'
import { formatRating } from '../lib/rating'
import { normalizeType } from '../lib/sakeType'
import { cleanLabel } from '../lib/labels'
import './sakeDetail.css'

const dot = d => (d || '').replaceAll('-', '.')

/**
 * 酒詳情 — one 酒札 as a page (/journal/:id).
 * Top: the bottle by default, with a 瓶身 / 原図 switch (original photo = the memory of the moment).
 * Owner actions live in the … menu; 編集 is also a visible primary button, 削除 is never.
 */
export default function SakeDetail({ session }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { lang, t } = useLang()
  const L = (ja, zh, en) => (lang === 'ja' ? ja : lang === 'zh' ? zh : en)
  const rawTag = useTagResolver()
  const tagLabel = (tid, cat) => cleanLabel(rawTag(tid, cat))

  const [entry, setEntry] = useState(null)
  const [state, setState] = useState('loading') // loading | ready | missing
  const [view, setView] = useState('bottle')    // bottle | photo | back
  const [reading, setReading] = useState(null)
  const [others, setOthers] = useState([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [confirmPublic, setConfirmPublic] = useState(false)
  const [busy, setBusy] = useState(false)
  const [lightbox, setLightbox] = useState(null)
  const [adjusting, setAdjusting] = useState(false)
  const [toast, setToast] = useState(null)
  const menuBtnRef = useRef(null)

  const isOwner = !!(session && entry && entry.user_id === session.user.id)

  // A new record always starts at the top (the ledger may have been scrolled).
  useEffect(() => { window.scrollTo(0, 0); setView('bottle') }, [id]) // eslint-disable-line react-hooks/set-state-in-effect

  useEffect(() => {
    let alive = true
    supabase.from('sake_entries').select('*').eq('id', id).maybeSingle().then(({ data }) => {
      if (!alive) return
      if (!data) { setState('missing'); return }
      setEntry({ ...data, type: normalizeType(data.type) || null })
      setState('ready')
    })
    return () => { alive = false }
  }, [id])

  // Reading of the brand (furigana in ja, romaji otherwise — never pinyin).
  useEffect(() => {
    if (!entry?.brand) return
    supabase.from('sake_brands').select('furigana,romaji').eq('name', entry.brand).limit(1)
      .then(({ data }) => setReading(data?.[0] || null))
  }, [entry?.brand])

  // みんなの瓶身: other public records of the same sake.
  useEffect(() => {
    if (!entry || !(entry.brand || entry.name)) return
    let q = supabase.from('sake_entries').select('id,brand,name,rating,photo_url,thumb_url,photo_crop,contributor_name,tasted_at')
      .eq('is_public', true).neq('id', entry.id).limit(12)
    if (entry.brand) q = q.eq('brand', entry.brand)
    if (entry.name) q = q.eq('name', entry.name)
    q.then(({ data }) => setOthers(data || []))
  }, [entry])

  const title = entry ? [entry.brand, entry.name].filter(Boolean).join(' ') : ''
  const typeName = entry?.type ? tagLabel(entry.type, 'type') : ''
  const dates = useMemo(() => (entry?.tasted_dates?.length ? [...entry.tasted_dates].sort().reverse() : entry?.tasted_at ? [entry.tasted_at] : []), [entry])
  const specs = entry ? [
    [L('精米歩合', '精米步合', 'Polishing'), entry.polishing && `${String(entry.polishing).replace(/%$/, '')}%`],
    [L('アルコール', '酒精度', 'Alcohol'), entry.alcohol && `${String(entry.alcohol).replace(/%$/, '')}%`],
    [L('日本酒度', '日本酒度', 'SMV'), entry.smv],
    [L('酸度', '酸度', 'Acidity'), entry.acidity],
    [L('原料米', '原料米', 'Rice'), entry.rice, true],
    [L('酵母', '酵母', 'Yeast'), entry.yeast, true],
    [L('装瓶日', '裝瓶日', 'Bottled'), entry.bottling_date && dot(entry.bottling_date)],
  ].filter(([, v]) => v) : []

  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate('/journal'))
  const goRegion = () => navigate('/journal', { state: { region: entry.region } })
  const goEdit = () => navigate('/journal', { state: { editEntryId: entry.id, returnTo: `/journal/${entry.id}` } })

  const patch = async fields => {
    setBusy(true)
    const { error } = await supabase.from('sake_entries').update(fields).eq('id', entry.id)
    setBusy(false)
    if (error) { setToast({ id: Date.now(), stamp: '!', message: error.message }); return false }
    setEntry(e => ({ ...e, ...fields }))
    return true
  }

  const togglePublic = async () => {
    setMenuOpen(false)
    if (!entry.is_public) { setConfirmPublic(true); return }
    if (await patch({ is_public: false })) setToast({ id: Date.now(), tone: 'draft', stamp: L('非公開', '不公開', 'Private'), message: L('非公開にしました', '已改為不公開', 'Now private') })
  }

  const share = async () => {
    setMenuOpen(false)
    try {
      const { generateShareCard, canvasToBlob } = await import('../lib/shareCard.js')
      const canvas = await generateShareCard({
        ...entry,
        aroma_tags_labels: entry.aroma_tags?.map(x => tagLabel(x, 'aroma')),
        taste_tags_labels: entry.taste_tags?.map(x => tagLabel(x, 'taste')),
        tags_labels: entry.tags?.map(x => tagLabel(x, 'flavor')),
      }, lang)
      const blob = await canvasToBlob(canvas)
      const file = new File([blob], `${entry.name || 'kikiroku'}.png`, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title })
      else { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = file.name; a.click(); URL.revokeObjectURL(url) }
    } catch (e) { if (e?.name !== 'AbortError') console.error(e) }
  }

  const remove = async () => {
    setBusy(true)
    const { error } = await supabase.from('sake_entries').delete().eq('id', entry.id)
    setBusy(false)
    if (error) { setToast({ id: Date.now(), stamp: '!', message: error.message }); return }
    navigate('/journal', { replace: true, state: { toast: 'deleted' } })
  }

  if (state !== 'ready') {
    return (
      <div className="kk-detail-page">
        <Nav session={session} topbar={false} />
        <header className="kk-detail-top">
          <button type="button" className="kk-icon-btn" onClick={goBack} aria-label={L('戻る', '返回', 'Back')}><BackIcon /></button>
          <h1 className="kk-detail-top__title">{L('記録', '記錄', 'Record')}</h1>
          <span className="kk-panel__head-spacer" />
        </header>
        {state === 'loading'
          ? <div className="kk-skeleton" style={{ padding: 16 }} aria-hidden="true"><div className="kk-skeleton__row"><span /><span /><span /></div></div>
          : <div className="kk-empty"><strong>{L('この記録は見つかりません', '找不到這筆記錄', 'Record not found')}</strong><span>{L('非公開か、削除された可能性があります。', '可能是不公開或已刪除。', 'It may be private or deleted.')}</span></div>}
      </div>
    )
  }

  const photo = view === 'back' ? entry.photo_url2 : entry.photo_url
  const tagsBlock = (label, ids, cat, outline) => ids?.length > 0 && (
    <section className="kk-detail-block">
      <h2>{label}</h2>
      <div className="kk-mini-tags">{ids.map(x => <span key={x} className={outline ? 'is-outline' : ''}>{tagLabel(x, cat)}</span>)}</div>
    </section>
  )

  return (
    <div className="kk-detail-page">
      <Nav session={session} topbar={false} />

      <header className="kk-detail-top">
        <button type="button" className="kk-icon-btn" onClick={goBack} aria-label={L('戻る', '返回', 'Back')}><BackIcon /></button>
        <h1 className="kk-detail-top__title">{entry.status === 'draft' ? L('下書き', '草稿', 'Draft') : L('記録', '記錄', 'Record')}</h1>
        {isOwner
          ? <button ref={menuBtnRef} type="button" className="kk-icon-btn" onClick={() => setMenuOpen(true)} aria-label={L('その他の操作', '更多操作', 'More actions')} aria-haspopup="dialog"><MoreIcon /></button>
          : <span className="kk-panel__head-spacer" />}
      </header>

      <main className="kk-detail">
        {/* Hero: bottle by default, original photo one tap away */}
        <section className="kk-detail-hero" aria-label={L('写真', '照片', 'Photo')}>
          {entry.photo_url && (
            <div className="kk-seg" role="tablist" aria-label={L('表示', '顯示', 'View')}>
              {[['bottle', L('瓶身', '瓶身', 'Bottle')], ['photo', L('原図', '原圖', 'Photo')], entry.photo_url2 && ['back', L('裏ラベル', '背標', 'Back')]].filter(Boolean).map(([k, label]) => (
                <button key={k} type="button" role="tab" aria-selected={view === k} className={view === k ? 'is-active' : ''} onClick={() => setView(k)}>{label}</button>
              ))}
            </div>
          )}
          {view === 'bottle' ? (
            <div className="kk-detail-hero__stage">
              <SakeBottleCrop imageUrl={entry.photo_url} crop={entry.photo_crop} height="236px" alt={title} />
            </div>
          ) : (
            <button type="button" className="kk-detail-hero__photo" onClick={() => setLightbox(photo)} aria-label={L('写真を拡大', '放大照片', 'Enlarge photo')}>
              <img src={photo} alt={title} />
            </button>
          )}
          <span className={`kk-status ${entry.is_public ? 'kk-status--public' : 'kk-status--private'} kk-detail-hero__privacy`}>
            {entry.is_public ? L('公開中', '公開中', 'Shared') : L('非公開', '不公開', 'Private')}
          </span>
        </section>

        {/* The 酒札 */}
        <article className="kk-plaque">
          <div className="kk-plaque__head">
            <div className="kk-plaque__titles">
              {reading && (lang === 'ja' ? reading.furigana : reading.romaji) && (
                <p className="kk-plaque__reading">{lang === 'ja' ? reading.furigana : reading.romaji}</p>
              )}
              <h2 className="kk-plaque__title">{title || L('名前のない下書き', '未命名草稿', 'Untitled draft')}</h2>
              <p className="kk-plaque__meta">
                {[entry.brewery,
                  entry.region && <button key="r" type="button" className="kk-link" onClick={goRegion}>{entry.region}</button>,
                  typeName].filter(Boolean).map((x, i) => <span key={i}>{i > 0 && ' / '}{x}</span>)}
              </p>
            </div>
            <span className="kk-seal" aria-hidden="true">{entry.status === 'draft' ? L('下書', '草稿', 'Draft') : L('記録', '記錄', 'Kept')}</span>
          </div>

          <div className="kk-plaque__rating">
            {Number(entry.rating) > 0
              ? <><span className="kk-score kk-score--lg">{formatRating(entry.rating)}</span><Stars rating={entry.rating} size={13} /></>
              : <span className="kk-card__unrated">{L('未評価', '未評分', 'Unrated')}</span>}
          </div>
          {dates.length > 0 && (
            <p className="kk-plaque__dates">
              {L('飲んだ日', '飲用日', 'Tasted')} {dot(dates[0])}
              {dates.length > 1 && <span> · {L(`ほか${dates.length - 1}回`, `另外 ${dates.length - 1} 次`, `+${dates.length - 1} more`)}</span>}
            </p>
          )}

          {entry.notes && (
            <section className="kk-detail-block">
              <h2>{L('私のメモ', '我的筆記', 'My notes')}</h2>
              <p className="kk-detail-note">{entry.notes}</p>
            </section>
          )}
          {tagsBlock(L('香り', '香氣', 'Aroma'), entry.aroma_tags, 'aroma')}
          {tagsBlock(L('味わい', '味道', 'Taste'), entry.taste_tags, 'taste')}
          {tagsBlock(L('整理', '整理', 'Labels'), entry.tags, 'flavor', true)}
          {tagsBlock(L('製法・状態', '製法・狀態', 'Method'), entry.method_tags, 'method', true)}

          {specs.length > 0 && (
            <section className="kk-detail-block">
              <h2>{L('スペック', '規格', 'Specs')}</h2>
              <dl className="kk-specs">
                {specs.map(([k, v, wiki]) => (
                  <div key={k}><dt>{k}</dt><dd>{wiki ? <WikiText text={String(v)} /> : v}</dd></div>
                ))}
              </dl>
            </section>
          )}

          {dates.length > 1 && (
            <section className="kk-detail-block">
              <h2>{L('飲んだ日', '飲用日', 'Dates tasted')}</h2>
              <ul className="kk-dates-list">{dates.map((d, i) => <li key={d}>{dot(d)}{i === 0 && <span>{L('最近', '最近', 'latest')}</span>}</li>)}</ul>
            </section>
          )}

          {isOwner && (
            <div className="kk-plaque__actions">
              <button type="button" className="kk-btn kk-btn--primary" onClick={goEdit}>{L('編集', '編輯', 'Edit')}</button>
            </div>
          )}
        </article>

        {/* みんなの瓶身 */}
        {others.length > 0 && (
          <section className="kk-others" aria-labelledby="kk-others-title">
            <div className="kk-others__head">
              <h2 id="kk-others-title">{L('みんなの瓶身', '大家的瓶身', 'Others’ bottles')}</h2>
              <span>{L('同じ酒の公開酒札', '同一款酒的公開酒札', 'Public tags of the same sake')}</span>
            </div>
            <ul className="kk-others__list">
              {others.map(o => (
                <li key={o.id}>
                  <button type="button" className="kk-others__item" onClick={() => navigate(`/journal/${o.id}`)}>
                    <span className="kk-others__stage"><SakeBottleCrop imageUrl={o.thumb_url || o.photo_url} crop={o.photo_crop} height="86px" /></span>
                    <span className="kk-others__who">{o.contributor_name || L('匿名', '匿名', 'Anonymous')}</span>
                    {Number(o.rating) > 0 && <span className="kk-score">{formatRating(o.rating)}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      {/* … menu */}
      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} className="kk-panel--fit kk-action-sheet" label={L('その他の操作', '更多操作', 'More actions')}>
        <ul className="kk-action-list">
          <li><button type="button" onClick={() => { setMenuOpen(false); goEdit() }}>{L('編集', '編輯', 'Edit')}</button></li>
          {entry.photo_url && <li><button type="button" onClick={() => { setMenuOpen(false); setAdjusting(true) }}>{L('瓶身を調整', '調整瓶身', 'Adjust bottle')}</button></li>}
          {entry.status !== 'draft' && <li><button type="button" onClick={togglePublic}>{entry.is_public ? L('非公開にする', '改為不公開', 'Make private') : L('廣場に公開する', '公開到廣場', 'Share to Discover')}</button></li>}
          <li><button type="button" onClick={share}>{L('画像で共有', '分享圖片', 'Share as image')}</button></li>
          <li className="kk-action-list__danger"><button type="button" onClick={() => { setMenuOpen(false); setConfirmDel(true) }}>{L('この記録を削除', '刪除這筆記錄', 'Delete this record')}</button></li>
        </ul>
        <button type="button" className="kk-btn kk-btn--block" onClick={() => setMenuOpen(false)}>{L('閉じる', '關閉', 'Close')}</button>
      </Sheet>

      <Sheet open={confirmDel} onClose={() => setConfirmDel(false)} variant="dialog" label={t('confirmDelete')}>
        <h2 className="kk-confirm__title kk-confirm__title--danger">{L('この記録を削除しますか？', '要刪除這筆記錄嗎？', 'Delete this record?')}</h2>
        <p className="kk-confirm__target">{title}</p>
        <p className="kk-confirm__note">{L('写真・メモ・評価もすべて消え、元に戻せません。', '照片、筆記和評分都會一併刪除，無法復原。', 'Photos, notes and rating will be removed. This cannot be undone.')}</p>
        <div className="kk-confirm__actions">
          <button type="button" className="kk-btn" data-autofocus onClick={() => setConfirmDel(false)}>{L('キャンセル', '取消', 'Cancel')}</button>
          <button type="button" className="kk-btn kk-btn--danger" disabled={busy} onClick={remove}>{L('削除する', '刪除', 'Delete')}</button>
        </div>
      </Sheet>

      <Sheet open={confirmPublic} onClose={() => setConfirmPublic(false)} variant="dialog" label={L('廣場に公開されます', '將公開到廣場', 'This will be shared')}>
        <h2 className="kk-confirm__title">{L('廣場に公開されます', '將公開到廣場', 'This will appear in Discover')}</h2>
        <p className="kk-confirm__note">{L('写真・評価・メモがみんなに見えます。あとで非公開に戻せます。', '照片、評分和筆記會讓大家看到；之後可以改回不公開。', 'Photo, rating and notes become visible. You can make it private again later.')}</p>
        <div className="kk-confirm__actions">
          <button type="button" className="kk-btn" onClick={() => setConfirmPublic(false)}>{L('やめる', '取消', 'Cancel')}</button>
          <button type="button" className="kk-btn kk-btn--primary" data-autofocus disabled={busy} onClick={async () => {
            const name = entry.contributor_name || session.user.user_metadata?.display_name || session.user.email.split('@')[0]
            if (await patch({ is_public: true, contributor_name: name })) {
              setConfirmPublic(false)
              setToast({ id: Date.now(), stamp: L('公開', '公開', 'Shared'), message: L('廣場に公開しました', '已公開到廣場', 'Shared to Discover') })
            }
          }}>{L('公開する', '公開', 'Share')}</button>
        </div>
      </Sheet>

      <Sheet open={!!lightbox} onClose={() => setLightbox(null)} variant="viewer" label={L('写真', '照片', 'Photo')}>
        <div onClick={() => setLightbox(null)} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={lightbox || ''} alt="" style={{ maxWidth: '96vw', maxHeight: '92svh', objectFit: 'contain', borderRadius: 8 }} />
        </div>
        <button type="button" className="kk-icon-btn" onClick={() => setLightbox(null)} aria-label={L('閉じる', '關閉', 'Close')}
          style={{ position: 'absolute', top: 'calc(16px + env(safe-area-inset-top, 0px))', right: 16, background: 'rgba(0,0,0,.5)', borderColor: 'rgba(255,255,255,.3)', color: '#fff' }}>
          <CloseIcon />
        </button>
      </Sheet>

      {adjusting && (
        <BottleCropEditor key={entry.photo_url} open src={entry.photo_url} initial={entry.photo_crop} lang={lang}
          onSave={async crop => { if (await patch({ photo_crop: crop })) { setAdjusting(false); setView('bottle') } }}
          onClose={() => setAdjusting(false)} />
      )}

      <Toast toast={toast} onDone={() => setToast(null)} />
    </div>
  )
}

function BackIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
}
function MoreIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg>
}
