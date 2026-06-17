import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Nav from '../components/Nav'
import Stars, { StarsLight } from '../components/Stars'
import { BrandMarkFull } from '../components/BrandMark'
import { useLang } from '../contexts/LangContext'
import { getTagLabel, getFlavorTagLabel, SAKE_TYPES } from '../lib/i18n'
import { getTheme } from '../lib/theme'
import { WikiText } from '../components/WikiTooltip'


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
  gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 },
  listContainer: { display: 'flex', flexDirection: 'column', gap: 10 },
  // Original grid card — vertical
  gridCard: { background: 'var(--surface-card)', border: '1px solid var(--card-border)', borderRadius: 14, cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,.1), inset 0 1px 0 rgba(220,240,255,.06)', transition: 'transform .15s', overflow: 'hidden' },
  gridFrame: { position: 'relative', overflow: 'hidden', aspectRatio: '3/4' },
  gridImg: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' },
  gridOverlay: { position: 'absolute', inset: 0, background: 'var(--card-overlay)', pointerEvents: 'none' },
  gridNoPhoto: { position: 'absolute', inset: 0, background: 'var(--card-no-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  gridKanji: { fontFamily: 'var(--font-serif)', fontSize: 44, color: 'var(--card-no-text)', writingMode: 'vertical-rl', letterSpacing: '-.04em', userSelect: 'none' },
  gridBody: { padding: '8px 10px 10px' },
  gridType: { fontSize: 8, letterSpacing: '.08em', color: 'var(--card-type)', marginBottom: 2 },
  gridName: { fontFamily: 'var(--font-serif)', fontSize: 13, fontWeight: 400, lineHeight: 1.3, color: 'var(--text)', marginBottom: 2 },
  gridBrewery: { fontSize: 10, color: 'var(--sub)' },
  gridAward: { fontSize: 9, color: '#8A6C00', background: 'rgba(180,140,0,.10)', border: '1px solid rgba(180,140,0,.28)', borderRadius: 6, padding: '1px 6px', display: 'inline-block', marginTop: 4 },
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
  // Detail
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(26,22,20,.6)', zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  detModal: { background: 'var(--surface-card)', borderRadius: 20, width: '100%', maxWidth: 660, maxHeight: '90svh', overflow: 'hidden auto', position: 'relative' },
  detClose: { position: 'absolute', top: 12, right: 12, width: 30, height: 30, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--sub)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  detTop: { display: 'flex', gap: 0, alignItems: 'flex-start', padding: '12px 12px 6px' },
  detPhoto: { width: 120, height: 150, objectFit: 'cover', flexShrink: 0, borderRadius: 10 },
  detPhotoPlaceholder: { width: 120, height: 150, background: 'var(--photo-ph)', flexShrink: 0, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, color: 'var(--photo-ph-icon)' },
  detRight: { flex: 1, padding: '2px 48px 0 12px', minWidth: 0, position: 'relative', overflow: 'hidden' },
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
    position: 'sticky', top: 52, zIndex: 30,
    background: 'var(--stickybar-bg)',
    backdropFilter: 'blur(28px) saturate(1.8)',
    WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
    borderBottom: '1px solid var(--tabbar-border)',
    padding: '10px 16px',
  },
  stickyInner: { maxWidth: 1100, margin: '0 auto' },
}

