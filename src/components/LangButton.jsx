import { useEffect, useRef, useState } from 'react'

const LANGS = [{ code: 'ja', label: '日', name: '日本語' }, { code: 'zh', label: '中', name: '中文' }, { code: 'en', label: 'EN', name: 'English' }]

// Temporary home for the language switch until プロフ is rebuilt.
export default function LangButton({ lang, onChange, label }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const onDown = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])
  const current = LANGS.find(l => l.code === lang) || LANGS[0]
  return (
    <div className="kk-lang" ref={ref}>
      <button type="button" className="kk-icon-btn kk-lang__btn" onClick={() => setOpen(o => !o)} aria-haspopup="listbox" aria-expanded={open} aria-label={`${label}: ${current.name}`}>
        {current.label}
      </button>
      {open && (
        <ul className="kk-lang__menu" role="listbox" aria-label={label}>
          {LANGS.map(l => (
            <li key={l.code}>
              <button type="button" role="option" aria-selected={l.code === lang} className={l.code === lang ? 'is-active' : ''} onClick={() => { onChange(l.code); setOpen(false) }}>{l.name}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
