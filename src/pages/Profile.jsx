import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Nav from '../components/Nav'
import Stars from '../components/Stars'
import JapanMap, { JA_TO_CODE } from '../components/JapanMap'
import { useLang } from '../contexts/LangContext'
import { THEMES, getTheme, applyTheme } from '../lib/theme'
import { useTagResolver } from '../contexts/TagsContext'

const s = {
  page: { minHeight: '100svh', background: 'var(--bg)' },
  main: { maxWidth: 520, margin: '0 auto', padding: '28px 16px 60px' },
  section: { background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 20px 22px', marginBottom: 14 },
  sectionTitle: { fontSize: 10, letterSpacing: '.08em', color: 'var(--sub)', marginBottom: 14, fontWeight: 500 },
  row: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 },
  label: { fontSize: 12, color: 'var(--sub)', width: 72, flexShrink: 0 },
  value: { fontSize: 14, color: 'var(--text)', flex: 1 },
  input: {
    flex: 1, padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border)',
    background: 'var(--bg)', color: 'var(--text)', fontSize: 14, outline: 'none',
    fontFamily: 'var(--font-sans)',
  },
  saveBtn: {
    padding: '8px 22px', borderRadius: 20, border: 'none', cursor: 'pointer',
    background: 'var(--accent)', color: '#fff', fontSize: 13, fontFamily: 'var(--font-sans)',
  },
  savedMsg: { fontSize: 12, color: '#4A7A35', marginLeft: 8 },
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0 },
  statItem: { padding: '8px 0', borderRight: '1px solid var(--border)', textAlign: 'center' },
  statNum: { fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--text)', lineHeight: 1 },
  statLabel: { fontSize: 10, color: 'var(--sub)', marginTop: 4, letterSpacing: '.04em' },
}

const LABELS = {
  title:       { ja: 'プロフィール',   zh: '個人資料',    en: 'Profile' },
  account:     { ja: 'アカウント',     zh: '賬戶',        en: 'Account' },
  displayName: { ja: '表示名',        zh: '顯示名稱',     en: 'Display Name' },
  email:       { ja: 'メール',        zh: '邮箱',         en: 'Email' },
  since:       { ja: '登録',          zh: '注册',         en: 'Member Since' },
  stats:       { ja: '記録統計',      zh: '記錄統計',     en: 'Entry Stats' },
  bottles:     { ja: '本',            zh: '瓶',           en: '' },
  avgRating:   { ja: '平均評価',      zh: '平均評分',     en: 'Avg Rating' },
  shared:      { ja: '公開中',        zh: '已公開',       en: 'Public' },
  save:        { ja: '設定',          zh: '設置',         en: 'Set' },
  saving:      { ja: '設定中…',      zh: '設置中…',      en: 'Setting…' },
  saved:       { ja: '設定しました',  zh: '已設置',       en: 'Done!' },
  theme:       { ja: 'テーマ',        zh: '主題',         en: 'Theme' },
}

const lbl = (key, lang) => LABELS[key]?.[lang] || LABELS[key]?.en || key

