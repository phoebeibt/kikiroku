import { useEffect, useId, useMemo, useState } from 'react'
import Sheet from '../../components/ui/Sheet'
import Stars from '../../components/Stars'
import { formatRating } from '../../lib/rating'
import { pressable } from '../../lib/a11y'
import { matchEntry, splitTerms } from '../../lib/ledgerSearch'
import { useTags } from '../../contexts/TagsContext'
import { cleanLabel } from '../../lib/labels'
import './ledger.css'

const REPEAT_TAGS = ['repeat', 'bottle-worthy', 'osusume']
const THIS_YEAR = String(new Date().getFullYear())
const EMPTY_FILTERS = { status: 'all', rating: 'any', period: 'all', types: [], flavors: [], regions: [] }
const VIEW_KEY = 'kk_ledger_density'
const SORT_KEY = 'kk_ledger_sort'

const readPref = (k, fallback) => { try { return localStorage.getItem(k) || fallback } catch { return fallback } }
const writePref = (k, v) => { try { localStorage.setItem(k, v) } catch { /* storage blocked */ } }

function passes(e, f, ignore) {
  if (ignore !== 'status') {
    if (f.status === 'draft' && e.status !== 'draft') return false
    if (f.status === 'public' && !(e.is_public && e.status !== 'draft')) return false
    if (f.status === 'private' && (e.is_public || e.status === 'draft')) return false
  }
  if (ignore !== 'rating') {
    const r = Number(e.rating) || 0
    if (f.rating === '4.5' && r < 4.5) return false
    if (f.rating === '4' && r < 4) return false
    if (f.rating === '3' && r < 3) return false
    if (f.rating === 'none' && r > 0) return false
  }
  if (ignore !== 'period') {
    const d = e.tasted_at || ''
    if (f.period === 'year' && !d.startsWith(THIS_YEAR)) return false
    if (f.period === '90d' && d < new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10)) return false
  }
  if (ignore !== 'types' && f.types.length && !f.types.includes(e.type)) return false
  if (ignore !== 'regions' && f.regions.length && !f.regions.includes(e.region)) return false
  if (ignore !== 'flavors' && f.flavors.length) {
    const own = new Set([...(e.aroma_tags || []), ...(e.taste_tags || [])])
    if (!f.flavors.some(id => own.has(id))) return false
  }
  return true
}

const SORTS = {
  recent: (a, b) => (b.tasted_at || '').localeCompare(a.tasted_at || '') || (b.created_at || '').localeCompare(a.created_at || ''),
  rating: (a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0) || SORTS.recent(a, b),
  oldest: (a, b) => (a.tasted_at || '').localeCompare(b.tasted_at || ''),
  brewery: (a, b) => (a.brewery || '￿').localeCompare(b.brewery || '￿', 'ja'),
}

