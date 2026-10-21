import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Nav from '../../components/Nav'
import LangButton from '../../components/LangButton'
import SakeBottleCrop from '../../components/bottle/SakeBottleCrop'
import { useLang } from '../../contexts/LangContext'
import { useTagResolver } from '../../contexts/TagsContext'
import { formatRating } from '../../lib/rating'
import { normalizeType } from '../../lib/sakeType'
import { cleanLabel } from '../../lib/labels'
import { pressable } from '../../lib/a11y'
import { forwardFrom, relativeTime } from '../../lib/plaza'
import { useWishes } from '../../lib/wishes'
import { tierFor, tanukiSrc } from '../../lib/plazaTier'
import PlazaStamp from '../../components/plaza/PlazaStamp'
import '../journal/ledger.css'
import './plaza.css'

const PAGE = 20
const COLS = 'id,user_id,product_id,brand,name,brewery,region,type,rating,notes,aroma_tags,taste_tags,photo_url,thumb_url,photo_crop,contributor_name,created_at,tasted_at'
const shortRegion = r => (r || '').replace(/[都道府県]$/, '') || r

// Five dots in the tier colour; 0.5 steps show a half dot.
function Dots({ rating }) {
  const r = Number(rating) || 0
  return (
    <span className="kk-pdots" aria-hidden="true">
      {[1, 2, 3, 4, 5].map(i => <i key={i} className={r >= i ? 'is-full' : r >= i - 0.5 ? 'is-half' : ''} />)}
    </span>
  )
}

/**
 * 廣場 — a quiet reading space for 酒札 people chose to share.
 * Not a social feed: no ranking, no likes or comments. Three ways in:
 * 新着 (newest), 高評価 (highest rated), 近い好み (close to your own high-rated tastes).
 * Guests see the factual card only (no photo, rating, notes or name) — Phase 7 rule.
 */
