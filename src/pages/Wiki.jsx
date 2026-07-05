import { useState, useEffect, useMemo, useRef } from 'react'
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom'
import Nav from '../components/Nav'
import { WikiText } from '../components/WikiTooltip'
import { useWiki } from '../contexts/WikiContext'
import { useLang } from '../contexts/LangContext'
import { supabase } from '../lib/supabase'

const EDITOR_LANGS = ['ja', 'zh', 'en']
const EDITOR_LANG_LABEL = { ja: '日本語', zh: '中文', en: 'English' }

const TITLE = { ja: '日本酒用語集', zh: '日本酒術語辭典', en: 'Sake Glossary' }
const SUB   = { ja: 'よく使われる日本酒の用語と解説', zh: '常見日本酒術語與說明', en: 'Common sake terminology explained' }

const BREW_TITLE = { ja: '酒蔵一覧', zh: '酒廠列表', en: 'Brewery Directory' }
const BREW_SUB   = { ja: '全国の酒蔵と銘柄', zh: '全國酒廠與銘柄', en: 'Breweries & brands across Japan' }

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
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 12 },
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
function BrandChip({ brand, lang }) {
  const [revealed, setRevealed] = useState(false)
  const showFuri = lang === 'ja'
  const reading = showFuri ? brand.furigana : brand.romaji

  return (
    <button
      onClick={() => setRevealed(r => !r)}
      title={reading || undefined}
      style={{
        background: revealed ? 'var(--accent-bg, rgba(124,58,40,.07))' : 'none',
        border: '1px solid var(--border)', borderRadius: 8,
        padding: '3px 9px', cursor: reading ? 'pointer' : 'default',
        fontFamily: 'var(--font-sans)', color: 'var(--text)',
        display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 1,
      }}>
      {showFuri && revealed && reading ? (
        <ruby style={{ fontSize: 14 }}>
          {brand.name}
          <rt style={{ fontSize: '0.5em', color: 'var(--sub)', letterSpacing: '.03em' }}>{reading}</rt>
        </ruby>
      ) : (
        <span style={{ fontSize: 13 }}>{brand.name}</span>
      )}
      {!showFuri && revealed && reading && (
        <span style={{ fontSize: 10, color: 'var(--sub)', letterSpacing: '.04em' }}>{reading}</span>
      )}
    </button>
  )
}

function IwcTimeline({ awards, lang }) {
  if (!awards || awards.length === 0) return null

  // Collect unique years per tier
  const goldYears  = [...new Set(awards.filter(a =>  a.is_gold).map(a => a.year))].sort((a, b) => a - b)
  const silverYears = [...new Set(awards.filter(a => !a.is_gold).map(a => a.year))].sort((a, b) => a - b)

  const YearChip = ({ year, gold }) => (
    <span style={{
      fontSize: 10, padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap',
      fontVariantNumeric: 'tabular-nums',
      background: gold ? 'rgba(180,140,0,.12)' : 'var(--bg)',
      color:      gold ? '#8A6C00' : 'var(--sub)',
      border:     `1px solid ${gold ? 'rgba(180,140,0,.35)' : 'var(--border)'}`,
    }}>
      {gold ? '★' : '○'} {year}
    </span>
  )

  const goldLabel   = lang === 'ja' ? 'Gold / Trophy' : lang === 'zh' ? 'Gold / Trophy' : 'Gold / Trophy'
  const silverLabel = lang === 'ja' ? 'Silver / Bronze' : lang === 'zh' ? 'Silver / Bronze' : 'Silver / Bronze'

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {goldYears.length > 0 && (
        <div>
          <div style={{ fontSize: 9, color: '#8A6C00', letterSpacing: '.08em', marginBottom: 5 }}>IWC {goldLabel}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {goldYears.map(y => <YearChip key={y} year={y} gold />)}
          </div>
        </div>
      )}
      {silverYears.length > 0 && (
        <div>
          <div style={{ fontSize: 9, color: 'var(--sub)', letterSpacing: '.08em', marginBottom: 5 }}>IWC {silverLabel}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {silverYears.map(y => <YearChip key={y} year={y} gold={false} />)}
          </div>
        </div>
      )}
    </div>
  )
}

