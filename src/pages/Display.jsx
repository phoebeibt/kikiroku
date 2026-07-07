import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Nav from '../components/Nav'
import Stars, { StarsLight } from '../components/Stars'
import { BrandMarkFull } from '../components/BrandMark'
import { useLang } from '../contexts/LangContext'
import { useTagResolver } from '../contexts/TagsContext'
import { getTheme } from '../lib/theme'
import { WikiText } from '../components/WikiTooltip'
import { WIKI_TERMS } from '../lib/wiki'
import { localizedTerm } from '../lib/wiki'
import { displayName } from '../lib/localize'


// Strip furigana annotations like「純米大吟醸（じゅんまいだいぎんじょう）」
// Used in browse tile and detail modal — clean displayed labels
const cleanLabel = (s) => (s || '').replace(/[(（][぀-ゟ゠-ヿ\s]+[)）]/g, '').trim()

// ── Sake-choice filter helpers ────────────────────────────────────────
// Extract standard rice/yeast varieties from WIKI_TERMS (with terms as aliases)
const RICE_VARIETIES = WIKI_TERMS.filter(t => t.group?.endsWith('-rice')).map(t => ({
  id: t.id,
  title: t.title,
  aliases: [...(t.terms?.ja || []), ...(t.terms?.zh || []), ...(t.terms?.en || []), t.title?.ja].filter(Boolean),
}))
const YEAST_VARIETIES = WIKI_TERMS.filter(t => t.group?.endsWith('-yeast')).map(t => ({
  id: t.id,
  title: t.title,
  aliases: [...(t.terms?.ja || []), ...(t.terms?.zh || []), ...(t.terms?.en || []), t.title?.ja].filter(Boolean),
}))

function textMatchesVariety(text, variety) {
  if (!text) return false
  const lower = text.toLowerCase()
  return variety.aliases.some(a => a && (text.includes(a) || lower.includes(a.toLowerCase())))
}

// SMV bucketing per SSI convention (甘口/中口/辛口)
const SMV_BUCKETS = [
  { id: 'sweet',  label: { ja: '甘口', zh: '甘口', en: 'Sweet' },  test: v => v <= -3 },
  { id: 'medium', label: { ja: '中口', zh: '中口', en: 'Medium' }, test: v => v > -3 && v < 3 },
  { id: 'dry',    label: { ja: '辛口', zh: '辛口', en: 'Dry' },    test: v => v >= 3 },
]
function smvBucketOf(entry) {
  const n = Number(entry.smv)
  if (isNaN(n) || entry.smv === null || entry.smv === '') return null
  return SMV_BUCKETS.find(b => b.test(n))?.id || null
}

// Method tag whitelist (objective brewing method — sake-property, not personal preference)
const METHOD_TAG_ORDER = ['namazake', 'genshu', 'nigori', 'sparkling', 'kimoto', 'yamahai', 'taruzake', 'koshu', 'kijoshu']


const WaveDivider = () => (
  <svg style={{ display: 'block', width: '100%', height: 12, margin: '0' }}
    viewBox="0 0 400 20" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0,10 C30,4 60,3 100,8 C140,13 160,14 200,10 C240,6 270,4 310,8 C340,11 370,13 400,10"
      fill="none" style={{ stroke: 'var(--accent)' }} strokeWidth="1" opacity="0.35" strokeLinecap="round" />
  </svg>
)

function MarkSVGAbs() {
  return (
    <svg style={{ position: 'absolute', right: -30, bottom: -30, width: 160, height: 160, opacity: .055, pointerEvents: 'none', zIndex: 0 }}
      viewBox="0 0 88 88" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(44,44)">
        <path d="M-15,-37 C-30,-30 -40,-14 -40,4 C-40,22 -32,36 -18,40 C-4,44 14,40 26,28 C36,18 40,2 36,-14 C32,-28 20,-38 4,-40" fill="none" style={{ stroke: 'var(--mark-outer)' }} strokeWidth="1.1" strokeLinecap="round" />
        <path d="M-10,-27 C-22,-22 -30,-10 -30,4 C-30,18 -22,28 -10,32 C2,36 16,30 24,20 C30,12 30,-2 24,-14 C18,-24 6,-30 -4,-30" fill="none" style={{ stroke: 'var(--mark-outer)' }} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M-6,-18 C-14,-14 -20,-6 -20,4 C-20,14 -14,20 -4,22 C6,24 16,18 20,10 C22,4 20,-6 14,-12 C8,-18 0,-20 -4,-20" fill="none" style={{ stroke: 'var(--mark-inner)' }} strokeWidth="2" strokeLinecap="round" />
        <circle r="10" style={{ fill: 'var(--mark-dot)' }} />
      </g>
    </svg>
  )
}

