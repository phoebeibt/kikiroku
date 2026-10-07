import { useState, useEffect, useMemo, useRef } from 'react'
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom'
import Nav from '../components/Nav'
import { WikiText } from '../components/WikiTooltip'
import { useWiki } from '../contexts/WikiContext'
import { useLang } from '../contexts/LangContext'
import { supabase } from '../lib/supabase'
import LangButton from '../components/LangButton'
import SakeShelf from './wiki/SakeShelf'
import { normalizeRegion, regionPath } from '../lib/region'
import './journal/ledger.css'
import './sakeDetail.css'
import './wiki/wiki.css'

const EDITOR_LANGS = ['ja', 'zh', 'en']
const EDITOR_LANG_LABEL = { ja: '日本語', zh: '中文', en: 'English' }


const editorFieldKey = (lang) => lang === 'zh' ? 'zhtw' : lang

// Japanese area name → { zh, en }
const AREA_I18N = {
  '北海道': { zh: '北海道', en: 'Hokkaido' },
  '青森県': { zh: '青森縣', en: 'Aomori' },
  '岩手県': { zh: '岩手縣', en: 'Iwate' },
  '宮城県': { zh: '宮城縣', en: 'Miyagi' },
  '秋田県': { zh: '秋田縣', en: 'Akita' },
  '山形県': { zh: '山形縣', en: 'Yamagata' },
  '福島県': { zh: '福島縣', en: 'Fukushima' },
  '茨城県': { zh: '茨城縣', en: 'Ibaraki' },
  '栃木県': { zh: '栃木縣', en: 'Tochigi' },
  '群馬県': { zh: '群馬縣', en: 'Gunma' },
  '埼玉県': { zh: '埼玉縣', en: 'Saitama' },
  '千葉県': { zh: '千葉縣', en: 'Chiba' },
  '東京都': { zh: '東京都', en: 'Tokyo' },
  '神奈川県': { zh: '神奈川縣', en: 'Kanagawa' },
  '新潟県': { zh: '新潟縣', en: 'Niigata' },
  '富山県': { zh: '富山縣', en: 'Toyama' },
  '石川県': { zh: '石川縣', en: 'Ishikawa' },
  '福井県': { zh: '福井縣', en: 'Fukui' },
  '山梨県': { zh: '山梨縣', en: 'Yamanashi' },
  '長野県': { zh: '長野縣', en: 'Nagano' },
  '静岡県': { zh: '靜岡縣', en: 'Shizuoka' },
  '愛知県': { zh: '愛知縣', en: 'Aichi' },
  '三重県': { zh: '三重縣', en: 'Mie' },
  '滋賀県': { zh: '滋賀縣', en: 'Shiga' },
  '京都府': { zh: '京都府', en: 'Kyoto' },
  '大阪府': { zh: '大阪府', en: 'Osaka' },
  '兵庫県': { zh: '兵庫縣', en: 'Hyogo' },
  '奈良県': { zh: '奈良縣', en: 'Nara' },
  '和歌山県': { zh: '和歌山縣', en: 'Wakayama' },
  '鳥取県': { zh: '鳥取縣', en: 'Tottori' },
  '島根県': { zh: '島根縣', en: 'Shimane' },
  '岡山県': { zh: '岡山縣', en: 'Okayama' },
  '広島県': { zh: '廣島縣', en: 'Hiroshima' },
  '山口県': { zh: '山口縣', en: 'Yamaguchi' },
  '徳島県': { zh: '德島縣', en: 'Tokushima' },
  '香川県': { zh: '香川縣', en: 'Kagawa' },
  '愛媛県': { zh: '愛媛縣', en: 'Ehime' },
  '高知県': { zh: '高知縣', en: 'Kochi' },
  '福岡県': { zh: '福岡縣', en: 'Fukuoka' },
  '佐賀県': { zh: '佐賀縣', en: 'Saga' },
  '長崎県': { zh: '長崎縣', en: 'Nagasaki' },
  '熊本県': { zh: '熊本縣', en: 'Kumamoto' },
  '大分県': { zh: '大分縣', en: 'Oita' },
  '宮崎県': { zh: '宮崎縣', en: 'Miyazaki' },
  '鹿児島県': { zh: '鹿兒島縣', en: 'Kagoshima' },
  '沖縄県': { zh: '沖繩縣', en: 'Okinawa' },
  '不明': { zh: '其他', en: 'Other' },
  'Unknown': { zh: '其他', en: 'Other' },
}

