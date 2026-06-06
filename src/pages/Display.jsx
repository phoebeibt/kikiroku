import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Nav from '../components/Nav'
import Stars, { StarsLight } from '../components/Stars'
import { BrandMarkFull } from '../components/BrandMark'
import { useLang } from '../contexts/LangContext'
import { getTagLabel, getFlavorTagLabel, SAKE_TYPES } from '../lib/i18n'
import { WikiText } from '../components/WikiTooltip'

const WaveDivider = () => (
  <svg style={{ display: 'block', width: '100%', height: 12, margin: '0' }}
    viewBox="0 0 400 20" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0,10 C30,4 60,3 100,8 C140,13 160,14 200,10 C240,6 270,4 310,8 C340,11 370,13 400,10"
      fill="none" stroke="#7C3A28" strokeWidth="1" opacity="0.35" strokeLinecap="round" />
  </svg>
)

const MARK_SVG_ABS = (
  <svg style={{ position: 'absolute', right: -30, bottom: -30, width: 160, height: 160, opacity: .055, pointerEvents: 'none', zIndex: 0 }}
    viewBox="0 0 88 88" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(44,44)">
      <path d="M-15,-37 C-30,-30 -40,-14 -40,4 C-40,22 -32,36 -18,40 C-4,44 14,40 26,28 C36,18 40,2 36,-14 C32,-28 20,-38 4,-40" fill="none" stroke="#7C3A28" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M-10,-27 C-22,-22 -30,-10 -30,4 C-30,18 -22,28 -10,32 C2,36 16,30 24,20 C30,12 30,-2 24,-14 C18,-24 6,-30 -4,-30" fill="none" stroke="#7C3A28" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M-6,-18 C-14,-14 -20,-6 -20,4 C-20,14 -14,20 -4,22 C6,24 16,18 20,10 C22,4 20,-6 14,-12 C8,-18 0,-20 -4,-20" fill="none" stroke="#7C3A28" strokeWidth="2" strokeLinecap="round" />
      <circle r="10" fill="#4A7A35" />
    </g>
  </svg>
)