export default function Ledger({ entries, loading, lang, tagLabel: rawTagLabel, typeLabel: rawTypeLabel, brandMap, onOpen, onAdd, hasDraft, wishCount, onShowWishlist }) {
  const L = (ja, zh, en) => (lang === 'ja' ? ja : lang === 'zh' ? zh : en)
  const tagLabel = (id, cat) => cleanLabel(rawTagLabel(id, cat))
  const typeLabel = id => cleanLabel(rawTypeLabel(id))
  const allTags = useTags()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [collection, setCollection] = useState(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS)
  const [density, setDensity] = useState(() => readPref(VIEW_KEY, 'card'))
  const [sort, setSort] = useState(() => readPref(SORT_KEY, 'recent'))

  useEffect(() => { writePref(VIEW_KEY, density) }, [density])
  useEffect(() => { writePref(SORT_KEY, sort) }, [sort])

  const tagIndex = useMemo(() => {
    const m = {}
    for (const [cat, list] of Object.entries(allTags || {})) for (const tg of list) m[`${cat}:${tg.id}`] = tg
    return m
  }, [allTags])

  const ctx = useMemo(() => ({
    tagNames: (id, cat) => { const tg = tagIndex[`${cat}:${id}`]; return tg ? [tg.ja, tg.zh, tg.en] : [] },
    tagLabel: (id, cat) => (cat === 'type' ? typeLabel(id) : tagLabel(id, cat)),
    readings: e => { const r = brandMap[e.brand]; return r ? [r.furigana, r.romaji] : [] },
  }), [tagIndex, rawTagLabel, rawTypeLabel, brandMap]) // eslint-disable-line react-hooks/exhaustive-deps

  const finished = entries.filter(e => e.status !== 'draft')

  // ── Stats ──
  const rated = finished.filter(e => Number(e.rating) > 0)
  const avg = rated.length ? rated.reduce((s, e) => s + Number(e.rating), 0) / rated.length : null
  const regionCounts = {}
  finished.forEach(e => { if (e.region) regionCounts[e.region] = (regionCounts[e.region] || 0) + 1 })
  const topRegion = Object.keys(regionCounts).sort((a, b) => regionCounts[b] - regionCounts[a])[0]
  const shortRegion = r => (r || '').replace(/[都道府県]$/, '') || r

  // ── Collections (quick shelves) ──
  const collections = [
    { id: 'repeat', title: L('また飲みたい', '想再喝', 'Drink again'), note: L('リピート・おすすめ', '回購・推薦', 'Buy again · recommend'), test: e => e.tags?.some(x => REPEAT_TAGS.includes(x)) },
    { id: 'treasure', title: L('4.5以上', '4.5 以上', '4.5 and up'), note: L('宝物札', '珍藏', 'Treasures'), test: e => Number(e.rating) >= 4.5 },
    topRegion && { id: 'region', title: L(`${shortRegion(topRegion)}の酒`, `${shortRegion(topRegion)}的酒`, `From ${shortRegion(topRegion)}`), note: L('最多産地', '最多產地', 'Top region'), test: e => e.region === topRegion },
    { id: 'draft', title: L('下書き', '草稿', 'Drafts'), note: L('補完待ち', '待補完', 'To finish'), test: e => e.status === 'draft', includeDrafts: true },
  ].filter(Boolean).map(c => ({ ...c, count: entries.filter(e => (c.includeDrafts || e.status !== 'draft') && c.test(e)).length }))
  const activeCollection = collections.find(c => c.id === collection)

  // ── Results ──
  const terms = splitTerms(query)
  const results = useMemo(() => {
    const rows = []
    for (const e of entries) {
      if (activeCollection) {
        if (!activeCollection.test(e)) continue
      }
      if (!passes(e, filters)) continue
      const hits = matchEntry(e, terms, ctx)
      if (!hits) continue
      rows.push({ e, hits })
    }
    rows.sort((a, b) => SORTS[sort](a.e, b.e))
    return rows
  }, [entries, activeCollection, filters, terms.join(' '), ctx, sort]) // eslint-disable-line react-hooks/exhaustive-deps

  const activeFilterCount = (filters.status !== 'all') + (filters.rating !== 'any') + (filters.period !== 'all') + filters.types.length + filters.flavors.length + filters.regions.length
  const anyNarrowing = !!(terms.length || activeFilterCount || activeCollection)

  // Filter-sheet options come from the user's own records, so nothing leads to zero.
  const options = useMemo(() => {
    const count = (fn) => { const m = {}; entries.forEach(e => fn(e).forEach(k => { if (k) m[k] = (m[k] || 0) + 1 })); return m }
    const types = count(e => [e.type])
    const regions = count(e => [e.region])
    const flavors = count(e => [...(e.aroma_tags || []), ...(e.taste_tags || [])])
    const top = (m, n) => Object.keys(m).sort((a, b) => m[b] - m[a]).slice(0, n)
    return { types: top(types, 10), regions: top(regions, 12), flavors: top(flavors, 14) }
  }, [entries])
  const sheetCount = entries.filter(e => (!activeCollection || activeCollection.test(e)) && passes(e, draftFilters) && matchEntry(e, terms, ctx)).length

  const openSheet = () => { setDraftFilters(filters); setSheetOpen(true) }
  const toggleIn = (key, v) => setDraftFilters(f => ({ ...f, [key]: f[key].includes(v) ? f[key].filter(x => x !== v) : [...f[key], v] }))
  const setOne = (key, v) => setDraftFilters(f => ({ ...f, [key]: f[key] === v ? EMPTY_FILTERS[key] : v }))
  const clearAll = () => { setQuery(''); setFilters(EMPTY_FILTERS); setCollection(null) }

  const flavorLabel = id => tagIndex[`aroma:${id}`] ? tagLabel(id, 'aroma') : tagLabel(id, 'taste')
  const statusLabels = { all: L('すべて', '全部', 'All'), private: L('非公開', '不公開', 'Private'), public: L('公開中', '公開中', 'Shared'), draft: L('下書き', '草稿', 'Drafts') }
  const ratingLabels = { any: L('指定なし', '不限', 'Any'), '4.5': L('4.5以上', '4.5 以上', '4.5+'), '4': L('4.0以上', '4.0 以上', '4.0+'), '3': L('3.0以上', '3.0 以上', '3.0+'), none: L('未評価', '未評分', 'Unrated') }
  const periodLabels = { all: L('全期間', '全部時間', 'Any time'), year: L('今年', '今年', 'This year'), '90d': L('最近90日', '最近 90 天', 'Last 90 days') }
  const sortLabels = { recent: L('新しい順', '最新', 'Newest'), rating: L('評価が高い順', '評分高到低', 'Highest rated'), oldest: L('古い順', '最舊', 'Oldest'), brewery: L('酒造名順', '酒造名', 'Brewery A–Z') }
  const fieldLabels = {
    brewery: L('酒造', '酒造', 'Brewery'), region: L('産地', '產地', 'Region'), type: L('種類', '種類', 'Type'),
    aroma: L('香り', '香氣', 'Aroma'), taste: L('味わい', '味道', 'Taste'), tags: L('整理', '整理', 'Label'),
    method: L('製法', '製法', 'Method'), rice: L('原料米', '原料米', 'Rice'), yeast: L('酵母', '酵母', 'Yeast'), notes: L('メモ', '筆記', 'Notes'),
  }

  // Removable chips for everything currently narrowing the shelf.
  const activeChips = [
    activeCollection && { key: 'col', label: activeCollection.title, clear: () => setCollection(null) },
    filters.status !== 'all' && { key: 'st', label: statusLabels[filters.status], clear: () => setFilters(f => ({ ...f, status: 'all' })) },
    filters.rating !== 'any' && { key: 'ra', label: ratingLabels[filters.rating], clear: () => setFilters(f => ({ ...f, rating: 'any' })) },
    filters.period !== 'all' && { key: 'pe', label: periodLabels[filters.period], clear: () => setFilters(f => ({ ...f, period: 'all' })) },
    ...filters.types.map(v => ({ key: 'ty' + v, label: typeLabel(v), clear: () => setFilters(f => ({ ...f, types: f.types.filter(x => x !== v) })) })),
    ...filters.flavors.map(v => ({ key: 'fl' + v, label: flavorLabel(v), clear: () => setFilters(f => ({ ...f, flavors: f.flavors.filter(x => x !== v) })) })),
    ...filters.regions.map(v => ({ key: 're' + v, label: v, clear: () => setFilters(f => ({ ...f, regions: f.regions.filter(x => x !== v) })) })),
  ].filter(Boolean)

  const titleOf = e => [e.brand, e.name].filter(Boolean).join(' ') || L('名前のない下書き', '未命名草稿', 'Untitled draft')
  const open = e => onOpen(e)

  return (
    <div className="kk-ledger">
      <div className="kk-ledger__head">
        <h1 className="kk-ledger__title">{L('マイ帳', '我的酒帳', 'My Ledger')}</h1>
        <div className="kk-ledger__head-actions">
          {wishCount > 0 && (
            <button type="button" className="kk-btn kk-btn--sm" onClick={onShowWishlist}>
              {L('飲みたい', '想喝', 'Wish list')} <span className="kk-ledger__badge">{wishCount}</span>
            </button>
          )}
          <button type="button" className="kk-icon-btn kk-ledger__filter-btn" onClick={openSheet}
            aria-label={L('絞り込み', '篩選', 'Filter') + (activeFilterCount ? ` (${activeFilterCount})` : '')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
            {activeFilterCount > 0 && <span className="kk-ledger__dot" aria-hidden="true">{activeFilterCount}</span>}
          </button>
        </div>
      </div>

      {finished.length > 0 && (
        <dl className="kk-stats">
          <div className="kk-stat"><dt>{L('記録', '記錄', 'Records')}</dt><dd>{finished.length}</dd></div>
          <div className="kk-stat"><dt>{L('平均評価', '平均評分', 'Avg rating')}</dt><dd>{avg ? formatRating(avg) : '—'}</dd></div>
          <div className="kk-stat"><dt>{L('公開中', '公開中', 'Shared')}</dt><dd>{finished.filter(e => e.is_public).length}</dd></div>
          <div className="kk-stat"><dt>{L('最多産地', '最多產地', 'Top region')}</dt><dd>{topRegion ? shortRegion(topRegion) : '—'}</dd></div>
        </dl>
      )}

      <div className="kk-search" role="search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        <input type="search" value={query} onChange={e => setQuery(e.target.value)}
          placeholder={L('酒名・酒造・産地・香り・メモまで検索', '搜尋酒名、酒造、產地、香氣、筆記', 'Search name, brewery, region, aroma, notes')}
          aria-label={L('マイ帳を検索', '搜尋酒帳', 'Search your ledger')} />
        {query && <button type="button" className="kk-search__clear" onClick={() => setQuery('')} aria-label={L('検索をクリア', '清除搜尋', 'Clear search')}>×</button>}
      </div>

      {!anyNarrowing && finished.length > 0 && (
        <div className="kk-collections" aria-label={L('よく戻る酒札', '常用集合', 'Shelves')}>
          {collections.filter(c => c.count > 0).slice(0, 4).map(c => (
            <button key={c.id} type="button" className="kk-collection" onClick={() => setCollection(c.id)}>
              <strong>{c.title}</strong>
              <span>{c.count}{L('件', ' 筆', '')} · {c.note}</span>
            </button>
          ))}
        </div>
      )}

      {hasDraft && !anyNarrowing && (
        <button type="button" className="kk-resume" onClick={onAdd}>
          <span className="kk-note-card__mark" aria-hidden="true">札</span>
          <span><strong>{L('書きかけの記録があります', '有寫到一半的記錄', 'You have an unfinished record')}</strong>
            <span className="kk-helper">{L('タップして続きを書く', '點一下繼續', 'Tap to continue')}</span></span>
        </button>
      )}

      {activeChips.length > 0 && (
        <div className="kk-active-chips">
          {activeChips.map(c => (
            <button key={c.key} type="button" className="kk-chip is-active" onClick={c.clear} aria-label={`${c.label} — ${L('解除', '移除', 'Remove')}`}>
              {c.label} <span aria-hidden="true">×</span>
            </button>
          ))}
          <button type="button" className="kk-btn kk-btn--ghost kk-btn--sm" onClick={clearAll}>{L('すべて解除', '全部清除', 'Clear all')}</button>
        </div>
      )}

      <div className="kk-result-bar">
        <div className="kk-result-bar__title">
          <strong>{activeCollection ? activeCollection.title : L('酒札棚', '酒札架', 'Shelf')}</strong>
          <span aria-live="polite">{results.length}{L('件', ' 筆', ' records')} · {sortLabels[sort]}</span>
        </div>
        <div className="kk-result-bar__controls">
          <label className="visually-hidden" htmlFor="kk-sort">{L('並び順', '排序', 'Sort')}</label>
          <select id="kk-sort" className="kk-sort" value={sort} onChange={e => setSort(e.target.value)}>
            {Object.entries(sortLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <div className="kk-density" role="radiogroup" aria-label={L('表示密度', '顯示密度', 'Density')}>
            {[['card', L('札', '卡', 'Cards')], ['table', L('表', '表', 'List')]].map(([k, label]) => (
              <button key={k} type="button" role="radio" aria-checked={density === k} className={density === k ? 'is-active' : ''} onClick={() => setDensity(k)}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="kk-skeleton" aria-hidden="true">{[0, 1, 2].map(i => <div key={i} className="kk-skeleton__row"><span /><span /><span /></div>)}</div>
      ) : entries.length === 0 ? (
        <div className="kk-empty">
          <img src="/icon-192.png" alt="" width="64" height="64" />
          <strong>{L('まだ酒札がありません', '還沒有酒札', 'No sake tags yet')}</strong>
          <span>{L('最初の一本を残しましょう', '記下第一瓶吧', 'Record your first bottle')}</span>
          <button type="button" className="kk-btn kk-btn--primary" onClick={onAdd}>{L('記録する', '開始記錄', 'Add a record')}</button>
        </div>
      ) : results.length === 0 ? (
        <div className="kk-empty kk-empty--quiet">
          <strong>{L('条件に合う酒札はありません', '沒有符合條件的酒札', 'Nothing matches')}</strong>
          <button type="button" className="kk-btn kk-btn--sm" onClick={clearAll}>{L('条件をクリア', '清除條件', 'Clear filters')}</button>
        </div>
      ) : (
        <ul className={`kk-shelf kk-shelf--${density}`}>
          {results.map(({ e, hits }) => {
            const isDraft = e.status === 'draft'
            const status = isDraft
              ? <span className="kk-status kk-status--draft">{statusLabels.draft}</span>
              : e.is_public ? <span className="kk-status kk-status--public">{statusLabels.public}</span> : <span className="kk-status">{statusLabels.private}</span>
            const hitLine = hits.length > 0 && (
              <p className="kk-hit">{hits.slice(0, 2).map(h => `${fieldLabels[h.field]}${L('に', '：', ': ')}「${h.value}」`).join(' / ')}</p>
            )
            const meta = [e.brewery, shortRegion(e.region), e.tasted_at?.replaceAll('-', '.')].filter(Boolean).join(' · ')
            return (
              <li key={e.id}>
                {density === 'table' ? (
                  <div className="kk-row" {...pressable(() => open(e), titleOf(e))}>
                    <div className="kk-row__line">
                      <strong>{titleOf(e)}</strong>
                      {Number(e.rating) > 0 && <span className="kk-row__score">{formatRating(e.rating)}</span>}
                    </div>
                    <div className="kk-row__meta">{meta} {status}</div>
                    {hitLine}
                  </div>
                ) : (
                  <div className={`kk-card${isDraft ? ' is-draft' : ''}`} {...pressable(() => open(e), titleOf(e))}>
                    <div className="kk-card__photo">
                      {e.photo_url ? <img src={e.photo_url} alt="" loading="lazy" /> : <span aria-hidden="true">{(e.brand || e.name || '札').slice(0, 2)}</span>}
                    </div>
                    <div className="kk-card__body">
                      {e.type && <span className="kk-card__type">{typeLabel(e.type)}</span>}
                      <strong className="kk-card__title">{titleOf(e)}</strong>
                      {meta && <span className="kk-card__meta">{meta}</span>}
                      <span className="kk-card__rating">
                        {Number(e.rating) > 0 && <Stars rating={e.rating} size={11} showNumber />}
                        {status}
                      </span>
                      {(e.aroma_tags?.length || e.taste_tags?.length) ? (
                        <span className="kk-card__tags">
                          {[...(e.aroma_tags || []).map(id => tagLabel(id, 'aroma')), ...(e.taste_tags || []).map(id => tagLabel(id, 'taste'))].slice(0, 3).map(x => <span key={x}>{x}</span>)}
                        </span>
                      ) : null}
                      {hitLine}
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={L('絞り込み', '篩選', 'Filter')} className="kk-panel--fit"
        closeLabel={L('閉じる', '關閉', 'Close')}
        footer={<>
          <button type="button" className="kk-btn" onClick={() => setDraftFilters(EMPTY_FILTERS)}>{L('クリア', '清除', 'Clear')}</button>
          <button type="button" className="kk-btn kk-btn--primary" onClick={() => { setFilters(draftFilters); setSheetOpen(false) }}>
            {L(`${sheetCount}件を表示`, `顯示 ${sheetCount} 筆`, `Show ${sheetCount}`)}
          </button>
        </>}
      >
        <FilterGroup label={L('状態', '狀態', 'Status')}>
          {Object.entries(statusLabels).map(([k, v]) => (
            <Opt key={k} on={draftFilters.status === k} onClick={() => setDraftFilters(f => ({ ...f, status: k }))}>{v}</Opt>
          ))}
        </FilterGroup>
        <FilterGroup label={L('評価', '評分', 'Rating')}>
          {Object.entries(ratingLabels).filter(([k]) => k !== 'any').map(([k, v]) => <Opt key={k} on={draftFilters.rating === k} onClick={() => setOne('rating', k)}>{v}</Opt>)}
        </FilterGroup>
        <FilterGroup label={L('時期', '時間', 'When')}>
          {Object.entries(periodLabels).filter(([k]) => k !== 'all').map(([k, v]) => <Opt key={k} on={draftFilters.period === k} onClick={() => setOne('period', k)}>{v}</Opt>)}
        </FilterGroup>
        {options.flavors.length > 0 && (
          <FilterGroup label={L('香り・味わい', '香氣・味道', 'Aroma & taste')} wrap>
            {options.flavors.map(id => <Opt key={id} on={draftFilters.flavors.includes(id)} onClick={() => toggleIn('flavors', id)}>{flavorLabel(id)}</Opt>)}
          </FilterGroup>
        )}
        {options.types.length > 0 && (
          <FilterGroup label={L('種類', '種類', 'Type')} wrap>
            {options.types.map(id => <Opt key={id} on={draftFilters.types.includes(id)} onClick={() => toggleIn('types', id)}>{typeLabel(id)}</Opt>)}
          </FilterGroup>
        )}
        {options.regions.length > 0 && (
          <FilterGroup label={L('産地', '產地', 'Region')} wrap>
            {options.regions.map(r => <Opt key={r} on={draftFilters.regions.includes(r)} onClick={() => toggleIn('regions', r)}>{shortRegion(r)}</Opt>)}
          </FilterGroup>
        )}
      </Sheet>
    </div>
  )
}

function FilterGroup({ label, children, wrap }) {
  const id = useId()
  return (
    <div className="kk-fgroup" role="group" aria-labelledby={id}>
      <h3 className="kk-fgroup__label" id={id}>{label}</h3>
      <div className={wrap ? 'kk-fgroup__wrap' : 'kk-fgroup__grid'}>{children}</div>
    </div>
  )
}

function Opt({ on, onClick, children }) {
  return <button type="button" className={`kk-fopt${on ? ' is-active' : ''}`} aria-pressed={on} onClick={onClick}>{children}</button>
}
