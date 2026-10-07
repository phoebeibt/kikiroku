import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Nav from '../../components/Nav'
import SakeBottleCrop from '../../components/bottle/SakeBottleCrop'
import { useLang } from '../../contexts/LangContext'
import { loadPublicEntries } from '../../lib/sakeMatch'
import { normalizeRegion } from '../../lib/region'
import '../sakeDetail.css'
import './wiki.css'

const dot = d => (d || '').slice(0, 10).replaceAll('-', '.')
const title = e => [e.brand, e.name].filter(Boolean).join(' ')

/**
 * 事典 › 産地. Facts only — this is reference, not a diary: counts, the brewery you record most,
 * the prefecture's breweries. No ratings, flavour tendencies or notes (user decision 2026-10-07).
 */
export default function RegionPage({ session }) {
  const params = useParams()
  const name = normalizeRegion(params.name)
  const navigate = useNavigate()
  const { lang } = useLang()
  const L = (ja, zh, en) => (lang === 'ja' ? ja : lang === 'zh' ? zh : en)
  const isGuest = !session
  const [mine, setMine] = useState(null)
  const [publicEntries, setPublicEntries] = useState(null)
  const [breweries, setBreweries] = useState(null)
  const [seg, setSeg] = useState(null)

  useEffect(() => {
    loadPublicEntries().then(setPublicEntries)
    supabase.from('sake_breweries').select('id,name,furigana,romaji,sake_areas!inner(name)').eq('sake_areas.name', name).order('name').limit(1000)
      .then(({ data }) => setBreweries((data || []).filter(b => b.name?.trim())))
  }, [name])

  useEffect(() => {
    if (!session) return
    supabase.from('sake_entries').select('id,brand,name,brewery,region,tasted_at,photo_url,thumb_url,photo_crop,status')
      .eq('user_id', session.user.id).order('tasted_at', { ascending: false })
      .then(({ data }) => setMine(data || []))
  }, [session?.user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const own = useMemo(() => (mine || []).filter(e => e.status !== 'draft' && normalizeRegion(e.region) === name), [mine, name])
  const others = useMemo(() => (publicEntries || []).filter(e => normalizeRegion(e.region) === name && e.user_id !== session?.user?.id), [publicEntries, name, session?.user?.id])
  const ownByBrewery = useMemo(() => own.reduce((m, e) => (e.brewery ? { ...m, [e.brewery]: (m[e.brewery] || 0) + 1 } : m), {}), [own])
  const topBrewery = Object.keys(ownByBrewery).sort((a, b) => ownByBrewery[b] - ownByBrewery[a])[0]
  const breweryList = useMemo(() => [...(breweries || [])].sort((a, b) => (ownByBrewery[b.name] || 0) - (ownByBrewery[a.name] || 0) || a.name.localeCompare(b.name, 'ja')), [breweries, ownByBrewery])

  const ready = publicEntries && breweries && (isGuest || mine)
  const active = seg || (!isGuest && own.length ? 'mine' : others.length ? 'public' : 'breweries')
  const segs = [
    ...(isGuest ? [] : [['mine', L('自分の酒札', '我的酒札', 'Mine'), own.length]]),
    ['public', L('公開酒札', '公開酒札', 'Public'), others.length],
    ['breweries', L('酒造', '酒造', 'Breweries'), breweries?.length ?? 0],
  ]
  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate('/wiki?tab=breweries'))

  return (
    <div className="kk-wiki-page">
      <Nav session={session} topbar={false} />
      <article className="kk-wdetail kk-region">
        <button type="button" className="kk-wdetail__back" onClick={goBack}>‹ {L('戻る', '返回', 'Back')}</button>

        <header className="kk-region__head">
          <h1>{L(`${name}の酒`, `${name}的酒`, `Sake from ${name}`)}</h1>
          <dl className="kk-region__stats">
            {!isGuest && <div><dd>{ready ? own.length : '…'}</dd><dt>{L('自分の酒札', '我的酒札', 'Your tags')}</dt></div>}
            {!isGuest && <div><dd className="is-text">{topBrewery || '—'}</dd><dt>{L('よく飲む酒造', '最常喝酒造', 'Most recorded')}</dt></div>}
            <div><dd>{breweries ? breweries.length : '…'}</dd><dt>{L('酒造', '酒造', 'Breweries')}</dt></div>
            <div><dd>{publicEntries ? others.length : '…'}</dd><dt>{L('公開酒札', '公開酒札', 'Public tags')}</dt></div>
          </dl>
        </header>

        <div className="kk-seg" role="tablist" aria-label={L('表示', '顯示', 'View')}>
          {segs.map(([k, label, n]) => (
            <button key={k} type="button" role="tab" aria-selected={active === k} className={active === k ? 'is-active' : ''} onClick={() => setSeg(k)}>
              {label}<span className="kk-seg__n">{n}</span>
            </button>
          ))}
        </div>

        {!ready && <div className="kk-skeleton" aria-hidden="true">{[0, 1, 2].map(i => <div key={i} className="kk-skeleton__row"><span /><span /><span /></div>)}</div>}

        {ready && active === 'mine' && (own.length ? (
          <ul className="kk-shelf">
            {own.map(e => (
              <li key={e.id}>
                <button type="button" className="kk-shelf__item" onClick={() => navigate(`/journal/${e.id}`)}>
                  <span className="kk-shelf__bottle" aria-hidden="true"><SakeBottleCrop imageUrl={e.thumb_url || e.photo_url} crop={e.photo_crop} height="72px" /></span>
                  <span className="kk-shelf__main">
                    <span className="kk-shelf__title">{title(e)}</span>
                    <span className="kk-shelf__meta">{[e.brewery, dot(e.tasted_at)].filter(Boolean).join(' · ')}</span>
                  </span>
                  <span className="kk-shelf__chev" aria-hidden="true">›</span>
                </button>
              </li>
            ))}
          </ul>
        ) : <p className="kk-wdetail__empty">{L(`${name}の記録はまだありません。`, `還沒有${name}的記錄。`, `No records from ${name} yet.`)}</p>)}

        {ready && active === 'public' && (others.length ? (
          <ul className="kk-shelf">
            {others.map(e => (
              <li key={e.id}>
                <button type="button" className="kk-shelf__item" onClick={() => navigate(`/journal/${e.id}`)}>
                  <span className="kk-shelf__bottle" aria-hidden="true"><SakeBottleCrop imageUrl={isGuest ? null : (e.thumb_url || e.photo_url)} crop={e.photo_crop} height="72px" /></span>
                  <span className="kk-shelf__main">
                    <span className="kk-shelf__title">{title(e)}</span>
                    <span className="kk-shelf__meta">{[e.brewery, !isGuest && e.contributor_name].filter(Boolean).join(' · ')}</span>
                  </span>
                  <span className="kk-shelf__chev" aria-hidden="true">›</span>
                </button>
              </li>
            ))}
          </ul>
        ) : <p className="kk-wdetail__empty">{L('この産地の公開酒札はまだありません。', '這個產地還沒有公開酒札。', 'No public tags from here yet.')}</p>)}

        {ready && active === 'breweries' && (breweryList.length ? (
          <ul className="kk-shelf">
            {breweryList.map(b => (
              <li key={b.id}>
                <button type="button" className="kk-shelf__item kk-shelf__item--plain" onClick={() => navigate(`/wiki/brewery/${b.id}`)}>
                  <span className="kk-shelf__main">
                    <span className="kk-shelf__title">{lang === 'ja' && b.furigana ? <ruby>{b.name}<rt>{b.furigana}</rt></ruby> : b.name}</span>
                    {lang !== 'ja' && b.romaji && <span className="kk-shelf__meta">{b.romaji}</span>}
                  </span>
                  <span className="kk-shelf__side">
                    {ownByBrewery[b.name] > 0 && <span>{L(`あなた ${ownByBrewery[b.name]}`, `你 ${ownByBrewery[b.name]}`, `You ${ownByBrewery[b.name]}`)}</span>}
                    <span className="kk-shelf__chev" aria-hidden="true">›</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : <p className="kk-wdetail__empty">{L('この産地の酒造データはまだありません。', '還沒有這個產地的酒造資料。', 'No breweries listed for this region yet.')}</p>)}
      </article>
    </div>
  )
}
