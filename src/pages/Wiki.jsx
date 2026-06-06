import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
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
    <div id={article.id} style={{ ...s.card, outline: isAnchor ? '2px solid var(--accent)' : 'none' }}>
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

function BreweryRow({ brewery, lang }) {
  const [open, setOpen] = useState(false)
  const [brands, setBrands] = useState(null)

  const toggle = async () => {
    if (!open && brands === null) {
      const { data } = await supabase
        .from('sake_brands')
        .select('id,name,furigana,romaji')
        .eq('brewery_id', brewery.id)
        .order('name')
      setBrands(data || [])
    }
    setOpen(o => !o)
  }

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        onClick={toggle}
        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '10px 12px', textAlign: 'left', display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--text)', flex: 1, minWidth: 0 }}>
          <RubyName name={brewery.name} furigana={brewery.furigana} />
        </span>
        {brewery.romaji && (
          <span style={{ fontSize: 11, color: 'var(--sub)', letterSpacing: '.04em', flexShrink: 0 }}>{brewery.romaji}</span>
        )}
        <span style={{ fontSize: 11, color: 'var(--sub)', flexShrink: 0, marginLeft: 4 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ padding: '2px 12px 10px 20px' }}>
          {brands === null ? (
            <div style={{ fontSize: 12, color: 'var(--sub)', padding: '4px 0' }}>…</div>
          ) : brands.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--sub)', padding: '4px 0' }}>
              {lang === 'ja' ? '銘柄なし' : lang === 'zh' ? '無銘柄' : 'No brands'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 8px' }}>
              {brands.map(b => (
                <BrandChip key={b.id} brand={b} lang={lang} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function BreweryDirectory({ lang }) {
  const [breweries, setBreweries] = useState(null)
  const [q, setQ] = useState('')
  const [openAreas, setOpenAreas] = useState(new Set())

  useEffect(() => {
    async function load() {
      const all = []
      const PAGE = 1000
      for (let from = 0; ; from += PAGE) {
        const { data } = await supabase
          .from('sake_breweries')
          .select('id,name,furigana,romaji,sake_areas(id,name)')
          .range(from, from + PAGE - 1)
          .order('name')
        if (!data?.length) break
        all.push(...data)
        if (data.length < PAGE) break
      }
      setBreweries(all)
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
      const area = b.sake_areas?.name || (lang === 'ja' ? '不明' : lang === 'zh' ? '不明' : 'Unknown')
      if (!result[area]) result[area] = []
      result[area].push(b)
    }
    return result
  }, [breweries, q, lang])

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

  const areas = Object.keys(grouped || {}).sort()
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
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--accent)', flex: 1, textAlign: 'left' }}>{area}</span>
              <span style={{ fontSize: 11, color: 'var(--sub)' }}>
                {lang === 'ja' ? `${list.length}蔵` : lang === 'zh' ? `${list.length}廠` : `${list.length}`}
              </span>
              <span style={{ fontSize: 11, color: 'var(--sub)', marginLeft: 2 }}>{isOpen ? '▲' : '▼'}</span>
            </button>
            {isOpen && (
              <div style={{ border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 12px 12px', background: 'var(--surface-card)', overflow: 'hidden' }}>
                {list.map(b => (
                  <BreweryRow key={b.id} brewery={b} lang={lang} />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Main Wiki page ─────────────────────────────────────────────────────────────

export default function Wiki({ session }) {
  const { lang } = useLang()
  const { articles, reload } = useWiki()
  const [q, setQ] = useState('')
  const [tab, setTab] = useState('glossary')
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

  const isBrewery = tab === 'breweries'
  const title = isBrewery ? BREW_TITLE[lang] : TITLE[lang]
  const sub   = isBrewery ? BREW_SUB[lang]   : SUB[lang]

  return (
    <div style={s.page}>
      <Nav session={session} />
      <div style={s.hero}>
        <div style={s.heroTitle}>{title}</div>
        <div style={s.heroSub}>{sub}</div>
      </div>
      <div style={s.tabs}>
        <button style={s.tab(!isBrewery)} onClick={() => setTab('glossary')}>
          {lang === 'ja' ? '用語集' : lang === 'zh' ? '術語辭典' : 'Glossary'}
        </button>
        <button style={s.tab(isBrewery)} onClick={() => setTab('breweries')}>
          {lang === 'ja' ? '酒蔵一覧' : lang === 'zh' ? '酒廠列表' : 'Breweries'}
        </button>
      </div>
      <div style={{ ...s.main, marginTop: 20 }}>
        {isBrewery ? (
          <BreweryDirectory lang={lang} />
        ) : (
          <>
            <input style={s.search} value={q} onChange={e => setQ(e.target.value)}
              placeholder={lang === 'en' ? 'Search terms…' : lang === 'zh' ? '搜索術語…' : '用語を検索…'} />
            <div style={s.grid}>
              {filtered.map(article => (
                <ArticleCard key={article.id} article={article} lang={lang} isEditor={isEditor} onSaved={reload} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