function areaLabel(jaName, lang) {
  if (lang === 'ja') return jaName
  return AREA_I18N[jaName]?.[lang] || jaName
}

const s = {
  page: { minHeight: '100svh', background: 'var(--bg)' },
  hero: { textAlign: 'center', padding: '32px 20px 16px' },
  heroTitle: { fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 400, color: 'var(--text)', letterSpacing: '.06em', marginBottom: 6 },
  heroSub: { fontSize: 13, color: 'var(--sub)' },
  tabs: { display: 'flex', justifyContent: 'center', gap: 8, padding: '12px 16px 0' },
  tab: (active) => ({
    padding: '6px 18px', borderRadius: 20, border: '1px solid var(--border)',
    cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-sans)',
    background: active ? 'var(--accent)' : 'var(--surface-card)',
    color: active ? '#fff' : 'var(--sub)',
  }),
  main: { maxWidth: 760, margin: '0 auto', padding: '0 16px 60px' },
  search: { width: '100%', padding: '10px 16px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--surface-card)', color: 'var(--text)', fontSize: 14, outline: 'none', marginBottom: 20, boxSizing: 'border-box' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(330px, 100%), 1fr))', gap: 12 },
  card: { background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px 18px', position: 'relative' },
  cardTitle: { fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--text)', marginBottom: 3 },
  cardAlt: { fontSize: 10, color: 'var(--sub)', letterSpacing: '.04em', marginBottom: 8 },
  summary: { fontSize: 13, color: 'var(--sub)', lineHeight: 1.65, marginBottom: 0 },
  bodyWrap: { fontSize: 13, color: 'var(--sub)', lineHeight: 1.7, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' },
  toggle: { fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0 0', fontFamily: 'var(--font-sans)' },
  editBtn: { position: 'absolute', top: 12, right: 14, fontSize: 11, color: 'var(--sub)', background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '3px 8px', cursor: 'pointer', fontFamily: 'var(--font-sans)' },
  editorWrap: { marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' },
  editorLangTab: (active) => ({ padding: '3px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-sans)', marginRight: 4, background: active ? 'var(--accent)' : 'var(--bg)', color: active ? '#fff' : 'var(--sub)' }),
  editorLabel: { fontSize: 10, color: 'var(--sub)', letterSpacing: '.06em', margin: '10px 0 4px', display: 'block' },
  editorInput: { width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font-sans)', boxSizing: 'border-box', resize: 'vertical' },
  editorRow: { display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' },
  saveBtn: { padding: '6px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'var(--accent)', color: '#fff', fontSize: 12, fontFamily: 'var(--font-sans)' },
  cancelBtn: { padding: '6px 14px', borderRadius: 10, border: '1px solid var(--border)', cursor: 'pointer', background: 'none', color: 'var(--sub)', fontSize: 12, fontFamily: 'var(--font-sans)' },
}

// Ruby annotation: name above, furigana below in <rt>
function RubyName({ name, furigana }) {
  if (!furigana) return <span>{name}</span>
  return (
    <ruby style={{ rubyAlign: 'center' }}>
      {name}
      <rt style={{ fontSize: '0.5em', color: 'var(--sub)', letterSpacing: '.03em' }}>{furigana}</rt>
    </ruby>
  )
}

function ArticleCard({ article, lang, isEditor, onSaved }) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editLang, setEditLang] = useState(lang)
  const [saving, setSaving] = useState(false)
  const location = useLocation()
  const isAnchor = location.hash === `#${article.id}`
  const cardRef = useRef(null)

  useEffect(() => {
    if (!isAnchor) return
    setExpanded(true)
    requestAnimationFrame(() => {
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }, [isAnchor])

  const title = article.title[lang] || article.title.ja
  const alts = [...(article.terms.ja || []), ...(lang !== 'zh' ? (article.terms.zh || []) : []), ...(lang !== 'en' ? (article.terms.en || []) : [])]
    .filter(w => w !== title).slice(0, 4)

  const summary = article.summary?.[lang] || article.summary?.ja || ''
  const body = article.body[lang] || article.body.ja || ''

  const [draft, setDraft] = useState({
    summary_ja: article.summary?.ja || '', summary_zhtw: article.summary?.zh || '',
    summary_en: article.summary?.en || '',
    body_ja: article.body.ja || '', body_zhtw: article.body.zh || '',
    body_en: article.body.en || '',
  })

  const toggleLabel = { ja: expanded ? '閉じる ▲' : '詳しく ▼', zh: expanded ? '收起 ▲' : '詳細 ▼', en: expanded ? 'Less ▲' : 'More ▼' }[lang] || 'More'

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('wiki_articles').upsert({
      term_id: article.id,
      ...draft,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'term_id' })
    setSaving(false)
    setEditing(false)
    onSaved()
  }

  return (
    <div ref={cardRef} id={article.id} style={{ ...s.card, outline: isAnchor ? '2px solid var(--accent)' : 'none', scrollMarginTop: 20 }}>
      {isEditor && !editing && (
        <button style={s.editBtn} onClick={() => setEditing(true)}>編集</button>
      )}
      <div style={s.cardTitle}>{title}</div>
      {alts.length > 0 && <div style={s.cardAlt}>{alts.join('  ·  ')}</div>}
      {summary && <div style={s.summary}><WikiText text={summary} /></div>}
      {body && (
        <>
          <button style={s.toggle} onClick={() => setExpanded(x => !x)}>{toggleLabel}</button>
          {expanded && <div style={s.bodyWrap}><WikiText text={body} /></div>}
        </>
      )}
      {editing && (
        <div style={s.editorWrap}>
          <div style={{ marginBottom: 8 }}>
            {EDITOR_LANGS.map(l => (
              <button key={l} style={s.editorLangTab(editLang === l)} onClick={() => setEditLang(l)}>{EDITOR_LANG_LABEL[l]}</button>
            ))}
          </div>
          <label style={s.editorLabel}>第一層 — 概要（100字以内）</label>
          <textarea rows={2} style={s.editorInput}
            value={draft[`summary_${editorFieldKey(editLang)}`]}
            onChange={e => setDraft(d => ({ ...d, [`summary_${editorFieldKey(editLang)}`]: e.target.value }))}
            maxLength={200} />
          <label style={s.editorLabel}>第二層 — 詳細解説</label>
          <textarea rows={5} style={s.editorInput}
            value={draft[`body_${editorFieldKey(editLang)}`]}
            onChange={e => setDraft(d => ({ ...d, [`body_${editorFieldKey(editLang)}`]: e.target.value }))} />
          <div style={s.editorRow}>
            <button style={s.cancelBtn} onClick={() => setEditing(false)}>キャンセル</button>
            <button style={s.saveBtn} onClick={handleSave} disabled={saving}>{saving ? '保存中…' : '保存する'}</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Brewery Directory ──────────────────────────────────────────────────────────

// Click to reveal reading: furigana in Japanese, romaji in Chinese/English
function BreweryDirectory({ lang, initialQ = '', session }) {
  const navigate = useNavigate()
  const [ownByArea, setOwnByArea] = useState({})
  useEffect(() => {
    if (!session) return
    supabase.from('sake_entries').select('region,status').eq('user_id', session.user.id)
      .then(({ data }) => setOwnByArea((data || []).reduce((m, e) => {
        if (e.status === 'draft' || !e.region) return m
        const r = normalizeRegion(e.region)
        return { ...m, [r]: (m[r] || 0) + 1 }
      }, {})))
  }, [session?.user?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const [breweries, setBreweries] = useState(null)
  const [q, setQ] = useState(initialQ)
  const [openAreas, setOpenAreas] = useState(new Set())
  const [iwcSummary, setIwcSummary] = useState([]) // [{name, hasGold, hasSilver}]

  useEffect(() => {
    async function load() {
      // Fetch breweries
      const all = []
      const PAGE = 1000
      for (let from = 0; ; from += PAGE) {
        const { data } = await supabase
          .from('sake_breweries')
          .select('id,name,furigana,romaji,sake_areas(id,name)')
          .range(from, from + PAGE - 1)
          .order('name')
        if (!data?.length) break
        all.push(...data.filter(b => b.name?.trim()))
        if (data.length < PAGE) break
      }
      setBreweries(all)

      // Fetch IWC award summary (brewery_name + is_gold only, lightweight)
      const awards = []
      for (let from = 0; ; from += PAGE) {
        const { data } = await supabase
          .from('sake_awards')
          .select('brewery_name, is_gold')
          .ilike('year_code', 'IWC_%')
          .range(from, from + PAGE - 1)
        if (!data?.length) break
        awards.push(...data)
        if (data.length < PAGE) break
      }
      // Deduplicate by brewery_name → {hasGold, hasSilver}
      const map = {}
      for (const r of awards) {
        if (!map[r.brewery_name]) map[r.brewery_name] = { hasGold: false, hasSilver: false }
        if (r.is_gold) map[r.brewery_name].hasGold = true
        else map[r.brewery_name].hasSilver = true
      }
      setIwcSummary(Object.entries(map).map(([name, v]) => ({ name, ...v })))
    }
    load()
  }, [])

  const grouped = useMemo(() => {
    if (!breweries) return null
    const lq = q.toLowerCase()
    const result = {}
    for (const b of breweries) {
      const match = !lq ||
        b.name.includes(q) ||
        (b.furigana && b.furigana.includes(q)) ||
        (b.romaji && b.romaji.toLowerCase().includes(lq))
      if (!match) continue
      const area = b.sake_areas?.name || '不明'
      if (!result[area]) result[area] = []
      result[area].push(b)
    }
    return result
  }, [breweries, q])

  // When query changes, open all matching areas automatically
  useEffect(() => {
    if (q && grouped) setOpenAreas(new Set(Object.keys(grouped)))
    else if (!q) setOpenAreas(new Set())
  }, [q])

  const toggleArea = (area) => {
    setOpenAreas(prev => {
      const next = new Set(prev)
      next.has(area) ? next.delete(area) : next.add(area)
      return next
    })
  }

  const searchPlaceholder = lang === 'ja' ? '酒造名・読み・ローマ字で検索' : lang === 'zh' ? '搜尋酒造名稱・讀音' : 'Search brewery name or reading'
  const loadingText = lang === 'ja' ? '読み込み中…' : lang === 'zh' ? '載入中…' : 'Loading…'

  if (breweries === null) {
    return <div className="kk-empty kk-empty--quiet">{loadingText}</div>
  }

  const areas = Object.keys(grouped || {}).sort((a, b) => {
    if (a === '不明' || b === '不明') return a === '不明' ? 1 : -1
    return a.localeCompare(b, 'ja')
  })
  const totalShown = areas.reduce((n, a) => n + grouped[a].length, 0)
  const iwcFor = b => {
    const kw = b.name.replace(/(株式会社|有限会社|合資会社|合名会社|㈱|㈲|合同会社)/g, '').trim().split(/[\s\u3000]+/)[0]
    return kw.length >= 2 ? iwcSummary.find(d => d.name.includes(kw)) : null
  }

  return (
    <div>
      <div className="kk-search" role="search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={searchPlaceholder} aria-label={searchPlaceholder} />
        {q && <button type="button" className="kk-search__clear" onClick={() => setQ('')} aria-label="×">×</button>}
      </div>
      {q && <h2 className="kk-wiki__sec">{lang === 'ja' ? '検索結果' : lang === 'zh' ? '搜尋結果' : 'Results'}<small>{totalShown}</small></h2>}
      {areas.map(area => {
        const list = grouped[area]
        const isOpen = openAreas.has(area)
        return (
          <section key={area} className="kk-area">
            <button type="button" className="kk-area__head" aria-expanded={isOpen} onClick={() => toggleArea(area)}>
              {areaLabel(area, lang)}
              <span>
                {ownByArea[area] > 0 && <span className="kk-area__mine">{lang === 'ja' ? `あなた ${ownByArea[area]}` : lang === 'zh' ? `你 ${ownByArea[area]}` : `You ${ownByArea[area]}`} · </span>}
                {lang === 'ja' ? `${list.length}蔵` : lang === 'zh' ? `${list.length} 家` : list.length} {isOpen ? '▴' : '▾'}
              </span>
            </button>
            {isOpen && (
              <ul className="kk-shelf">
                {area !== '不明' && area !== 'その他' && !q && (
                  <li className="kk-area__open">
                    <button type="button" className="kk-shelf__item" onClick={() => navigate(regionPath(area))}>
                      <span className="kk-shelf__main">
                        <span className="kk-shelf__title">{lang === 'ja' ? `${area}の産地ページ` : lang === 'zh' ? `${areaLabel(area, lang)}產地頁` : `About ${areaLabel(area, lang)}`}</span>
                        <span className="kk-shelf__meta">{lang === 'ja' ? '自分の酒札・公開酒札・酒造' : lang === 'zh' ? '我的酒札・公開酒札・酒造' : 'Your tags, public tags, breweries'}</span>
                      </span>
                      <span className="kk-shelf__chev" aria-hidden="true">›</span>
                    </button>
                  </li>
                )}
                {list.map(b => {
                  const iwc = iwcFor(b)
                  return (
                    <li key={b.id}>
                      <button type="button" className="kk-shelf__item" onClick={() => navigate(`/wiki/brewery/${b.id}`)}>
                        <span className="kk-shelf__main">
                          <span className="kk-shelf__title"><RubyName name={b.name} furigana={lang === 'ja' ? b.furigana : null} /></span>
                          {lang !== 'ja' && b.romaji && <span className="kk-shelf__meta">{b.romaji}</span>}
                        </span>
                        <span className="kk-shelf__side">
                          {iwc?.hasGold && <span className="kk-iwc">IWC ★</span>}
                          {!iwc?.hasGold && iwc?.hasSilver && <span className="kk-iwc kk-iwc--silver">IWC</span>}
                          <span className="kk-shelf__chev" aria-hidden="true">›</span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}

// ── Group label i18n ────────────────────────────────────────────────────────────
const GROUP_LABELS = {
  'major-rice':   { ja: '代表品種',         zh: '代表品種',         en: 'Major Varieties' },
  'regional-rice':{ ja: '地域特産品種',     zh: '地域特產品種',     en: 'Regional Varieties' },
  'kyokai-yeast':     { ja: '協会酵母',               zh: '協會酵母',               en: 'Kyokai Yeasts' },
  'kyokai-old-yeast': { ja: '歴史的協会酵母（廃頒布）', zh: '歷史協會酵母（已停止頒布）', en: 'Historic Kyokai Yeasts (Discontinued)' },
  'local-yeast':      { ja: '地域・独自酵母',           zh: '地域・獨自酵母',           en: 'Regional & Unique Yeasts' },
}
const groupLabel = (id, lang) => GROUP_LABELS[id]?.[lang] || id

// Glossary sub-categories (ordered)
const GLOSSARY_CATEGORIES = [
  { id: 'type',       label: { ja: '分類・タイプ',   zh: '分類・類型',    en: 'Types & Classifications' } },
  { id: 'method',     label: { ja: '製法',           zh: '製法',          en: 'Methods' } },
  { id: 'ingredient', label: { ja: '原料・素材',     zh: '原料・素材',    en: 'Ingredients' } },
  { id: 'flavor',     label: { ja: '味わい・数値',   zh: '味道・數值',    en: 'Flavor & Metrics' } },
  { id: 'people',     label: { ja: '人・銘柄',       zh: '人・銘柄',      en: 'People & Names' } },
]

// ── Flat item list (rice / yeast) ───────────────────────────────────────────────
function FlatItemCard({ item, lang }) {
  const location = useLocation()
  const isAnchor = location.hash === `#${item.id}`
  const ref = useRef(null)

  useEffect(() => {
    if (!isAnchor) return
    requestAnimationFrame(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }, [isAnchor])

  const title = item.title[lang] || item.title.ja
  const alts = [...(item.terms?.ja || []), ...(item.terms?.zh || []), ...(item.terms?.en || [])]
    .filter(w => w !== title).slice(0, 3)
  const summary = item.summary?.[lang] || item.summary?.ja || ''
  const body = item.body?.[lang] || item.body?.ja || ''
  const text = summary || body

  return (
    <div ref={ref} id={item.id} style={{
      background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 12,
      padding: '14px 16px', outline: isAnchor ? '2px solid var(--accent)' : 'none',
      scrollMarginTop: 20,
    }}>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--text)', marginBottom: alts.length ? 3 : (text ? 6 : 0) }}>{title}</div>
      {alts.length > 0 && (
        <div style={{ fontSize: 10, color: 'var(--sub)', letterSpacing: '.04em', marginBottom: text ? 6 : 0 }}>{alts.join(' · ')}</div>
      )}
      {text && <div style={{ fontSize: 13, color: 'var(--sub)', lineHeight: 1.65 }}>{text}</div>}
    </div>
  )
}

function FlatDirectory({ items, lang }) {
  // Group by group field
  const groups = []
  const seen = new Set()
  for (const item of items) {
    const g = item.group || ''
    if (!seen.has(g)) { seen.add(g); groups.push(g) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {groups.map(g => {
        const groupItems = items.filter(i => (i.group || '') === g)
        return (
          <div key={g}>
            {g && (
              <div style={{ fontSize: 10, letterSpacing: '.08em', color: 'var(--sub)', marginBottom: 10, fontWeight: 500 }}>
                {groupLabel(g, lang).toUpperCase()}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: 10 }}>
              {groupItems.map(item => (
                <FlatItemCard key={item.id} item={item} lang={lang} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Main Wiki page ─────────────────────────────────────────────────────────────

const TAB_META = {
  sake:      { ja: '酒款', zh: '酒款', en: 'Sakes' },
  breweries: { ja: '産地・酒造', zh: '產地・酒造', en: 'Regions' },
  glossary:  { ja: '用語', zh: '用語', en: 'Terms' },
  materials: { ja: '原料', zh: '原料', en: 'Rice & yeast' },
}
// Older links (WikiTooltip, bookmarks) still say rice / yeast.
const TAB_ALIAS = { rice: 'materials', yeast: 'materials' }
const tabFrom = t => (TAB_META[t] ? t : TAB_ALIAS[t] || null)

export default function Wiki({ session }) {
  const { lang, changeLang } = useLang()
  const { articles, reload } = useWiki()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [tab, setTab] = useState(() => tabFrom(searchParams.get('tab')) || 'sake')
  // Sync tab when URL params change (e.g., Wiki popup deep-link to another tab)
  useEffect(() => {
    const t = tabFrom(searchParams.get('tab'))
    if (t && t !== tab) setTab(t)
  }, [searchParams])
  const breweryQ = searchParams.get('q') || ''
  const isEditor = session?.user?.user_metadata?.is_editor === true

  const filtered = articles.filter(term => {
    if (!q) return true
    const lq = q.toLowerCase()
    const words = [...(term.terms.ja || []), ...(term.terms.zh || []), ...(term.terms.en || [])]
    const title = term.title[lang] || term.title.ja
    const summary = term.summary?.[lang] || term.summary?.ja || ''
    const body = term.body[lang] || term.body.ja || ''
    return words.some(w => w.toLowerCase().includes(lq)) ||
      title.toLowerCase().includes(lq) ||
      summary.toLowerCase().includes(lq) ||
      body.toLowerCase().includes(lq)
  })

  const riceItems = articles.filter(a => a.group?.endsWith('-rice'))
  const yeastItems = articles.filter(a => a.group?.endsWith('-yeast'))
  const glossaryItems = filtered.filter(a => !a.group?.endsWith('-rice') && !a.group?.endsWith('-yeast'))
  const glossaryByCat = GLOSSARY_CATEGORIES.map(cat => ({
    ...cat,
    items: glossaryItems.filter(a => a.group === cat.id),
  })).filter(cat => cat.items.length > 0)

  const scrollToCat = (catId) => {
    const el = document.getElementById(`gloss-cat-${catId}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const L = (ja, zh, en) => (lang === 'ja' ? ja : lang === 'zh' ? zh : en)

  return (
    <div className="kk-wiki-page">
      <Nav session={session} topbar={false} />
      <div className="kk-wiki">
        <header className="kk-ledger__head">
          <h1 className="kk-ledger__title">{L('事典', '事典', 'Library')}</h1>
          <div className="kk-ledger__head-actions">
            <LangButton lang={lang} onChange={changeLang} label={L('表示言語', '介面語言', 'Language')} />
          </div>
        </header>
        <div className="kk-seg" role="tablist" aria-label={L('事典の分類', '事典分類', 'Sections')}>
          {Object.entries(TAB_META).map(([id, m]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'is-active' : ''} onClick={() => {
              setTab(id)
              // Clear any lingering #term-id hash so the new tab starts at the top
              navigate(`/wiki?tab=${id}`, { replace: true })
              window.scrollTo({ top: 0 })
            }}>
              {m[lang] || m.ja}
            </button>
          ))}
        </div>
        {tab === 'sake'      && <SakeShelf lang={lang} isGuest={!session} />}
        {tab === 'breweries' && <BreweryDirectory lang={lang} initialQ={breweryQ} session={session} />}
        {tab === 'materials' && (
          <div className="kk-wiki__legacy">
            <h2 className="kk-wiki__sec">{L('酒米', '酒米', 'Sake rice')}<small>{riceItems.length}</small></h2>
            <FlatDirectory items={riceItems} lang={lang} />
            <h2 className="kk-wiki__sec" style={{ marginTop: 28 }}>{L('酵母', '酵母', 'Yeast')}<small>{yeastItems.length}</small></h2>
            <FlatDirectory items={yeastItems} lang={lang} />
          </div>
        )}
        {tab === 'glossary'  && (
          <>
            <div className="kk-search" role="search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              <input type="search" value={q} onChange={e => setQ(e.target.value)} aria-label={L('用語を検索', '搜尋用語', 'Search terms')}
                placeholder={L('用語を検索', '搜尋用語', 'Search terms')} />
              {q && <button type="button" className="kk-search__clear" onClick={() => setQ('')} aria-label="×">×</button>}
            </div>
            {!q && glossaryByCat.length > 1 && (
              <div className="kk-wiki__chips">
                {glossaryByCat.map(cat => (
                  <button key={cat.id} type="button" className="kk-chip" onClick={() => scrollToCat(cat.id)}>
                    {cat.label[lang] || cat.label.ja}
                    <span style={{ marginLeft: 6, opacity: 0.6 }}>{cat.items.length}</span>
                  </button>
                ))}
              </div>
            )}
            {q && (
              <h2 className="kk-wiki__sec">{L('検索結果', '搜尋結果', 'Results')}<small>{glossaryItems.length}</small></h2>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {glossaryByCat.map(cat => (
                <div key={cat.id} id={`gloss-cat-${cat.id}`} style={{ scrollMarginTop: 20 }}>
                  <h2 className="kk-wiki__sec">{cat.label[lang] || cat.label.ja}<small>{cat.items.length}</small></h2>
                  <div style={s.grid}>
                    {cat.items.map(article => (
                      <ArticleCard key={article.id} article={article} lang={lang} isEditor={isEditor} onSaved={reload} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
