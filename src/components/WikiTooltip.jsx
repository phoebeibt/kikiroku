import { useState, useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { buildTermIndex, segmentText } from '../lib/wiki'
import { useLang } from '../contexts/LangContext'
import { useWiki } from '../contexts/WikiContext'

function WikiPopup({ term, anchorRect, onClose }) {
  const { lang } = useLang()
  const { articles } = useWiki()
  const ref = useRef(null)

  const article = articles.find(a => a.id === term.id)
  const title = article?.title[lang] || term.title[lang] || term.title.ja
  const summary = article?.summary?.[lang] || article?.summary?.ja
  const moreLabel = { ja: '詳しく →', zh: '詳細 →', en: 'More →' }[lang] || 'More →'

  // Start near anchor (invisible), fine-tune after layout to avoid top-left flash
  const [pos, setPos] = useState({ top: anchorRect.bottom + 8, left: anchorRect.left, visible: false })
  useLayoutEffect(() => {
    if (!ref.current) return
    const popup = ref.current.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    let top = anchorRect.bottom + 8
    let left = anchorRect.left
    if (top + popup.height > vh - 16) top = anchorRect.top - popup.height - 8
    if (left + popup.width > vw - 16) left = vw - popup.width - 16
    if (left < 8) left = 8
    setPos({ top, left, visible: true })
  }, [anchorRect])

  useEffect(() => {
    const down = e => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    const key = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', down)
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key) }
  }, [onClose])

  return (
    <div ref={ref} style={{
      position: 'fixed', top: pos.top, left: pos.left,
      opacity: pos.visible ? 1 : 0,
      zIndex: 200, width: 260, background: 'var(--surface-card)',
      border: '1px solid var(--border)', borderRadius: 12,
      boxShadow: '0 8px 28px rgba(26,22,20,.18)',
      padding: '12px 14px 12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--text)', lineHeight: 1.3 }}>{title}</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--sub)', cursor: 'pointer', fontSize: 14, lineHeight: 1, flexShrink: 0, padding: 0, marginTop: 1 }}>✕</button>
      </div>
      {summary && (
        <div style={{ fontSize: 12, color: 'var(--sub)', lineHeight: 1.65, marginBottom: 8 }}>{summary}</div>
      )}
      <Link to={`/wiki#${term.id}`} onClick={onClose} style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none' }}>{moreLabel}</Link>
    </div>
  )
}

export function WikiText({ text, style }) {
  const { lang } = useLang()
  const [popup, setPopup] = useState(null)
  const index = buildTermIndex(lang)
  const parts = segmentText(text, index)

  const handleClick = useCallback((term, e) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setPopup(prev => prev?.term.id === term.id ? null : { term, rect })
  }, [])

  const close = useCallback(() => setPopup(null), [])

  return (
    <>
      <span style={style}>
        {parts.map((p, i) =>
          p.type === 'term' ? (
            <span key={i} onClick={e => handleClick(p.term, e)} style={{
              borderBottom: '1px dashed var(--accent)',
              color: 'inherit', cursor: 'pointer', borderRadius: 2,
              background: popup?.term.id === p.term.id ? 'var(--accent-bg)' : 'transparent',
            }}>{p.content}</span>
          ) : (
            <span key={i}>{p.content}</span>
          )
        )}
      </span>
      {popup && <WikiPopup term={popup.term} anchorRect={popup.rect} onClose={close} />}
    </>
  )
}
