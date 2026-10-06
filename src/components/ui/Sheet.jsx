import { useEffect, useId, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import './ui.css'

// Every open overlay registers here so Esc only closes the topmost one
// and the bottom nav stays hidden until the last one closes.
const stack = []

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Accessible overlay.
 *  variant="sheet"   bottom sheet (full width on phones, centred card on desktop)
 *  variant="dialog"  small centred confirm dialog
 *  variant="viewer"  dark full-bleed (photo lightbox)
 * `label` names the dialog for screen readers when no visible title is passed.
 */
export default function Sheet({ open, onClose, title, label, variant = 'sheet', header, footer, children, className = '', closeLabel = '閉じる' }) {
  const panelRef = useRef(null)
  const onCloseRef = useRef(onClose)
  useLayoutEffect(() => { onCloseRef.current = onClose })
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const token = {}
    stack.push(token)
    document.body.classList.add('sheet-open')
    const returnTo = document.activeElement

    // Move focus inside: first [data-autofocus], else the panel itself.
    const panel = panelRef.current
    const first = panel?.querySelector('[data-autofocus]')
    ;(first || panel)?.focus({ preventScroll: true })

    const onKey = e => {
      if (stack[stack.length - 1] !== token) return
      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseRef.current?.()
        return
      }
      if (e.key !== 'Tab' || !panel) return
      const items = [...panel.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null)
      if (!items.length) { e.preventDefault(); panel.focus(); return }
      const firstEl = items[0], lastEl = items[items.length - 1]
      if (e.shiftKey && (document.activeElement === firstEl || document.activeElement === panel)) {
        e.preventDefault(); lastEl.focus()
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault(); firstEl.focus()
      }
    }
    document.addEventListener('keydown', onKey)

    return () => {
      document.removeEventListener('keydown', onKey)
      const i = stack.indexOf(token)
      if (i >= 0) stack.splice(i, 1)
      if (!stack.length) document.body.classList.remove('sheet-open')
      if (returnTo && typeof returnTo.focus === 'function' && document.contains(returnTo)) {
        returnTo.focus({ preventScroll: true })
      }
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className={`kk-overlay kk-overlay--${variant}`} onMouseDown={e => { if (e.target === e.currentTarget) onClose?.() }}>
      <div
        ref={panelRef}
        className={`kk-panel kk-panel--${variant} ${className}`}
        role={variant === 'dialog' ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : label}
        tabIndex={-1}
      >
        {(title || header) && (
          <div className="kk-panel__head">
            {header || (<>
              <button type="button" className="kk-icon-btn" onClick={onClose} aria-label={closeLabel}>
                <CloseIcon />
              </button>
              <h2 id={titleId} className="kk-panel__title">{title}</h2>
              <span className="kk-panel__head-spacer" />
            </>)}
          </div>
        )}
        <div className="kk-panel__body">{children}</div>
        {footer && <div className="kk-panel__foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

export function CloseIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}
