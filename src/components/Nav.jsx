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

// Per-theme nav color tokens (derived in JS so React re-renders apply them)
const THEME_NAV = {
  aizome: {
    topbar:        'rgba(6,14,24,.52)',
    topBorder:     'rgba(200,225,255,.18)',
    pill:          'rgba(8,18,36,.58)',
    pillBorder:    'rgba(200,225,255,.18)',
    pillShadow:    '0 4px 28px rgba(0,10,30,.5), inset 0 1px 0 rgba(220,240,255,.12)',
    wrap:          'rgba(4,10,20,.5)',
    tabActiveBg:   'rgba(181,69,27,.18)',
    tabActiveClr:  '#E8B4A0',
    tabInactClr:   'rgba(180,210,245,.4)',
    dropdown:      '#0c1e32',
    dropdownBdr:   'rgba(200,225,255,.14)',
    dropdownSh:    '0 8px 24px rgba(0,0,0,.3)',
    ctrlBg:        'rgba(181,69,27,.08)',
    ctrlBdr:       'rgba(200,225,255,.16)',
    ctrlClr:       'rgba(180,210,245,.55)',
    accentClr:     '#B5451B',
    handleSh:      '0 4px 20px rgba(0,10,30,.5)',
  },
  suminagashi: {
    topbar:        'rgba(22,20,18,.52)',
    topBorder:     'rgba(200,180,140,.2)',
    pill:          'rgba(24,22,20,.58)',
    pillBorder:    'rgba(200,180,140,.2)',
    pillShadow:    '0 4px 28px rgba(0,0,0,.5), inset 0 1px 0 rgba(200,180,140,.1)',
    wrap:          'rgba(20,18,16,.5)',
    tabActiveBg:   'rgba(192,57,43,.16)',
    tabActiveClr:  '#E8A898',
    tabInactClr:   'rgba(200,180,160,.36)',
    dropdown:      '#252320',
    dropdownBdr:   'rgba(200,180,140,.14)',
    dropdownSh:    '0 8px 24px rgba(0,0,0,.4)',
    ctrlBg:        'rgba(192,57,43,.08)',
    ctrlBdr:       'rgba(200,180,140,.14)',
    ctrlClr:       '#8C8076',
    accentClr:     '#C0392B',
    handleSh:      '0 4px 20px rgba(0,0,0,.5)',
  },
  fukahi: {
    topbar:        'rgba(244,240,232,.58)',
    topBorder:     'rgba(180,160,140,.25)',
    pill:          'rgba(237,232,222,.6)',
    pillBorder:    'rgba(150,130,120,.25)',
    pillShadow:    '0 4px 20px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.5)',
    wrap:          'rgba(237,232,222,.5)',
    tabActiveBg:   'rgba(124,58,40,.1)',
    tabActiveClr:  '#7C3A28',
    tabInactClr:   'rgba(100,80,70,.4)',
    dropdown:      '#F0EBE2',
    dropdownBdr:   '#E5DED4',
    dropdownSh:    '0 8px 24px rgba(0,0,0,.1)',
    ctrlBg:        'rgba(124,58,40,.07)',
    ctrlBdr:       '#E5DED4',
    ctrlClr:       '#8C7E74',
    accentClr:     '#7C3A28',
    handleSh:      '0 4px 20px rgba(0,0,0,.12)',
  },
}

// ── SVG icons ──────────────────────────────────────────────────

// 廣場: 杉玉 (concentric hexagons + center dot)
const IcoDiscover = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L21 7v10l-9 5-9-5V7z" />
    <path d="M12 6.5L18 10v8l-6 3.3L6 18V10z" />
    <circle cx="12" cy="14" r="2.2" fill="currentColor" stroke="none" opacity=".75" />
  </svg>
)