function BreweryRow({ brewery, lang, iwcSummary = [] }) {
  const [open, setOpen] = useState(false)
  const [brands, setBrands] = useState(null)
  const [awards, setAwards] = useState(null)

  // Normalize brewery name to a short keyword (strip corporate suffixes)
  const brewKw = brewery.name
    .replace(/(株式会社|有限会社|合資会社|合名会社|㈱|㈲|合同会社)/g, '')
    .trim().split(/[\s　]+/)[0]

  const toggle = async () => {
    if (!open && brands === null) {
      // Awards: FK lookup first (indexed, precise). Fallback to name search
      // for breweries whose award rows weren't linked during Phase 1 backfill.
      const [brandsRes, primaryAwards] = await Promise.all([
        supabase.from('sake_brands').select('id,name,furigana,romaji')
          .eq('brewery_id', brewery.id).order('name'),
        supabase.from('sake_awards').select('year,brand_name,is_gold')
          .eq('brewery_id', brewery.id)
          .order('year', { ascending: false }).limit(200),
      ])
      let awardsData = primaryAwards.data || []
      if (awardsData.length === 0) {
        const searchKw = brewKw.length >= 2 ? brewKw : brewery.name
        const { data } = await supabase.from('sake_awards')
          .select('year,brand_name,is_gold')
          .ilike('brewery_name', `%${searchKw}%`)
          .order('year', { ascending: false }).limit(200)
        awardsData = data || []
      }
      setBrands(brandsRes.data || [])
      setAwards(awardsData)
    }
    setOpen(o => !o)
  }
  // Pre-compute from summary (available before click); switch to precise count after load
  const preMatch = brewKw.length >= 2
    ? iwcSummary.find(d => d.name.includes(brewKw))
    : null
  const goldCount  = awards
    ? [...new Set(awards.filter(a =>  a.is_gold).map(a => a.year))].length
    : (preMatch?.hasGold ? 1 : 0)
  const silverOnly = awards
    ? (goldCount === 0 && awards.some(a => !a.is_gold))
    : (!preMatch?.hasGold && preMatch?.hasSilver)

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        onClick={toggle}
        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '10px 12px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--text)', flex: 1, minWidth: 0 }}>
          <RubyName name={brewery.name} furigana={brewery.furigana} />
        </span>
        {brewery.romaji && (
          <span style={{ fontSize: 11, color: 'var(--sub)', letterSpacing: '.04em', flexShrink: 0 }}>{brewery.romaji}</span>
        )}
        {goldCount > 0 && (
          <span style={{ fontSize: 10, color: '#8A6C00', background: 'rgba(180,140,0,.10)', border: '1px solid rgba(180,140,0,.28)', borderRadius: 8, padding: '1px 7px', flexShrink: 0 }}>
            ★ ×{goldCount}
          </span>
        )}
        {silverOnly && (
          <span style={{ fontSize: 10, color: 'var(--sub)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '1px 7px', flexShrink: 0 }}>
            ○ IWC
          </span>
        )}
        <span style={{ fontSize: 11, color: 'var(--sub)', flexShrink: 0, marginLeft: 2 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ padding: '2px 14px 12px 20px' }}>
          {brands === null ? (
            <div style={{ fontSize: 12, color: 'var(--sub)', padding: '4px 0' }}>…</div>
          ) : (
            <>
              {brands.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 8px' }}>
                  {brands.map(b => (
                    <BrandChip key={b.id} brand={b} lang={lang} />
                  ))}
                </div>
              )}
              {brands.length === 0 && (
                <div style={{ fontSize: 12, color: 'var(--sub)', paddingBottom: 4 }}>
                  {lang === 'ja' ? '銘柄なし' : lang === 'zh' ? '無銘柄' : 'No brands'}
                </div>
              )}
              <IwcTimeline awards={awards} lang={lang} />
            </>
          )}
        </div>
      )}
    </div>
  )
}

