import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Nav from '../components/Nav'
import Stars from '../components/Stars'
import { useLang } from '../contexts/LangContext'

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
  save:        { ja: '保存する',      zh: '保存',         en: 'Save' },
  saving:      { ja: '保存中…',      zh: '保存中…',      en: 'Saving…' },
  saved:       { ja: '保存しました',  zh: '已保存',       en: 'Saved!' },
}

const lbl = (key, lang) => LABELS[key]?.[lang] || LABELS[key]?.en || key

export default function Profile({ session }) {
  const { lang } = useLang()
  const nav = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [stats, setStats] = useState({ total: 0, avg: null, shared: 0 })

  useEffect(() => {
    if (!session) { nav('/login'); return }
    const meta = session.user.user_metadata || {}
    setDisplayName(meta.display_name || meta.full_name || '')

    supabase.from('sake_entries')
      .select('id, rating, is_public', { count: 'exact' })
      .eq('user_id', session.user.id)
      .then(({ data, count }) => {
        const entries = data || []
        const withRating = entries.filter(e => e.rating != null)
        const avg = withRating.length ? withRating.reduce((s, e) => s + e.rating, 0) / withRating.length : null
        const shared = entries.filter(e => e.is_public).length
        setStats({ total: count || 0, avg, shared })
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
              {saved ? '✅' : saving ? lbl('saving', lang) : lbl('save', lang)}
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
              <div style={s.statNum}>
                {stats.avg != null ? stats.avg.toFixed(1) : '–'}
              </div>
              <div style={s.statLabel}>{lbl('avgRating', lang)}</div>
            </div>
            <div style={{ ...s.statItem, borderRight: 'none' }}>
              <div style={s.statNum}>{stats.shared}</div>
              <div style={s.statLabel}>{lbl('shared', lang)}</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
