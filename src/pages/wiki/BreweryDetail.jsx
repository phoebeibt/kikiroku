import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Nav from '../../components/Nav'
import { useLang } from '../../contexts/LangContext'
import { regionPath } from '../../lib/region'
import './wiki.css'

const PAGE = 30
// Award rows were linked by brewery_id in a backfill; older rows only carry the name.
const brewKeyword = name => (name || '').replace(/(株式会社|有限会社|合資会社|合名会社|㈱|㈲|合同会社)/g, '').trim().split(/[\s\u3000]+/)[0]

/** 事典 › 酒造の詳細: reading, region, IWC awards, brands, its 酒款, and a link to your own records. */
export default function BreweryDetail({ session }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { lang } = useLang()
  const L = (ja, zh, en) => (lang === 'ja' ? ja : lang === 'zh' ? zh : en)
  const [loaded, setLoaded] = useState({ id: null, data: null })
  const brewery = loaded.id === id ? loaded.data : undefined
  const [brands, setBrands] = useState([])
  const [awards, setAwards] = useState([])
  const [products, setProducts] = useState([])
  const [productTotal, setProductTotal] = useState(0)
  const [mineCount, setMineCount] = useState(0)
  const [page, setPage] = useState(0)

  useEffect(() => {
    supabase.from('sake_breweries').select('id,name,furigana,romaji,sake_areas(name)').eq('id', id).maybeSingle()
      .then(({ data }) => { setPage(0); setLoaded({ id, data: data || null }) })
    supabase.from('sake_brands').select('id,name,furigana,romaji').eq('brewery_id', id).order('name')
      .then(({ data }) => setBrands(data || []))
  }, [id])

  useEffect(() => {
    if (!brewery) return
    supabase.from('sake_awards').select('year,is_gold').eq('brewery_id', brewery.id).order('year', { ascending: false }).limit(200)
      .then(async ({ data }) => {
        if (data?.length) { setAwards(data); return }
        const kw = brewKeyword(brewery.name)
        const res = await supabase.from('sake_awards').select('year,is_gold').ilike('brewery_name', `%${kw.length >= 2 ? kw : brewery.name}%`).order('year', { ascending: false }).limit(200)
        setAwards(res.data || [])
      })
    if (session) {
      supabase.from('sake_entries').select('id', { count: 'exact', head: true }).eq('user_id', session.user.id).eq('brewery', brewery.name).neq('status', 'draft')
        .then(({ count }) => setMineCount(count || 0))
    }
  }, [brewery, session?.user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!brewery) return
    supabase.from('sake_products').select('id,name,type,polishing', { count: 'exact' })
      .or(`brewery_id.eq.${brewery.id},brewery_name.eq."${brewery.name.replace(/["\\]/g, '')}"`)
      .order('name').range(page * PAGE, page * PAGE + PAGE - 1)
      .then(({ data, count }) => { setProducts(prev => (page === 0 ? (data || []) : [...prev, ...(data || [])])); setProductTotal(count || 0) })
  }, [brewery, page])

  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate('/wiki?tab=breweries'))

  if (brewery === undefined) {
    return <div className="kk-wiki-page"><Nav session={session} topbar={false} /><div className="kk-wdetail"><div className="kk-skeleton" aria-hidden="true"><div className="kk-skeleton__row"><span /><span /><span /></div></div></div></div>
  }
  if (brewery === null) {
    return (
      <div className="kk-wiki-page"><Nav session={session} topbar={false} />
        <div className="kk-wdetail">
          <button type="button" className="kk-wdetail__back" onClick={goBack}>‹ {L('事典', '事典', 'Library')}</button>
          <div className="kk-empty kk-empty--quiet"><strong>{L('この酒造は見つかりませんでした', '找不到這家酒造', 'Brewery not found')}</strong></div>
        </div>
      </div>
    )
  }

  const area = brewery.sake_areas?.name
  const gold = [...new Set(awards.filter(a => a.is_gold).map(a => a.year))]
  const silver = [...new Set(awards.filter(a => !a.is_gold).map(a => a.year))].filter(y => !gold.includes(y))
  const reading = lang === 'ja' ? brewery.furigana : brewery.romaji

  return (
    <div className="kk-wiki-page">
      <Nav session={session} topbar={false} />
      <article className="kk-wdetail">
        <button type="button" className="kk-wdetail__back" onClick={goBack}>‹ {L('事典', '事典', 'Library')}</button>
        <header style={{ padding: '6px 0 4px' }}>
          {reading && <p className="kk-wdetail__reading">{reading}</p>}
          <h1>{brewery.name}</h1>
          {area && area !== '不明' && (
            <p className="kk-wdetail__sub">
              <button type="button" className="kk-wdetail__link" onClick={() => navigate(regionPath(area))}>{area}</button>
            </p>
          )}
          {(gold.length > 0 || silver.length > 0) && (
            <div className="kk-awards" aria-label="IWC">
              {gold.map(y => <span key={`g${y}`}>IWC {L('金', '金', 'Gold')} {y}</span>)}
              {silver.map(y => <span key={`s${y}`} className="is-silver">IWC {L('銀・銅', '銀・銅', 'Silver/Bronze')} {y}</span>)}
            </div>
          )}
        </header>

        {brands.length > 0 && (
          <>
            <h2 className="kk-wiki__sec">{L('銘柄', '銘柄', 'Brands')}<small>{brands.length}</small></h2>
            <div className="kk-brands">
              {brands.map(b => (
                <span key={b.id} className="kk-chip" title={(lang === 'ja' ? b.furigana : b.romaji) || undefined}>
                  {lang === 'ja' && b.furigana ? <ruby>{b.name}<rt>{b.furigana}</rt></ruby> : b.name}
                </span>
              ))}
            </div>
          </>
        )}

        <h2 className="kk-wiki__sec">{L('酒款', '酒款', 'Sakes')}<small>{productTotal}</small></h2>
        {products.length > 0 ? (
          <ul className="kk-shelf">
            {products.map(p => (
              <li key={p.id}>
                <button type="button" className="kk-shelf__item kk-shelf__item--plain" onClick={() => navigate(`/wiki/sake/${p.id}`)}>
                  <span className="kk-shelf__main">
                    <span className="kk-shelf__title">{p.name}</span>
                    <span className="kk-shelf__meta">{[p.type, p.polishing && `精米${p.polishing}%`].filter(Boolean).join(' · ')}</span>
                  </span>
                  <span className="kk-shelf__chev" aria-hidden="true">›</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="kk-wdetail__empty">{L('酒款のデータはまだありません。', '還沒有酒款資料。', 'No sakes in the catalog yet.')}</p>
        )}
        {products.length < productTotal && (
          <button type="button" className="kk-btn kk-btn--block kk-wiki__more" onClick={() => setPage(p => p + 1)}>{L('もっと見る', '載入更多', 'Show more')}</button>
        )}

        {session && (
          <>
            <h2 className="kk-wiki__sec">{L('あなたの記録', '你的記錄', 'Your records')}<small>{mineCount}</small></h2>
            {mineCount > 0 ? (
              <button type="button" className="kk-btn kk-btn--block" onClick={() => navigate('/journal', { state: { brewery: brewery.name } })}>
                {L(`マイ帳で ${brewery.name} の記録を見る`, `在マイ帳查看 ${brewery.name} 的記錄`, `See them in your shelf`)}
              </button>
            ) : (
              <p className="kk-wdetail__empty">{L('この酒造の記録はまだありません。', '還沒有這家酒造的記錄。', 'No records from this brewery yet.')}</p>
            )}
          </>
        )}
      </article>
    </div>
  )
}
