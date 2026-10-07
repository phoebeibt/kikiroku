import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import SakeBottleCrop from '../../components/bottle/SakeBottleCrop'
import { entryMatchesProduct, loadPublicEntries, normName } from '../../lib/sakeMatch'

const PAGE = 30
const TYPES = ['純米大吟醸', '純米吟醸', '特別純米', '純米', '大吟醸', '吟醸', '特別本醸造', '本醸造']
const shortRegion = r => (r || '').replace(/[都道府県]$/, '') || r

/**
 * 事典 › 酒款. Two shelves:
 * - 公開酒札にある酒: sakes people actually recorded and shared (they carry real bottles)
 * - 酒款カタログ: the 4k-row product catalog, searchable and filterable by type
 */
export default function SakeShelf({ lang, isGuest }) {
  const navigate = useNavigate()
  const L = (ja, zh, en) => (lang === 'ja' ? ja : lang === 'zh' ? zh : en)
  const [query, setQuery] = useState('')
  const [type, setType] = useState(null)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [publicEntries, setPublicEntries] = useState([])
  const [showAllRecorded, setShowAllRecorded] = useState(false)
  const pageRef = useRef(0)

  useEffect(() => { loadPublicEntries().then(setPublicEntries) }, [])

  // Recorded sakes, grouped by brand + name; the newest record with a photo is the cover.
  const recorded = useMemo(() => {
    const groups = new Map()
    for (const e of publicEntries) {
      const key = normName(`${e.brand || ''}${e.name || ''}`)
      if (!key) continue
      const g = groups.get(key)
      if (!g) groups.set(key, { cover: e, count: 1 })
      else {
        g.count += 1
        if (!(g.cover.thumb_url || g.cover.photo_url) && (e.thumb_url || e.photo_url)) g.cover = e
      }
    }
    return [...groups.values()].sort((a, b) => b.count - a.count || (b.cover.created_at || '').localeCompare(a.cover.created_at || ''))
  }, [publicEntries])

  const fetchPage = async (page, replace) => {
    setLoading(true)
    let q = supabase.from('sake_products').select('id,name,brewery_name,brewery_id,region,type,polishing', { count: 'exact' })
    const term = query.trim().replace(/[%,()]/g, '')
    if (term) q = q.or(`name.ilike.%${term}%,brewery_name.ilike.%${term}%,region.ilike.%${term}%`)
    if (type) q = q.eq('type', type)
    const { data, count } = await q.order('brewery_name').order('name').range(page * PAGE, page * PAGE + PAGE - 1)
    setRows(prev => (replace ? (data || []) : [...prev, ...(data || [])]))
    setTotal(count ?? null)
    setLoading(false)
  }

  useEffect(() => {
    pageRef.current = 0
    const id = setTimeout(() => fetchPage(0, true), query ? 250 : 0)
    return () => clearTimeout(id)
  }, [query, type]) // eslint-disable-line react-hooks/exhaustive-deps

  const browsing = !query.trim() && !type
  const recordedShown = showAllRecorded ? recorded : recorded.slice(0, 5)
  const matchesFor = p => publicEntries.filter(e => entryMatchesProduct(e, p))

  return (
    <div>
      <div className="kk-search" role="search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        <input type="search" value={query} onChange={e => setQuery(e.target.value)}
          placeholder={L('酒名・酒造・産地で探す', '以酒名・酒造・產地搜尋', 'Name, brewery or region')}
          aria-label={L('酒款を検索', '搜尋酒款', 'Search sakes')} />
        {query && <button type="button" className="kk-search__clear" onClick={() => setQuery('')} aria-label={L('検索をクリア', '清除搜尋', 'Clear search')}>×</button>}
      </div>
      <div className="kk-wiki__chips" role="group" aria-label={L('種類', '種類', 'Type')}>
        <button type="button" className={`kk-chip${!type ? ' is-active' : ''}`} aria-pressed={!type} onClick={() => setType(null)}>{L('すべて', '全部', 'All')}</button>
        {TYPES.map(t => (
          <button key={t} type="button" className={`kk-chip${type === t ? ' is-active' : ''}`} aria-pressed={type === t} onClick={() => setType(type === t ? null : t)}>{t}</button>
        ))}
      </div>

      {browsing && recorded.length > 0 && (
        <>
          <h2 className="kk-wiki__sec">{L('公開酒札にある酒', '公開酒札裡的酒', 'From public tags')}<small>{recorded.length}</small></h2>
          <ul className="kk-shelf">
            {recordedShown.map(({ cover: e, count }) => (
              <li key={e.id}>
                <button type="button" className="kk-shelf__item" onClick={() => navigate(`/journal/${e.id}`)}>
                  <span className="kk-shelf__bottle" aria-hidden="true">
                    <SakeBottleCrop imageUrl={isGuest ? null : (e.thumb_url || e.photo_url)} crop={e.photo_crop} height="72px" />
                  </span>
                  <span className="kk-shelf__main">
                    <span className="kk-shelf__title">{[e.brand, e.name].filter(Boolean).join(' ')}</span>
                    <span className="kk-shelf__meta">{[e.brewery, shortRegion(e.region)].filter(Boolean).join(' · ')}</span>
                    <span className="kk-shelf__hint">{L(`みんなの瓶身 ${count}`, `大家的瓶身 ${count}`, `${count} bottle${count > 1 ? 's' : ''}`)}</span>
                  </span>
                  <span className="kk-shelf__chev" aria-hidden="true">›</span>
                </button>
              </li>
            ))}
          </ul>
          {recorded.length > 5 && (
            <button type="button" className="kk-btn kk-btn--block kk-wiki__more" onClick={() => setShowAllRecorded(v => !v)} aria-expanded={showAllRecorded}>
              {showAllRecorded ? L('閉じる', '收起', 'Show less') : L(`ほか ${recorded.length - 5} 件を見る`, `再看 ${recorded.length - 5} 款`, `${recorded.length - 5} more`)}
            </button>
          )}
        </>
      )}

      <h2 className="kk-wiki__sec">
        {browsing ? L('酒款カタログ', '酒款目錄', 'Catalog') : L('検索結果', '搜尋結果', 'Results')}
        {total != null && <small>{L(`${total} 件`, `${total} 款`, `${total}`)}</small>}
      </h2>
      {rows.length > 0 && (
        <ul className="kk-shelf" aria-busy={loading}>
          {rows.map(p => {
            const m = matchesFor(p)
            const cover = m.find(e => e.thumb_url || e.photo_url)
            return (
              <li key={p.id}>
                <button type="button" className="kk-shelf__item" onClick={() => navigate(`/wiki/sake/${p.id}`)}>
                  <span className="kk-shelf__bottle" aria-hidden="true">
                    <SakeBottleCrop imageUrl={isGuest || !cover ? null : (cover.thumb_url || cover.photo_url)} crop={cover?.photo_crop} height="72px" />
                  </span>
                  <span className="kk-shelf__main">
                    <span className="kk-shelf__title">{p.name}</span>
                    <span className="kk-shelf__meta">{[p.brewery_name, shortRegion(p.region), p.type, p.polishing && L(`精米${p.polishing}%`, `精米${p.polishing}%`, `${p.polishing}% polish`)].filter(Boolean).join(' · ')}</span>
                    {m.length > 0 && <span className="kk-shelf__hint">{L(`みんなの瓶身 ${m.length}`, `大家的瓶身 ${m.length}`, `${m.length} bottle${m.length > 1 ? 's' : ''}`)}</span>}
                  </span>
                  <span className="kk-shelf__chev" aria-hidden="true">›</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {loading && rows.length === 0 && (
        <div className="kk-skeleton" aria-hidden="true">{[0, 1, 2].map(i => <div key={i} className="kk-skeleton__row"><span /><span /><span /></div>)}</div>
      )}
      {!loading && rows.length === 0 && (
        <div className="kk-empty kk-empty--quiet"><strong>{L('見つかりませんでした', '找不到結果', 'Nothing found')}</strong></div>
      )}
      {total != null && rows.length < total && !loading && (
        <button type="button" className="kk-btn kk-btn--block kk-wiki__more" onClick={() => { pageRef.current += 1; fetchPage(pageRef.current, false) }}>
          {L('もっと見る', '載入更多', 'Show more')}
        </button>
      )}
    </div>
  )
}
