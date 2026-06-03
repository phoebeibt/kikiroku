import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import BrandMark from './BrandMark'
import { useLang } from '../contexts/LangContext'

const LANGS = [
  { code: 'ja', label: '日' },
  { code: 'zh', label: '中' },
  { code: 'en', label: 'EN' },
]

const IconSignOut = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

const IconSignIn = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
    <polyline points="10 17 15 12 10 7"/>
    <line x1="15" y1="12" x2="3" y2="12"/>
  </svg>
)

const s = {
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 20px', borderBottom: '1px solid var(--border)',
    background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 10,
  },
  brand: { display: 'flex', alignItems: 'center', gap: 10 },
  logo: { fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 400, color: 'var(--text)', letterSpacing: '0.06em' },
  logoEm: { fontStyle: 'normal', color: 'var(--accent)' },
  logoSmall: { display: 'block', fontFamily: 'var(--font-sans)', fontSize: 9, fontWeight: 300, color: 'var(--sub)', letterSpacing: '0.14em', marginTop: 2 },
  right: { display: 'flex', alignItems: 'center', gap: 6 },
  link: { fontSize: 13, padding: '6px 12px', borderRadius: 20, color: 'var(--sub)' },
  iconBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 32, height: 32, borderRadius: '50%',
    background: 'var(--accent-bg)', color: 'var(--accent)',
    border: 'none', cursor: 'pointer',
  },
  langSelect: {
    padding: '5px 24px 5px 10px', borderRadius: 20, border: '1px solid var(--border)',
    background: `var(--surface-card) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%238C7E74'/%3E%3C/svg%3E") no-repeat right 8px center`,
    color: 'var(--sub)', fontSize: 12, outline: 'none', appearance: 'none', cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
}

export default function Nav({ session }) {
  const nav = useNavigate()
  const { lang, changeLang, t } = useLang()

  const signOut = async () => {
    await supabase.auth.signOut()
    nav('/login')
  }

  return (
    <nav style={s.nav}>
      <Link to="/" style={s.brand}>
        <BrandMark size={30} />
        <div style={s.logo}>
          酒<em style={s.logoEm}>記</em>録
          <small style={s.logoSmall}>sake journal</small>
        </div>
      </Link>
      <div style={s.right}>
        {/* Language switcher */}
        <select style={s.langSelect} value={lang} onChange={e => changeLang(e.target.value)}>
          {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>

        {session ? (
          <>
            <Link to="/" style={s.link}>{t('nav.discover')}</Link>
            <Link to="/journal" style={s.link}>{t('nav.journal')}</Link>
            <button style={s.iconBtn} onClick={signOut} title={t('nav.signout')}>
              <IconSignOut />
            </button>
          </>
        ) : (
          <button style={s.iconBtn} onClick={() => nav('/login')} title={t('nav.login')}>
            <IconSignIn />
          </button>
        )}
      </div>
    </nav>
  )
}