export default function Plaza({ session }) {
  const navigate = useNavigate()
  const { lang, changeLang } = useLang()
  const L = (ja, zh, en) => (lang === 'ja' ? ja : lang === 'zh' ? zh : en)
  const rawTag = useTagResolver()
  const tagLabel = (id, cat) => cleanLabel(rawTag(id, cat))
  const isGuest = !session
  // Aroma and taste ids can sit in either list on older records; resolve against both vocabularies.
  const sensoryLabel = id => { const a = tagLabel(id, 'aroma'); return a && a !== id ? a : tagLabel(id, 'taste') }
  const { isWished, toggleWish } = useWishes(session)

  const [tab, setTab] = useState('new')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [mine, setMine] = useState(null) // the user's own records, for 近い好み
  const pageRef = useRef(0)
  const searchRef = useRef(null)
  // Guests land here first: a short card says what Kikiroku is (2026-10-21 本人). Closing it is remembered.
  const [introClosed, setIntroClosed] = useState(() => { try { return localStorage.getItem('kk_intro_closed') === '1' } catch { return false } })
  const closeIntro = () => { setIntroClosed(true); try { localStorage.setItem('kk_intro_closed', '1') } catch { /* storage blocked */ } }

  // Own records → taste profile (aroma/taste tags of 4.0+), breweries and regions.
  useEffect(() => {
    if (!session) return
    supabase.from('sake_entries').select('id,rating,aroma_tags,taste_tags,brewery,region,status').eq('user_id', session.user.id)
      .then(({ data }) => setMine(data || []))
  }, [session?.user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const profile = useMemo(() => {
    if (!mine) return null
    const tags = new Map(); const breweries = new Set(); const regions = new Set()
    for (const e of mine) {
      if (e.status === 'draft') continue
      if (e.brewery) breweries.add(e.brewery)
      if (e.region) regions.add(e.region)
      if (Number(e.rating) >= 4) for (const t of [...(e.aroma_tags || []), ...(e.taste_tags || [])]) tags.set(t, (tags.get(t) || 0) + 1)
    }
    return { tags, breweries, regions, ownIds: new Set(mine.map(e => e.id)) }
  }, [mine])
  const canMatch = !!profile && profile.tags.size > 0

  // Why this 酒札 is in front of you — every card states one reason.
  // Personal reasons first (taste, brewery, region you've recorded), then the tab's own reason.
  const reasonFor = useCallback(e => {
    if (profile && !isGuest) {
      const overlap = [...new Set([...(e.aroma_tags || []), ...(e.taste_tags || [])])].filter(t => profile.tags.has(t))
      if (overlap.length >= (tab === 'near' ? 1 : 2)) return { kind: 'taste', label: L('近い好み', '口味相近', 'Your taste'), detail: overlap.slice(0, 2).map(sensoryLabel).join('・') }
      if (e.brewery && profile.breweries.has(e.brewery)) return { kind: 'brewery', label: L('飲んだことのある酒造', '喝過的酒造', 'A brewery you’ve had') }
      if (e.region && profile.regions.has(e.region)) return { kind: 'region', label: L('記録のある産地', '記錄過的產地', 'A region you’ve recorded'), detail: shortRegion(e.region) }
    }
    if (tab === 'top') return { kind: 'top', label: L('評価上位', '高評分', 'Top rated') }
    return { kind: 'new', label: L('新着', '最新公開', 'Newly shared') }
  }, [profile, tab, isGuest, lang, rawTag]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPage = useCallback(async (page, replace) => {
    setLoading(true)
    let q = supabase.from('sake_entries').select(COLS).eq('is_public', true).eq('status', 'published')
    const term = query.trim()
    if (term) {
      const like = `%${term.replace(/[%,()]/g, '')}%`
      q = q.or(`brand.ilike.${like},name.ilike.${like},brewery.ilike.${like},region.ilike.${like}`)
    }
    if (tab === 'top') q = q.not('rating', 'is', null).order('rating', { ascending: false }).order('created_at', { ascending: false })
    else q = q.order('created_at', { ascending: false })
    // 近い好み scores a wider window client-side, then shows the closest first.
    const size = tab === 'near' ? 200 : PAGE
    const { data } = await q.range(page * size, page * size + size - 1)
    let list = (data || []).map(e => ({ ...e, type: normalizeType(e.type) || null }))
    if (tab === 'near' && profile) {
      list = list.filter(e => !profile.ownIds.has(e.id))
        .map(e => ({ e, score: [...(e.aroma_tags || []), ...(e.taste_tags || [])].reduce((s, t) => s + (profile.tags.get(t) || 0), 0) }))
        .filter(x => x.score > 0).sort((a, b) => b.score - a.score).map(x => x.e)
    }
    setRows(prev => (replace ? list : [...prev, ...list]))
    setHasMore(tab !== 'near' && (data || []).length === size)
    setLoading(false)
  }, [tab, query, profile])

  useEffect(() => {
    pageRef.current = 0
    const id = setTimeout(() => fetchPage(0, true), query ? 250 : 0)
    return () => clearTimeout(id)
  }, [fetchPage]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (searchOpen) searchRef.current?.focus() }, [searchOpen])

  const tabs = [
    ['new', L('新着', '最新', 'New')],
    ['top', L('高評価', '高評分', 'Top rated')],
    ...(isGuest ? [] : [['near', L('近い好み', '相近口味', 'Close to you')]]),
  ]

  const open = e => navigate(`/journal/${e.id}`, { state: { from: 'plaza' } })
  const recordToo = e => navigate('/journal', { state: { forward: forwardFrom(e) } })

  return (
    <div className="kk-plaza-page">
      <Nav session={session} topbar={false} />
      <div className="kk-plaza">
        <header className="kk-ledger__head">
          <h1 className="kk-ledger__title">{L('広場', '廣場', 'Discover')}</h1>
          <div className="kk-ledger__head-actions">
            {/* Signed-in users switch language in プロフ; guests have no プロフ, so they keep it here. */}
            {isGuest && <LangButton lang={lang} onChange={changeLang} label={L('表示言語', '介面語言', 'Language')} />}
            {isGuest && <button type="button" className="kk-btn kk-btn--sm" onClick={() => navigate('/login')}>{L('ログイン', '登入', 'Sign in')}</button>}
            <button type="button" className="kk-icon-btn" onClick={() => setSearchOpen(o => !o)} aria-expanded={searchOpen} aria-controls="kk-plaza-search"
              aria-label={L('広場を検索', '搜尋廣場', 'Search Discover')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            </button>
          </div>
        </header>

        {isGuest && !introClosed && (
          <section className="kk-intro" aria-labelledby="kk-intro-title">
            <img src="/icon-192.png" alt="" width="48" height="48" className="kk-intro__icon" />
            <div className="kk-intro__body">
              <h2 id="kk-intro-title">{L('飲んだ日本酒を、一本ずつ札に。', '把喝過的日本酒，一瓶一瓶做成酒札。', 'Every sake you drink, kept as a tag.')}</h2>
              <ul>
                <li>{L('ラベルを撮って自動入力', '拍酒標自動填寫', 'Snap the label, fields fill in')}</li>
                <li>{L('酒名にふりがな・3 言語', '酒名附讀音・3 種語言', 'Readings on names, 3 languages')}</li>
                <li>{L('自分用にも、広場で共有にも', '自己看，或分享到廣場', 'Keep it private, or share it here')}</li>
              </ul>
              <div className="kk-intro__actions">
                <button type="button" className="kk-btn kk-btn--sm kk-btn--primary" onClick={() => navigate('/login')}>{L('ログイン', '登入', 'Sign in')}</button>
                <span>{L('新規登録は招待制です', '目前採邀請制註冊', 'Sign-up is by invitation')}</span>
              </div>
            </div>
            <button type="button" className="kk-intro__close" onClick={closeIntro} aria-label={L('閉じる', '關閉', 'Close')}>×</button>
          </section>
        )}

        {searchOpen && (
          <div className="kk-search" role="search" id="kk-plaza-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input ref={searchRef} type="search" value={query} onChange={e => setQuery(e.target.value)}
              placeholder={L('酒名・酒造・産地で探す', '以酒名・酒造・產地搜尋', 'Name, brewery or region')} aria-label={L('広場を検索', '搜尋廣場', 'Search Discover')} />
            {query && <button type="button" className="kk-search__clear" onClick={() => setQuery('')} aria-label={L('検索をクリア', '清除搜尋', 'Clear search')}>×</button>}
          </div>
        )}

        <div className="kk-tabs" role="tablist" aria-label={L('並べ方', '排列方式', 'View')}>
          {tabs.map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} className={`kk-chip${tab === k ? ' is-active' : ''}`} onClick={() => setTab(k)}>{label}</button>
          ))}
        </div>
        {tab === 'near' && !canMatch && mine && (
          <p className="kk-plaza__hint">{L('4.0以上の記録に香り・味わいを付けると、近い好みの酒札が見つかります。', '在 4.0 以上的記錄加上香氣・味道，就能找到口味相近的酒札。', 'Add aroma and taste tags to your 4.0+ records to find sake close to your taste.')}</p>
        )}

        <ul className="kk-feed" aria-busy={loading}>
          {rows.map((e, i) => {
            const reason = reasonFor(e)
            const who = e.contributor_name || L('匿名', '匿名', 'Someone')
            const title = [e.brand, e.name].filter(Boolean).join(' ')
            const wished = isWished(e)
            // Guests never see ratings, so they never see the rating colour or scene either.
            const tier = isGuest ? null : tierFor(e.rating)
            // Tanuki marks where a rating band starts: a run of same-tier cards shows it on the first
            // card only; a card whose tier differs from the previous card shows its own (user rule 2026-10-07).
            const prevTier = i > 0 && !isGuest ? tierFor(rows[i - 1].rating) : null
            const scene = !!tier && tier.id !== prevTier?.id
            // One stable spoken summary per card (design 2026-10-08 §4): name, rating, author, time.
            const when = relativeTime(e.created_at, lang)
            const cardLabel = (isGuest
              ? [title, e.brewery, when]
              : [title, Number(e.rating) > 0 && L(`評価${formatRating(e.rating)}`, `評分${formatRating(e.rating)}`, `rated ${formatRating(e.rating)}`), who, when]
            ).filter(Boolean).join(L('、', '，', ', '))
            return (
              <li key={e.id}>
                <article className={`kk-pcard kk-pcard--${tier ? tier.id : 'none'}${scene ? ' has-scene' : ''}`}>
                  {scene && <img className="kk-pcard__tanuki" src={tanukiSrc(tier)} alt="" aria-hidden="true" width="256" height="256" loading="lazy" />}
                  <div className="kk-pcard__paper">
                    <div className="kk-pcard__bottle" aria-hidden="true" onClick={() => open(e)}>
                      <SakeBottleCrop imageUrl={isGuest ? null : (e.thumb_url || e.photo_url)} crop={e.photo_crop} height="84px" />
                    </div>
                    <div className="kk-pcard__body">
                      <div className="kk-pcard__main" {...pressable(() => open(e), cardLabel)}>
                        {tier && (
                          <p className="kk-pcard__score" title={L(tier.ja, tier.zh, tier.en)} aria-label={L(`評価 ${formatRating(e.rating)}・${tier.ja}`, `評分 ${formatRating(e.rating)}・${tier.zh}`, `Rated ${formatRating(e.rating)} · ${tier.en}`)}>
                            <span className="kk-pcard__num">{formatRating(e.rating)}</span>
                            <Dots rating={e.rating} />
                            <PlazaStamp kind={tier.stamp} />
                          </p>
                        )}
                        <p className={`kk-reason kk-reason--${reason.kind}`}>
                          <span className="kk-reason__label">{reason.label}</span>
                          {reason.detail && <span className="kk-reason__detail">{reason.detail}</span>}
                        </p>
                        <h2 className="kk-pcard__title">{title}</h2>
                        <p className="kk-pcard__meta">{[e.brewery, shortRegion(e.region), e.type && tagLabel(e.type, 'type')].filter(Boolean).join(' · ')}</p>
                        {!isGuest && e.notes && <p className="kk-pcard__note">{e.notes}</p>}
                      </div>
                      <div className="kk-pcard__foot">
                        <p className="kk-pcard__who">
                          {!isGuest && <><span className="kk-pcard__name">{who}</span><span aria-hidden="true">·</span></>}
                          <span>{when}</span>
                        </p>
                        <div className="kk-pcard__actions">
                          {isGuest ? (
                            <button type="button" className="kk-act kk-act--go" onClick={() => navigate('/login')}
                              aria-label={L(`ログインして${title}を記録`, `登入後記錄${title}`, `Sign in to record ${title}`)}>{L('ログインして記録', '登入後記錄', 'Sign in to record')}</button>
                          ) : (<>
                            <button type="button" className={`kk-act${wished ? ' is-on' : ''}`} aria-pressed={wished} onClick={() => toggleWish(e)}
                              aria-label={L(`${title}を飲みたいに追加`, `把${title}加入想喝`, `Add ${title} to want to try`)}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill={wished ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z" /></svg>
                              {L('飲みたい', '想喝', 'Want to try')}
                            </button>
                            <button type="button" className="kk-act kk-act--go" onClick={() => recordToo(e)}
                              aria-label={L(`${title}を自分も記録`, `我也記錄${title}`, `Record ${title} too`)}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                              {L('自分も記録', '我也記錄', 'Record it too')}
                            </button>
                          </>)}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>

        {loading && rows.length === 0 && (
          <div className="kk-skeleton" aria-hidden="true">{[0, 1, 2].map(i => <div key={i} className="kk-skeleton__row"><span /><span /><span /></div>)}</div>
        )}
        {!loading && rows.length === 0 && (
          <div className="kk-empty kk-empty--quiet">
            <strong>{query ? L('見つかりませんでした', '找不到結果', 'Nothing found') : tab === 'near' ? L('近い好みの酒札はまだありません', '還沒有口味相近的酒札', 'Nothing close to your taste yet') : L('まだ公開中の酒札がありません', '還沒有公開酒札', 'No public tags yet')}</strong>
          </div>
        )}
        {hasMore && !loading && (
          <button type="button" className="kk-btn kk-btn--block kk-plaza__more" onClick={() => { pageRef.current += 1; fetchPage(pageRef.current, false) }}>
            {L('もっと見る', '載入更多', 'Show more')}
          </button>
        )}
      </div>
    </div>
  )
}
