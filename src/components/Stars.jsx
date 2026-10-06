import { formatRating } from '../lib/rating'

// Rating dots (清酒金). Ratings come in 0.5 steps; integers from older records render the same.

function Dot({ fill, size, on, off }) {
  // fill: 0 | 0.5 | 1
  const id = `half-${on.replace(/[^a-z0-9]/gi, '')}`
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden="true" style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
      {fill === 0.5 && (
        <defs>
          <linearGradient id={id}>
            <stop offset="50%" stopColor={on} />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        </defs>
      )}
      <circle cx="6" cy="6" r="4.6"
        fill={fill === 1 ? on : fill === 0.5 ? `url(#${id})` : 'none'}
        stroke={fill ? on : off} strokeWidth="1.3" />
    </svg>
  )
}

function dotsFor(rating, max) {
  const r = Math.round(Number(rating) * 2) / 2
  return Array.from({ length: max }, (_, i) => (r >= i + 1 ? 1 : r >= i + 0.5 ? 0.5 : 0))
}


// On paper surfaces
export default function Stars({ rating, max = 5, size = 13, showNumber = false }) {
  if (!rating) return null
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }} role="img" aria-label={`${formatRating(rating)} / ${max}`}>
      {showNumber && <span style={{ color: 'var(--gold)', fontWeight: 800, fontSize: size + 1, marginRight: 3 }}>{formatRating(rating)}</span>}
      {dotsFor(rating, max).map((f, i) => <Dot key={i} fill={f} size={size} on="#b9974a" off="rgba(116,108,96,.35)" />)}
    </span>
  )
}

// On dark photo/gradient backgrounds
export function StarsLight({ rating, max = 5, size = 11 }) {
  if (!rating) return null
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }} role="img" aria-label={`${formatRating(rating)} / ${max}`}>
      {dotsFor(rating, max).map((f, i) => <Dot key={i} fill={f} size={size} on="#e2c27a" off="rgba(255,253,248,.45)" />)}
    </span>
  )
}
