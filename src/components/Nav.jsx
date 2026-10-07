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

// Icons follow the 10/07 board's nav marks (drawn as SVG instead of CSS shapes).
const svg = children => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
)
// 廣場: a shared board of 札
const IcoDiscover = () => svg(<>
  <rect x="4" y="3.5" width="16" height="13" rx="4.5" />
  <path d="M7 20.5h3M14 20.5h3" />
</>)
// マイ帳: a single 短冊酒札 with its hole and band
const IcoLedger = () => svg(<>
  <rect x="7" y="2" width="10" height="20" rx="4.5" />
  <circle cx="12" cy="7" r="1.1" fill="currentColor" stroke="none" />
  <path d="M7.5 14h9" />
</>)
// 事典: an open book
const IcoWiki = () => svg(<>
  <rect x="4" y="4" width="16" height="16" rx="3.5" />
  <path d="M12 4.5v15" />
</>)
// プロフ: a person
const IcoProfile = () => svg(<>
  <circle cx="12" cy="7.5" r="3.5" />
  <path d="M5.5 20.5v-1a5 5 0 0 1 5-5h3a5 5 0 0 1 5 5v1" />
</>)

const LABELS = {
  discover: { ja: '廣場',   zh: '廣場', en: 'Discover' },
  ledger:   { ja: 'マイ帳', zh: '酒帳', en: 'Ledger' },
  record:   { ja: '記録',   zh: '記錄', en: 'Record' },
  wiki:     { ja: '事典',   zh: '事典', en: 'Wiki' },
  profile:  { ja: 'プロフ', zh: '我的', en: 'Profile' },
}
const RECORD_HINT = { ja: '新しい記録を追加', zh: '新增記錄', en: 'Add a new record' }
const LANG_HINT = { ja: '表示言語', zh: '介面語言', en: 'Language' }

export default function Nav({ session, topbar = true }) {
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
        { key: 'wiki',     to: '/wiki',    icon: <IcoWiki />,     active: path.startsWith('/wiki') || path.startsWith('/region') },
        { key: 'profile',  to: '/profile', icon: <IcoProfile />,  active: path === '/profile' },
      ]
    : [
        { key: 'discover', to: '/',     icon: <IcoDiscover />, active: path === '/' },
        { key: 'wiki',     to: '/wiki', icon: <IcoWiki />,     active: path.startsWith('/wiki') || path.startsWith('/region') },
      ]

  return (
    <>
      {topbar && <header className="kk-topbar">
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
      </header>}

      <nav className="kk-bottom-nav" aria-label={lang === 'en' ? 'Main' : lang === 'zh' ? '主導覽' : 'メインメニュー'}>
        <ul className={`kk-bottom-nav__list kk-bottom-nav__list--${tabs.length}`}>
          {tabs.map(tab => tab.key === 'record' ? (
            <li key="record">
              <button type="button" className={`kk-bottom-nav__item kk-bottom-nav__item--record${isRecord ? ' is-active' : ''}`}
                onClick={() => navigate('/journal?new=1')} aria-label={RECORD_HINT[lang] || RECORD_HINT.ja}>
                <span className="kk-bottom-nav__add" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                </span>
                <span className="kk-bottom-nav__label kk-bottom-nav__label--add" aria-hidden="true">{lbl('record')}</span>
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
