import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import BrandMark from './BrandMark'
import { useLang } from '../contexts/LangContext'

const LANGS = [
  { code: 'ja', label: '日' },
  { code: 'zh', label: '中' },
  { code: 'en', label: 'EN' },
]

const IconSignOut = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>
  </svg>
)
const IconSignIn = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8"/>
  </svg>
)
const IconMenu = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
)
const IconClose = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const s = {
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 20px', borderBottom: '1px solid var(--border)',
    background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 10,
    gap: 10,
  },
  brand: { display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 },
  logo: { fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 400, color: 'var(--text)', letterSpacing: '0.06em' },
  logoEm: { fontStyle: 'normal', color: 'var(--accent)' },
  logoSmall: { display: 'flex', justifyContent: 'space-between', width: '100%', fontFamily: 'var(--font-sans)', fontSize: 9, fontWeight: 300, color: 'var(--sub)', letterSpacing: 0, marginTop: 2 },
  // Spacer pushes right-side controls to the right
  spacer: { flex: 1 },
  // Right side cluster
  right: { display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 },
  // Contextual view-switch pill — sits left of lang selector
  viewPill: {
    padding: '5px 12px', borderRadius: 20,
    border: '1px solid var(--border)',
    background: 'var(--surface-card)',
    color: 'var(--sub)', fontSize: 12,
    cursor: 'pointer', fontFamily: 'var(--font-sans)',
    whiteSpace: 'nowrap', lineHeight: 1.4,
  },
  langSelect: {
    padding: '5px 22px 5px 9px', borderRadius: 20, border: '1px solid var(--border)',
    background: `var(--surface-card) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%238C7E74'/%3E%3C/svg%3E") no-repeat right 7px center`,
    color: 'var(--sub)', fontSize: 12, outline: 'none', appearance: 'none', cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
  link: { fontSize: 13, padding: '6px 10px', borderRadius: 20, color: 'var(--sub)', textDecoration: 'none', whiteSpace: 'nowrap' },
  linkActive: { fontSize: 13, padding: '6px 10px', borderRadius: 20, color: 'var(--accent)', background: 'var(--accent-bg)', textDecoration: 'none', whiteSpace: 'nowrap' },
  iconBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 32, height: 32, borderRadius: '50%',
    background: 'var(--accent-bg)', color: 'var(--accent)',
    border: 'none', cursor: 'pointer', flexShrink: 0,
  },
  menuWrap: { position: 'relative' },
  dropdown: {
    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
    background: 'var(--surface-card)', border: '1px solid var(--border)',
    borderRadius: 14, boxShadow: '0 8px 24px rgba(26,22,20,.12)',
    minWidth: 160, overflow: 'hidden', zIndex: 20,
  },
  dropItem: {
    display: 'block', padding: '13px 18px', fontSize: 14, color: 'var(--text)',
    textDecoration: 'none', borderBottom: '1px solid var(--border)',
    background: 'none', border: 'none', width: '100%', textAlign: 'left',
    cursor: 'pointer', fontFamily: 'var(--font-sans)',
  },
  dropItemActive: {
    display: 'block', padding: '13px 18px', fontSize: 14, color: 'var(--accent)',
    textDecoration: 'none', borderBottom: '1px solid var(--border)',
    background: 'var(--accent-bg)', border: 'none', width: '100%', textAlign: 'left',
    cursor: 'pointer', fontFamily: 'var(--font-sans)',
  },
  dropSignOut: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '13px 18px', fontSize: 14, color: 'var(--sub)',
    background: 'none', border: 'none', width: '100%', textAlign: 'left',
    cursor: 'pointer', fontFamily: 'var(--font-sans)',
  },
}

function useIsMobile(bp = 640) {
  const [mobile, setMobile] = useState(() => window.innerWidth < bp)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < bp)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [bp])
  return mobile
}

export default function Nav({ session }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { lang, changeLang, t } = useLang()
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const menuRef = useRef()

  const isJournal = location.pathname === '/journal'
  const isDiscover = location.pathname === '/'

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [open])

  useEffect(() => { setOpen(false) }, [location.pathname])

  const signOut = async () => {
    setOpen(false)
    await supabase.auth.signOut()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  // Contextual view-switch: shows the OTHER view's label
  // On journal → "广场" ; on discover (or elsewhere) → "我的"
  const viewToggle = session
    ? isJournal
      ? { label: t('nav.discover'), to: '/' }
      : { label: t('nav.journal'), to: '/journal' }
    : null

  // Secondary links in dropdown / desktop inline (wiki + profile)
  const secondaryLinks = session
    ? [{ to: '/wiki', label: t('nav.wiki') }, { to: '/profile', label: t('nav.profile') }]
    : [{ to: '/wiki', label: t('nav.wiki') }]

  return (
    <nav style={s.nav}>
      {/* Brand */}
      <Link to="/" style={s.brand}>
        <BrandMark size={30} />
        <div style={s.logo}>
          酒<em style={s.logoEm}>記</em>録
          <small style={s.logoSmall}>{'kikiroku'.split('').map((c, i) => <span key={i}>{c}</span>)}</small>
        </div>
      </Link>

      <div style={s.spacer} />

      <div style={s.right}>
        {/* Contextual view-switch pill — left of lang selector, always in nav bar */}
        {viewToggle && (
          <button style={s.viewPill} onClick={() => navigate(viewToggle.to)}>
            {viewToggle.label}
          </button>
        )}

        {/* Language selector */}
        <select style={s.langSelect} value={lang} onChange={e => changeLang(e.target.value)}>
          {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>

        {isMobile ? (
          /* Mobile: hamburger for wiki / profile / signout only */
          <div ref={menuRef} style={s.menuWrap}>
            <button style={s.iconBtn} onClick={() => setOpen(x => !x)} aria-label="Menu">
              {open ? <IconClose /> : <IconMenu />}
            </button>
            {open && (
              <div style={s.dropdown}>
                {secondaryLinks.map(({ to, label }) => (
                  <Link key={to} to={to}
                    style={isActive(to) ? s.dropItemActive : s.dropItem}
                    onClick={() => setOpen(false)}>
                    {label}
                  </Link>
                ))}
                {session ? (
                  <button style={s.dropSignOut} onClick={signOut}>
                    <IconSignOut /> {t('nav.signout')}
                  </button>
                ) : (
                  <button style={{ ...s.dropSignOut, color: 'var(--accent)' }} onClick={() => { setOpen(false); navigate('/login') }}>
                    <IconSignIn /> {t('nav.login')}
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Desktop: inline wiki / profile + signout icon */
          <>
            {secondaryLinks.map(({ to, label }) => (
              <Link key={to} to={to} style={isActive(to) ? s.linkActive : s.link}>{label}</Link>
            ))}
            {session ? (
              <button style={s.iconBtn} onClick={signOut} title={t('nav.signout')}>
                <IconSignOut />
              </button>
            ) : (
              <button style={s.iconBtn} onClick={() => navigate('/login')} title={t('nav.login')}>
                <IconSignIn />
              </button>
            )}
          </>
        )}
      </div>
    </nav>
  )
}
