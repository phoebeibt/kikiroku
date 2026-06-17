function DotOnSurface({ filled, size }) {
  if (filled) return (
    <svg width={size} height={size} viewBox="0 0 44 44" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <g transform="translate(22,22)">
        <path d="M-3,-9 C-7,-7 -10,-3 -10,2 C-10,7 -7,10 -2,11 C3,12 8,9 10,5 C11,2 10,-3 7,-6 C4,-8 0,-9 -2,-9"
          fill="none" style={{ stroke: 'var(--accent)' }} strokeOpacity=".5" strokeWidth="2.8" strokeLinecap="round" />
        <circle r="5" style={{ fill: 'var(--green)' }} />
      </g>
    </svg>
  )
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <g transform="translate(22,22)">
        <circle r="5" fill="none" style={{ stroke: 'var(--sub)' }} strokeWidth="2.2" opacity="0.4" />
      </g>
    </svg>
  )
}

function DotOnPhoto({ filled, size }) {
  if (filled) return (
    <svg width={size} height={size} viewBox="0 0 44 44" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <g transform="translate(22,22)">
        <path d="M-3,-9 C-7,-7 -10,-3 -10,2 C-10,7 -7,10 -2,11 C3,12 8,9 10,5 C11,2 10,-3 7,-6 C4,-8 0,-9 -2,-9"
          fill="none" stroke="rgba(200,160,90,.6)" strokeWidth="2.8" strokeLinecap="round" />
        <circle r="5" fill="rgba(180,145,60,.8)" />
      </g>
    </svg>
  )
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <g transform="translate(22,22)">
        <circle r="5" fill="none" stroke="rgba(220,200,180,.4)" strokeWidth="2.2" />
      </g>
    </svg>
  )
}

// On surface-card background — uses theme colors
export default function Stars({ rating, max = 5, size = 13 }) {
  if (!rating) return null
  const r = Math.round(rating)
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {Array.from({ length: max }, (_, i) => <DotOnSurface key={i} filled={i < r} size={size} />)}
    </span>
  )
}

// On dark photo/gradient background — warm light colors
export function StarsLight({ rating, max = 5, size = 11 }) {
  if (!rating) return null
  const r = Math.round(rating)
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {Array.from({ length: max }, (_, i) => <DotOnPhoto key={i} filled={i < r} size={size} />)}
    </span>
  )
}
