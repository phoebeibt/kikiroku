import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Nav from '../../components/Nav'
import SakeBottleCrop from '../../components/bottle/SakeBottleCrop'
import { useLang } from '../../contexts/LangContext'
import { formatRating } from '../../lib/rating'
import { forwardFrom } from '../../lib/plaza'
import { useWishes } from '../../lib/wishes'
import { entryFullName, entryMatchesProduct, loadPublicEntries } from '../../lib/sakeMatch'
import '../sakeDetail.css'
import { isPrefecture, normalizeRegion, regionPath } from '../../lib/region'
import './wiki.css'

const dot = d => (d || '').slice(0, 10).replaceAll('-', '.')
const pct = v => (v == null || v === '' ? null : `${String(v).replace(/%$/, '')}%`)

// For a sake with no catalogue row: take each spec from the newest record that has it.
function assembleFromRecords(group, brand, name, brewery) {
  const pick = k => group.find(e => e[k] != null && e[k] !== '')?.[k] ?? null
  return {
    id: null, recorded: true, brand, sakeName: name,
    name: [brand, name].filter(Boolean).join(' '),
    brewery_name: brewery || pick('brewery'), region: pick('region'), type: pick('type'),
    polishing: pick('polishing'), alcohol: pick('alcohol'), smv: pick('smv'), acidity: pick('acidity'), rice: pick('rice'), yeast: pick('yeast'),
  }
}

/**
 * 事典 › 酒款の詳細. Catalog facts plus the people side: みんなの瓶身 (public records of this
 * sake), your own records (count + link only — private notes stay in マイ帳), and この酒を記録.
 * `recorded` mode (/wiki/sake/recorded?brand=&name=&brewery=) serves sakes people recorded that the
 * catalogue doesn't have; if a catalogue row does exist it redirects there.
 */
