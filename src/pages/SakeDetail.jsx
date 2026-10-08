import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Nav from '../components/Nav'
import Sheet, { CloseIcon } from '../components/ui/Sheet'
import Toast from '../components/ui/Toast'
import SakeBottleCrop from '../components/bottle/SakeBottleCrop'
import BottleCropEditor from '../components/bottle/BottleCropEditor'
import { WikiText } from '../components/WikiTooltip'
import { useLang } from '../contexts/LangContext'
import { useTagResolver } from '../contexts/TagsContext'
import { formatRating } from '../lib/rating'
import { normalizeType } from '../lib/sakeType'
import { cleanLabel } from '../lib/labels'
import { forwardFrom } from '../lib/plaza'
import { useWishes } from '../lib/wishes'
import './plaza/plaza.css'
import './sakeDetail.css'
import { regionPath } from '../lib/region'

const dot = d => (d || '').replaceAll('-', '.')

/**
 * 酒詳情 — one 酒札 as a page (/journal/:id). Layout B「照片与记忆・效率精修」(design 2026-10-08):
 * full-width title → small fixed photo column (瓶身 / 写真) beside my rating, date and two key specs →
 * 種類・状態 line → 私のメモ → 香り・味わい → 関連 → お酒の詳しい情報 (folded). Desktop: title spans,
 * 関連 and details move to a right column. Owner actions: 編集 in the top bar, the rest in the … menu.
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
  const [view, setView] = useState('bottle')    // bottle | photo
  const [reading, setReading] = useState(null)
  const [others, setOthers] = useState([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [confirmPublic, setConfirmPublic] = useState(false)
  const [busy, setBusy] = useState(false)
  const [lightbox, setLightbox] = useState(null) // index into photos
  const [adjusting, setAdjusting] = useState(false)
  const [toast, setToast] = useState(null)
  const [specsOpen, setSpecsOpen] = useState(false)
  const [flavorsOpen, setFlavorsOpen] = useState(false)
  const menuBtnRef = useRef(null)

  const isOwner = !!(session && entry && entry.user_id === session.user.id)
  // Guests see the factual 酒札 only (Phase 7 rule): no photo, rating, notes, tags, dates or name.
  const isGuest = !session
  const { isWished, toggleWish } = useWishes(session)

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
  const goRegion = () => navigate(regionPath(entry.region))
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
        type: typeName, // stored as an id (e.g. tokubetsu-junmai) since the type clean-up
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

  const photos = [entry.photo_url && { key: 'front', src: entry.photo_url, label: L('表ラベル', '正標', 'Front') }, entry.photo_url2 && { key: 'back', src: entry.photo_url2, label: L('裏ラベル', '背標', 'Back') }].filter(Boolean)
  const canSeePhoto = !isGuest && photos.length > 0
  const shownView = canSeePhoto ? view : 'bottle'
  const rating = Number(entry.rating) || 0
  const pct = v => (v ? `${String(v).replace(/%$/, '')}%` : null)
  const keySpecs = [[L('精米歩合', '精米步合', 'Polishing'), pct(entry.polishing)], [L('アルコール', '酒精度', 'Alcohol'), pct(entry.alcohol)]].filter(([, v]) => v)
  const moreSpecs = specs.filter(([k]) => !keySpecs.some(([kk]) => kk === k))
  const methodNames = (entry.method_tags || []).map(x => tagLabel(x, 'method'))
  const flavorIds = [...(entry.aroma_tags || []).map(x => [x, 'aroma']), ...(entry.taste_tags || []).map(x => [x, 'taste'])]
  const FLAVOR_SHOWN = 6
  const visibleFlavors = flavorsOpen ? flavorIds : flavorIds.slice(0, FLAVOR_SHOWN)
  const wished = isWished(entry)
  const ratingLabel = rating > 0 ? L(`評価 ${formatRating(rating)}（5点中）`, `評分 ${formatRating(rating)}（滿分 5）`, `Rated ${formatRating(rating)} out of 5`) : L('未評価', '未評分', 'Unrated')
  const readingText = reading && (lang === 'ja' ? reading.furigana : reading.romaji)

  const related = !isGuest && (
    <section className="kk-dv-related" aria-labelledby="kk-dv-related-title">
      <h2 id="kk-dv-related-title" className="kk-dv-h2">{L('関連', '相關', 'Related')}</h2>
      {entry.brewery && (
        <button type="button" className="kk-dv-row" onClick={() => navigate('/journal', { state: { brewery: entry.brewery } })}>
          <span><strong>{L('同じ酒造', '同一酒造', 'Same brewery')}</strong><small>{L(`${entry.brewery}の記録を見る`, `看${entry.brewery}的記錄`, `Your records from ${entry.brewery}`)}</small></span>
          <span className="kk-dv-row__go" aria-hidden="true">›</span>
        </button>
      )}
      {entry.region && (
        <button type="button" className="kk-dv-row" onClick={() => navigate('/journal', { state: { region: entry.region } })}>
          <span><strong>{L('同じ産地', '同一產地', 'Same region')}</strong><small>{L(`${entry.region}の酒札を見る`, `看${entry.region}的酒札`, `Your sake from ${entry.region}`)}</small></span>
          <span className="kk-dv-row__go" aria-hidden="true">›</span>
        </button>
      )}
      <button type="button" className={`kk-dv-row${wished ? ' is-on' : ''}`} aria-pressed={wished} onClick={() => toggleWish(entry)}>
        <span>
          <strong>{isOwner ? L('また飲みたい', '還想再喝', 'Drink again') : L('飲みたい', '想喝', 'Want to try')}</strong>
          <small>{wished ? L('飲みたいリストに入っています', '已在想喝清單裡', 'On your wish list') : L('飲みたいリストに追加', '加入想喝清單', 'Add to your wish list')}</small>
        </span>
        <span className="kk-dv-row__go" aria-hidden="true">{wished ? '✓' : '+'}</span>
      </button>
      {!isOwner && (
        <button type="button" className="kk-dv-row" onClick={() => navigate('/journal', { state: { forward: forwardFrom(entry) } })}>
          <span><strong>{L('自分も記録', '我也記錄', 'Record it too')}</strong><small>{L('この酒で新しい記録をつくる', '用這款酒新增一筆記錄', 'Start a record of this sake')}</small></span>
          <span className="kk-dv-row__go" aria-hidden="true">›</span>
        </button>
      )}
    </section>
  )

  const details = (moreSpecs.length > 0 || dates.length > 1) && (
    <details className="kk-dv-more" open={specsOpen} onToggle={e => setSpecsOpen(e.currentTarget.open)}>
      <summary>{L('お酒の詳しい情報', '酒的詳細資訊', 'More about this sake')}</summary>
      {moreSpecs.length > 0 && (
        <dl className="kk-dv-specs">
          {moreSpecs.map(([k, v, wiki]) => <div key={k}><dt>{k}</dt><dd>{wiki ? <WikiText text={String(v)} /> : v}</dd></div>)}
        </dl>
      )}
      {!isGuest && dates.length > 1 && (
        <div className="kk-dv-dates" id="kk-all-dates">
          <p className="kk-dv-overline">{L('飲んだ日', '飲用日', 'Dates tasted')}</p>
          <ul className="kk-dates-list">{dates.map((d, i) => <li key={d}>{dot(d)}{i === 0 && <span>{L('最近', '最近', 'latest')}</span>}</li>)}</ul>
        </div>
      )}
    </details>
  )

  return (
    <div className="kk-detail-page kk-dv-page">
      <Nav session={session} topbar={false} />

      <header className="kk-dv-top">
        <button type="button" className="kk-dv-top__back" onClick={goBack}><span aria-hidden="true">←</span> {isOwner ? L('マイ帳', '酒帳', 'Ledger') : L('戻る', '返回', 'Back')}</button>
        <h1 className="kk-dv-top__title">{entry.status === 'draft' ? L('下書き', '草稿', 'Draft') : L('酒の記録', '酒的記錄', 'Sake record')}</h1>
        <div className="kk-dv-top__actions">
          {isOwner && <button type="button" className="kk-dv-top__edit" onClick={goEdit}>{L('編集', '編輯', 'Edit')}</button>}
          {isOwner && <button ref={menuBtnRef} type="button" className="kk-icon-btn kk-dv-top__more" onClick={() => setMenuOpen(true)} aria-label={L('その他の操作', '更多操作', 'More actions')} aria-haspopup="dialog"><MoreIcon /></button>}
        </div>
      </header>

      <main className="kk-dv">
        <div className="kk-dv-titles">
          <p className="kk-dv-eyebrow">
            {readingText && <span>{readingText}</span>}
            {!isOwner && !isGuest && <span>{L(`${entry.contributor_name || '匿名'} の公開酒札`, `${entry.contributor_name || '匿名'} 的公開酒札`, `${entry.contributor_name || 'Someone'}’s public tag`)}</span>}
            {isOwner && <span className={`kk-dv-privacy${entry.is_public ? ' is-public' : ''}`}>{entry.is_public ? L('公開中', '公開中', 'Shared') : L('非公開', '不公開', 'Private')}</span>}
          </p>
          <h2 className="kk-dv-title">{title || L('名前のない下書き', '未命名草稿', 'Untitled draft')}</h2>
          {(entry.brewery || entry.region) && (
            <p className="kk-dv-brewery">
              {entry.brewery && (isGuest ? <span>{entry.brewery}</span> : <button type="button" className="kk-dv-link" onClick={() => navigate('/journal', { state: { brewery: entry.brewery } })}>{entry.brewery}</button>)}
              {entry.brewery && entry.region && ' · '}
              {entry.region && <button type="button" className="kk-dv-link" onClick={goRegion}>{entry.region}</button>}
            </p>
          )}
        </div>

        <div className="kk-dv-primary">
          <div className="kk-dv-overview">
            <div className="kk-dv-photo-col">
              {shownView === 'bottle' ? (
                <div className="kk-dv-photo">
                  <SakeBottleCrop imageUrl={isGuest ? null : entry.photo_url} crop={entry.photo_crop} height="172px" alt={title} />
                </div>
              ) : (
                <button type="button" className="kk-dv-photo is-original" onClick={() => setLightbox(0)} aria-label={L('写真を拡大', '放大照片', 'Enlarge photo')}>
                  <img src={entry.photo_url} alt={title} />
                </button>
              )}
              {canSeePhoto ? (
                <div className="kk-dv-switch" role="group" aria-label={L('表示', '顯示', 'View')}>
                  {[['bottle', L('瓶身', '瓶身', 'Bottle')], ['photo', L('写真', '照片', 'Photo')]].map(([k, label]) => (
                    <button key={k} type="button" aria-pressed={shownView === k} onClick={() => setView(k)}>{label}</button>
                  ))}
                </div>
              ) : isOwner && (
                <button type="button" className="kk-dv-addphoto" onClick={goEdit}>{L('写真を追加', '加照片', 'Add a photo')}</button>
              )}
            </div>

            <div className="kk-dv-assess">
              {!isGuest && <img className="kk-dv-tanuki" src="/detail/tanuki-record.webp" alt="" aria-hidden="true" width="76" height="76" />}
              {!isGuest && (<>
                <p className="kk-dv-overline">{L('私の評価', '我的評分', 'My rating')}</p>
                {rating > 0 ? (
                  <div className="kk-dv-rating" role="img" aria-label={ratingLabel}>
                    <p className="kk-dv-score" aria-hidden="true"><strong>{formatRating(rating)}</strong><span>/ 5</span></p>
                    <Dots rating={rating} />
                  </div>
                ) : <p className="kk-dv-unrated">{L('未評価', '未評分', 'Unrated')}</p>}
                {dates.length > 0 && (
                  <div className="kk-dv-date">
                    <span>{L('飲んだ日', '飲用日', 'Tasted')}</span>
                    {dot(dates[0])}
                    {dates.length > 1 && <small>{L(`ほか${dates.length - 1}回`, `另外 ${dates.length - 1} 次`, `+${dates.length - 1} more`)}</small>}
                  </div>
                )}
              </>)}
              {keySpecs.length > 0 && (
                <dl className={`kk-dv-keyspecs${isGuest ? ' is-first' : ''}`}>
                  {keySpecs.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
                </dl>
              )}
            </div>
          </div>

          {(typeName || methodNames.length > 0) && (
            <dl className="kk-dv-class">
              {typeName && <div><dt>{L('種類', '種類', 'Type')}</dt><dd>{typeName}</dd></div>}
              {methodNames.length > 0 && <div><dt>{L('状態', '狀態', 'Style')}</dt><dd>{methodNames.join('・')}</dd></div>}
            </dl>
          )}

          {!isGuest && (
            <section className="kk-dv-memo" aria-labelledby="kk-dv-memo-title">
              <h2 id="kk-dv-memo-title" className="kk-dv-h2">{L('私のメモ', '我的筆記', 'My notes')}</h2>
              {entry.notes
                ? <p className="kk-dv-note">{entry.notes}</p>
                : <p className="kk-dv-empty">{L('まだメモはありません。', '還沒有筆記。', 'No notes yet.')}{isOwner && <> <button type="button" className="kk-dv-textbtn" onClick={goEdit}>{L('メモを書く', '寫筆記', 'Write a note')}</button></>}</p>}
            </section>
          )}

          {!isGuest && (flavorIds.length > 0 || entry.tags?.length > 0) && (
            <div className="kk-dv-flavors">
              {flavorIds.length > 0 && (
                <p className="kk-dv-chips">
                  <span className="kk-dv-chips__label">{L('香り・味わい', '香氣・味道', 'Aroma · taste')}</span>
                  {visibleFlavors.map(([x, cat]) => <span key={cat + x} className="kk-dv-chip">{tagLabel(x, cat)}</span>)}
                  {flavorIds.length > FLAVOR_SHOWN && (
                    <button type="button" className="kk-dv-chip kk-dv-chip--more" aria-expanded={flavorsOpen} onClick={() => setFlavorsOpen(o => !o)}>
                      {flavorsOpen ? L('閉じる', '收起', 'Less') : `+${flavorIds.length - FLAVOR_SHOWN}`}
                    </button>
                  )}
                </p>
              )}
              {entry.tags?.length > 0 && (
                <p className="kk-dv-chips">
                  <span className="kk-dv-chips__label">{L('整理', '整理', 'Labels')}</span>
                  {entry.tags.map(x => <span key={x} className="kk-dv-chip is-outline">{tagLabel(x, 'flavor')}</span>)}
                </p>
              )}
            </div>
          )}

          {isGuest && (
            <div className="kk-dv-guest">
              <p className="kk-helper">{L('写真・評価・メモはログインすると見られます。', '登入後可以看到照片、評分和筆記。', 'Sign in to see photos, ratings and notes.')}</p>
              <button type="button" className="kk-btn kk-btn--primary" onClick={() => navigate('/login')}>{L('ログイン', '登入', 'Sign in')}</button>
            </div>
          )}
        </div>

        <div className="kk-dv-secondary">
          {related}
          {details}
          {/* みんなの瓶身 */}
          {others.length > 0 && (
            <section className="kk-dv-others" aria-labelledby="kk-others-title">
              <div className="kk-others__head">
                <h2 id="kk-others-title" className="kk-dv-h2">{L('みんなの瓶身', '大家的瓶身', 'Others’ bottles')}</h2>
                <span>{L('同じ酒の公開酒札', '同一款酒的公開酒札', 'Public tags of the same sake')}</span>
              </div>
              <ul className="kk-others__list">
                {others.map(o => (
                  <li key={o.id}>
                    <button type="button" className="kk-others__item" onClick={() => navigate(`/journal/${o.id}`)}>
                      <span className="kk-others__stage"><SakeBottleCrop imageUrl={isGuest ? null : (o.thumb_url || o.photo_url)} crop={o.photo_crop} height="86px" /></span>
                      {!isGuest && <span className="kk-others__who">{o.contributor_name || L('匿名', '匿名', 'Anonymous')}</span>}
                      {!isGuest && Number(o.rating) > 0 && <span className="kk-score">{formatRating(o.rating)}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
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

      <Sheet open={lightbox !== null} onClose={() => setLightbox(null)} variant="viewer" label={L('写真', '照片', 'Photo')}>
        <div className="kk-dv-viewer" onClick={e => { if (e.target === e.currentTarget) setLightbox(null) }}>
          {lightbox !== null && photos[lightbox] && <img src={photos[lightbox].src} alt={`${title}・${photos[lightbox].label}`} />}
        </div>
        {photos.length > 1 && (
          <div className="kk-dv-viewer__tabs" role="group" aria-label={L('写真を選ぶ', '選擇照片', 'Choose photo')}>
            {photos.map((ph, i) => <button key={ph.key} type="button" aria-pressed={lightbox === i} onClick={() => setLightbox(i)}>{ph.label}</button>)}
          </div>
        )}
        <button type="button" className="kk-icon-btn kk-dv-viewer__close" onClick={() => setLightbox(null)} aria-label={L('閉じる', '關閉', 'Close')}>
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

function Dots({ rating }) {
  const r = Number(rating) || 0
  return (
    <span className="kk-pdots kk-dv-dots" aria-hidden="true">
      {[1, 2, 3, 4, 5].map(i => <i key={i} className={r >= i ? 'is-full' : r >= i - 0.5 ? 'is-half' : ''} />)}
    </span>
  )
}
function BackIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
}
function MoreIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg>
}
