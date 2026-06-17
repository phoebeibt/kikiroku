import { useState, useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
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
  const summary = article?.summary?.[lang] || article?.summary?.ja || ''
  const body = article?.body?.[lang] || article?.body?.ja || ''

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

  return createPortal(
    <div ref={ref} style={{
      position: 'fixed', top: pos.top, left: pos.left,
      opacity: pos.visible ? 1 : 0,
      zIndex: 1000, width: 260, background: 'var(--surface-card)',
      border: '1px solid var(--border)', borderRadius: 12,
      boxShadow: '0 8px 28px rgba(26,22,20,.18)',
      padding: '12px 14px 12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--text)', lineHeight: 1.3 }}>{title}</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--sub)', cursor: 'pointer', fontSize: 14, lineHeight: 1, flexShrink: 0, padding: 0, marginTop: 1 }}>✕</button>
      </div>
      {summary && (
        <div style={{ fontSize: 12, color: 'var(--sub)', lineHeight: 1.65, marginBottom: body ? 6 : 0 }}>{summary}</div>
      )}
      {body && (
        <div style={{ fontSize: 12, color: 'var(--sub)', lineHeight: 1.65 }}>{body.length > 160 ? body.slice(0, 160) + '…' : body}</div>
      )}
    </div>,
    document.body
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

export function WikiInlineText({ text, style }) {
  const { lang } = useLang()
  const { articles } = useWiki()
  const [openId, setOpenId] = useState(null)
  const index = buildTermIndex(lang)
  const parts = segmentText(text, index)

  const activeTerm = openId ? parts.find(p => p.type === 'term' && p.term.id === openId)?.term : null
  const article = activeTerm ? articles.find(a => a.id === activeTerm.id) : null
  const title = activeTerm ? (article?.title?.[lang] || activeTerm.title?.[lang] || activeTerm.title?.ja) : null
  const body = activeTerm ? (article?.body?.[lang] || activeTerm.body?.[lang] || activeTerm.body?.ja) : null

  return (
    <div style={style}>
      <span>
        {parts.map((p, i) =>
          p.type === 'term' ? (
            <span key={i}
              onClick={e => { e.stopPropagation(); setOpenId(prev => prev === p.term.id ? null : p.term.id) }}
              style={{
                borderBottom: '1px dashed var(--accent)',
                color: 'inherit', cursor: 'pointer', borderRadius: 2,
                background: openId === p.term.id ? 'var(--accent-bg)' : 'transparent',
              }}>
              {p.content}
            </span>
          ) : (
            <span key={i}>{p.content}</span>
          )
        )}
      </span>
      {activeTerm && title && (
        <div onClick={e => e.stopPropagation()} style={{
          marginTop: 6, padding: '8px 10px', borderRadius: 8,
          background: 'var(--accent-bg)', border: '1px solid var(--border)',
          lineHeight: 1.6,
        }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 12, color: 'var(--accent)', marginBottom: body ? 3 : 0 }}>{title}</div>
          {body && <div style={{ fontSize: 11, color: 'var(--sub)' }}>{body.length > 120 ? body.slice(0, 120) + '…' : body}</div>}
        </div>
      )}
    </div>
  )
}

export function WikiIcon({ termId }) {
  const { lang } = useLang()
  const { articles } = useWiki()
  const [popup, setPopup] = useState(null)
  const btnRef = useRef(null)

  const WIKI_TERMS_MAP = buildTermIndex(lang)
  const term = WIKI_TERMS_MAP.map(t => t.term).find(t => t.id === termId)

  const handleClick = useCallback(e => {
    e.stopPropagation()
    if (!term) return
    const rect = btnRef.current.getBoundingClientRect()
    setPopup(prev => prev ? null : { term, rect })
  }, [term])

  const close = useCallback(() => setPopup(null), [])

  if (!term) return null
  return (
    <>
      <button ref={btnRef} onClick={handleClick} style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 4px',
        color: popup ? 'var(--accent)' : 'var(--sub)', fontSize: 11, lineHeight: 1,
        verticalAlign: 'middle', opacity: popup ? 1 : 0.7,
      }}>ⓘ</button>
      {popup && <WikiPopup term={popup.term} anchorRect={popup.rect} onClose={close} />}
    </>
  )
}