export default function ProductDetail({ session, recorded = false }) {
  const params = useParams()
  const [search] = useSearchParams()
  const rb = search.get('brand') || '', rn = search.get('name') || '', rbr = search.get('brewery') || ''
  const id = recorded ? `recorded:${rb}|${rn}|${rbr}` : params.id
  const navigate = useNavigate()
  const { lang } = useLang()
  const L = (ja, zh, en) => (lang === 'ja' ? ja : lang === 'zh' ? zh : en)
  const isGuest = !session
  const [loaded, setLoaded] = useState({ id: null, data: null })
  const product = loaded.id === id ? loaded.data : undefined
  const [publicEntries, setPublicEntries] = useState([])
  const [mine, setMine] = useState([])
  const [siblings, setSiblings] = useState([])
  const { isWishedProduct, toggleWish } = useWishes(session)

  useEffect(() => {
    if (!recorded) {
      supabase.from('sake_products').select('*').eq('id', id).maybeSingle()
        .then(({ data }) => setLoaded({ id, data: data || null }))
      loadPublicEntries().then(setPublicEntries)
      return
    }
    const probe = { brand: rb, name: rn, brewery: rbr }
    const key = entryFullName(probe)
    loadPublicEntries().then(async all => {
      setPublicEntries(all)
      const group = all.filter(e => entryFullName(e) === key)
      const linked = group.find(e => e.product_id)?.product_id
      if (linked) { navigate(`/wiki/sake/${linked}`, { replace: true }); return }
      if (rbr) {
        const { data } = await supabase.from('sake_products').select('id,name,brewery_name').eq('brewery_name', rbr).limit(400)
        const hit = (data || []).find(p => entryMatchesProduct(probe, p))
        if (hit) { navigate(`/wiki/sake/${hit.id}`, { replace: true }); return }
      }
      const assembled = assembleFromRecords(group, rb, rn, rbr)
      if (assembled.brewery_name) {
        const { data } = await supabase.from('sake_breweries').select('id').eq('name', assembled.brewery_name).limit(1)
        assembled.brewery_id = data?.[0]?.id || null
      }
      setLoaded({ id, data: group.length || rn ? assembled : null })
    })
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const recordedKey = product?.recorded ? entryFullName({ brand: product.brand, name: product.sakeName }) : null
  const matches = e => (!product ? false : recordedKey ? entryFullName(e) === recordedKey : entryMatchesProduct(e, product))

  useEffect(() => {
    if (!product) return
    if (product.brewery_name) {
      let q = supabase.from('sake_products').select('id,name,type,polishing').eq('brewery_name', product.brewery_name)
      if (product.id) q = q.neq('id', product.id)
      q.order('name').limit(8).then(({ data }) => setSiblings(data || []))
    }
    if (session && product.brewery_name) {
      supabase.from('sake_entries').select('id,product_id,brand,name,brewery,rating,tasted_at,photo_url,thumb_url,photo_crop,status')
        .eq('user_id', session.user.id).eq('brewery', product.brewery_name)
        .then(({ data }) => setMine((data || []).filter(e => e.status !== 'draft' && matches(e))))
    }
  }, [product, session?.user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const others = product ? publicEntries.filter(e => matches(e) && e.user_id !== session?.user?.id) : []
  const cover = [...mine, ...others].find(e => e.thumb_url || e.photo_url)

  if (product === undefined) {
    return <div className="kk-wiki-page"><Nav session={session} topbar={false} /><div className="kk-wdetail"><div className="kk-skeleton" aria-hidden="true"><div className="kk-skeleton__row"><span /><span /><span /></div></div></div></div>
  }
  if (product === null) {
    return (
      <div className="kk-wiki-page"><Nav session={session} topbar={false} />
        <div className="kk-wdetail">
          <button type="button" className="kk-wdetail__back" onClick={() => navigate('/wiki')}>‹ {L('事典', '事典', 'Library')}</button>
          <div className="kk-empty kk-empty--quiet"><strong>{L('この酒款は見つかりませんでした', '找不到這款酒', 'Sake not found')}</strong></div>
        </div>
      </div>
    )
  }

  const specs = [
    [L('精米歩合', '精米步合', 'Polishing'), pct(product.polishing)],
    [L('アルコール', '酒精度', 'Alcohol'), pct(product.alcohol)],
    [L('日本酒度', '日本酒度', 'SMV'), product.smv],
    [L('酸度', '酸度', 'Acidity'), product.acidity],
    [L('原料米', '原料米', 'Rice'), product.rice],
    [L('酵母', '酵母', 'Yeast'), product.yeast],
  ].filter(([, v]) => v != null && v !== '')

  const sake = forwardFrom({ product_id: product.id, brand: product.recorded ? product.brand : '', name: product.recorded ? product.sakeName : product.name, brewery: product.brewery_name, region: product.region, type: product.type, alcohol: product.alcohol, rice: product.rice, polishing: product.polishing, smv: product.smv, acidity: product.acidity, yeast: product.yeast })
  const recordIt = () => {
    if (isGuest) { navigate('/login'); return }
    navigate('/journal', { state: { forward: sake } })
  }
  const wished = isWishedProduct(product.id)
  // A recorded-only sake joins the catalogue when it is wished; move to its real 酒款 page.
  const wishIt = async () => {
    const pid = await toggleWish(null, sake)
    if (pid && !product.id) navigate(`/wiki/sake/${pid}`, { replace: true })
  }
  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate('/wiki'))

  return (
    <div className="kk-wiki-page">
      <Nav session={session} topbar={false} />
      <article className="kk-wdetail">
        <button type="button" className="kk-wdetail__back" onClick={goBack}>‹ {L('事典', '事典', 'Library')}</button>

        <header className="kk-wdetail__hero">
          <span className="kk-wdetail__hero-bottle" aria-hidden="true">
            <SakeBottleCrop imageUrl={isGuest || !cover ? null : (cover.thumb_url || cover.photo_url)} crop={cover?.photo_crop} height="172px" />
          </span>
          <div>
            <h1>{product.name}</h1>
            <p className="kk-wdetail__sub">
              {product.brewery_id
                ? <button type="button" className="kk-wdetail__link" onClick={() => navigate(`/wiki/brewery/${product.brewery_id}`)}>{product.brewery_name}</button>
                : product.brewery_name}
              {product.region && <> · {isPrefecture(product.region) ? <button type="button" className="kk-wdetail__link" onClick={() => navigate(regionPath(product.region))}>{normalizeRegion(product.region)}</button> : product.region}</>}
              {product.type && <> · {product.type}</>}
              {product.is_seasonal && <> · {L('季節限定', '季節限定', 'Seasonal')}</>}
            </p>
          </div>
        </header>

        {specs.length > 0 && (
          <ul className="kk-spec" aria-label={L('スペック', '規格', 'Specs')}>
            {specs.map(([k, v]) => <li key={k}><b>{v}</b><span>{k}</span></li>)}
          </ul>
        )}

        <h2 className="kk-wiki__sec">{L('みんなの瓶身', '大家的瓶身', 'Others’ bottles')}<small>{L(`公開酒札 ${others.length}`, `公開酒札 ${others.length}`, `${others.length} public`)}</small></h2>
        {others.length > 0 ? (
          <section className="kk-others">
            <ul className="kk-others__list">
              {others.map(o => (
                <li key={o.id}>
                  <button type="button" className="kk-others__item" onClick={() => navigate(`/journal/${o.id}`)}>
                    <span className="kk-others__stage" aria-hidden="true">
                      <SakeBottleCrop imageUrl={isGuest ? null : (o.thumb_url || o.photo_url)} crop={o.photo_crop} height="96px" />
                    </span>
                    {!isGuest && Number(o.rating) > 0 && <span className="kk-score">{formatRating(o.rating)}</span>}
                    {!isGuest && <span className="kk-others__who">{o.contributor_name || L('匿名', '匿名', 'Someone')}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <p className="kk-wdetail__empty">{L('まだ公開酒札がありません。記録して公開すると、ここに瓶身が並びます。', '還沒有公開酒札。記錄並公開後，瓶身會出現在這裡。', 'No public tags yet. Record and share it to add the first bottle.')}</p>
        )}

        {!isGuest && (
          <>
            <h2 className="kk-wiki__sec">{L('あなたの記録', '你的記錄', 'Your records')}<small>{mine.length}</small></h2>
            {mine.length > 0 ? (
              <ul className="kk-shelf">
                {mine.map(e => (
                  <li key={e.id}>
                    <button type="button" className="kk-shelf__item" onClick={() => navigate(`/journal/${e.id}`)}>
                      <span className="kk-shelf__bottle" aria-hidden="true"><SakeBottleCrop imageUrl={e.thumb_url || e.photo_url} crop={e.photo_crop} height="64px" /></span>
                      <span className="kk-shelf__main">
                        <span className="kk-shelf__title">{[dot(e.tasted_at), Number(e.rating) > 0 && formatRating(e.rating)].filter(Boolean).join(' · ')}</span>
                        <span className="kk-shelf__meta">{L('マイ帳で開く', '在マイ帳打開', 'Open in your shelf')}</span>
                      </span>
                      <span className="kk-shelf__chev" aria-hidden="true">›</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="kk-wdetail__empty">{L('まだ記録していません。', '還沒有記錄過。', 'Not recorded yet.')}</p>
            )}
          </>
        )}

        {siblings.length > 0 && (
          <>
            <h2 className="kk-wiki__sec">{L('同じ酒造の酒款', '同酒造的酒款', 'More from this brewery')}</h2>
            <ul className="kk-shelf">
              {siblings.map(s => (
                <li key={s.id}>
                  <button type="button" className="kk-shelf__item kk-shelf__item--plain" onClick={() => navigate(`/wiki/sake/${s.id}`)}>
                    <span className="kk-shelf__main">
                      <span className="kk-shelf__title">{s.name}</span>
                      <span className="kk-shelf__meta">{[s.type, s.polishing && `精米${s.polishing}%`].filter(Boolean).join(' · ')}</span>
                    </span>
                    <span className="kk-shelf__chev" aria-hidden="true">›</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </article>

      <div className={`kk-wdetail__cta${isGuest ? '' : ' kk-wdetail__cta--pair'}`}>
        {!isGuest && (
          <button type="button" className={`kk-btn${wished ? ' is-on' : ''}`} aria-pressed={wished} onClick={wishIt}>
            {wished ? L('飲みたい済み', '已加入想喝', 'On wish list') : L('飲みたい', '想喝', 'Want to try')}
          </button>
        )}
        <button type="button" className="kk-btn kk-btn--primary" onClick={recordIt}>
          {isGuest ? L('ログインして記録', '登入後記錄', 'Sign in to record') : L('この酒を記録', '記錄這款酒', 'Record this sake')}
        </button>
      </div>
    </div>
  )
}
