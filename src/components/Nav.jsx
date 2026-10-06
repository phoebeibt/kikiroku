import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLang } from '../contexts/LangContext'
import './Nav.css'

const LANGS = [
  { code: 'ja', label: '日', name: '日本語' },
  { code: 'zh', label: '中', name: '中文' },
  { code: 'en', label: 'EN', name: 'English' },
]

// ── SVG icons ──────────────────────────────────────────────────

// 廣場: 杉玉 (concentric hexagons + center dot)
const IcoDiscover = () => (
  <svg width="22" height="22" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L21 7v10l-9 5-9-5V7z" />
    <path d="M12 6.5L18 10v8l-6 3.3L6 18V10z" />
    <circle cx="12" cy="14" r="2.2" fill="currentColor" stroke="none" opacity=".75" />
  </svg>
)

// マイ帳: 徳利 sake bottle
const IcoLedger = () => (
  <svg width="22" height="22" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 4.5 C10.5 2.8 13.5 2.8 14 4.5" />
    <line x1="10.5" y1="4.5" x2="10.5" y2="8.8" />
    <line x1="13.5" y1="4.5" x2="13.5" y2="8.8" />
    <path d="M10.5 8.8 C8.8 10.8 7.2 13.2 7.2 16 C7.2 19.2 9.3 22 12 22 C14.7 22 16.8 19.2 16.8 16 C16.8 13.2 15.2 10.8 13.5 8.8 Z" />
  </svg>
)

// 事典: 猪口 ochoko cup
const IcoWiki = () => (
  <svg width="22" height="22" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="9" rx="6.2" ry="1.9" />
    <path d="M5.8 9 C6.4 15.2 8.8 21 12 21 C15.2 21 17.6 15.2 18.2 9" />
    <path d="M9 21 Q12 22.2 15 21" />
    <path d="M7.2 14.5 Q12 15.8 16.8 14.5" />
  </svg>
)

// プロフ: person
const IcoProfile = () => (
  <svg width="22" height="22" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="3.5" />
    <path d="M4.5 20.5 C4.5 16.4 7.9 13 12 13 C16.1 13 19.5 16.4 19.5 20.5" />
  </svg>
)

const LABELS = {
  discover: { ja: '廣場',   zh: '廣場', en: 'Discover' },
  ledger:   { ja: 'マイ帳', zh: '酒帳', en: 'Ledger' },
  record:   { ja: '記録',   zh: '記錄', en: 'Record' },
  wiki:     { ja: '事典',   zh: '事典', en: 'Wiki' },
  profile:  { ja: 'プロフ', zh: '我的', en: 'Profile' },
}
const RECORD_HINT = { ja: '新しい記録を追加', zh: '新增記錄', en: 'Add a new record' }
const LANG_HINT = { ja: '表示言語', zh: '介面語言', en: 'Language' }

export default function Nav({ session }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { lang, changeLang, t } = useLang()
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef()

  useEffect(() => {
    if (!langOpen) return
    const onDown = e => { if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false) }
    const onKey = e => { if (e.key === 'Escape') setLangOpen(false) }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey) }
  }, [langOpen])

  const lbl = key => LABELS[key][lang] || LABELS[key].ja
  const path = location.pathname
  const isRecord = path === '/journal' && location.search.includes('new')
  const signOut = async () => { await supabase.auth.signOut(); navigate('/login') }

  const tabs = session
    ? [
        { key: 'discover', to: '/',        icon: <IcoDiscover />, active: path === '/' },
        { key: 'ledger',   to: '/journal', icon: <IcoLedger />,   active: path === '/journal' && !isRecord },
        { key: 'record' },
        { key: 'wiki',     to: '/wiki',    icon: <IcoWiki />,     active: path === '/wiki' },
        { key: 'profile',  to: '/profile', icon: <IcoProfile />,  active: path === '/profile' },
      ]
    : [
        { key: 'discover', to: '/',     icon: <IcoDiscover />, active: path === '/' },
        { key: 'wiki',     to: '/wiki', icon: <IcoWiki />,     active: path === '/wiki' },
      ]

  return (
    <>
      <header className="kk-topbar">
        <Link to="/" className="kk-topbar__brand" aria-label="Kikiroku">
          <img src="/icon-192.png" alt="" width="32" height="32" />
          <span className="kk-topbar__name">Kikiroku</span>
        </Link>

        <div className="kk-topbar__actions">
          <div ref={langRef} className="kk-lang">
            <button type="button" className="kk-topbar__ctrl" onClick={() => setLangOpen(x => !x)}
              aria-haspopup="listbox" aria-expanded={langOpen} aria-label={`${LANG_HINT[lang] || LANG_HINT.ja}: ${LANGS.find(l => l.code === lang)?.name}`}>
              {LANGS.find(l => l.code === lang)?.label}
            </button>
            {langOpen && (
              <ul className="kk-lang__menu" role="listbox" aria-label={LANG_HINT[lang] || LANG_HINT.ja}>
                {LANGS.map(l => (
                  <li key={l.code}>
                    <button type="button" role="option" aria-selected={l.code === lang}
                      className={l.code === lang ? 'is-active' : ''}
                      onClick={() => { changeLang(l.code); setLangOpen(false) }}>
                      {l.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {session ? (
            <button type="button" className="kk-topbar__ctrl kk-topbar__ctrl--icon" onClick={signOut} aria-label={t('nav.signout')} title={t('nav.signout')}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" />
              </svg>
            </button>
          ) : (
            <button type="button" className="kk-topbar__ctrl" onClick={() => navigate('/login')}>
              {t('nav.login')}
            </button>
          )}
        </div>
      </header>

      <nav className="kk-bottom-nav" aria-label={lang === 'en' ? 'Main' : lang === 'zh' ? '主導覽' : 'メインメニュー'}>
        <ul className={`kk-bottom-nav__list kk-bottom-nav__list--${tabs.length}`}>
          {tabs.map(tab => tab.key === 'record' ? (
            <li key="record">
              <button type="button" className={`kk-bottom-nav__item kk-bottom-nav__item--record${isRecord ? ' is-active' : ''}`}
                onClick={() => navigate('/journal?new=1')} aria-label={RECORD_HINT[lang] || RECORD_HINT.ja}>
                <span className="kk-bottom-nav__add" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                </span>
                <span className="kk-bottom-nav__label" aria-hidden="true">{lbl('record')}</span>
              </button>
            </li>
          ) : (
            <li key={tab.key}>
              <Link to={tab.to} className={`kk-bottom-nav__item${tab.active ? ' is-active' : ''}`} aria-current={tab.active ? 'page' : undefined}>
                {tab.icon}
                <span className="kk-bottom-nav__label">{lbl(tab.key)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}
