import { BOTTLE_POINTS } from '../bottle/crop'

// Round 印章 for a public 酒札. Symbols stay on-topic: bottle, bottle + small paw, 酒札, 記録帳.
// Provisional glyphs — to be replaced by the designer's final 24×24 set.
export default function PlazaStamp({ kind }) {
  return (
    <span className={`kk-stamp kk-stamp--${kind}`} aria-hidden="true">
      <svg viewBox="0 0 40 40" width="100%" height="100%">
        <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="20" cy="20" r="15" fill="none" stroke="currentColor" strokeWidth=".7" strokeDasharray="1.5 1.8" />
        {(kind === 'bottle' || kind === 'bottle-paw') && (
          <svg x={kind === 'bottle-paw' ? 9 : 14.5} y="9.5" width="11" height="21" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polygon points={BOTTLE_POINTS} fill="currentColor" />
          </svg>
        )}
        {kind === 'bottle-paw' && (
          <g fill="currentColor">
            <ellipse cx="27" cy="25.5" rx="3.6" ry="3" />
            <circle cx="23.6" cy="21.2" r="1.3" /><circle cx="26" cy="19.6" r="1.3" /><circle cx="28.6" cy="19.8" r="1.3" /><circle cx="30.6" cy="21.8" r="1.3" />
          </g>
        )}
        {kind === 'tag' && (
          <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
            <path d="M14 15 l6-5 6 5 v15 h-12z" />
            <circle cx="20" cy="15" r="1.4" fill="currentColor" stroke="none" />
            <path d="M17 21h6M17 25h6" strokeLinecap="round" />
          </g>
        )}
        {kind === 'book' && (
          <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
            <path d="M10 13.5c3.5-1 7-.6 10 1.5 3-2.1 6.5-2.5 10-1.5v14c-3.5-1-7-.6-10 1.5-3-2.1-6.5-2.5-10-1.5z" />
            <path d="M20 15v14" />
          </g>
        )}
      </svg>
    </span>
  )
}