function SakeCard({ e, lang, typeLabel, onOpen, wished, onWish, awarded, mode = 'grid' }) {
  const wishIcon = (
    <svg width="13" height="13" viewBox="0 0 24 24" fill={wished ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>
  )

  if (mode === 'grid') {
    return (
      <div style={s.gridCard} onClick={() => onOpen(e)}>
        <div style={s.gridFrame}>
          {e.photo_url ? (
            <><img style={s.gridImg} src={e.photo_url} alt={e.name} /><div style={s.gridOverlay} /></>
          ) : (
            <div style={s.gridNoPhoto}><div style={s.gridKanji}>{(e.brand || e.name)?.slice(0, 2) || '酒'}</div></div>
          )}
          {onWish && (
            <button onClick={ev => onWish(e.id, ev)}
              style={{ position: 'absolute', top: 6, right: 6, width: 32, height: 32, borderRadius: '50%', border: wished ? 'none' : '1px solid rgba(255,255,255,.3)', background: wished ? 'var(--accent)' : 'rgba(0,0,0,.4)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2, backdropFilter: 'blur(4px)' }}>
              {wishIcon}
            </button>
          )}
        </div>
        <div style={s.gridBody}>
          {e.type && <div style={s.gridType}>{typeLabel(e.type)}</div>}
          <div style={s.gridName}>{[e.brand, e.name].filter(Boolean).join(' ')}</div>
          {(e.brewery || e.region) && <div style={s.gridBrewery}>{[e.brewery, e.region].filter(Boolean).join(' · ')}</div>}
          {awarded && <div style={s.gridAward}>★ 受賞</div>}
        </div>
      </div>
    )
  }

  // list mode
  return (
    <div style={s.listCard} onClick={() => onOpen(e)}>
      <div style={s.listThumb}>
        {e.photo_url
          ? <img style={s.listThumbImg} src={e.photo_url} alt={e.name} />
          : <div style={s.listThumbNo}><span style={s.listKanji}>{(e.brand || e.name)?.slice(0, 2) || '酒'}</span></div>
        }
      </div>
      <div style={s.listBody}>
        {e.type && <div style={s.listType}>{typeLabel(e.type)}</div>}
        <div style={s.listName}>{[e.brand, e.name].filter(Boolean).join(' ')}</div>
        {(e.brewery || e.region) && <div style={s.listBrewery}>{[e.brewery, e.region].filter(Boolean).join(' · ')}</div>}
        <div style={s.listMeta}>
          {e.rating > 0 && <Stars rating={e.rating} size={10} />}
          {awarded && <span style={s.listAward}>★ 受賞</span>}
        </div>
        {e.aroma_tags?.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
            {e.aroma_tags.slice(0, 3).map(id => (
              <span key={id} style={s.listAromaTag}>{getTagLabel(id, 'aroma', lang)}</span>
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
  const [activeTag, setActiveTag] = useState('')
  const [tagsExp, setTagsExp] = useState(false)
  const [filters, setFilters] = useState({ type: '', brewery: '', region: '', rice: '', rating: '' })
  const [filtersOpen, setFiltersOpen] = useState(false)
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

  const typeLabel = type => {
    if (!type) return ''
    const found = SAKE_TYPES.find(s => s.id === type)
    if (!found) return type
    if (lang === 'zh') return found.zh
    if (lang === 'en') return found.en
    return found.id
  }

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
    supabase.from('sake_brands').select('furigana,romaji').eq('name', name).limit(1)
      .then(({ data }) => {
        if (data?.length) { setDetailBrand(data[0]); return }
        const first = name.split(/[\s　・]/)[0]
        if (first.length >= 2) {
          supabase.from('sake_brands').select('furigana,romaji').ilike('name', `${first}%`).limit(1)
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

  const allTags = [...new Set(entries.flatMap(e => e.tags || []))]
  const topTags = allTags.slice(0, 6)
  const visibleTags = tagsExp ? allTags : topTags

  const types = [...new Set(entries.map(e => e.type).filter(Boolean))]
  const breweries = [...new Set(entries.map(e => e.brewery).filter(Boolean))]
  const regions = [...new Set(entries.map(e => e.region).filter(Boolean))].sort()
  const rices = [...new Set(entries.map(e => e.rice).filter(Boolean))]

  const setF = (k, v) => setFilters(p => ({ ...p, [k]: v }))

  const filtered = entries.filter(e => {
    if (activeTag && !e.tags?.includes(activeTag)) return false
    if (filters.type && e.type !== filters.type) return false
    if (filters.brewery && e.brewery !== filters.brewery) return false
    if (filters.region && e.region !== filters.region) return false
    if (filters.rice && e.rice !== filters.rice) return false
    if (filters.rating && (e.rating || 0) < Number(filters.rating)) return false
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

  const Cell = ({ label, value, wiki }) => (
    <div style={s.detCell}>
      <div style={s.detCellLabel}>{label}</div>
      {value != null && value !== ''
        ? <div style={s.detCellValue}>{wiki ? <WikiText text={value} /> : value}</div>
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
              <>
                {activeFilterCount > 0 && (
                  <button onClick={() => { setFilters({ type: '', brewery: '', region: '', rice: '', rating: '' }); setActiveTag('') }}
                    style={{ flexShrink: 0, height: 42, padding: '0 12px', borderRadius: 20, border: '1px solid var(--border)', background: 'transparent', color: 'var(--sub)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap', boxSizing: 'border-box' }}>
                    ×
                  </button>
                )}
                <button onClick={() => setFiltersOpen(x => !x)}
                  style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '0 14px', height: 42, borderRadius: 20, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap', boxSizing: 'border-box' }}>
                  {t('display.filters')}
                  {activeFilterCount > 0
                    ? <span style={{ background: 'rgba(255,255,255,.25)', borderRadius: 20, padding: '1px 7px', fontSize: 11, fontWeight: 600 }}>{activeFilterCount}</span>
                    : <span style={{ fontSize: 10, opacity: 0.8 }}>{filtersOpen ? '▲' : '▼'}</span>}
                </button>
              </>
            )}
          </div>

          {/* Collapsible filter panel — logged-in only */}
          {session && filtersOpen && (
            <>
              <div style={s.dropRow}>
                <select style={s.drop} value={filters.type} onChange={e => setF('type', e.target.value)}>
                  <option value="">{t('filter.type')}</option>
                  {types.map(tp => <option key={tp} value={tp}>{typeLabel(tp)}</option>)}
                </select>
                <select style={s.drop} value={filters.region} onChange={e => setF('region', e.target.value)}>
                  <option value="">{t('filter.region')}</option>
                  {regions.map(r => <option key={r}>{r}</option>)}
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
          const GUEST_LIMIT = 10
          const isGuest = !session
          const visible = isGuest ? filtered.slice(0, GUEST_LIMIT) : filtered
          const locked = isGuest && filtered.length > GUEST_LIMIT
          return (
            <div style={{ position: 'relative' }}>
              <div style={layoutMode === 'grid' ? s.gridContainer : s.listContainer}>
                {visible.map(e => (
                  <SakeCard key={e.id} e={e} lang={lang} typeLabel={typeLabel} onOpen={setDetail}
                    wished={myWishes.has(e.id)} onWish={session ? toggleWish : null}
                    awarded={awardedBreweries.has(e.brewery)} mode={layoutMode} />
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
              {!isGuest && hasMore && (
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
          <button
              onClick={async () => {
                if (shareLoading) return
                setShareLoading(true)
                try {
                  const { generateShareCard, canvasToBlob } = await import('../lib/shareCard.js')
                  const entryWithLabels = {
                    ...detail,
                    aroma_tags_labels: detail.aroma_tags?.map(id => getTagLabel(id, 'aroma', lang)),
                    taste_tags_labels: detail.taste_tags?.map(id => getTagLabel(id, 'taste', lang)),
                    tags_labels: detail.tags?.map(id => getFlavorTagLabel(id, lang)),
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
            </button>

            <div style={s.detTop}>
              {detail.photo_url
                ? <img style={s.detPhoto} src={detail.photo_url} alt={detail.name} />
                : <div style={s.detPhotoPlaceholder}>🍶</div>}
              <div style={s.detRight}>
                <MarkSVGAbs />
                {detail.type && <div style={s.detTypeTag}><WikiText text={typeLabel(detail.type)} /></div>}
                {detail.brand
                  ? <>
                      {detailBrand && (lang === 'ja' ? detailBrand.furigana : detailBrand.romaji) && (
                        <div style={{ fontSize: 11, color: 'var(--sub)', letterSpacing: '.07em', marginBottom: 3, fontFamily: 'var(--font-sans)', lineHeight: 1.2 }}>
                          {lang === 'ja' ? detailBrand.furigana : detailBrand.romaji}
                        </div>
                      )}
                      <div style={{ ...s.detName, marginBottom: 4 }}>
                        {detail.brand}
                      </div>
                      {detail.name && (
                        <div style={{ marginBottom: 5 }}>
                          <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.35, marginBottom: detail.name_reading ? 2 : 0 }}>
                            <WikiText text={detail.name} />
                          </div>
                          {detail.name_reading && (
                            <div style={{ fontSize: 10, color: 'var(--sub)', letterSpacing: '.05em', fontFamily: 'var(--font-sans)', lineHeight: 1.2 }}>
                              {detail.name_reading}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  : <div style={{ ...s.detName, marginBottom: 5 }}>
                      <WikiText text={detail.name || ''} />
                    </div>
                }
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
                <Cell label={t('detail.rice')} value={detail.rice} wiki />
                <Cell label={t('detail.yeast')} value={detail.yeast} wiki />
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
                    {lang === 'ja' ? '受賞歴' : lang === 'zh' ? '得獎記錄' : 'Awards'}
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {detailAwards.map((a, i) => {
                      const isSC = a.year_code?.startsWith('SC_')
                      const isIWC = a.year_code?.startsWith('IWC_')
                      const prefix = isSC ? 'SC' : isIWC ? 'IWC' : '鑑'
                      return (
                        <span key={i} title={a.brand_name}
                          style={{ fontSize: 10, padding: '2px 9px', borderRadius: 12, whiteSpace: 'nowrap',
                            background: a.is_gold ? 'rgba(180,140,0,.10)' : 'var(--bg)',
                            color: a.is_gold ? '#8A6C00' : 'var(--sub)',
                            border: `1px solid ${a.is_gold ? 'rgba(180,140,0,.28)' : 'var(--border)'}` }}>
                          {a.is_gold ? '★' : '○'} {prefix} {a.year}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
              {(relatedLoading || relatedEntries.length > 0) && (
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