function BreweryDirectory({ lang, initialQ = '' }) {
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

  const searchPlaceholder = lang === 'ja' ? '蔵名・読み・ローマ字で検索…' : lang === 'zh' ? '搜索酒廠名稱…' : 'Search brewery name, reading…'
  const loadingText = lang === 'ja' ? '読み込み中…' : lang === 'zh' ? '載入中…' : 'Loading…'

  if (breweries === null) {
    return <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--sub)', fontSize: 14 }}>{loadingText}</div>
  }

  const areas = Object.keys(grouped || {}).sort((a, b) => {
    if (a === '不明' || b === '不明') return a === '不明' ? 1 : -1
    return a.localeCompare(b, 'ja')
  })
  const totalShown = areas.reduce((n, a) => n + grouped[a].length, 0)

  return (
    <div>
      <input
        style={s.search}
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder={searchPlaceholder}
      />
      {q && (
        <div style={{ fontSize: 12, color: 'var(--sub)', marginBottom: 14, marginTop: -10 }}>
          {lang === 'ja' ? `${totalShown} 件` : lang === 'zh' ? `共 ${totalShown} 間` : `${totalShown} results`}
        </div>
      )}
      {areas.map(area => {
        const list = grouped[area]
        const isOpen = openAreas.has(area)
        return (
          <div key={area} style={{ marginBottom: 8 }}>
            <button
              onClick={() => toggleArea(area)}
              style={{
                width: '100%', background: 'var(--surface-card)', border: '1px solid var(--border)',
                borderRadius: isOpen ? '12px 12px 0 0' : 12, cursor: 'pointer',
                padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8,
              }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--accent)', flex: 1, textAlign: 'left' }}>{areaLabel(area, lang)}</span>
              <span style={{ fontSize: 11, color: 'var(--sub)' }}>
                {lang === 'ja' ? `${list.length}蔵` : lang === 'zh' ? `${list.length}廠` : `${list.length}`}
              </span>
              <span style={{ fontSize: 11, color: 'var(--sub)', marginLeft: 2 }}>{isOpen ? '▲' : '▼'}</span>
            </button>
            {isOpen && (
              <div style={{ border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 12px 12px', background: 'var(--surface-card)', overflow: 'hidden' }}>
                {list.map(b => (
                  <BreweryRow key={b.id} brewery={b} lang={lang} iwcSummary={iwcSummary} />
                ))}
              </div>
            )}
          </div>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
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
  glossary:  { ja: '用語集',   zh: '術語辭典', en: 'Glossary',   title: TITLE,      sub: SUB },
  breweries: { ja: '酒蔵一覧', zh: '酒廠列表', en: 'Breweries',  title: BREW_TITLE, sub: BREW_SUB },
  rice:      { ja: '酒米',     zh: '酒米',     en: 'Sake Rice',
    title: { ja: '酒米品種一覧', zh: '酒米品種一覧', en: 'Sake Rice Varieties' },
    sub:   { ja: '酒造好適米の品種と産地', zh: '釀酒專用米的品種與產地', en: 'Brewing rice varieties and origins' } },
  yeast:     { ja: '酵母',     zh: '酵母',     en: 'Yeast',
    title: { ja: '酵母一覧', zh: '酵母一覧', en: 'Sake Yeasts' },
    sub:   { ja: '協会酵母と地域酵母の種類', zh: '協會酵母與地域酵母種類', en: 'Kyokai and regional yeast strains' } },
}

export default function Wiki({ session }) {
  const { lang } = useLang()
  const { articles, reload } = useWiki()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [tab, setTab] = useState(() => {
    const t = searchParams.get('tab')
    return TAB_META[t] ? t : 'glossary'
  })
  // Sync tab when URL params change (e.g., Wiki popup deep-link to another tab)
  useEffect(() => {
    const t = searchParams.get('tab')
    if (TAB_META[t] && t !== tab) setTab(t)
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

  const meta = TAB_META[tab] || TAB_META.glossary

  return (
    <div style={s.page}>
      <Nav session={session} />
      <div style={s.hero}>
        <div style={s.heroTitle}>{meta.title[lang]}</div>
        <div style={s.heroSub}>{meta.sub[lang]}</div>
      </div>
      <div style={{ ...s.tabs, flexWrap: 'wrap', gap: 6 }}>
        {Object.entries(TAB_META).map(([id, m]) => (
          <button key={id} style={s.tab(tab === id)} onClick={() => {
            setTab(id)
            // Clear any lingering #term-id hash so the new tab starts at the top
            navigate(`/wiki?tab=${id}`, { replace: true })
            window.scrollTo({ top: 0 })
          }}>
            {m[lang] || m.ja}
          </button>
        ))}
      </div>
      <div style={{ ...s.main, marginTop: 20 }}>
        {tab === 'breweries' && <BreweryDirectory lang={lang} initialQ={breweryQ} />}
        {tab === 'rice'      && <FlatDirectory items={riceItems} lang={lang} />}
        {tab === 'yeast'     && <FlatDirectory items={yeastItems} lang={lang} />}
        {tab === 'glossary'  && (
          <>
            <input style={s.search} value={q} onChange={e => setQ(e.target.value)}
              placeholder={lang === 'en' ? 'Search terms…' : lang === 'zh' ? '搜索術語…' : '用語を検索…'} />
            {!q && glossaryByCat.length > 1 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18, marginTop: -8 }}>
                {glossaryByCat.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => scrollToCat(cat.id)}
                    style={{
                      fontSize: 12, padding: '4px 12px', borderRadius: 16,
                      border: '1px solid var(--border)', background: 'var(--surface-card)',
                      color: 'var(--sub)', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    }}>
                    {cat.label[lang] || cat.label.ja}
                    <span style={{ marginLeft: 6, opacity: 0.6 }}>{cat.items.length}</span>
                  </button>
                ))}
              </div>
            )}
            {q && (
              <div style={{ fontSize: 12, color: 'var(--sub)', marginBottom: 14, marginTop: -10 }}>
                {lang === 'ja' ? `${glossaryItems.length} 件` : lang === 'zh' ? `共 ${glossaryItems.length} 條` : `${glossaryItems.length} results`}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {glossaryByCat.map(cat => (
                <div key={cat.id} id={`gloss-cat-${cat.id}`} style={{ scrollMarginTop: 20 }}>
                  <div style={{ fontSize: 10, letterSpacing: '.08em', color: 'var(--sub)', marginBottom: 10, fontWeight: 500 }}>
                    {(cat.label[lang] || cat.label.ja).toUpperCase()}
                  </div>
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
