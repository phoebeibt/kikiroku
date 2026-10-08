import { useEffect, useId, useMemo, useState } from 'react'
import Sheet from '../../components/ui/Sheet'
import Stars from '../../components/Stars'
import SakeBottleCrop from '../../components/bottle/SakeBottleCrop'
import { formatRating } from '../../lib/rating'
import { pressable } from '../../lib/a11y'
import { matchEntry, splitTerms } from '../../lib/ledgerSearch'
import { useTags } from '../../contexts/TagsContext'
import { useLang } from '../../contexts/LangContext'
import { cleanLabel } from '../../lib/labels'
import { Link } from 'react-router-dom'
import { isPrefecture, normalizeRegion, regionPath } from '../../lib/region'
import './ledger.css'

const REPEAT_TAGS = ['repeat', 'bottle-worthy', 'osusume']
const RECENT_COUNT = 10
const DRAFTS_PREVIEW = 3
const THIS_YEAR = String(new Date().getFullYear())
const EMPTY_FILTERS = { status: 'all', rating: 'any', period: 'all', from: '', to: '', flavors: [], regions: [], breweries: [] }
const VIEW_KEY = 'kk_ledger_density'
const SORT_KEY = 'kk_ledger_sort'

const readPref = (k, fallback) => { try { return localStorage.getItem(k) || fallback } catch { return fallback } }
const writePref = (k, v) => { try { localStorage.setItem(k, v) } catch { /* storage blocked */ } }
const daysAgo = n => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10)
const isPhotoOnlyDraft = e => e.status === 'draft' && !!(e.photo_url || e.photo_url2) && !(e.brand || '').trim() && !(e.name || '').trim()