const s = {
  page: { minHeight: '100svh', background: 'var(--bg)' },
  main: { maxWidth: 1100, margin: '0 auto', padding: '12px 16px 100px' },
  searchRow: { display: 'flex', gap: 8, marginBottom: 14, alignItems: 'stretch', overflow: 'hidden' },
  searchInput: { flex: 1, minWidth: 0, padding: '0 14px', height: 42, borderRadius: 20, border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
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
    background: `var(--surface-card) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='rgba(180,210,245,0.45)'/%3E%3C/svg%3E") no-repeat right 12px center`,
    color: 'var(--text)', fontSize: 13, outline: 'none', appearance: 'none', cursor: 'pointer',
  },
  // Layout containers
  gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 },
  listContainer: { display: 'flex', flexDirection: 'column', gap: 10 },
  // New editorial tile — text-first, no photo, no aspect-ratio
  gridTile: {
    background: 'var(--card-bg)',
    border: '1px solid var(--card-border)',
    borderRadius: 4,
    padding: '14px 16px',
    cursor: 'pointer',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    transition: 'background .18s, border-color .18s',
  },
  wishBtn: (wished) => ({
    position: 'absolute',
    top: 10, right: 12,
    width: 24, height: 24,
    borderRadius: '50%',
    border: wished ? 'none' : '1px solid var(--border)',
    background: wished ? 'var(--accent)' : 'transparent',
    color: wished ? '#fff' : 'var(--sub)',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    opacity: wished ? 1 : .5,
    transition: 'opacity .15s, background .15s, color .15s',
    zIndex: 2,
    padding: 0,
  }),
  gridBrandTypeRow: {
    fontFamily: 'var(--font-serif)',
    fontSize: 13,
    color: 'var(--sub)',
    letterSpacing: '.05em',
    fontWeight: 400,
    marginBottom: 2,
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
    paddingRight: 32,  // avoid overlap with wish button
    flexWrap: 'wrap',
  },
  gridBrandName: { color: 'var(--accent)', fontWeight: 500 },
  gridDivider: { color: 'var(--placeholder)', fontSize: 11 },
  gridProduct: {
    fontFamily: 'var(--font-serif)',
    fontSize: 20,
    lineHeight: 1.25,
    color: 'var(--text)',
    letterSpacing: '.03em',
    fontWeight: 400,
    marginBottom: 2,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    minHeight: '2.5em',
  },
  gridBrewery: {
    fontFamily: 'var(--font-serif)',
    fontSize: 13,
    color: 'var(--sub)',
    letterSpacing: '.05em',
    paddingBottom: 8,
    borderBottom: '1.5px solid var(--accent-light)',
  },
  gridBreweryName: { color: 'var(--text)', fontWeight: 400, marginRight: 6 },
  gridAromaRow: {
    marginTop: 8,
    fontSize: 12,
    color: 'var(--sub)',
    letterSpacing: '.04em',
    lineHeight: 1.5,
  },
  gridAromaKw: {
    color: 'var(--text)',
    opacity: .75,
    marginRight: 10,
  },
  gridRatingRow: {
    marginTop: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  gridAwardBadge: {
    fontFamily: 'var(--font-serif)',
    fontSize: 10,
    color: '#b48c00',
    background: 'rgba(180,140,0,.10)',
    border: '1px solid rgba(180,140,0,.35)',
    padding: '1px 7px',
    borderRadius: 2,
    letterSpacing: '.04em',
    marginLeft: 8,
  },
  // List card — horizontal with aroma tags
  listCard: { display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface-card)', border: '1px solid var(--card-border)', borderRadius: 14, cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,.1), inset 0 1px 0 rgba(220,240,255,.06)', transition: 'transform .15s', overflow: 'hidden', padding: '10px 12px 10px 10px' },
  listThumb: { width: 80, height: 100, flexShrink: 0, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  listThumbImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  listThumbNo: { width: '100%', height: '100%', background: 'var(--card-no-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  listKanji: { fontFamily: 'var(--font-serif)', fontSize: 24, color: 'var(--card-no-text)', writingMode: 'vertical-rl', letterSpacing: '-.04em', userSelect: 'none' },
  listBody: { flex: 1, minWidth: 0 },
  listType: { fontSize: 9, letterSpacing: '.07em', color: 'var(--accent)', marginBottom: 2 },
  listName: { fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 400, lineHeight: 1.3, color: 'var(--text)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  listBrewery: { fontSize: 11, color: 'var(--sub)', marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  listMeta: { display: 'flex', alignItems: 'center', gap: 6 },
  listAward: { fontSize: 9, color: '#8A6C00', background: 'rgba(180,140,0,.10)', border: '1px solid rgba(180,140,0,.28)', borderRadius: 6, padding: '1px 6px', whiteSpace: 'nowrap' },
  listAromaTag: { fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'rgba(181,69,27,.08)', color: 'var(--accent)', border: '1px solid rgba(181,69,27,.15)', whiteSpace: 'nowrap' },
  // Detail modal
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(26,22,20,.6)', zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  detModal: { background: 'var(--surface-card)', borderRadius: 18, width: '100%', maxWidth: 660, maxHeight: '90svh', overflow: 'hidden auto', position: 'relative' },
  detClose: { position: 'absolute', top: 12, right: 12, width: 30, height: 30, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--sub)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  detTop: { display: 'flex', gap: 20, alignItems: 'flex-start', padding: '20px 20px 4px' },
  detPhoto: { width: 140, height: 186, objectFit: 'cover', flexShrink: 0, borderRadius: 10 },
  detPhotoPlaceholder: { width: 140, height: 186, background: 'var(--photo-ph)', flexShrink: 0, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, color: 'var(--photo-ph-icon)' },
  detRight: { flex: 1, paddingRight: 40, minWidth: 0, position: 'relative', overflow: 'hidden' },
  // 銘柄 + 类型合并一行
  detBrandTypeRow: {
    fontFamily: 'var(--font-serif)',
    fontSize: 14,
    color: 'var(--sub)',
    letterSpacing: '.05em',
    fontWeight: 400,
    marginBottom: 6,
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    flexWrap: 'wrap',
  },
  detBrandName: { color: 'var(--text)', fontWeight: 400 },
  detDivider: { color: 'var(--placeholder)', fontSize: 12 },
  detProduct: {
    fontFamily: 'var(--font-serif)',
    fontSize: 22,
    lineHeight: 1.25,
    color: 'var(--text)',
    letterSpacing: '.03em',
    fontWeight: 400,
    marginBottom: 6,
  },
  detReading: { fontSize: 11, color: 'var(--sub)', letterSpacing: '.05em', marginBottom: 4 },
  detBrewery: { fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--sub)', letterSpacing: '.05em', marginTop: 6 },
  detBreweryName: { color: 'var(--text)', fontWeight: 400 },
  detMeta: { fontSize: 11, color: 'var(--sub)', marginTop: 4 },
  detContributor: { fontSize: 11, color: 'var(--sub)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 },
  // Editorial spec block
  specSection: { padding: '16px 20px 8px' },
  specHeader: { fontSize: 11, color: 'var(--sub)', letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 16, paddingLeft: 4 },
  specGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', columnGap: 24, rowGap: 22, padding: '0 4px' },
  specItem: { display: 'flex', flexDirection: 'column', gap: 6, position: 'relative', paddingTop: 6 },
  specItemMark: { position: 'absolute', top: -2, left: 0, width: 20, height: 1, background: 'var(--accent)', opacity: .6 },
  specName: { fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--sub)', letterSpacing: '.16em', textTransform: 'uppercase' },
  specFig: { fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 300, color: 'var(--text)', letterSpacing: '.02em', lineHeight: 1 },
  specFigText: { fontFamily: 'var(--font-serif)', fontSize: 19, fontWeight: 300, color: 'var(--text)', letterSpacing: '.04em', lineHeight: 1.2 },
  specSuffix: { fontSize: 13, color: 'var(--placeholder)', fontWeight: 400, marginLeft: 2 },
  // Tag section
  tagSection: { padding: '4px 20px 8px' },
  tagBlock: { marginTop: 14 },
  tagLabel: { fontSize: 11, color: 'var(--sub)', letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 8 },
  tagsRow: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  tagChip: { fontSize: 12, padding: '4px 11px', borderRadius: 12, background: 'var(--card-bg)', color: 'var(--text)', letterSpacing: '.02em', fontFamily: 'var(--font-sans)', border: '1px solid var(--card-border)' },
  // Awards
  awardSection: { padding: '8px 20px 8px' },
  awardHeader: { fontSize: 11, color: 'var(--sub)', letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 12 },
  awardRow: { display: 'flex', alignItems: 'baseline', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' },
  awardCategory: { fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--sub)', display: 'flex', alignItems: 'baseline', gap: 6, flexShrink: 0, minWidth: 150 },
  awardMedal: (gold) => ({
    display: 'inline-block', fontSize: 10, padding: '2px 7px', borderRadius: 6, letterSpacing: '.02em', fontWeight: 500, marginLeft: 4,
    color: gold ? '#e0b954' : '#c8ced9',
    background: gold ? 'rgba(220,175,50,.16)' : 'rgba(190,200,215,.10)',
  }),
  awardYears: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  awardYearBadge: { fontFamily: 'var(--font-sans)', fontSize: 12, padding: '2px 7px', borderRadius: 6, background: 'var(--card-bg)', color: 'var(--text)', fontVariantNumeric: 'tabular-nums', letterSpacing: '.02em', border: '1px solid var(--card-border)' },
  // Notes prose block
  notesProse: { fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--text)', fontStyle: 'italic', padding: '10px 14px 10px 18px', borderLeft: '2px solid var(--accent)', background: 'var(--accent-bg)', borderRadius: 3, margin: '12px 20px', lineHeight: 1.7, letterSpacing: '.02em' },
  empty: { textAlign: 'center', color: 'var(--sub)', paddingTop: 60, fontSize: 14 },
  stickyBar: {
    position: 'sticky', top: 52, zIndex: 30,
    background: 'var(--stickybar-bg)',
    backdropFilter: 'blur(28px) saturate(1.8)',
    WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
    borderBottom: '1px solid var(--tabbar-border)',
    padding: '10px 16px',
  },
  stickyInner: { maxWidth: 1100, margin: '0 auto' },
}

function SakeCard({ e, lang, typeLabel, tagLabel, onOpen, wished, onWish, awarded, mode = 'grid', isGuest = false }) {
  const wishIcon = (
    <svg width="13" height="13" viewBox="0 0 24 24" fill={wished ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>
  )

  if (mode === 'grid') {
    const hasBrand = !!e.brand
    const hasType = !!e.type
    return (
      <div style={s.gridTile} onClick={() => onOpen(e)}>
        {onWish && (
          <button onClick={ev => onWish(e.id, ev)} style={s.wishBtn(wished)} title={wished ? '想喝リストから外す' : '想喝'}>
            {wishIcon}
          </button>
        )}
        {(hasBrand || hasType) && (
          <div style={s.gridBrandTypeRow}>
            {hasBrand && <span style={s.gridBrandName}>{e.brand}</span>}
            {hasBrand && hasType && <span style={s.gridDivider}>·</span>}
            {hasType && <span>{cleanLabel(typeLabel(e.type))}</span>}
          </div>
        )}
        <div style={s.gridProduct}>{e.name || e.brand || '—'}</div>
        {(e.brewery || e.region) && (
          <div style={s.gridBrewery}>
            {e.brewery && <span style={s.gridBreweryName}>{e.brewery}</span>}
            {e.brewery && e.region && <span>· {e.region}</span>}
            {!e.brewery && e.region && <span>{e.region}</span>}
          </div>
        )}
        {!isGuest && e.aroma_tags?.length > 0 && tagLabel && (
          <div style={s.gridAromaRow}>
            {e.aroma_tags.slice(0, 3).map(id => (
              <span key={id} style={s.gridAromaKw}>{tagLabel(id, 'aroma')}</span>
            ))}
          </div>
        )}
        {((!isGuest && e.rating > 0) || awarded) && (
          <div style={s.gridRatingRow}>
            {!isGuest && e.rating > 0 && <Stars rating={e.rating} size={10} />}
            {awarded && <span style={s.gridAwardBadge}>★ 受賞</span>}
          </div>
        )}
      </div>
    )
  }

  // list mode
  return (
    <div style={s.listCard} onClick={() => onOpen(e)}>
      <div style={s.listThumb}>
        {!isGuest && e.photo_url
          ? <img style={s.listThumbImg} src={e.photo_url} alt={e.name} />
          : <div style={s.listThumbNo}><span style={s.listKanji}>{(e.brand || e.name)?.slice(0, 2) || '酒'}</span></div>
        }
      </div>
      <div style={s.listBody}>
        {e.type && <div style={s.listType}>{typeLabel(e.type)}</div>}
        <div style={s.listName}>{[e.brand, e.name].filter(Boolean).join(' ')}</div>
        {(e.brewery || e.region) && <div style={s.listBrewery}>{[e.brewery, e.region].filter(Boolean).join(' · ')}</div>}
        <div style={s.listMeta}>
          {!isGuest && e.rating > 0 && <Stars rating={e.rating} size={10} />}
          {awarded && <span style={s.listAward}>★ 受賞</span>}
        </div>
        {!isGuest && e.aroma_tags?.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
            {e.aroma_tags.slice(0, 3).map(id => (
              <span key={id} style={s.listAromaTag}>{tagLabel(id, 'aroma')}</span>
            ))}
          </div>
        )}
      </div>
      {onWish && (
        <button onClick={ev => onWish(e.id, ev)}
          style={{ flexShrink: 0, width: 32, height: 32, borderRadius: '50%', border: wished ? 'none' : '1px solid var(--border)', background: wished ? 'var(--accent)' : 'transparent', color: wished ? '#fff' : 'var(--sub)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          {wishIcon}
        </button>
      )}
    </div>
  )
}

export default function Display({ session }) {
  const { lang, t } = useLang()
  const nav = useNavigate()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ rice: '', yeast: '', type: '', smv: '', method: '', region: '' })
  const [searchOpen, setSearchOpen] = useState(false)
  const [filterCollapsed, setFilterCollapsed] = useState(false)
  const [detail, setDetail] = useState(null)
  const [detailAwards, setDetailAwards] = useState([])
  const [detailBrand, setDetailBrand] = useState(null) // null=loading, false=not found, object=found
  const [relatedEntries, setRelatedEntries] = useState([])
  const [relatedLoading, setRelatedLoading] = useState(false)
  const [lightboxImg, setLightboxImg] = useState(null)
  const [shareLoading, setShareLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [brandMap, setBrandMap] = useState({})
  const [myWishes, setMyWishes] = useState(new Set())
  const [awardedBreweries, setAwardedBreweries] = useState(new Set())
  const [layoutMode, setLayoutMode] = useState('grid')
  const sentinelRef = useRef(null)
  const checkedBreweriesRef = useRef(new Set())
  const pageRef = useRef(0)
  const loadingMoreRef = useRef(false)
  const PAGE_SIZE = 30

  const tagLabel = useTagResolver()
  const typeLabel = type => type ? tagLabel(type, 'type') : ''

  const fetchPage = async (pageNum) => {
    if (loadingMoreRef.current) return
    loadingMoreRef.current = true
    if (pageNum === 0) setLoading(true); else setLoadingMore(true)
    const { data } = await supabase.from('sake_entries').select('*')
      .eq('is_public', true).order('tasted_at', { ascending: false })
      .range(pageNum * PAGE_SIZE, pageNum * PAGE_SIZE + PAGE_SIZE - 1)
    const rows = data || []
    setEntries(prev => pageNum === 0 ? rows : [...prev, ...rows])
    setHasMore(rows.length === PAGE_SIZE)
    if (pageNum === 0) setLoading(false); else setLoadingMore(false)
    loadingMoreRef.current = false
  }

  useEffect(() => {
    fetchPage(0)
    supabase.from('sake_brands').select('name,furigana,romaji').limit(3000)
      .then(({ data }) => {
        const m = {}
        ;(data || []).forEach(b => { if (b.name) m[b.name] = { furigana: b.furigana || '', romaji: b.romaji || '' } })
        setBrandMap(m)
      })
  }, [])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !loadingMoreRef.current) {
        pageRef.current += 1
        fetchPage(pageRef.current)
      }
    }, { rootMargin: '300px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [hasMore])

  useEffect(() => {
    setDetailBrand(null)
    const lookup = detail?.brand || detail?.name
    if (!lookup) return
    const name = lookup.trim()
    supabase.from('sake_brands').select('name,name_zh,name_en,furigana,romaji').eq('name', name).limit(1)
      .then(({ data }) => {
        if (data?.length) { setDetailBrand(data[0]); return }
        const first = name.split(/[\s　・]/)[0]
        if (first.length >= 2) {
          supabase.from('sake_brands').select('name,name_zh,name_en,furigana,romaji').ilike('name', `${first}%`).limit(1)
            .then(({ data: d2 }) => setDetailBrand(d2?.[0] || false))
        } else {
          setDetailBrand(false)
        }
      })
  }, [detail?.id])

  useEffect(() => {
    if (!detail?.brewery) { setDetailAwards([]); return }
    const keyword = detail.brewery.replace(/(株式会社|有限会社|合資会社|合名会社|㈱|㈲)/g, '').trim().split(/[\s　]+/)[0]
    if (!keyword || keyword.length < 2) { setDetailAwards([]); return }
    supabase
      .from('sake_awards')
      .select('year,year_code,brand_name,is_gold')
      .ilike('brewery_name', `%${keyword}%`)
      .order('year', { ascending: false })
      .limit(10)
      .then(({ data }) => setDetailAwards(data || []))
  }, [detail?.brewery])

  useEffect(() => {
    if (!session) return
    supabase.from('sake_wishes').select('entry_id').eq('user_id', session.user.id)
      .then(({ data }) => setMyWishes(new Set((data || []).map(w => w.entry_id))))
  }, [session?.user?.id])

  useEffect(() => {
    const cleanKw = b => b.replace(/(株式会社|有限会社|合資会社|合名会社|㈱|㈲)/g, '').trim().split(/[\s　]+/)[0]
    const newBreweries = [...new Set(entries.map(e => e.brewery).filter(Boolean))]
      .filter(b => !checkedBreweriesRef.current.has(b))
    if (newBreweries.length === 0) return
    newBreweries.forEach(b => checkedBreweriesRef.current.add(b))
    const keywords = [...new Set(newBreweries.map(cleanKw).filter(k => k.length >= 2))]
    if (keywords.length === 0) return
    const orFilter = keywords.map(k => `brewery_name.ilike.%${k}%`).join(',')
    supabase.from('sake_awards').select('brewery_name').or(orFilter).limit(500)
      .then(({ data }) => {
        if (!data?.length) return
        const matched = new Set()
        for (const b of newBreweries) {
          const kw = cleanKw(b)
          if (kw.length >= 2 && data.some(a => a.brewery_name.includes(kw))) matched.add(b)
        }
        if (matched.size) setAwardedBreweries(prev => new Set([...prev, ...matched]))
      })
  }, [entries])

  useEffect(() => {
    if (!detail?.name) { setRelatedEntries([]); return }
    setRelatedLoading(true)
    let q = supabase.from('sake_entries')
      .select('id, rating, notes, contributor_name, tasted_at, photo_url')
      .eq('is_public', true)
      .eq('name', detail.name)
      .neq('id', detail.id)
      .order('tasted_at', { ascending: false })
      .limit(20)
    if (detail.brewery) q = q.eq('brewery', detail.brewery)
    q.then(({ data }) => { setRelatedEntries(data || []); setRelatedLoading(false) })
  }, [detail?.id])

  // Build filter chip options with counts from all fetched entries
  const chipOptions = useMemo(() => {
    const riceMap = new Map(), yeastMap = new Map(), typeMap = new Map()
    const smvMap = new Map(), methodMap = new Map(), regionMap = new Map()
    for (const e of entries) {
      // Rice — match against each standard variety's aliases
      for (const v of RICE_VARIETIES) {
        if (textMatchesVariety(e.rice, v)) riceMap.set(v.id, (riceMap.get(v.id) || 0) + 1)
      }
      // Yeast — same
      for (const v of YEAST_VARIETIES) {
        if (textMatchesVariety(e.yeast, v)) yeastMap.set(v.id, (yeastMap.get(v.id) || 0) + 1)
      }
      // Type
      if (e.type) typeMap.set(e.type, (typeMap.get(e.type) || 0) + 1)
      // SMV bucket
      const bucket = smvBucketOf(e)
      if (bucket) smvMap.set(bucket, (smvMap.get(bucket) || 0) + 1)
      // Method tags (objective brewing methods only)
      for (const mt of (e.method_tags || [])) {
        if (METHOD_TAG_ORDER.includes(mt)) methodMap.set(mt, (methodMap.get(mt) || 0) + 1)
      }
      // Region
      if (e.region) regionMap.set(e.region, (regionMap.get(e.region) || 0) + 1)
    }
    return {
      rice: RICE_VARIETIES.filter(v => riceMap.has(v.id)).map(v => ({ ...v, count: riceMap.get(v.id) }))
        .sort((a, b) => b.count - a.count),
      yeast: YEAST_VARIETIES.filter(v => yeastMap.has(v.id)).map(v => ({ ...v, count: yeastMap.get(v.id) }))
        .sort((a, b) => b.count - a.count),
      type: [...typeMap.entries()].map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count),
      smv: SMV_BUCKETS.filter(b => smvMap.has(b.id)).map(b => ({ ...b, count: smvMap.get(b.id) })),
      method: METHOD_TAG_ORDER.filter(m => methodMap.has(m)).map(m => ({ id: m, count: methodMap.get(m) })),
      region: [...regionMap.entries()].map(([id, count]) => ({ id, count })).sort((a, b) => a.id.localeCompare(b.id, 'ja')),
    }
  }, [entries])

  const setF = (k, v) => setFilters(p => ({ ...p, [k]: p[k] === v ? '' : v }))

  const filtered = entries.filter(e => {
    if (filters.type && e.type !== filters.type) return false
    if (filters.region && e.region !== filters.region) return false
    if (filters.smv && smvBucketOf(e) !== filters.smv) return false
    if (filters.method && !(e.method_tags || []).includes(filters.method)) return false
    if (filters.rice) {
      const v = RICE_VARIETIES.find(x => x.id === filters.rice)
      if (!v || !textMatchesVariety(e.rice, v)) return false
    }
    if (filters.yeast) {
      const v = YEAST_VARIETIES.find(x => x.id === filters.yeast)
      if (!v || !textMatchesVariety(e.yeast, v)) return false
    }
    if (search) {
      const q = search.toLowerCase()
      if ((e.brand || '').toLowerCase().includes(q)) return true
      if ((e.name || '').toLowerCase().includes(q)) return true
      if ((e.brewery || '').toLowerCase().includes(q)) return true
      if ((e.region || '').toLowerCase().includes(q)) return true
      if ((e.contributor_name || '').toLowerCase().includes(q)) return true
      if (e.tags?.some(t => t.toLowerCase().includes(q))) return true
      const bm = brandMap[e.brand || e.name]
      if (bm?.furigana && bm.furigana.includes(search)) return true
      if (bm?.romaji && bm.romaji.toLowerCase().includes(q)) return true
      return false
    }
    return true
  })

  const toggleWish = async (entryId, ev) => {
    ev.stopPropagation()
    if (!session) return
    if (myWishes.has(entryId)) {
      setMyWishes(prev => { const s = new Set(prev); s.delete(entryId); return s })
      await supabase.from('sake_wishes').delete().eq('user_id', session.user.id).eq('entry_id', entryId)
    } else {
      setMyWishes(prev => new Set([...prev, entryId]))
      await supabase.from('sake_wishes').insert({ user_id: session.user.id, entry_id: entryId })
    }
  }

// Editorial spec item — 数字或文本值，用 serif light 大字
const SpecFigureItem = ({ label, value, suffix, wiki }) => {
    const str = value != null && value !== '' ? String(value) : null
    if (!str) return (
      <div style={s.specItem}>
        <div style={s.specItemMark} />
        <div style={s.specName}>{label}</div>
        <div style={{ ...s.specFig, color: 'var(--border)', fontSize: 16 }}>—</div>
      </div>
    )
    // Detect if value is numeric (with optional +/- and decimal)
    const isNumeric = /^[+\-]?\d+(\.\d+)?$/.test(str.replace(/[%°]/g, ''))
    // Extract numeric part and unit if inline (e.g., "15%" → "15" + "%")
    const inlineUnitMatch = !suffix && str.match(/^([+\-]?\d+(?:\.\d+)?)(%|号|°C?)$/)
    const numPart = inlineUnitMatch ? inlineUnitMatch[1] : str
    const unit = suffix || inlineUnitMatch?.[2] || ''
    const useNumStyle = isNumeric || inlineUnitMatch
    return (
      <div style={s.specItem}>
        <div style={s.specItemMark} />
        <div style={s.specName}>{label}</div>
        <div style={useNumStyle ? s.specFig : s.specFigText}>
          {wiki ? <WikiText text={numPart} /> : numPart}
          {unit && <span style={s.specSuffix}>{unit}</span>}
        </div>
      </div>
    )
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length
  const clearFilters = () => setFilters({ rice: '', yeast: '', type: '', smv: '', method: '', region: '' })

  const dropLabel = { ja: { rice: '米', yeast: '酵母', method: '製法', region: '産地' },
                     zh: { rice: '米', yeast: '酵母', method: '製法', region: '產地' },
                     en: { rice: 'Rice', yeast: 'Yeast', method: 'Method', region: 'Region' } }[lang] || {}

  const dropSections = [
    { key: 'rice',   options: chipOptions.rice.map(o => ({ id: o.id, label: o.title[lang] || o.title.ja, count: o.count })) },
    { key: 'yeast',  options: chipOptions.yeast.map(o => ({ id: o.id, label: o.title[lang] || o.title.ja, count: o.count })) },
    { key: 'method', options: chipOptions.method.map(o => ({ id: o.id, label: cleanLabel(tagLabel(o.id, 'method')), count: o.count })) },
    { key: 'region', options: chipOptions.region.map(o => ({ id: o.id, label: o.id, count: o.count })) },
  ]
  const chipSections = [
    { key: 'type', label: { ja: 'タイプ',   zh: '類型',   en: 'Type' },
      options: chipOptions.type.map(o => ({ id: o.id, label: cleanLabel(typeLabel(o.id)), count: o.count })) },
    { key: 'smv',  label: { ja: '甘辛度',   zh: '甘辛度', en: 'Sweetness' },
      options: chipOptions.smv.map(o => ({ id: o.id, label: o.label[lang] || o.label.ja, count: o.count })) },
  ]

  const chipStyle = (active) => ({
    padding: '5px 12px', borderRadius: 16, cursor: 'pointer', fontSize: 12,
    border: active ? 'none' : '1px solid var(--border)',
    background: active ? 'var(--accent)' : 'var(--surface-card)',
    color: active ? '#fff' : 'var(--text)',
    fontFamily: 'var(--font-sans)',
    display: 'inline-flex', alignItems: 'center', gap: 5,
  })

  return (
    <div style={s.page}>
      <Nav session={session} />
      <BrandMarkFull />
      <div style={s.stickyBar}>
        <div style={s.stickyInner}>
          {/* Optional row 0 — search bar (opens on demand OR when filter yields nothing) */}
          {(searchOpen || (!loading && filtered.length === 0)) && (
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--sub)', pointerEvents: 'none' }}>
                <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
              </svg>
              <input autoFocus={searchOpen}
                style={{
                  width: '100%', height: 40, padding: '0 44px 0 42px', borderRadius: 20,
                  border: '1px solid var(--border)', background: 'var(--surface-card)',
                  color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                  fontFamily: 'var(--font-sans)',
                }}
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder={t('search')} />
              {(search || searchOpen) && (
                <button onClick={() => { setSearch(''); setSearchOpen(false) }}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--sub)', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 4 }}>
                  ×
                </button>
              )}
            </div>
          )}

          {filterCollapsed ? (
            /* Collapsed — single-line summary bar */
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button onClick={() => setFilterCollapsed(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0,
                  height: 32, padding: '0 12px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'transparent',
                  color: activeFilterCount > 0 ? 'var(--accent)' : 'var(--sub)',
                  fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  whiteSpace: 'nowrap', overflow: 'hidden',
                }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
                </svg>
                <span>{lang === 'ja' ? '絞り込み' : lang === 'zh' ? '篩選' : 'Filters'}</span>
                {activeFilterCount > 0 && (
                  <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 600 }}>{activeFilterCount}</span>
                )}
                <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: 10 }}>▼</span>
              </button>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters}
                  style={{ height: 32, width: 30, padding: 0, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--sub)', fontSize: 14, cursor: 'pointer', flexShrink: 0 }}>
                  ×
                </button>
              )}
              <button onClick={() => setSearchOpen(o => !o)}
                title={t('search')}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)',
                  background: searchOpen || search ? 'var(--accent-bg, rgba(124,58,40,.10))' : 'transparent',
                  color: searchOpen || search ? 'var(--accent)' : 'var(--sub)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
                </svg>
              </button>
            </div>
          ) : (
            <>
              {/* Row 1: compact dropdowns (single line, equally distributed) + collapse + search icon */}
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'nowrap', marginBottom: 10 }}>
                {dropSections.map(sec => (
                  <select key={sec.key}
                    style={{
                      height: 30, padding: '0 20px 0 8px', borderRadius: 6,
                      border: '1px solid var(--border)',
                      background: `${filters[sec.key] ? 'var(--accent-bg, rgba(124,58,40,.10))' : 'transparent'} url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='rgba(160,140,120,0.5)'/%3E%3C/svg%3E") no-repeat right 7px center`,
                      color: filters[sec.key] ? 'var(--accent)' : 'var(--sub)', fontSize: 12,
                      outline: 'none', appearance: 'none', cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                      flex: '1 1 0', minWidth: 0,
                      textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap',
                    }}
                    value={filters[sec.key]}
                    onChange={e => setFilters(p => ({ ...p, [sec.key]: e.target.value }))}
                    disabled={sec.options.length === 0}>
                    <option value="">{dropLabel[sec.key] || sec.key}</option>
                    {sec.options.map(o => (
                      <option key={o.id} value={o.id}>{o.label} ({o.count})</option>
                    ))}
                  </select>
                ))}
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters}
                    title={String(activeFilterCount)}
                    style={{ height: 30, width: 26, padding: 0, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--sub)', fontSize: 14, cursor: 'pointer', flexShrink: 0 }}>
                    ×
                  </button>
                )}
                <button onClick={() => setSearchOpen(o => !o)}
                  title={t('search')}
                  style={{
                    width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border)',
                    background: searchOpen || search ? 'var(--accent-bg, rgba(124,58,40,.10))' : 'transparent',
                    color: searchOpen || search ? 'var(--accent)' : 'var(--sub)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
                  </svg>
                </button>
                <button onClick={() => setFilterCollapsed(true)}
                  title={lang === 'ja' ? '閉じる' : lang === 'zh' ? '收起' : 'Collapse'}
                  style={{
                    width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border)',
                    background: 'transparent', color: 'var(--sub)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10,
                  }}>
                  ▲
                </button>
              </div>

              {/* Row 2: chip sections for type + 甘辛度 (direct-pick) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {chipSections.map(sec => sec.options.length > 0 && (
                  <div key={sec.key} style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ fontSize: 10, letterSpacing: '.08em', color: 'var(--sub)', fontWeight: 500, minWidth: 42 }}>
                      {(sec.label[lang] || sec.label.ja).toUpperCase()}
                    </div>
                    {sec.options.map(opt => {
                      const active = filters[sec.key] === opt.id
                      return (
                        <button key={opt.id} onClick={() => setF(sec.key, opt.id)} style={chipStyle(active)}>
                          {opt.label}
                          <span style={{ fontSize: 10, opacity: active ? 0.75 : 0.55 }}>{opt.count}</span>
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div style={s.main}>
        {/* Layout mode toggle */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
          <div style={{ display: 'flex', gap: 2, background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 3 }}>
            {[
              ['grid', <svg key="g" width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="1" y="1" width="5.5" height="5.5" rx="1.2"/><rect x="7.5" y="1" width="5.5" height="5.5" rx="1.2"/><rect x="1" y="7.5" width="5.5" height="5.5" rx="1.2"/><rect x="7.5" y="7.5" width="5.5" height="5.5" rx="1.2"/></svg>],
              ['list', <svg key="l" width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="1" y="1.5" width="4.5" height="5" rx="1"/><rect x="6.5" y="2.5" width="6.5" height="1.3" rx=".65"/><rect x="6.5" y="4.7" width="5" height="1.3" rx=".65"/><rect x="1" y="8.5" width="4.5" height="4" rx="1"/><rect x="6.5" y="9.5" width="6.5" height="1.3" rx=".65"/><rect x="6.5" y="11.2" width="4" height="1.3" rx=".65"/></svg>],
            ].map(([m, icon]) => (
              <button key={m} onClick={() => setLayoutMode(m)} style={{
                width: 30, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 7, border: 'none', cursor: 'pointer',
                background: layoutMode === m ? 'var(--accent)' : 'transparent',
                color: layoutMode === m ? '#fff' : 'var(--sub)',
                transition: 'all .15s',
              }}>{icon}</button>
            ))}
          </div>
        </div>

        {!session && (
          <div style={{ textAlign: 'center', padding: '6px 0 14px', fontSize: 12, color: 'var(--sub)' }}>
            <a href="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>{t('display.loginHint')}</a>
          </div>
        )}

        {loading && <p style={s.empty}>{t('loading')}</p>}
        {!loading && filtered.length === 0 && <p style={s.empty}>{search ? t('noResults', { q: search }) : t('noEntries')}</p>}

        {(() => {
          const isGuest = !session
          return (
            <div style={{ position: 'relative' }}>
              <div style={layoutMode === 'grid' ? s.gridContainer : s.listContainer}>
                {filtered.map(e => (
                  <SakeCard key={e.id} e={e} lang={lang} typeLabel={typeLabel} tagLabel={tagLabel} onOpen={setDetail}
                    wished={myWishes.has(e.id)} onWish={session ? toggleWish : null}
                    awarded={awardedBreweries.has(e.brewery)} mode={layoutMode} isGuest={isGuest} />
                ))}
              </div>
              {hasMore && (
                <div ref={sentinelRef} style={{ height: 1 }} />
              )}
              {loadingMore && (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--sub)', fontSize: 13 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                    style={{ animation: 'spin 1s linear infinite', verticalAlign: 'middle', marginRight: 6 }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  {lang === 'ja' ? '読み込み中…' : lang === 'zh' ? '載入中…' : 'Loading…'}
                </div>
              )}
            </div>
          )
        })()}
      </div>

      {/* Detail modal */}
      {detail && (
        <div style={s.backdrop} onClick={() => setDetail(null)}>
          <div style={s.detModal} onClick={e => e.stopPropagation()}>
          {session && <button
              onClick={async () => {
                if (shareLoading) return
                setShareLoading(true)
                try {
                  const { generateShareCard, canvasToBlob } = await import('../lib/shareCard.js')
                  const entryWithLabels = {
                    ...detail,
                    aroma_tags_labels: detail.aroma_tags?.map(id => tagLabel(id, 'aroma')),
                    taste_tags_labels: detail.taste_tags?.map(id => tagLabel(id, 'taste')),
                    tags_labels: detail.tags?.map(id => tagLabel(id, 'flavor')),
                  }
                  const canvas = await generateShareCard(entryWithLabels, lang, getTheme())
                  const blob = await canvasToBlob(canvas)
                  const file = new File([blob], `${detail.name}.png`, { type: 'image/png' })
                  if (navigator.canShare?.({ files: [file] })) {
                    await navigator.share({ files: [file], title: detail.name, text: detail.brewery || '' })
                  } else {
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url; a.download = `${detail.name}.png`; a.click()
                    URL.revokeObjectURL(url)
                  }
                } catch(e) { if (e?.name !== 'AbortError') console.error(e) }
                finally { setShareLoading(false) }
              }}
              disabled={shareLoading}
              title={lang === 'ja' ? '画像をシェア' : lang === 'zh' ? '分享圖片' : 'Share image'}
              style={{ position: 'absolute', top: 12, right: 12, width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'var(--green)', color: '#fff', cursor: shareLoading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, opacity: shareLoading ? 0.65 : 1, transition: 'opacity .2s' }}>
              {shareLoading
                ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="8.5 5.5 12 2 15.5 5.5"/>
                    <line x1="12" y1="2" x2="12" y2="14"/>
                    <path d="M7 10.5H5a1 1 0 0 0-1 1V20a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8.5a1 1 0 0 0-1-1h-2"/>
                  </svg>}
            </button>}

            <div style={s.detTop}>
              {session && detail.photo_url
                ? <img style={s.detPhoto} src={detail.photo_url} alt={detail.name} />
                : <div style={s.detPhotoPlaceholder}>🍶</div>}
              <div style={s.detRight}>
                <MarkSVGAbs />
                {/* 銘柄 · 类型（同一行）*/}
                {(detail.brand || detail.type) && (() => {
                  const brandKanji = detailBrand ? displayName(detailBrand, lang).kanji : detail.brand
                  return (
                    <div style={s.detBrandTypeRow}>
                      {detail.brand && <span style={s.detBrandName}>{brandKanji}</span>}
                      {detail.brand && detail.type && <span style={s.detDivider}>·</span>}
                      {detail.type && <span><WikiText text={cleanLabel(typeLabel(detail.type))} /></span>}
                    </div>
                  )
                })()}
                {/* Product hero */}
                {(detail.name || (!detail.brand)) && (
                  <div style={s.detProduct}>
                    <WikiText text={detail.name || detail.brand || ''} />
                  </div>
                )}
                {detailBrand && (lang === 'ja' ? detailBrand.furigana : detailBrand.romaji) && (
                  <div style={s.detReading}>
                    {lang === 'ja' ? detailBrand.furigana : detailBrand.romaji}
                  </div>
                )}
                {detail.name_reading && (
                  <div style={s.detReading}>{detail.name_reading}</div>
                )}
                {/* 酒造 · 都道府県 */}
                {(detail.brewery || detail.region) && (
                  <div style={s.detBrewery}>
                    {detail.brewery && <span style={s.detBreweryName}>{detail.brewery}</span>}
                    {detail.brewery && detail.region && <span> · {detail.region}</span>}
                    {!detail.brewery && detail.region && <span>{detail.region}</span>}
                  </div>
                )}
                {session && <div style={{ marginTop: 10 }}><Stars rating={detail.rating} size={13} /></div>}
                {session && detail.tasted_at && <div style={s.detMeta}>{detail.tasted_at}</div>}
                {session && detail.contributor_name && (
                  <div style={s.detContributor}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4A7A35', display: 'inline-block', flexShrink: 0 }} />
                    {detail.contributor_name}
                  </div>
                )}
              </div>
            </div>

            {session && (
              <div style={{ display: 'flex', gap: 8, padding: '10px 12px 6px' }}>
                {/* 想喝 — icon only */}
                <button
                  onClick={() => toggleWish(detail.id, { stopPropagation: () => {} })}
                  title={myWishes.has(detail.id) ? (lang === 'zh' ? '從想喝清單移除' : lang === 'ja' ? '想喝リストから削除' : 'Remove from wish list') : (lang === 'zh' ? '加入想喝清單' : lang === 'ja' ? '想喝リストに追加' : 'Add to wish list')}
                  style={{
                    width: 46, height: 38, flexShrink: 0, borderRadius: 20, padding: 0,
                    border: `1px solid ${myWishes.has(detail.id) ? 'transparent' : 'var(--border)'}`,
                    background: myWishes.has(detail.id) ? 'var(--accent)' : 'var(--bg)',
                    color: myWishes.has(detail.id) ? '#fff' : 'var(--sub)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .2s',
                  }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={myWishes.has(detail.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                  </svg>
                </button>
                {/* 記録する — text, fills remaining space */}
                <button
                  onClick={() => {
                    const forward = {
                      brand: detail.brand, name: detail.name, brewery: detail.brewery, region: detail.region,
                      type: detail.type, alcohol: detail.alcohol, rice: detail.rice,
                      polishing: detail.polishing, smv: detail.smv, acidity: detail.acidity,
                      yeast: detail.yeast,
                    }
                    setDetail(null)
                    nav('/journal', { state: { forward } })
                  }}
                  style={{
                    flex: 1, height: 38, borderRadius: 20, padding: '0 12px',
                    border: '1px solid var(--border)', background: 'var(--bg)',
                    color: 'var(--text)', fontSize: 13, cursor: 'pointer',
                    fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    transition: 'all .2s',
                  }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                  </svg>
                  {lang === 'zh' ? '記錄這瓶酒' : lang === 'ja' ? 'この酒を記録する' : 'Log this sake'}
                </button>
              </div>
            )}

            {/* Editorial spec section (酒質) */}
            <div style={s.specSection}>
              <div style={s.specHeader}>{lang === 'ja' ? '酒質' : lang === 'zh' ? '酒質' : 'Characteristics'}</div>
              <div style={s.specGrid}>
                <SpecFigureItem label={t('detail.polishing')} value={detail.polishing} suffix="%" />
                <SpecFigureItem label={t('detail.rice')} value={localizedTerm(detail.rice, lang)} wiki />
                <SpecFigureItem label={t('detail.yeast')} value={localizedTerm(detail.yeast, lang)} wiki />
                <SpecFigureItem label={t('detail.alcohol')} value={detail.alcohol} suffix="%" />
                <SpecFigureItem label={t('detail.smv')} value={detail.smv} />
                <SpecFigureItem label={t('detail.acidity')} value={detail.acidity} />
              </div>
            </div>

            {/* Notes prose */}
            {session && detail.notes && (
              <div style={s.notesProse}><WikiText text={detail.notes} /></div>
            )}

            {/* Tag section */}
            {session && (detail.aroma_tags?.length > 0 || detail.taste_tags?.length > 0 || detail.tags?.length > 0) && (
              <div style={s.tagSection}>
                <div style={s.specHeader}>{lang === 'ja' ? '香味特徵' : lang === 'zh' ? '香味特徵' : 'Tasting Notes'}</div>
                {detail.aroma_tags?.length > 0 && (
                  <div style={s.tagBlock}>
                    <div style={s.tagLabel}>{t('detail.aroma')}</div>
                    <div style={s.tagsRow}>
                      {detail.aroma_tags.map(id => (
                        <span key={id} style={s.tagChip}>{tagLabel(id, 'aroma')}</span>
                      ))}
                    </div>
                  </div>
                )}
                {detail.taste_tags?.length > 0 && (
                  <div style={s.tagBlock}>
                    <div style={s.tagLabel}>{t('detail.taste')}</div>
                    <div style={s.tagsRow}>
                      {detail.taste_tags.map(id => (
                        <span key={id} style={s.tagChip}>{tagLabel(id, 'taste')}</span>
                      ))}
                    </div>
                  </div>
                )}
                {detail.tags?.length > 0 && (
                  <div style={s.tagBlock}>
                    <div style={s.tagLabel}>{lang === 'ja' ? 'その他' : lang === 'zh' ? '其他' : 'Other'}</div>
                    <div style={s.tagsRow}>
                      {detail.tags.map(tg => (
                        <span key={tg} style={s.tagChip}>{tagLabel(tg, 'flavor')}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bottling date / drinking date — minor meta */}
            {(detail.bottling_date) && (
              <div style={{ padding: '6px 20px', fontSize: 11, color: 'var(--sub)', letterSpacing: '.05em' }}>
                {t('detail.bottling')}: {detail.bottling_date}
              </div>
            )}

            {/* Awards section — grouped by category */}
            {detailAwards.length > 0 && (
              <div style={s.awardSection}>
                <div style={s.awardHeader}>{lang === 'ja' ? '受賞記錄' : lang === 'zh' ? '得獎記錄' : 'Awards'}</div>
                {(() => {
                  // Group awards by prefix + is_gold
                  const groups = {}
                  detailAwards.forEach(a => {
                    const isSC = a.year_code?.startsWith('SC_')
                    const isIWC = a.year_code?.startsWith('IWC_')
                    const cat = isSC ? 'SC' : isIWC ? 'IWC' : (lang === 'ja' ? '全国新酒鑑評会' : lang === 'zh' ? '全國新酒鑑評會' : 'NRIB')
                    const medal = a.is_gold ? 'gold' : 'silver'
                    const key = `${cat}-${medal}`
                    if (!groups[key]) groups[key] = { cat, gold: a.is_gold, years: [] }
                    if (!groups[key].years.includes(a.year_code || a.year)) {
                      groups[key].years.push(a.year_code || a.year)
                    }
                  })
                  return Object.entries(groups).map(([key, g]) => (
                    <div key={key} style={s.awardRow}>
                      <div style={s.awardCategory}>
                        <span>{g.cat}</span>
                        <span style={s.awardMedal(g.gold)}>{g.gold ? (lang === 'en' ? 'Gold' : '金賞') : (lang === 'en' ? 'Silver' : '銀賞')}</span>
                      </div>
                      <div style={s.awardYears}>
                        {g.years.map((y, i) => <span key={i} style={s.awardYearBadge}>{y}</span>)}
                      </div>
                    </div>
                  ))
                })()}
              </div>
            )}

            {/* Other prose (aroma/taste text) */}
            {(detail.aroma || detail.taste) && (
              <div style={{ padding: '8px 20px', fontSize: 13, color: 'var(--sub)', lineHeight: 1.7 }}>
                {detail.aroma && <p><strong style={{ color: 'var(--text)' }}>{t('detail.aroma')}：</strong><WikiText text={detail.aroma} /></p>}
                {detail.taste && <p><strong style={{ color: 'var(--text)' }}>{t('detail.taste')}：</strong><WikiText text={detail.taste} /></p>}
              </div>
            )}

            <div style={{ padding: '8px 20px 20px' }}>
              {session && (relatedLoading || relatedEntries.length > 0) && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 9, color: 'var(--sub)', letterSpacing: '.06em', marginBottom: 6, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
                    {lang === 'ja' ? '他の記録' : lang === 'zh' ? '其他記錄' : 'Other Logs'}
                    {!relatedLoading && <span style={{ marginLeft: 6, opacity: .6 }}>{relatedEntries.length}</span>}
                  </div>
                  {relatedLoading
                    ? <div style={{ fontSize: 12, color: 'var(--sub)', padding: '8px 0' }}>…</div>
                    : relatedEntries.map(r => (
                      <div key={r.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                        {r.photo_url
                          ? <img src={r.photo_url} onClick={() => setLightboxImg(r.photo_url)}
                              style={{ width: 42, height: 54, objectFit: 'cover', borderRadius: 6, flexShrink: 0, cursor: 'pointer' }} />
                          : <div style={{ width: 42, height: 54, borderRadius: 6, flexShrink: 0, background: 'var(--photo-ph)' }} />}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <Stars rating={r.rating} size={10} />
                            {r.contributor_name && <span style={{ fontSize: 11, color: 'var(--sub)' }}>{r.contributor_name}</span>}
                            <span style={{ fontSize: 10, color: 'var(--border)', marginLeft: 'auto', flexShrink: 0 }}>{r.tasted_at}</span>
                          </div>
                          {r.notes && (
                            <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.55, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {r.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {lightboxImg && (
        <div onClick={() => setLightboxImg(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.9)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <img src={lightboxImg} style={{ maxWidth: '100%', maxHeight: '90svh', borderRadius: 10, objectFit: 'contain' }} />
        </div>
      )}
    </div>
  )
}