const s = {
  page: { height: '100svh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  scrollArea: { flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' },
  main: { maxWidth: 1100, margin: '0 auto', padding: '12px 16px 80px' },
  searchRow: { display: 'flex', gap: 8, marginBottom: 14, alignItems: 'stretch', overflow: 'hidden' },
  searchInput: { flex: 1, minWidth: 0, padding: '0 14px', height: 42, borderRadius: 20, border: '1px solid var(--border)', background: 'var(--surface-card)', color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  chips: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 },
  chip: (active) => ({
    padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13,
    background: active ? 'var(--accent)' : 'var(--surface)',
    color: active ? '#fff' : 'var(--text)',
    fontFamily: 'var(--font-sans)',
    boxShadow: active ? 'none' : '0 1px 4px rgba(26,22,20,.06)',
  }),
  dropRow: { display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
  drop: {
    padding: '8px 32px 8px 14px', borderRadius: 10, border: '1px solid var(--border)',
    background: `var(--surface-card) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%238C7E74'/%3E%3C/svg%3E") no-repeat right 12px center`,
    color: 'var(--text)', fontSize: 13, outline: 'none', appearance: 'none', cursor: 'pointer',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 },
  // Variant C — 厚留白框 · 花牌內框線 · 底部文字堆疊
  card: {
    background: '#F4F0E8', border: '1px solid #E5DED4', borderRadius: 14,
    padding: 11, cursor: 'pointer',
    boxShadow: '0 2px 10px rgba(26,22,20,.08)',
    transition: 'transform .15s, box-shadow .15s',
  },
  cardFrame: {
    position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '3/4',
  },
  cardImg: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' },
  cardOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 22%, rgba(42,18,8,.3) 48%, rgba(42,18,8,.82) 72%, rgba(36,14,6,.96) 100%)' },
  cardNo: { position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #2d1f18 0%, #1A1614 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: 'rgba(244,240,232,.15)' },
  cardBody: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 10px 12px', display: 'flex', flexDirection: 'column' },
  cardType: { fontSize: 8, letterSpacing: '.1em', color: '#D9A882', marginBottom: 2 },
  cardName: { fontFamily: 'var(--font-serif)', fontSize: 13, fontWeight: 400, lineHeight: 1.3, color: '#F4F0E8', marginBottom: 2 },
  cardBrewery: { fontSize: 10, color: 'rgba(244,240,232,.60)', marginBottom: 2 },
  cardMeta: { fontSize: 9, color: 'rgba(244,240,232,.40)', marginTop: 2 },
  cardContributor: { fontSize: 9, color: 'rgba(244,240,232,.38)', marginTop: 2 },
  cardTags: { display: 'flex', gap: 7, flexWrap: 'nowrap', marginTop: 5, overflow: 'hidden' },
  cardTag: { fontSize: 8.5, flexShrink: 0, color: 'rgba(244,240,232,.60)', whiteSpace: 'nowrap' },
  // Detail
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(26,22,20,.6)', zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  detModal: { background: 'var(--surface-card)', borderRadius: 20, width: '100%', maxWidth: 660, maxHeight: '90svh', overflow: 'hidden auto', position: 'relative' },
  detClose: { position: 'absolute', top: 12, right: 12, width: 30, height: 30, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--sub)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  detTop: { display: 'flex', gap: 0, alignItems: 'flex-start', padding: '12px 12px 6px' },
  detPhoto: { width: 120, height: 150, objectFit: 'cover', flexShrink: 0, borderRadius: 10 },
  detPhotoPlaceholder: { width: 120, height: 150, background: '#2d2520', flexShrink: 0, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, color: 'rgba(255,245,230,.1)' },
  detRight: { flex: 1, padding: '2px 32px 0 12px', minWidth: 0, position: 'relative', overflow: 'hidden' },
  detTypeTag: { fontSize: 10, color: 'var(--accent)', letterSpacing: '.06em', marginBottom: 3 },
  detName: { fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 400, lineHeight: 1.3, marginBottom: 5, letterSpacing: '.03em' },
  detBrewery: { fontSize: 12, color: 'var(--sub)', marginTop: 3 },
  detMeta: { fontSize: 11, color: 'var(--sub)', marginTop: 2 },
  detContributor: { fontSize: 11, color: 'var(--sub)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 },
  statsBar: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', margin: '0 12px' },
  statItem: { padding: '6px 10px', borderRight: '1px solid var(--border)', overflow: 'hidden' },
  statLabel: { fontSize: 9, color: 'var(--sub)', letterSpacing: '.06em', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  statValue: { fontSize: 14, fontFamily: 'var(--font-serif)', fontWeight: 400, color: 'var(--text)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.3 },
  detLower: { padding: '4px 16px 16px', position: 'relative', overflow: 'hidden' },
  detGrid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, marginBottom: 4 },
  detCell: { padding: '7px 0', borderBottom: '1px solid var(--border)', paddingRight: 12 },
  detCellLabel: { fontSize: 9, color: 'var(--sub)', letterSpacing: '.05em', marginBottom: 2 },
  detCellValue: { fontSize: 12, color: 'var(--text)' },
  detTagsRow: { display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 10 },
  detTag: { fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'var(--accent-bg)', color: 'var(--accent)' },
  empty: { textAlign: 'center', color: 'var(--sub)', paddingTop: 60, fontSize: 14 },
  stickyBar: {
    flexShrink: 0,
    background: 'var(--bg)', borderBottom: '1px solid var(--border)',
    padding: '10px 16px',
  },
  stickyInner: { maxWidth: 1100, margin: '0 auto' },
}

function SakeCard({ e, lang, typeLabel, onOpen }) {
  return (
    <div style={s.card} onClick={() => onOpen(e)}>
      <div style={s.cardFrame}>
        {e.photo_url ? <img style={s.cardImg} src={e.photo_url} alt={e.name} /> : <div style={s.cardNo}>🍶</div>}
        <div style={s.cardOverlay} />
        <div style={s.cardBody}>
          {e.type && <div style={s.cardType}>{typeLabel(e.type)}</div>}
          <div style={s.cardName}>{e.name}</div>
          <div style={s.cardBrewery}>{[e.brewery, e.region].filter(Boolean).join(' · ')}</div>
          <StarsLight rating={e.rating} size={9} />
          {e.tags?.length > 0 && (
            <div style={s.cardTags}>
              {e.tags.slice(0, 3).map(t => <span key={t} style={s.cardTag}>{getFlavorTagLabel(t, lang)}</span>)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Display({ session }) {
  const { lang, t } = useLang()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState('')
  const [tagsExp, setTagsExp] = useState(false)
  const [filters, setFilters] = useState({ type: '', brewery: '', rice: '', rating: '' })
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [detail, setDetail] = useState(null)
  const [detailAwards, setDetailAwards] = useState([])
  const [detailBrand, setDetailBrand] = useState(null) // null=unfetched, false=not found, object
  const [showDetailReading, setShowDetailReading] = useState(false)
  const [copied, setCopied] = useState(false)

  const typeLabel = type => {
    if (!type) return ''
    const found = SAKE_TYPES.find(s => s.id === type)
    if (!found) return type
    if (lang === 'zh') return found.zh
    if (lang === 'en') return found.en
    return found.id
  }

  useEffect(() => {
    supabase.from('sake_entries').select('*').eq('is_public', true)
      .order('tasted_at', { ascending: false }).limit(200)
      .then(({ data }) => { setEntries(data || []); setLoading(false) })
  }, [])

  useEffect(() => {
    setDetailBrand(null)
    setShowDetailReading(false)
  }, [detail?.id])

  const handleDetailNameClick = async () => {
    if (detailBrand === null) {
      const name = detail.name.trim()
      let { data } = await supabase
        .from('sake_brands').select('furigana,romaji').eq('name', name).limit(1)
      if (!data?.length) {
        const first = name.split(/[\s　・]/)[0]
        if (first.length >= 2) {
          ;({ data } = await supabase
            .from('sake_brands').select('furigana,romaji').ilike('name', `${first}%`).limit(1))
        }
      }
      const b = data?.[0] || false
      setDetailBrand(b)
      if (b && (lang === 'ja' ? b.furigana : b.romaji)) setShowDetailReading(true)
    } else {
      const r = detailBrand && (lang === 'ja' ? detailBrand.furigana : detailBrand.romaji)
      if (r) setShowDetailReading(s => !s)
    }
  }

  useEffect(() => {
    if (!detail?.brewery) { setDetailAwards([]); return }
    const keyword = detail.brewery.replace(/(株式会社|有限会社|合資会社|合名会社|㈱|㈲)/g, '').trim().split(/[\s　]+/)[0]
    if (!keyword || keyword.length < 2) { setDetailAwards([]); return }
    supabase
      .from('sake_awards')
      .select('year,brand_name,is_gold')
      .ilike('brewery_name', `%${keyword}%`)
      .order('year', { ascending: false })
      .limit(10)
      .then(({ data }) => setDetailAwards(data || []))
  }, [detail?.brewery])

  const allTags = [...new Set(entries.flatMap(e => e.tags || []))]
  const topTags = allTags.slice(0, 6)
  const visibleTags = tagsExp ? allTags : topTags

  const types = [...new Set(entries.map(e => e.type).filter(Boolean))]
  const breweries = [...new Set(entries.map(e => e.brewery).filter(Boolean))]
  const rices = [...new Set(entries.map(e => e.rice).filter(Boolean))]

  const setF = (k, v) => setFilters(p => ({ ...p, [k]: v }))

  const filtered = entries.filter(e => {
    if (activeTag && !e.tags?.includes(activeTag)) return false
    if (filters.type && e.type !== filters.type) return false
    if (filters.brewery && e.brewery !== filters.brewery) return false
    if (filters.rice && e.rice !== filters.rice) return false
    if (filters.rating && (e.rating || 0) < Number(filters.rating)) return false
    if (search) {
      const q = search.toLowerCase()
      return (e.name || '').toLowerCase().includes(q) ||
        (e.brewery || '').toLowerCase().includes(q) ||
        (e.region || '').toLowerCase().includes(q) ||
        (e.contributor_name || '').toLowerCase().includes(q) ||
        e.tags?.some(t => t.toLowerCase().includes(q))
    }
    return true
  })

  const StatItem = ({ label, value }) => {
    const str = value != null && value !== '' ? String(value) : null
    const fontSize = str && str.length > 8 ? 11 : str && str.length > 5 ? 12 : 15
    return (
      <div style={s.statItem}>
        <div style={s.statLabel}>{label}</div>
        {str
          ? <div style={{ ...s.statValue, fontSize }} title={str}>{str}</div>
          : <div style={{ ...s.statValue, fontSize: 12, color: 'var(--border)' }}>N/A</div>}
      </div>
    )
  }

  const Cell = ({ label, value }) => (
    <div style={s.detCell}>
      <div style={s.detCellLabel}>{label}</div>
      {value != null && value !== ''
        ? <div style={s.detCellValue}>{value}</div>
        : <div style={{ ...s.detCellValue, color: 'var(--border)' }}>N/A</div>}
    </div>
  )

  const activeFilterCount = Object.values(filters).filter(Boolean).length + (activeTag ? 1 : 0)

  return (
    <div style={s.page}>
      <Nav session={session} />
      <BrandMarkFull />
      <div style={s.stickyBar}>
        <div style={s.stickyInner}>
          {/* Search bar — always visible */}
          <div style={{ ...s.searchRow, marginBottom: session && filtersOpen ? 10 : 0 }}>
            <input style={s.searchInput} value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t('search')} />
            {search && <button onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', color: 'var(--sub)', cursor: 'pointer', fontSize: 18, lineHeight: 1, flexShrink: 0, padding: '0 4px' }}>×</button>}
            {session && (
              <button onClick={() => setFiltersOpen(x => !x)}
                style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '0 14px', height: 42, borderRadius: 20, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap', boxSizing: 'border-box' }}>
                {t('display.filters')}
                {activeFilterCount > 0
                  ? <span style={{ background: 'rgba(255,255,255,.25)', borderRadius: 20, padding: '1px 7px', fontSize: 11, fontWeight: 600 }}>{activeFilterCount}</span>
                  : <span style={{ fontSize: 10, opacity: 0.8 }}>{filtersOpen ? '▲' : '▼'}</span>}
              </button>
            )}
          </div>

          {/* Collapsible filter panel — logged-in only */}
          {session && filtersOpen && (
            <>
              {allTags.length > 0 && (
                <div style={s.chips}>
                  <button style={s.chip(!activeTag)} onClick={() => setActiveTag('')}>{t('all')}</button>
                  {visibleTags.map(tag => (
                    <button key={tag} style={s.chip(activeTag === tag)} onClick={() => setActiveTag(activeTag === tag ? '' : tag)}>{getFlavorTagLabel(tag, lang)}</button>
                  ))}
                  {allTags.length > 6 && (
                    <button style={s.chip(false)} onClick={() => setTagsExp(x => !x)}>
                      {tagsExp ? t('less') : t('more')}
                    </button>
                  )}
                </div>
              )}
              <div style={s.dropRow}>
                <select style={s.drop} value={filters.type} onChange={e => setF('type', e.target.value)}>
                  <option value="">{t('filter.type')}</option>
                  {types.map(tp => <option key={tp} value={tp}>{typeLabel(tp)}</option>)}
                </select>
                <select style={s.drop} value={filters.brewery} onChange={e => setF('brewery', e.target.value)}>
                  <option value="">{t('filter.brewery')}</option>
                  {breweries.map(b => <option key={b}>{b}</option>)}
                </select>
                <select style={s.drop} value={filters.rice} onChange={e => setF('rice', e.target.value)}>
                  <option value="">{t('filter.rice')}</option>
                  {rices.map(r => <option key={r}>{r}</option>)}
                </select>
                <select style={s.drop} value={filters.rating} onChange={e => setF('rating', e.target.value)}>
                  <option value="">{t('filter.rating')}</option>
                  <option value="4">{t('filter.rating4')}</option>
                  <option value="5">{t('filter.rating5')}</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      <div style={s.scrollArea}>
      <div style={s.main}>
        {!session && (
          <div style={{ textAlign: 'center', padding: '6px 0 14px', fontSize: 12, color: 'var(--sub)' }}>
            <a href="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>{t('display.loginHint')}</a>
          </div>
        )}

        {loading && <p style={s.empty}>{t('loading')}</p>}
        {!loading && filtered.length === 0 && <p style={s.empty}>{search ? t('noResults', { q: search }) : t('noEntries')}</p>}

        {(() => {
          const GUEST_LIMIT = 10
          const isGuest = !session
          const visible = isGuest ? filtered.slice(0, GUEST_LIMIT) : filtered
          const locked = isGuest && filtered.length > GUEST_LIMIT
          return (
            <div style={{ position: 'relative' }}>
              <div style={s.grid}>
                {visible.map(e => (
                  <SakeCard key={e.id} e={e} lang={lang} typeLabel={typeLabel} onOpen={setDetail} />
                ))}
              </div>
              {locked && (
                <div style={{ position: 'relative', marginTop: -120, zIndex: 2 }}>
                  <div style={{ height: 140, background: 'linear-gradient(to bottom, transparent, var(--bg) 80%)' }} />
                  <div style={{ background: 'var(--bg)', textAlign: 'center', padding: '4px 0 32px' }}>
                    <div style={{ fontSize: 13, color: 'var(--sub)', marginBottom: 14 }}>
                      {t('guest.moreHidden', { n: filtered.length - GUEST_LIMIT })}
                    </div>
                    <a href="/login" style={{ display: 'inline-block', padding: '10px 28px', borderRadius: 20, background: 'var(--accent)', color: '#fff', fontSize: 14, textDecoration: 'none', fontFamily: 'var(--font-sans)' }}>
                      {t('guest.loginToSeeAll')}
                    </a>
                  </div>
                </div>
              )}
            </div>
          )
        })()}
      </div>
      </div>

      {/* Detail modal */}
      {detail && (
        <div style={s.backdrop} onClick={() => setDetail(null)}>
          <div style={s.detModal} onClick={e => e.stopPropagation()}>
            <button style={s.detClose} onClick={() => setDetail(null)}>✕</button>
            <button
              onClick={() => {
                const url = `${window.location.origin}/entry/${detail.id}`
                navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800) })
              }}
              title={lang === 'ja' ? 'リンクをコピー' : lang === 'zh' ? '複製連結' : 'Copy link'}
              style={{ position: 'absolute', top: 12, right: 50, width: 30, height: 30, borderRadius: '50%', border: '1px solid var(--border)', background: copied ? 'var(--accent)' : 'var(--bg)', color: copied ? '#fff' : 'var(--sub)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, transition: 'all .2s' }}>
              {copied ? '✓' : '🔗'}
            </button>

            <div style={s.detTop}>
              {detail.photo_url
                ? <img style={s.detPhoto} src={detail.photo_url} alt={detail.name} />
                : <div style={s.detPhotoPlaceholder}>🍶</div>}
              <div style={s.detRight}>
                {MARK_SVG_ABS}
                {detail.type && <div style={s.detTypeTag}><WikiText text={typeLabel(detail.type)} /></div>}
                <div style={{ ...s.detName, cursor: 'pointer', marginBottom: 1 }} onClick={handleDetailNameClick}>
                  <WikiText text={detail.name} />
                </div>
                {showDetailReading && (lang === 'ja' ? detailBrand?.furigana : detailBrand?.romaji) ? (
                  <div style={{ fontSize: 11, color: 'var(--sub)', letterSpacing: '.07em', marginBottom: 6, fontFamily: 'var(--font-sans)', lineHeight: 1.2 }}>
                    {lang === 'ja' ? detailBrand.furigana : detailBrand.romaji}
                  </div>
                ) : (
                  <div style={{ fontSize: 10, color: 'var(--accent)', opacity: 0.7, marginBottom: 6, cursor: 'pointer', letterSpacing: '.04em' }}
                    onClick={handleDetailNameClick}>
                    {lang === 'ja' ? '▾ 読み方' : lang === 'zh' ? '▾ 讀音' : '▾ Reading'}
                  </div>
                )}
                <Stars rating={detail.rating} size={13} />
                {detail.brewery && <div style={s.detBrewery}>{detail.brewery}</div>}
                <div style={s.detMeta}>{[detail.region, detail.tasted_at].filter(Boolean).join(' · ')}</div>
                {detail.contributor_name && (
                  <div style={s.detContributor}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4A7A35', display: 'inline-block', flexShrink: 0 }} />
                    {detail.contributor_name}
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: '0 12px' }}><WaveDivider /></div>
            <div style={s.statsBar}>
              <StatItem label={t('detail.polishing')} value={detail.polishing} />
              <StatItem label={t('detail.alcohol')} value={detail.alcohol} />
              <StatItem label={t('detail.smv')} value={detail.smv} />
              <StatItem label={t('detail.acidity')} value={detail.acidity} />
            </div>
            <div style={{ padding: '0 12px' }}><WaveDivider /></div>

            <div style={s.detLower}>
              <div style={s.detGrid2}>
                <Cell label={t('detail.rice')} value={detail.rice} />
                <Cell label={t('detail.yeast')} value={detail.yeast} />
                <Cell label={t('detail.bottling')} value={detail.bottling_date} />
                <Cell label={t('detail.drinking')} value={detail.tasted_at} />
              </div>
              {detail.aroma_tags?.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 10, color: 'var(--sub)', letterSpacing: '.05em', marginBottom: 6 }}>{t('detail.aroma')}</div>
                  <div style={s.detTagsRow}>
                    {detail.aroma_tags.map(id => (
                      <span key={id} style={s.detTag}>{getTagLabel(id, 'aroma', lang)}</span>
                    ))}
                  </div>
                </div>
              )}
              {detail.taste_tags?.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 10, color: 'var(--sub)', letterSpacing: '.05em', marginBottom: 6 }}>{t('detail.taste')}</div>
                  <div style={s.detTagsRow}>
                    {detail.taste_tags.map(id => (
                      <span key={id} style={{ ...s.detTag, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>{getTagLabel(id, 'taste', lang)}</span>
                    ))}
                  </div>
                </div>
              )}
              {(detail.aroma || detail.taste || detail.notes) && (
                <div style={{ marginTop: 12, fontSize: 14, color: 'var(--sub)', lineHeight: 1.7 }}>
                  {detail.aroma && <p><strong>{t('detail.aroma')}：</strong><WikiText text={detail.aroma} /></p>}
                  {detail.taste && <p><strong>{t('detail.taste')}：</strong><WikiText text={detail.taste} /></p>}
                  {detail.notes && <p><WikiText text={detail.notes} /></p>}
                </div>
              )}
              {detail.tags?.length > 0 && (
                <div style={s.detTagsRow}>
                  {detail.tags.map(tg => <span key={tg} style={s.detTag}>{getFlavorTagLabel(tg, lang)}</span>)}
                </div>
              )}
              {detailAwards.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 9, color: 'var(--sub)', letterSpacing: '.06em', marginBottom: 6 }}>
                    {lang === 'ja' ? '全国新酒鑑評会' : lang === 'zh' ? '全国新酒鉴评会' : 'NRIB Awards'}
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {detailAwards.map((a, i) => (
                      <span key={i} title={a.brand_name}
                        style={{ fontSize: 10, padding: '2px 9px', borderRadius: 12, whiteSpace: 'nowrap',
                          background: a.is_gold ? 'rgba(180,140,0,.10)' : 'var(--bg)',
                          color: a.is_gold ? '#8A6C00' : 'var(--sub)',
                          border: `1px solid ${a.is_gold ? 'rgba(180,140,0,.28)' : 'var(--border)'}` }}>
                        {a.is_gold ? '★' : '○'} {a.year}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