export default function Profile({ session }) {
  const { lang } = useLang()
  const tagLabel = useTagResolver()
  const nav = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [stats, setStats] = useState({ total: 0, avg: null, shared: 0, topTypes: [], topRegions: [], regionCounts: {}, regionEntries: {}, topAroma: [], topTaste: [], tasteBase: 'all' })
  const [currentTheme, setCurrentTheme] = useState(getTheme)
  const [regionView, setRegionView] = useState('map')
  const [selectedPref, setSelectedPref] = useState(null)

  const handleTheme = id => { applyTheme(id); setCurrentTheme(id) }

  useEffect(() => {
    if (!session) { nav('/login'); return }
    const meta = session.user.user_metadata || {}
    setDisplayName(meta.display_name || meta.full_name || '')

    supabase.from('sake_entries')
      .select('id, rating, is_public, type, region, aroma_tags, taste_tags, brand, name, brewery', { count: 'exact' })
      .eq('user_id', session.user.id)
      .then(({ data, count }) => {
        const entries = data || []
        const withRating = entries.filter(e => e.rating != null)
        const avg = withRating.length ? withRating.reduce((s, e) => s + e.rating, 0) / withRating.length : null
        const shared = entries.filter(e => e.is_public).length

        const typeCounts = {}
        entries.forEach(e => { if (e.type) typeCounts[e.type] = (typeCounts[e.type] || 0) + 1 })
        const topTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)

        const regionCounts = {}
        const regionEntries = {}
        entries.forEach(e => {
          if (e.region) {
            regionCounts[e.region] = (regionCounts[e.region] || 0) + 1
            if (!regionEntries[e.region]) regionEntries[e.region] = []
            regionEntries[e.region].push(e)
          }
        })
        const topRegions = Object.entries(regionCounts).sort((a, b) => b[1] - a[1])

        const highRated = entries.filter(e => e.rating >= 4)
        const tasteBase = highRated.length >= 3 ? 'high' : 'all'
        const pool = tasteBase === 'high' ? highRated : entries
        const aromaCounts = {}
        const tasteCounts = {}
        pool.forEach(e => {
          ;(e.aroma_tags || []).forEach(t => { aromaCounts[t] = (aromaCounts[t] || 0) + 1 })
          ;(e.taste_tags || []).forEach(t => { tasteCounts[t] = (tasteCounts[t] || 0) + 1 })
        })
        const topAroma = Object.entries(aromaCounts).sort((a, b) => b[1] - a[1]).slice(0, 6)
        const topTaste = Object.entries(tasteCounts).sort((a, b) => b[1] - a[1]).slice(0, 6)

        setStats({ total: count || 0, avg, shared, topTypes, topRegions, regionCounts, regionEntries, topAroma, topTaste, tasteBase })
      })
  }, [session, nav])

  const handleSave = async () => {
    setSaving(true)
    await supabase.auth.updateUser({ data: { display_name: displayName.trim() } })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!session) return null

  const email = session.user.email
  const createdAt = session.user.created_at
    ? new Date(session.user.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : lang === 'zh' ? 'zh-TW' : 'ja-JP', { year: 'numeric', month: 'long' })
    : ''

  return (
    <div style={s.page}>
      <Nav session={session} />
      <div style={s.main}>

        {/* Account section */}
        <div style={s.section}>
          <div style={s.sectionTitle}>{lbl('account', lang).toUpperCase()}</div>
          <div style={{ ...s.row, marginBottom: 16 }}>
            <div style={s.label}>{lbl('email', lang)}</div>
            <div style={s.value}>{email}</div>
          </div>
          <div style={{ ...s.row, marginBottom: 16 }}>
            <div style={s.label}>{lbl('since', lang)}</div>
            <div style={s.value}>{createdAt}</div>
          </div>
          <div style={{ ...s.row, marginBottom: 0, alignItems: 'center' }}>
            <div style={s.label}>{lbl('displayName', lang)}</div>
            <input
              style={{ ...s.input, flex: '0 1 180px', minWidth: 0 }}
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder={lang === 'en' ? 'Your name…' : lang === 'zh' ? '你的名字…' : 'あなたの名前…'}
              onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
            />
            <button style={{ ...s.saveBtn, background: saved ? '#4A7A35' : 'var(--accent)', minWidth: 36 }} onClick={handleSave} disabled={saving || saved}>
              {saved ? '✅' : lbl('save', lang)}
            </button>
          </div>
        </div>

        {/* Stats section */}
        <div style={s.section}>
          <div style={s.sectionTitle}>{lbl('stats', lang).toUpperCase()}</div>
          <div style={s.statGrid}>
            <div style={s.statItem}>
              <div style={s.statNum}>{stats.total}<span style={{ fontSize: 12, marginLeft: 2 }}>{lbl('bottles', lang)}</span></div>
              <div style={s.statLabel}>{lang === 'ja' ? '記録した酒' : lang === 'zh' ? '記錄總數' : 'Entries'}</div>
            </div>
            <div style={s.statItem}>
              <div style={s.statNum}>{stats.avg != null ? stats.avg.toFixed(1) : '–'}</div>
              <div style={s.statLabel}>{lbl('avgRating', lang)}</div>
            </div>
            <div style={{ ...s.statItem, borderRight: 'none' }}>
              <div style={s.statNum}>{stats.shared}</div>
              <div style={s.statLabel}>{lbl('shared', lang)}</div>
            </div>
          </div>
        </div>

        {/* Flavor profile */}
        {(stats.topAroma.length > 0 || stats.topTaste.length > 0) && (
          <div style={s.section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
              <div style={s.sectionTitle}>
                {(lang === 'ja' ? '好みの香り・味わい' : lang === 'zh' ? '偏好香氣・口感' : 'Flavor Profile').toUpperCase()}
              </div>
              {stats.tasteBase === 'high' && (
                <div style={{ fontSize: 10, color: 'var(--sub)' }}>
                  {lang === 'ja' ? '★4以上の酒から' : lang === 'zh' ? '來自 ★4 以上' : 'from ★4+ entries'}
                </div>
              )}
            </div>
            {stats.topAroma.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: 'var(--sub)', marginBottom: 8, letterSpacing: '.04em' }}>
                  {lang === 'ja' ? '香り' : lang === 'zh' ? '香氣' : 'Aroma'}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {stats.topAroma.map(([id, cnt], i) => {
                    const opacity = 1 - i * 0.12
                    return (
                      <span key={id} style={{
                        fontSize: 12, padding: '4px 12px', borderRadius: 20,
                        background: `rgba(181,69,27,${0.08 + (1 - i / stats.topAroma.length) * 0.1})`,
                        color: 'var(--text)', border: '1px solid rgba(181,69,27,.2)',
                        opacity,
                      }}>
                        {tagLabel(id, 'aroma')}
                        <span style={{ fontSize: 10, marginLeft: 5, opacity: .7 }}>{cnt}</span>
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
            {stats.topTaste.length > 0 && (
              <div>
                <div style={{ fontSize: 10, color: 'var(--sub)', marginBottom: 8, letterSpacing: '.04em' }}>
                  {lang === 'ja' ? '味わい' : lang === 'zh' ? '口感' : 'Taste'}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {stats.topTaste.map(([id, cnt], i) => {
                    const opacity = 1 - i * 0.12
                    return (
                      <span key={id} style={{
                        fontSize: 12, padding: '4px 12px', borderRadius: 20,
                        background: 'var(--bg)', color: 'var(--text)',
                        border: '1px solid var(--border)', opacity,
                      }}>
                        {tagLabel(id, 'taste')}
                        <span style={{ fontSize: 10, marginLeft: 5, opacity: .5 }}>{cnt}</span>
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Type breakdown */}
        {stats.topTypes.length > 0 && (
          <div style={s.section}>
            <div style={s.sectionTitle}>{(lang === 'ja' ? '種類別' : lang === 'zh' ? '種類分佈' : 'By Type').toUpperCase()}</div>
            {stats.topTypes.map(([type, count]) => (
              <div key={type} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text)', marginBottom: 4 }}>
                  <span>{type}</span>
                  <span style={{ color: 'var(--sub)' }}>{count} {lbl('bottles', lang)}</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: 'var(--accent)', width: `${Math.round(count / stats.total * 100)}%`, transition: 'width .4s' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Region breakdown */}
        {stats.topRegions.length > 0 && (
          <div style={s.section}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={s.sectionTitle}>{(lang === 'ja' ? '産地別' : lang === 'zh' ? '產地分佈' : 'By Region').toUpperCase()}</div>
              <div style={{ display: 'flex', gap: 2, background: 'var(--bg)', borderRadius: 8, padding: 2 }}>
                {[
                  ['map', <svg key="map" width="13" height="13" viewBox="0 0 13 13"><rect x="1" y="1" width="5" height="5" rx="1"/><rect x="7" y="1" width="5" height="5" rx="1"/><rect x="1" y="7" width="5" height="5" rx="1"/><rect x="7" y="7" width="5" height="5" rx="1"/></svg>],
                  ['list', <svg key="list" width="13" height="13" viewBox="0 0 13 13"><rect x="1" y="2" width="11" height="1.5" rx=".75"/><rect x="1" y="5.75" width="11" height="1.5" rx=".75"/><rect x="1" y="9.5" width="11" height="1.5" rx=".75"/></svg>],
                ].map(([v, icon]) => (
                  <button key={v} onClick={() => setRegionView(v)} style={{
                    background: regionView === v ? 'var(--surface-card)' : 'transparent',
                    border: regionView === v ? '1px solid var(--border)' : '1px solid transparent',
                    borderRadius: 6, cursor: 'pointer', padding: '4px 7px',
                    color: regionView === v ? 'var(--text)' : 'var(--sub)',
                    transition: 'all .15s', display: 'flex', alignItems: 'center',
                    fill: 'currentColor',
                  }}>{icon}</button>
                ))}
              </div>
            </div>
            {regionView === 'map' ? (
              <>
                <JapanMap
                  regionCounts={stats.regionCounts}
                  selected={selectedPref}
                  onSelect={code => setSelectedPref(prev => prev === code ? null : code)}
                />
                {selectedPref && (() => {
                  const prefEntries = Object.entries(stats.regionEntries)
                    .filter(([r]) => JA_TO_CODE[r] === selectedPref)
                    .flatMap(([, es]) => es)
                  const prefName = Object.keys(stats.regionEntries).find(r => JA_TO_CODE[r] === selectedPref) || ''
                  if (!prefEntries.length) return null
                  return (
                    <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ fontSize: 11, color: 'var(--text)', fontFamily: 'var(--font-serif)' }}>
                          {prefName}
                          <span style={{ fontSize: 10, color: 'var(--sub)', marginLeft: 6 }}>{prefEntries.length}本</span>
                        </div>
                        <button onClick={() => setSelectedPref(null)} style={{ background: 'none', border: 'none', color: 'var(--sub)', cursor: 'pointer', fontSize: 12, padding: 0 }}>✕</button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {prefEntries.map(e => (
                          <div key={e.id} onClick={() => nav('/journal', { state: { openEntryId: e.id } })} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: 'var(--bg)', borderRadius: 8, padding: '7px 10px', cursor: 'pointer',
                          }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 12, color: 'var(--text)', fontFamily: 'var(--font-serif)', lineHeight: 1.3 }}>
                                {[e.brand, e.name].filter(Boolean).join(' ') || '—'}
                              </div>
                              {e.brewery && <div style={{ fontSize: 10, color: 'var(--sub)', marginTop: 1 }}>{e.brewery}</div>}
                            </div>
                            {e.rating > 0 && <Stars rating={e.rating} size={9} style={{ flexShrink: 0, marginLeft: 8 }} />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {stats.topRegions.map(([region, count]) => (
                  <div key={region} style={{ background: 'var(--bg)', borderRadius: 10, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 12, color: 'var(--text)' }}>{region}</div>
                    <div style={{ fontSize: 11, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>{count}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Theme section */}
        <div style={s.section}>
          <div style={s.sectionTitle}>{lbl('theme', lang).toUpperCase()}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {THEMES.map(th => (
              <button
                key={th.id}
                onClick={() => handleTheme(th.id)}
                style={{
                  flex: 1, padding: '12px 8px', borderRadius: 12, cursor: 'pointer',
                  border: currentTheme === th.id ? '2px solid var(--accent)' : '2px solid var(--border)',
                  background: th.preview[0], display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  outline: 'none', transition: 'border-color .2s',
                }}
              >
                <div style={{ display: 'flex', gap: 4 }}>
                  {th.preview.map((c, i) => (
                    <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: c, border: '1px solid rgba(255,255,255,.15)' }} />
                  ))}
                </div>
                <span style={{ fontSize: 11, color: th.preview[2], letterSpacing: '.04em', fontFamily: 'var(--font-sans)' }}>
                  {th[lang] || th.en}
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
