import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Nav from '../components/Nav'
import Stars, { StarsLight } from '../components/Stars'
import { BrandMarkFull } from '../components/BrandMark'
import { useLang } from '../contexts/LangContext'
import { getTagLabel, getFlavorTagLabel, SAKE_TYPES } from '../lib/i18n'

const WaveDivider = () => (
  <svg style={{ display: 'block', width: '100%', height: 18, margin: '2px 0' }}
    viewBox="0 0 400 20" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0,10 C30,4 60,3 100,8 C140,13 160,14 200,10 C240,6 270,4 310,8 C340,11 370,13 400,10"
      fill="none" stroke="#7C3A28" strokeWidth="1" opacity="0.35" strokeLinecap="round" />
  </svg>
)

const MARK_SVG_ABS = (
  <svg style={{ position: 'absolute', right: -40, bottom: -40, width: 200, height: 200, opacity: .065, pointerEvents: 'none', zIndex: 0 }}
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
  page: { minHeight: '100svh', background: 'var(--bg)' },
  main: { maxWidth: 1100, margin: '0 auto', padding: '20px 16px 60px' },
  searchRow: { display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' },
  searchInput: { flex: 1, padding: '9px 14px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--surface-card)', color: 'var(--text)', fontSize: 14, outline: 'none' },
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
  card: { borderRadius: 14, overflow: 'hidden', cursor: 'pointer', position: 'relative', aspectRatio: '3/4' },
  cardImg: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' },
  cardOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,.05) 0%, rgba(0,0,0,.25) 40%, rgba(0,0,0,.75) 75%, rgba(0,0,0,.88) 100%)' },
  cardNo: { position: 'absolute', inset: 0, background: '#2d2520', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: 'rgba(255,245,230,.15)' },
  cardBody: { position: 'absolute', inset: 0, padding: '10px 11px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', color: '#fff' },
  cardType: { fontSize: 9, letterSpacing: '.08em', color: 'rgba(255,245,230,.7)', marginBottom: 3 },
  cardName: { fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 400, lineHeight: 1.35, marginBottom: 3 },
  cardBrewery: { fontSize: 11, color: 'rgba(255,245,230,.75)', marginBottom: 5 },
  cardMeta: { fontSize: 9, color: 'rgba(255,245,230,.5)', marginTop: 4 },
  cardContributor: { fontSize: 9, color: 'rgba(255,245,230,.45)', marginTop: 2 },
  cardTags: { display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 7 },
  cardTag: { fontSize: 9, padding: '2px 7px', borderRadius: 20, background: 'rgba(255,245,230,.1)', color: 'rgba(255,245,230,.85)', border: '1px solid rgba(255,245,230,.12)' },
  // Detail
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(26,22,20,.6)', zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  detModal: { background: 'var(--surface-card)', borderRadius: 20, width: '100%', maxWidth: 720, maxHeight: '90svh', overflow: 'hidden auto', position: 'relative' },
  detClose: { position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--sub)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  detTop: { display: 'flex', gap: 0 },
  detPhoto: { width: 240, height: 240, objectFit: 'cover', flexShrink: 0, borderRadius: '20px 0 0 0' },
  detPhotoPlaceholder: { width: 240, height: 240, background: '#2d2520', flexShrink: 0, borderRadius: '20px 0 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, color: 'rgba(255,245,230,.1)' },
  detRight: { flex: 1, padding: '24px 24px 20px', minWidth: 0, position: 'relative', overflow: 'hidden' },
  detTypeTag: { fontSize: 10, color: 'var(--accent)', letterSpacing: '.06em', marginBottom: 8 },
  detName: { fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 400, lineHeight: 1.3, marginBottom: 8, letterSpacing: '.04em' },
  detBrewery: { fontSize: 13, color: 'var(--sub)', marginTop: 6 },
  detMeta: { fontSize: 12, color: 'var(--sub)', marginTop: 3 },
  detContributor: { fontSize: 11, color: 'var(--sub)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 },
  statsBar: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' },
  statItem: { padding: '14px 20px', borderRight: '1px solid var(--border)', overflow: 'hidden' },
  statLabel: { fontSize: 10, color: 'var(--sub)', letterSpacing: '.06em', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  statValue: { fontSize: 18, fontFamily: 'var(--font-serif)', fontWeight: 400, color: 'var(--text)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.3 },
  detLower: { padding: '16px 24px 24px', position: 'relative', overflow: 'hidden' },
  detGrid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, marginBottom: 4 },
  detCell: { padding: '12px 0', borderBottom: '1px solid var(--border)', paddingRight: 16 },
  detCellLabel: { fontSize: 10, color: 'var(--sub)', letterSpacing: '.05em', marginBottom: 3 },
  detCellValue: { fontSize: 14, color: 'var(--text)' },
  detTagsRow: { display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 16 },
  detTag: { fontSize: 12, padding: '4px 12px', borderRadius: 20, background: 'var(--accent-bg)', color: 'var(--accent)' },
  empty: { textAlign: 'center', color: 'var(--sub)', paddingTop: 60, fontSize: 14 },
}

export default function Display({ session }) {
  const { lang, t } = useLang()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState('')
  const [tagsExp, setTagsExp] = useState(false)
  const [filters, setFilters] = useState({ type: '', brewery: '', rice: '', rating: '' })
  const [detail, setDetail] = useState(null)

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
    const fontSize = str && str.length > 8 ? 13 : str && str.length > 5 ? 15 : 18
    return (
      <div style={s.statItem}>
        <div style={s.statLabel}>{label}</div>
        {str && <div style={{ ...s.statValue, fontSize }} title={str}>{str}</div>}
      </div>
    )
  }

  const Cell = ({ label, value }) => (
    <div style={s.detCell}>
      <div style={s.detCellLabel}>{label}</div>
      {value != null && value !== '' && <div style={s.detCellValue}>{value}</div>}
    </div>
  )

  return (
    <div style={s.page}>
      <Nav session={session} />
      <BrandMarkFull />
      <div style={s.main}>

        {/* Search */}
        <div style={s.searchRow}>
          <input style={s.searchInput} value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('search')} />
          {search && <button onClick={() => setSearch('')}
            style={{ background: 'none', border: 'none', color: 'var(--sub)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>}
        </div>

        {/* Tag chips */}
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

        {/* Dropdown filters */}
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

        {loading && <p style={s.empty}>{t('loading')}</p>}
        {!loading && filtered.length === 0 && <p style={s.empty}>{search ? t('noResults', { q: search }) : t('noEntries')}</p>}

        <div style={s.grid}>
          {filtered.map(e => (
            <div key={e.id} style={s.card} onClick={() => setDetail(e)}>
              {e.photo_url ? <img style={s.cardImg} src={e.photo_url} alt={e.name} /> : <div style={s.cardNo}>🍶</div>}
              <div style={s.cardOverlay} />
              <div style={s.cardBody}>
                {e.type && <div style={s.cardType}>{typeLabel(e.type)}</div>}
                <div style={s.cardName}>{e.name}</div>
                {e.brewery && <div style={s.cardBrewery}>{e.brewery}</div>}
                <StarsLight rating={e.rating} />
                <div style={s.cardMeta}>{[e.region, e.tasted_at].filter(Boolean).join(' · ')}</div>
                {e.contributor_name && <div style={s.cardContributor}>{e.contributor_name}</div>}
                {e.tags?.length > 0 && (
                  <div style={s.cardTags}>
                    {e.tags.slice(0, 4).map(t => <span key={t} style={s.cardTag}>{getFlavorTagLabel(t, lang)}</span>)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail modal */}
      {detail && (
        <div style={s.backdrop} onClick={() => setDetail(null)}>
          <div style={s.detModal} onClick={e => e.stopPropagation()}>
            <button style={s.detClose} onClick={() => setDetail(null)}>✕</button>

            <div style={s.detTop}>
              {detail.photo_url
                ? <img style={s.detPhoto} src={detail.photo_url} alt={detail.name} />
                : <div style={s.detPhotoPlaceholder}>🍶</div>}
              <div style={s.detRight}>
                {MARK_SVG_ABS}
                {detail.type && <div style={s.detTypeTag}>{typeLabel(detail.type)}</div>}
                <div style={s.detName}>{detail.name}</div>
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

            <div style={{ padding: '0 24px' }}><WaveDivider /></div>
            <div style={s.statsBar}>
              <StatItem label={t('detail.polishing')} value={detail.polishing} />
              <StatItem label={t('detail.alcohol')} value={detail.alcohol} />
              <StatItem label={t('detail.smv')} value={detail.smv} />
              <StatItem label={t('detail.acidity')} value={detail.acidity} />
            </div>
            <div style={{ padding: '0 24px' }}><WaveDivider /></div>

            <div style={s.detLower}>
              <WaveDivider />
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
                  {detail.aroma && <p><strong>{t('detail.aroma')}：</strong>{detail.aroma}</p>}
                  {detail.taste && <p><strong>{t('detail.taste')}：</strong>{detail.taste}</p>}
                  {detail.notes && <p>{detail.notes}</p>}
                </div>
              )}
              {detail.tags?.length > 0 && (
                <div style={s.detTagsRow}>
                  {detail.tags.map(tg => <span key={tg} style={s.detTag}>{getFlavorTagLabel(tg, lang)}</span>)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
