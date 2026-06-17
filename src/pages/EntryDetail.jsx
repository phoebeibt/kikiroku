import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Stars from '../components/Stars'
import BrandMark from '../components/BrandMark'
import { useLang } from '../contexts/LangContext'
import { SAKE_TYPES, getTagLabel, getFlavorTagLabel } from '../lib/i18n'
import { WikiText } from '../components/WikiTooltip'

const WaveDivider = () => (
  <svg style={{ display: 'block', width: '100%', height: 12 }}
    viewBox="0 0 400 20" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0,10 C30,4 60,3 100,8 C140,13 160,14 200,10 C240,6 270,4 310,8 C340,11 370,13 400,10"
      fill="none" stroke="#7C3A28" strokeWidth="1" opacity="0.35" strokeLinecap="round" />
  </svg>
)

const s = {
  page: { minHeight: '100svh', background: 'var(--bg)' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 10 },
  backBtn: { display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--sub)', fontSize: 14, cursor: 'pointer', padding: '6px 0', fontFamily: 'var(--font-sans)' },
  brand: { display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--text)' },
  shareBtn: { display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: '1px solid var(--border)', borderRadius: 20, color: 'var(--sub)', fontSize: 12, cursor: 'pointer', padding: '5px 13px', fontFamily: 'var(--font-sans)', transition: 'all .2s' },
  main: { maxWidth: 660, margin: '0 auto', padding: '16px 16px 48px' },
  top: { display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 4 },
  photo: { width: 120, height: 150, objectFit: 'cover', borderRadius: 10, flexShrink: 0 },
  photoPlaceholder: { width: 120, height: 150, background: '#2d2520', flexShrink: 0, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, color: 'rgba(255,245,230,.1)' },
  right: { flex: 1, minWidth: 0, paddingTop: 2 },
  typeTag: { fontSize: 10, color: 'var(--accent)', letterSpacing: '.06em', marginBottom: 4 },
  name: { fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 400, lineHeight: 1.3, color: 'var(--text)', marginBottom: 4 },
  brewery: { fontSize: 13, color: 'var(--sub)', marginTop: 4 },
  meta: { fontSize: 12, color: 'var(--sub)', marginTop: 2 },
  contributor: { fontSize: 11, color: 'var(--sub)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 },
  statsBar: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', margin: '0 0 0 0' },
  statItem: { padding: '7px 10px', borderRight: '1px solid var(--border)', overflow: 'hidden' },
  statLabel: { fontSize: 9, color: 'var(--sub)', letterSpacing: '.06em', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  statValue: { fontSize: 14, fontFamily: 'var(--font-serif)', color: 'var(--text)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.3 },
  lower: { paddingTop: 8 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, marginBottom: 4 },
  cell: { padding: '7px 0', borderBottom: '1px solid var(--border)', paddingRight: 12 },
  cellLabel: { fontSize: 9, color: 'var(--sub)', letterSpacing: '.05em', marginBottom: 2 },
  cellValue: { fontSize: 12, color: 'var(--text)' },
  tagsRow: { display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 10 },
  tag: { fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'var(--accent-bg)', color: 'var(--accent)' },
  tasteTag: { fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' },
  notes: { fontSize: 14, color: 'var(--sub)', lineHeight: 1.7, marginTop: 12 },
  notesLabel: { fontSize: 10, color: 'var(--sub)', letterSpacing: '.05em', marginBottom: 4 },
  footer: { textAlign: 'center', padding: '28px 0 8px', opacity: 0.4 },
  loading: { textAlign: 'center', color: 'var(--sub)', paddingTop: 80, fontSize: 14 },
  notFound: { textAlign: 'center', color: 'var(--sub)', paddingTop: 80, fontSize: 14 },
}

export default function EntryDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { lang, t } = useLang()
  const [entry, setEntry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [awards, setAwards] = useState([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    supabase.from('sake_entries').select('*').eq('id', id).eq('is_public', true).limit(1)
      .then(({ data }) => { setEntry(data?.[0] || null); setLoading(false) })
  }, [id])

  useEffect(() => {
    if (entry) document.title = `${entry.name} — 酒記録 Kikiroku`
    return () => { document.title = '酒記録 Kikiroku' }
  }, [entry])

  useEffect(() => {
    if (!entry?.brewery) return
    const kw = entry.brewery.replace(/(株式会社|有限会社|合資会社|合名会社|㈱|㈲)/g, '').trim().split(/[\s　]+/)[0]
    if (!kw || kw.length < 2) return
    supabase.from('sake_awards').select('year,year_code,brand_name,is_gold')
      .ilike('brewery_name', `%${kw}%`).order('year', { ascending: false }).limit(12)
      .then(({ data }) => setAwards(data || []))
  }, [entry?.brewery])

  const typeLabel = (typeId) => {
    if (!typeId) return null
    const found = SAKE_TYPES.find(t => t.id === typeId)
    return found ? (lang === 'ja' ? typeId : (found[lang] || typeId)) : typeId
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1800)
    })
  }

  const StatItem = ({ label, value }) => {
    const str = value != null && value !== '' ? String(value) : null
    return (
      <div style={s.statItem}>
        <div style={s.statLabel}>{label}</div>
        {str
          ? <div style={{ ...s.statValue, fontSize: str.length > 8 ? 11 : str.length > 5 ? 12 : 14 }}>{str}</div>
          : <div style={{ ...s.statValue, fontSize: 12, color: 'var(--border)' }}>N/A</div>}
      </div>
    )
  }

  const Cell = ({ label, value }) => (
    <div style={s.cell}>
      <div style={s.cellLabel}>{label}</div>
      {value != null && value !== ''
        ? <div style={s.cellValue}>{value}</div>
        : <div style={{ ...s.cellValue, color: 'var(--border)' }}>N/A</div>}
    </div>
  )

  if (loading) return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => nav('/')}>← Kikiroku</button>
      </div>
      <p style={s.loading}>{t('loading')}</p>
    </div>
  )

  if (!entry) return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => nav('/')}>← Kikiroku</button>
      </div>
      <p style={s.notFound}>
        {lang === 'ja' ? '記録が見つかりませんでした' : lang === 'zh' ? '找不到這筆記錄' : 'Entry not found'}
      </p>
    </div>
  )

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => nav('/')}>
          ← {lang === 'ja' ? 'みんなのお酒' : lang === 'zh' ? '廣場' : 'Discover'}
        </button>
        <div style={s.brand}>
          <BrandMark size={22} />
          <span>酒<em style={{ fontStyle: 'normal', color: 'var(--accent)' }}>記</em>録</span>
        </div>
        <button
          style={{ ...s.shareBtn, background: copied ? 'var(--accent)' : 'none', color: copied ? '#fff' : 'var(--sub)', borderColor: copied ? 'var(--accent)' : 'var(--border)' }}
          onClick={handleShare}>
          {copied
            ? (lang === 'ja' ? '✓ コピー済み' : lang === 'zh' ? '✓ 已複製' : '✓ Copied')
            : (lang === 'ja' ? '🔗 シェア' : lang === 'zh' ? '🔗 分享' : '🔗 Share')}
        </button>
      </div>

      <div style={s.main}>
        <div style={s.top}>
          {entry.photo_url
            ? <img style={s.photo} src={entry.photo_url} alt={entry.name} />
            : <div style={s.photoPlaceholder}>🍶</div>}
          <div style={s.right}>
            {entry.type && <div style={s.typeTag}><WikiText text={typeLabel(entry.type)} /></div>}
            <div style={s.name}><WikiText text={entry.name} /></div>
            <Stars rating={entry.rating} size={13} />
            {entry.brewery && (
              <Link to={`/wiki?tab=breweries&q=${encodeURIComponent(entry.brewery)}`}
                style={{ ...s.brewery, textDecoration: 'none', cursor: 'pointer' }}>
                {entry.brewery}
              </Link>
            )}
            <div style={s.meta}>{[entry.region, entry.tasted_at].filter(Boolean).join(' · ')}</div>
            {entry.contributor_name && (
              <div style={s.contributor}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4A7A35', display: 'inline-block' }} />
                {entry.contributor_name}
              </div>
            )}
          </div>
        </div>

        <WaveDivider />
        <div style={s.statsBar}>
          <StatItem label={t('detail.polishing')} value={entry.polishing} />
          <StatItem label={t('detail.alcohol')} value={entry.alcohol} />
          <StatItem label={t('detail.smv')} value={entry.smv} />
          <StatItem label={{ ...s.statItem, borderRight: 'none' } && t('detail.acidity')} value={entry.acidity} />
        </div>
        <WaveDivider />

        <div style={s.lower}>
          <div style={s.grid2}>
            <Cell label={t('detail.rice')} value={entry.rice} />
            <Cell label={t('detail.yeast')} value={entry.yeast} />
            <Cell label={t('detail.bottling')} value={entry.bottling_date} />
            <Cell label={t('detail.drinking')} value={entry.tasted_at} />
          </div>

          {entry.aroma_tags?.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={s.notesLabel}>{t('detail.aroma')}</div>
              <div style={s.tagsRow}>
                {entry.aroma_tags.map(id => <span key={id} style={s.tag}>{getTagLabel(id, 'aroma', lang)}</span>)}
              </div>
            </div>
          )}
          {entry.taste_tags?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={s.notesLabel}>{t('detail.taste')}</div>
              <div style={s.tagsRow}>
                {entry.taste_tags.map(id => <span key={id} style={s.tasteTag}>{getTagLabel(id, 'taste', lang)}</span>)}
              </div>
            </div>
          )}
          {(entry.aroma || entry.taste || entry.notes) && (
            <div style={s.notes}>
              {entry.aroma && <p><strong>{t('detail.aroma')}：</strong><WikiText text={entry.aroma} /></p>}
              {entry.taste && <p><strong>{t('detail.taste')}：</strong><WikiText text={entry.taste} /></p>}
              {entry.notes && <p><WikiText text={entry.notes} /></p>}
            </div>
          )}
          {entry.tags?.length > 0 && (
            <div style={{ ...s.tagsRow, marginTop: 14 }}>
              {entry.tags.map(tg => <span key={tg} style={s.tag}>{getFlavorTagLabel(tg, lang)}</span>)}
            </div>
          )}

          {awards.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 9, color: 'var(--sub)', letterSpacing: '.06em', marginBottom: 6 }}>
                {lang === 'ja' ? '受賞歴' : lang === 'zh' ? '獲獎記錄' : 'Awards'}
              </div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {awards.map((a, i) => {
                  const comp = a.year_code?.startsWith('IWC') ? 'IWC' : (lang === 'ja' ? '鑑評会' : lang === 'zh' ? '鑑評会' : 'NRIB')
                  return (
                    <span key={i} title={a.brand_name}
                      style={{ fontSize: 10, padding: '2px 9px', borderRadius: 12, whiteSpace: 'nowrap',
                        background: a.is_gold ? 'rgba(180,140,0,.10)' : 'var(--bg)',
                        color: a.is_gold ? '#8A6C00' : 'var(--sub)',
                        border: `1px solid ${a.is_gold ? 'rgba(180,140,0,.28)' : 'var(--border)'}` }}>
                      {a.is_gold ? '★' : '○'} {comp} {a.year}
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div style={s.footer}>
          <BrandMark size={28} />
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 13, marginTop: 6, color: 'var(--sub)' }}>酒記録 Kikiroku</div>
          <div style={{ fontSize: 11, color: 'var(--sub)', marginTop: 2 }}>kikiroku.com</div>
        </div>
      </div>
    </div>
  )
}