// マイ帳: 徳利 sake bottle
const IcoLedger = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 4.5 C10.5 2.8 13.5 2.8 14 4.5" />
    <line x1="10.5" y1="4.5" x2="10.5" y2="8.8" />
    <line x1="13.5" y1="4.5" x2="13.5" y2="8.8" />
    <path d="M10.5 8.8 C8.8 10.8 7.2 13.2 7.2 16 C7.2 19.2 9.3 22 12 22 C14.7 22 16.8 19.2 16.8 16 C16.8 13.2 15.2 10.8 13.5 8.8 Z" />
  </svg>
)

// 記録する: 染付雫 (diamond in accent ring)
const IcoRecord = ({ active }) => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="13" cy="13" r="12"
      fill={active ? 'rgba(181,69,27,.85)' : 'rgba(181,69,27,.22)'}
      stroke={active ? 'rgba(181,69,27,.95)' : 'rgba(181,69,27,.5)'}
      strokeWidth="1" />
    <path d="M13 5.5L18.5 13 13 20.5 7.5 13Z"
      fill={active ? 'rgba(255,240,230,.9)' : 'rgba(181,69,27,.75)'}
      stroke="none" />
    <path d="M13 5.5L18.5 13 13 20.5 7.5 13Z"
      fill="none" stroke={active ? 'rgba(255,255,255,.3)' : 'rgba(181,69,27,.4)'}
      strokeWidth=".8" />
  </svg>
)

// 事典: 猪口 ochoko cup
const IcoWiki = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="9" rx="6.2" ry="1.9" />
    <path d="M5.8 9 C6.4 15.2 8.8 21 12 21 C15.2 21 17.6 15.2 18.2 9" />
    <path d="M9 21 Q12 22.2 15 21" />
    <path d="M7.2 14.5 Q12 15.8 16.8 14.5" />
  </svg>
)

// プロフ: person
const IcoProfile = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="3.5" />
    <path d="M4.5 20.5 C4.5 16.4 7.9 13 12 13 C16.1 13 19.5 16.4 19.5 20.5" />
  </svg>
)

const NAV_H = 52