function passes(e, f) {
  if (f.status === 'public' && !e.is_public) return false
  if (f.status === 'private' && e.is_public) return false
  const r = Number(e.rating) || 0
  if (f.rating === '4.5' && r < 4.5) return false
  if (f.rating === '4' && r < 4) return false
  if (f.rating === 'none' && r > 0) return false
  const d = e.tasted_at || ''
  if (f.period === '30d' && d < daysAgo(30)) return false
  if (f.period === 'year' && !d.startsWith(THIS_YEAR)) return false
  if (f.period === 'range' && ((f.from && d < f.from) || (f.to && d > f.to))) return false
  if (f.regions.length && !f.regions.includes(normalizeRegion(e.region))) return false
  if (f.breweries?.length && !f.breweries.includes(e.brewery)) return false
  if (f.flavors.length) {
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

export default function Ledger({ initialRegion, initialBrewery, initialView, entries, loading, tagLabel: rawTagLabel, typeLabel: rawTypeLabel, brandMap, onOpen, onAdd, hasDraft, wishCount, onShowWishlist }) {
  const { lang } = useLang()
  const L = (ja, zh, en) => (lang === 'ja' ? ja : lang === 'zh' ? zh : en)
  const tagLabel = (id, cat) => cleanLabel(rawTagLabel(id, cat))
  const allTags = useTags()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [collection, setCollection] = useState(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS)
  const [density, setDensity] = useState(() => readPref(VIEW_KEY, 'card'))
  const [sort, setSort] = useState(() => readPref(SORT_KEY, 'recent'))
  const [draftsOpen, setDraftsOpen] = useState(false)

  // Arriving from a detail page's 産地 link narrows the shelf to that region.
  useEffect(() => {
    if (initialRegion) setFilters({ ...EMPTY_FILTERS, regions: [normalizeRegion(initialRegion)] }) // eslint-disable-line react-hooks/set-state-in-effect
  }, [initialRegion])
  // Arriving from プロフ's numbers: a quick shelf, the private filter, or the unfinished list.
  useEffect(() => {
    if (!initialView) return
    /* eslint-disable react-hooks/set-state-in-effect */
    setQuery('')
    if (initialView.kind === 'collection') { setFilters(EMPTY_FILTERS); setCollection(initialView.value) }
    if (initialView.kind === 'private') { setCollection(null); setFilters({ ...EMPTY_FILTERS, status: 'private' }) }
    if (initialView.kind === 'drafts') {
      setCollection(null); setFilters(EMPTY_FILTERS); setDraftsOpen(true)
      requestAnimationFrame(() => document.getElementById('kk-drafts-title')?.scrollIntoView({ block: 'start' }))
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [initialView])

  // Arriving from 事典 › 酒造の詳細 narrows the shelf to exactly that brewery.
  useEffect(() => {
    if (initialBrewery?.name) setFilters({ ...EMPTY_FILTERS, breweries: [initialBrewery.name] }) // eslint-disable-line react-hooks/set-state-in-effect
  }, [initialBrewery])

  useEffect(() => { writePref(VIEW_KEY, density) }, [density])
  useEffect(() => { writePref(SORT_KEY, sort) }, [sort])

  const tagIndex = useMemo(() => {
    const m = {}
    for (const [cat, list] of Object.entries(allTags || {})) for (const tg of list) m[`${cat}:${tg.id}`] = tg
    return m
  }, [allTags])

  const ctx = useMemo(() => ({
    tagNames: (id, cat) => { const tg = tagIndex[`${cat}:${id}`]; return tg ? [tg.ja, tg.zh, tg.en] : [] },
    tagLabel: (id, cat) => cleanLabel(cat === 'type' ? rawTypeLabel(id) : rawTagLabel(id, cat)),
    readings: e => { const r = brandMap[e.brand]; return r ? [r.furigana, r.romaji] : [] },
  }), [tagIndex, rawTagLabel, rawTypeLabel, brandMap])

  // Drafts live in their own 書きかけ block; the shelf holds finished 酒札.
  const finished = useMemo(() => entries.filter(e => e.status !== 'draft'), [entries])
  const drafts = useMemo(() => entries.filter(e => e.status === 'draft').sort((a, b) => (b.updated_at || b.created_at || '').localeCompare(a.updated_at || a.created_at || '')), [entries])

  // ── Stats ──
  const rated = finished.filter(e => Number(e.rating) > 0)
  const avg = rated.length ? rated.reduce((s, e) => s + Number(e.rating), 0) / rated.length : null
  const breweryCounts = {}
  finished.forEach(e => { if (e.brewery) breweryCounts[e.brewery] = (breweryCounts[e.brewery] || 0) + 1 })
  const topBrewery = Object.keys(breweryCounts).sort((a, b) => breweryCounts[b] - breweryCounts[a])[0]
  const shortRegion = r => (r || '').replace(/[都道府県]$/, '') || r

  // ── Quick shelves ──
  const recentIds = useMemo(() => new Set([...finished].sort(SORTS.recent).slice(0, RECENT_COUNT).map(e => e.id)), [finished])
  const collections = [
    { id: 'repeat', title: L('また飲みたい', '想再喝', 'Drink again'), note: L('リピート・おすすめ', '回購・推薦', 'Buy again'), pool: finished, test: e => e.tags?.some(x => REPEAT_TAGS.includes(x)) },
    { id: 'treasure', title: L('4.5以上', '4.5 以上', '4.5 and up'), note: L('宝物札', '珍藏', 'Treasures'), pool: finished, test: e => Number(e.rating) >= 4.5 },
    { id: 'photo', title: L('写真だけ', '只有照片', 'Photo only'), note: L('酒名を補完', '待補酒名', 'Needs a name'), pool: drafts, test: isPhotoOnlyDraft },
    { id: 'recent', title: L('最近飲んだ', '最近喝的', 'Recently tasted'), note: L(`直近${RECENT_COUNT}件`, `最近 ${RECENT_COUNT} 筆`, `Last ${RECENT_COUNT}`), pool: finished, test: e => recentIds.has(e.id) },
  ].map(c => ({ ...c, count: c.pool.filter(c.test).length }))
  const activeCollection = collections.find(c => c.id === collection)

  // ── Results ──
  const terms = splitTerms(query)
  const termsKey = terms.join(' ')
  const results = useMemo(() => {
    const pool = activeCollection ? activeCollection.pool.filter(activeCollection.test) : finished
    const rows = []
    for (const e of pool) {
      if (!passes(e, filters)) continue
      const hits = matchEntry(e, terms, ctx)
      if (hits) rows.push({ e, hits })
    }
    return rows.sort((a, b) => SORTS[sort](a.e, b.e))
  }, [finished, activeCollection?.id, filters, termsKey, ctx, sort]) // eslint-disable-line react-hooks/exhaustive-deps

  const activeFilterCount = (filters.status !== 'all') + (filters.rating !== 'any') + (filters.period !== 'all') + filters.flavors.length + filters.regions.length + filters.breweries.length
  const anyNarrowing = !!(terms.length || activeFilterCount || activeCollection)

  // Filter options come from the user's own records, so no choice leads to an empty shelf.
  const options = useMemo(() => {
    const count = fn => { const m = {}; finished.forEach(e => fn(e).forEach(k => { if (k) m[k] = (m[k] || 0) + 1 })); return m }
    const top = (m, n) => Object.keys(m).sort((a, b) => m[b] - m[a]).slice(0, n)
    return {
      regions: top(count(e => [normalizeRegion(e.region)]), 12),
      breweries: top(count(e => [e.brewery]), 12),
      flavors: top(count(e => [...(e.aroma_tags || []), ...(e.taste_tags || [])]), 14),
    }
  }, [finished])
  const sheetPool = activeCollection ? activeCollection.pool.filter(activeCollection.test) : finished
  const sheetCount = sheetPool.filter(e => passes(e, draftFilters) && matchEntry(e, terms, ctx)).length

  const openSheet = () => { setDraftFilters(filters); setSheetOpen(true) }
  const toggleIn = (key, v) => setDraftFilters(f => ({ ...f, [key]: f[key].includes(v) ? f[key].filter(x => x !== v) : [...f[key], v] }))
  const setOne = (key, v) => setDraftFilters(f => ({ ...f, [key]: f[key] === v ? EMPTY_FILTERS[key] : v }))
  const clearAll = () => { setQuery(''); setFilters(EMPTY_FILTERS); setCollection(null) }

  const flavorLabel = id => tagIndex[`aroma:${id}`] ? tagLabel(id, 'aroma') : tagLabel(id, 'taste')
  const statusLabels = { all: L('すべて', '全部', 'All'), private: L('非公開', '不公開', 'Private'), public: L('公開中', '公開中', 'Shared') }
  const ratingLabels = { '4.5': L('4.5以上', '4.5 以上', '4.5+'), '4': L('4.0以上', '4.0 以上', '4.0+'), none: L('未評価', '未評分', 'Unrated') }
  const periodLabels = { '30d': L('最近30日', '最近 30 天', 'Last 30 days'), year: L('今年', '今年', 'This year'), range: L('期間指定', '指定期間', 'Date range') }
  const sortLabels = { recent: L('新しい順', '最新', 'Newest'), rating: L('評価が高い順', '評分高到低', 'Highest rated'), oldest: L('古い順', '最舊', 'Oldest'), brewery: L('酒造名順', '酒造名', 'Brewery A–Z') }
  const fieldLabels = {
    brewery: L('酒造', '酒造', 'Brewery'), region: L('産地', '產地', 'Region'), type: L('種類', '種類', 'Type'),
    aroma: L('香り', '香氣', 'Aroma'), taste: L('味わい', '味道', 'Taste'), tags: L('タグ', '標籤', 'Tag'),
    method: L('製法', '製法', 'Method'), rice: L('原料米', '原料米', 'Rice'), yeast: L('酵母', '酵母', 'Yeast'), notes: L('メモ', '筆記', 'Notes'),
  }
  const rangeLabel = f => [f.from, f.to].map(d => d?.replaceAll('-', '.') || '…').join(' – ')

  const activeChips = [
    activeCollection && { key: 'col', label: activeCollection.title, clear: () => setCollection(null) },
    filters.status !== 'all' && { key: 'st', label: statusLabels[filters.status], clear: () => setFilters(f => ({ ...f, status: 'all' })) },
    filters.rating !== 'any' && { key: 'ra', label: ratingLabels[filters.rating], clear: () => setFilters(f => ({ ...f, rating: 'any' })) },
    filters.period !== 'all' && { key: 'pe', label: filters.period === 'range' ? rangeLabel(filters) : periodLabels[filters.period], clear: () => setFilters(f => ({ ...f, period: 'all', from: '', to: '' })) },
    ...filters.regions.map(v => ({ key: 're' + v, label: shortRegion(v), clear: () => setFilters(f => ({ ...f, regions: f.regions.filter(x => x !== v) })) })),
    ...filters.breweries.map(v => ({ key: 'br' + v, label: v, clear: () => setFilters(f => ({ ...f, breweries: f.breweries.filter(x => x !== v) })) })),
    ...filters.flavors.map(v => ({ key: 'fl' + v, label: flavorLabel(v), clear: () => setFilters(f => ({ ...f, flavors: f.flavors.filter(x => x !== v) })) })),
  ].filter(Boolean)

  const titleOf = e => [e.brand, e.name].filter(Boolean).join(' ')
  // Up to 3 tags: sensory (aroma/taste) and 整理 tags interleaved.
  const cardTags = e => {
    const sensory = [...(e.aroma_tags || []).map(id => tagLabel(id, 'aroma')), ...(e.taste_tags || []).map(id => tagLabel(id, 'taste'))]
    const labels = (e.tags || []).map(id => tagLabel(id, 'flavor'))
    const out = []
    for (let i = 0; out.length < 3 && (i < sensory.length || i < labels.length); i++) {
      if (sensory[i] && out.length < 3) out.push({ text: sensory[i], kind: 'sense' })
      if (labels[i] && out.length < 3) out.push({ text: labels[i], kind: 'label' })
    }
    return out
  }
  const statusPill = e => e.is_public
    ? <span className="kk-status kk-status--public">{statusLabels.public}</span>
    : <span className="kk-status kk-status--private">{statusLabels.private}</span>

  const visibleDrafts = draftsOpen ? drafts : drafts.slice(0, DRAFTS_PREVIEW)

  return (
    <div className="kk-ledger">
      <header className="kk-ledger__head">
        <h1 className="kk-ledger__title">{L('マイ帳', '我的酒帳', 'My Ledger')}</h1>
        <div className="kk-ledger__head-actions">
          <button type="button" className="kk-icon-btn kk-ledger__filter-btn" onClick={openSheet}
            aria-label={L('絞り込み', '篩選', 'Filter') + (activeFilterCount ? ` (${activeFilterCount})` : '')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
            {activeFilterCount > 0 && <span className="kk-ledger__dot" aria-hidden="true">{activeFilterCount}</span>}
          </button>
        </div>
      </header>

      <div className="kk-search" role="search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        <input type="search" value={query} onChange={e => setQuery(e.target.value)}
          placeholder={L('酒名・酒造・タグ・メモで検索', '以酒名・酒造・標籤・筆記搜尋', 'Search name, brewery, tags, notes')}
          aria-label={L('マイ帳を検索', '搜尋酒帳', 'Search your ledger')} />
        {query && <button type="button" className="kk-search__clear" onClick={() => setQuery('')} aria-label={L('検索をクリア', '清除搜尋', 'Clear search')}>×</button>}
      </div>

      {finished.length > 0 && !anyNarrowing && (
        <dl className="kk-stats">
          <div className="kk-stat"><dt>{L('記録', '記錄', 'Records')}</dt><dd>{finished.length}</dd></div>
          <div className="kk-stat"><dt>{L('平均評価', '平均評分', 'Avg rating')}</dt><dd>{avg ? formatRating(avg) : '—'}</dd></div>
          <div className="kk-stat"><dt>{L('公開中', '公開中', 'Shared')}</dt><dd>{finished.filter(e => e.is_public).length}</dd></div>
          <div className="kk-stat"><dt>{L('最多酒造', '最常喝酒造', 'Top brewery')}</dt><dd className="kk-stat__text">{topBrewery || '—'}</dd></div>
        </dl>
      )}

      {!anyNarrowing && (drafts.length > 0 || hasDraft) && (
        <section className="kk-drafts" aria-labelledby="kk-drafts-title">
          <div className="kk-drafts__head">
            <h2 id="kk-drafts-title">{L('書きかけ', '寫到一半', 'Unfinished')}<span className="kk-drafts__count">{drafts.length + (hasDraft ? 1 : 0)}</span></h2>
            {drafts.length > DRAFTS_PREVIEW && (
              <button type="button" className="kk-btn kk-btn--ghost kk-btn--sm" onClick={() => setDraftsOpen(o => !o)} aria-expanded={draftsOpen}>
                {draftsOpen ? L('閉じる', '收起', 'Show less') : L(`すべて (${drafts.length})`, `全部 (${drafts.length})`, `All (${drafts.length})`)}
              </button>
            )}
          </div>
          <ul className="kk-drafts__list">
            {hasDraft && (
              <li>
                <button type="button" className="kk-draft" onClick={onAdd}>
                  <span className="kk-draft__mark" aria-hidden="true">札</span>
                  <span className="kk-draft__text">
                    <strong>{L('未保存の入力', '尚未儲存的內容', 'Unsaved entry')}</strong>
                    <span>{L('この端末に残っています', '保留在這台裝置上', 'Kept on this device')}</span>
                  </span>
                  <span className="kk-draft__go" aria-hidden="true">{L('続きを書く', '繼續', 'Continue')} ›</span>
                </button>
              </li>
            )}
            {visibleDrafts.map(e => (
              <li key={e.id}>
                <button type="button" className="kk-draft" onClick={() => onOpen(e)}>
                  <span className="kk-draft__thumb" aria-hidden="true">
                    {e.photo_url ? <img src={e.photo_url} alt="" loading="lazy" /> : '札'}
                  </span>
                  <span className="kk-draft__text">
                    <strong>{titleOf(e) || L('写真だけの下書き', '只有照片的草稿', 'Photo-only draft')}</strong>
                    <span>{(e.updated_at || e.created_at || '').slice(0, 10).replaceAll('-', '.')}{Number(e.rating) > 0 ? ` · ${formatRating(e.rating)}` : ''}</span>
                  </span>
                  <span className="kk-draft__go" aria-hidden="true">{L('続きを書く', '繼續', 'Continue')} ›</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!anyNarrowing && finished.length > 0 && (
        <div className="kk-collections" role="group" aria-label={L('よく戻る酒札', '常用集合', 'Shelves')}>
          {collections.map(c => (
            <button key={c.id} type="button" className="kk-collection" onClick={() => setCollection(c.id)} disabled={!c.count}>
              <strong>{c.title}</strong>
              <span>{c.count}{L('件', ' 筆', '')} · {c.note}</span>
            </button>
          ))}
          <button type="button" className="kk-collection kk-collection--wish" onClick={onShowWishlist}>
            <strong>{L('飲みたい', '想喝', 'Want to try')}</strong>
            <span>{wishCount}{L('件', ' 筆', '')} · {L('次に記録したい酒', '下一支想記錄的酒', 'What to record next')}</span>
            <span className="kk-collection__go" aria-hidden="true">›</span>
          </button>
        </div>
      )}

      {activeChips.length > 0 && (
        <div className="kk-active-chips">
          {activeChips.map(c => (
            <button key={c.key} type="button" className="kk-chip is-active" onClick={c.clear} aria-label={`${c.label} — ${L('解除', '移除', 'Remove')}`}>
              {c.label} <span aria-hidden="true">×</span>
            </button>
          ))}
          <button type="button" className="kk-btn kk-btn--ghost kk-btn--sm" onClick={clearAll}>{L('すべて解除', '全部清除', 'Clear all')}</button>
          {filters.regions.length === 1 && isPrefecture(filters.regions[0]) && (
            <Link className="kk-region-link" to={regionPath(filters.regions[0])}>
              {L(`${normalizeRegion(filters.regions[0])}の産地ページ`, `${normalizeRegion(filters.regions[0])}的產地頁`, `About ${normalizeRegion(filters.regions[0])}`)} ›
            </Link>
          )}
        </div>
      )}

      <div className="kk-result-bar">
        <div className="kk-result-bar__title">
          <h2>{activeCollection ? activeCollection.title : L('酒札棚', '酒札架', 'Shelf')}</h2>
          <span aria-live="polite">{L(`${results.length}件`, `${results.length} 筆`, `${results.length} records`)} · {sortLabels[sort]}</span>
        </div>
        <div className="kk-result-bar__controls">
          <label className="visually-hidden" htmlFor="kk-sort">{L('並び順', '排序', 'Sort')}</label>
          <select id="kk-sort" className="kk-sort" value={sort} onChange={e => setSort(e.target.value)}>
            {Object.entries(sortLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <div className="kk-density" role="radiogroup" aria-label={L('表示密度', '顯示密度', 'Density')}>
            {[['card', L('札', '札', 'Tags'), L('酒札表示', '酒札檢視', 'Tag view')], ['table', L('表', '表', 'List'), L('一覧表示', '列表檢視', 'Compact list')]].map(([k, label, full]) => (
              <button key={k} type="button" role="radio" aria-checked={density === k} aria-label={full} className={density === k ? 'is-active' : ''} onClick={() => setDensity(k)}>{label}</button>
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
            const title = titleOf(e) || L('写真だけの下書き', '只有照片的草稿', 'Photo-only draft')
            const hitLine = hits.length > 0 && (
              <p className="kk-hit">{hits.slice(0, 2).map(h => L(`${fieldLabels[h.field]}に「${h.value}」`, `${fieldLabels[h.field]}：「${h.value}」`, `${fieldLabels[h.field]}: “${h.value}”`)).join(' / ')}</p>
            )
            const meta = [e.brewery, shortRegion(e.region)].filter(Boolean).join(' · ')
            const date = e.tasted_at?.replaceAll('-', '.')
            const tags = cardTags(e)
            return (
              <li key={e.id}>
                {density === 'table' ? (
                  <div className="kk-row" {...pressable(() => onOpen(e), title)}>
                    <span className="kk-row__bottle" aria-hidden="true">
                      <SakeBottleCrop imageUrl={e.thumb_url || e.photo_url} crop={e.photo_crop} height="88px" />
                    </span>
                    <div className="kk-row__main">
                    <div className="kk-row__line">
                      <strong>{title}</strong>
                      {Number(e.rating) > 0 && <span className="kk-score">{formatRating(e.rating)}</span>}
                    </div>
                    <div className="kk-row__meta">
                      <span className="kk-row__meta-text">{[meta, date].filter(Boolean).join(' · ')}</span>
                      {isDraft ? <span className="kk-status kk-status--draft">{L('下書き', '草稿', 'Draft')}</span> : statusPill(e)}
                    </div>
                    {hitLine}
                    </div>
                  </div>
                ) : (
                  <div className={`kk-card${isDraft ? ' is-draft' : ''}`} {...pressable(() => onOpen(e), title)}>
                    <div className="kk-card__photo">
                      <SakeBottleCrop imageUrl={e.thumb_url || e.photo_url} crop={e.photo_crop} height="108px" />
                    </div>
                    <div className="kk-card__body">
                      <strong className="kk-card__title">{title}</strong>
                      {meta && <span className="kk-card__meta">{meta}</span>}
                      <span className="kk-card__rating">
                        {Number(e.rating) > 0
                          ? <><span className="kk-score">{formatRating(e.rating)}</span><Stars rating={e.rating} size={10} /></>
                          : <span className="kk-card__unrated">{L('未評価', '未評分', 'Unrated')}</span>}
                      </span>
                      {tags.length > 0 && (
                        <span className="kk-card__tags">{tags.map(tg => <span key={tg.kind + tg.text} className={`is-${tg.kind}`}>{tg.text}</span>)}</span>
                      )}
                      {hitLine}
                    </div>
                    <div className="kk-card__side">
                      {isDraft ? <span className="kk-status kk-status--draft">{L('下書き', '草稿', 'Draft')}</span> : statusPill(e)}
                      {date && <span className="kk-card__date">{date}</span>}
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
        <FilterGroup label={L('状態', '狀態', 'Status')} columns={3}>
          {Object.entries(statusLabels).map(([k, v]) => (
            <Opt key={k} on={draftFilters.status === k} onClick={() => setDraftFilters(f => ({ ...f, status: k }))}>{v}</Opt>
          ))}
        </FilterGroup>
        <FilterGroup label={L('評価', '評分', 'Rating')} columns={3}>
          {Object.entries(ratingLabels).map(([k, v]) => <Opt key={k} on={draftFilters.rating === k} onClick={() => setOne('rating', k)}>{v}</Opt>)}
        </FilterGroup>
        <FilterGroup label={L('飲んだ日', '飲用日', 'Date tasted')} columns={3}>
          {Object.entries(periodLabels).map(([k, v]) => <Opt key={k} on={draftFilters.period === k} onClick={() => setOne('period', k)}>{v}</Opt>)}
        </FilterGroup>
        {draftFilters.period === 'range' && (
          <div className="kk-range">
            <label>
              <span>{L('から', '起', 'From')}</span>
              <input type="date" className="kk-input" value={draftFilters.from} max={draftFilters.to || undefined} onChange={e => setDraftFilters(f => ({ ...f, from: e.target.value }))} />
            </label>
            <label>
              <span>{L('まで', '迄', 'To')}</span>
              <input type="date" className="kk-input" value={draftFilters.to} min={draftFilters.from || undefined} onChange={e => setDraftFilters(f => ({ ...f, to: e.target.value }))} />
            </label>
          </div>
        )}
        {options.regions.length > 0 && (
          <FilterGroup label={L('産地', '產地', 'Region')} wrap>
            {options.regions.map(r => <Opt key={r} on={draftFilters.regions.includes(r)} onClick={() => toggleIn('regions', r)}>{shortRegion(r)}</Opt>)}
          </FilterGroup>
        )}
        {options.breweries.length > 0 && (
          <FilterGroup label={L('酒造', '酒造', 'Brewery')} wrap>
            {[...new Set([...draftFilters.breweries, ...options.breweries])].map(b => <Opt key={b} on={draftFilters.breweries.includes(b)} onClick={() => toggleIn('breweries', b)}>{b}</Opt>)}
          </FilterGroup>
        )}
        {options.flavors.length > 0 && (
          <FilterGroup label={L('香り・味わい', '香氣・味道', 'Aroma & taste')} wrap>
            {options.flavors.map(id => <Opt key={id} on={draftFilters.flavors.includes(id)} onClick={() => toggleIn('flavors', id)}>{flavorLabel(id)}</Opt>)}
          </FilterGroup>
        )}
      </Sheet>
    </div>
  )
}

function FilterGroup({ label, children, wrap, columns = 4 }) {
  const id = useId()
  return (
    <div className="kk-fgroup" role="group" aria-labelledby={id}>
      <h3 className="kk-fgroup__label" id={id}>{label}</h3>
      <div className={wrap ? 'kk-fgroup__wrap' : 'kk-fgroup__grid'} style={wrap ? undefined : { '--cols': columns }}>{children}</div>
    </div>
  )
}

function Opt({ on, onClick, children }) {
  return <button type="button" className={`kk-fopt${on ? ' is-active' : ''}`} aria-pressed={on} onClick={onClick}>{children}</button>
}