export default function Nav({ session }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { lang, changeLang, t } = useLang()
  const [langOpen, setLangOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [themeId, setThemeId] = useState(() => document.documentElement.dataset.theme || 'aizome')
  const langRef = useRef()
  const lastScrollRef = useRef(0)
  const lastScrollElRef = useRef(null)
  const collapsedRef = useRef(false)

  const nt = THEME_NAV[themeId] || THEME_NAV.aizome

  // Sync theme state when applyTheme() fires the custom event
  useEffect(() => {
    const h = () => setThemeId(document.documentElement.dataset.theme || 'aizome')
    window.addEventListener('kikiroku-theme', h)
    return () => window.removeEventListener('kikiroku-theme', h)
  }, [])

  // Close lang dropdown on outside click
  useEffect(() => {
    if (!langOpen) return
    const h = e => { if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false) }
    document.addEventListener('pointerdown', h)
    return () => document.removeEventListener('pointerdown', h)
  }, [langOpen])

  // Collapse on scroll-down, expand on scroll-up
  useEffect(() => {
    const onScroll = e => {
      const raw = e.target
      if (!raw) return
      // document scroll (nodeType 9) → use documentElement
      const el = raw.nodeType === 9 ? document.documentElement : raw
      if (el.nodeType !== 1) return
      // Ignore small containers (dropdowns, filter chips, etc.)
      if ((el.scrollHeight - el.clientHeight) < 200) return
      const cur = el.scrollTop ?? 0
      // Reset baseline when switching scroll container
      if (lastScrollElRef.current !== el) {
        lastScrollElRef.current = el
        lastScrollRef.current = cur
        return
      }
      const diff = cur - lastScrollRef.current
      lastScrollRef.current = cur
      if (diff > 12 && !collapsedRef.current) {
        collapsedRef.current = true
        setCollapsed(true)
      } else if (diff < -12 && collapsedRef.current) {
        collapsedRef.current = false
        setCollapsed(false)
      }
    }
    document.addEventListener('scroll', onScroll, { capture: true, passive: true })
    return () => document.removeEventListener('scroll', onScroll, { capture: true })
  }, [])

  // Always expand on page navigation
  useEffect(() => {
    collapsedRef.current = false
    lastScrollElRef.current = null
    lastScrollRef.current = 0
    setCollapsed(false)
  }, [location.pathname])

  const is = path => location.pathname === path
  const isRecord = is('/journal') && location.search.includes('new')

  const handleRecord = () => navigate('/journal?new=1')
  const signOut = async () => { await supabase.auth.signOut(); navigate('/login') }

  const labels = {
    discover: { ja: '廣場',     zh: '廣場',     en: 'Discover' },
    ledger:   { ja: 'マイ帳',   zh: '我的酒帳', en: 'My Ledger' },
    record:   { ja: '記録する', zh: '記録',      en: 'Record' },
    wiki:     { ja: '事典',     zh: '事典',      en: 'Wiki' },
    profile:  { ja: 'プロフ',   zh: '我',        en: 'Profile' },
  }
  const lbl = key => labels[key]?.[lang] || labels[key]?.ja

  const activeLabel = is('/') ? lbl('discover')
    : is('/wiki') ? lbl('wiki')
    : is('/profile') ? lbl('profile')
    : isRecord ? lbl('record')
    : is('/journal') ? lbl('ledger')
    : ''

  return (
    <>
      {/* ── Top bar ─────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
        height: NAV_H,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 18px',
        background: nt.topbar,
        backdropFilter: 'blur(28px) saturate(1.8)',
        WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
        borderBottom: `1px solid ${nt.topBorder}`,
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
          <BrandMark size={28} />
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 400, color: 'var(--text)', letterSpacing: '.06em' }}>
            酒<em style={{ fontStyle: 'normal', color: 'var(--accent)' }}>記</em>録
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Lang picker */}
          <div ref={langRef} style={{ position: 'relative' }}>
            <button onClick={() => setLangOpen(x => !x)} style={{
              padding: '5px 11px', borderRadius: 18,
              background: nt.ctrlBg, border: `1px solid ${nt.ctrlBdr}`,
              color: nt.ctrlClr, fontSize: 12, cursor: 'pointer',
            }}>
              {LANGS.find(l => l.code === lang)?.label}
            </button>
            {langOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                background: nt.dropdown, border: `1px solid ${nt.dropdownBdr}`,
                borderRadius: 12, overflow: 'hidden', zIndex: 50, minWidth: 80,
                boxShadow: nt.dropdownSh,
              }}>
                {LANGS.map(l => (
                  <button key={l.code} onClick={() => { changeLang(l.code); setLangOpen(false) }}
                    style={{
                      display: 'block', width: '100%', padding: '10px 16px',
                      textAlign: 'left',
                      background: l.code === lang ? nt.tabActiveBg : 'none',
                      border: 'none', borderBottom: `1px solid ${nt.dropdownBdr}`,
                      color: l.code === lang ? nt.tabActiveClr : nt.ctrlClr,
                      fontSize: 13, cursor: 'pointer',
                    }}>
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sign out / Sign in */}
          {session ? (
            <button onClick={signOut} title={t('nav.signout')} style={{
              width: 30, height: 30, borderRadius: '50%',
              background: nt.ctrlBg, border: `1px solid ${nt.ctrlBdr}`,
              color: nt.accentClr, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" />
              </svg>
            </button>
          ) : (
            <button onClick={() => navigate('/login')} style={{
              width: 30, height: 30, borderRadius: '50%',
              background: nt.ctrlBg, border: `1px solid ${nt.ctrlBdr}`,
              color: nt.accentClr, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
              </svg>
            </button>
          )}
        </div>
      </nav>
      {/* Spacer so content starts below the fixed topbar */}
      <div style={{ height: NAV_H, flexShrink: 0 }} />

      {/* ── Bottom gradient fade ─────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 39,
        height: 90, pointerEvents: 'none',
        background: `linear-gradient(to top, ${nt.wrap} 0%, transparent 100%)`,
        opacity: collapsed ? 0 : 1,
        transition: 'opacity .3s',
      }} />

      {/* ── Full tab pill ────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 14, left: 0, right: 0, zIndex: 40,
        display: 'flex', justifyContent: 'center',
        pointerEvents: collapsed ? 'none' : 'auto',
        transform: collapsed ? 'translateY(110px)' : 'translateY(0)',
        transition: 'transform .35s cubic-bezier(.32,.72,0,1)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 0,
          height: 56, padding: '0 6px',
          borderRadius: 40,
          background: nt.pill,
          backdropFilter: 'blur(28px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
          border: `1px solid ${nt.pillBorder}`,
          boxShadow: nt.pillShadow,
        }}>
          {session ? (<>
            <TabBtn active={is('/')} activeClr={nt.tabActiveClr} inactClr={nt.tabInactClr} activeBg={nt.tabActiveBg}
              onClick={() => navigate('/')} label={lbl('discover')}>
              <IcoDiscover />
            </TabBtn>

            <TabBtn active={is('/journal') && !location.search.includes('new')}
              activeClr={nt.tabActiveClr} inactClr={nt.tabInactClr} activeBg={nt.tabActiveBg}
              onClick={() => navigate('/journal')} label={lbl('ledger')}>
              <IcoLedger />
            </TabBtn>

            {/* 記録する — accent circle */}
            <button onClick={handleRecord} style={{
              width: 52, height: 46, borderRadius: 28,
              background: 'none', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
            }}>
              <IcoRecord active={isRecord} />
            </button>

            <TabBtn active={is('/wiki')} activeClr={nt.tabActiveClr} inactClr={nt.tabInactClr} activeBg={nt.tabActiveBg}
              onClick={() => navigate('/wiki')} label={lbl('wiki')}>
              <IcoWiki />
            </TabBtn>

            <TabBtn active={is('/profile')} activeClr={nt.tabActiveClr} inactClr={nt.tabInactClr} activeBg={nt.tabActiveBg}
              onClick={() => navigate('/profile')} label={lbl('profile')}>
              <IcoProfile />
            </TabBtn>
          </>) : (
            <TabBtn active={is('/wiki')} activeClr={nt.tabActiveClr} inactClr={nt.tabInactClr} activeBg={nt.tabActiveBg}
              onClick={() => navigate('/wiki')} label={lbl('wiki')}>
              <IcoWiki />
            </TabBtn>
          )}
        </div>
      </div>

      {/* ── Collapsed handle ─────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 14, left: 0, right: 0, zIndex: 40,
        display: 'flex', justifyContent: 'center',
        pointerEvents: collapsed ? 'auto' : 'none',
        opacity: collapsed ? 1 : 0,
        transform: collapsed ? 'translateY(0)' : 'translateY(60px)',
        transition: 'opacity .2s, transform .35s cubic-bezier(.32,.72,0,1)',
      }}>
        <button onClick={() => setCollapsed(false)} style={{
          padding: '7px 18px 7px 14px', borderRadius: 24,
          background: nt.pill,
          backdropFilter: 'blur(28px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
          border: `1px solid ${nt.pillBorder}`,
          boxShadow: nt.handleSh,
          color: nt.tabActiveClr,
          fontSize: 11, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: 'var(--font-sans)', letterSpacing: '.03em',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M18 15l-6-6-6 6" />
          </svg>
          {activeLabel}
        </button>
      </div>
    </>
  )
}

function TabBtn({ active, activeClr, inactClr, activeBg, onClick, label, children }) {
  return (
    <button onClick={onClick} style={{
      width: 58, height: 46, borderRadius: 28,
      background: active ? activeBg : 'none',
      border: 'none',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 2, cursor: 'pointer',
      color: active ? activeClr : inactClr,
      transition: 'background .2s, color .2s',
      WebkitTapHighlightColor: 'transparent',
    }}>
      {children}
      <span style={{ fontSize: 9, letterSpacing: '.03em', lineHeight: 1 }}>{label}</span>
    </button>
  )
}
