function Dot({ filled, size, color, emptyColor }) {
  if (filled) return (
    <svg width={size} height={size} viewBox="0 0 44 44" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <g transform="translate(22,22)">
        <path d="M-3,-9 C-7,-7 -10,-3 -10,2 C-10,7 -7,10 -2,11 C3,12 8,9 10,5 C11,2 10,-3 7,-6 C4,-8 0,-9 -2,-9"
          fill="none" stroke={color} strokeOpacity=".45" strokeWidth="2.8" strokeLinecap="round" />
        <circle r="5" fill={color} />
      </g>
    </svg>
  )
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <g transform="translate(22,22)">
        <circle r="5" fill="none" stroke={emptyColor} strokeWidth="2.2" opacity="0.35" />
      </g>
    </svg>
  )
}

// Dark dots — for light backgrounds
export default function Stars({ rating, max = 5, size = 13 }) {
  if (!rating) return null
  const r = Math.round(rating)
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {Array.from({ length: max }, (_, i) => (
        <Dot key={i} filled={i < r} size={size} color="#7C3A28" emptyColor="#7C3A28" />
      ))}
    </span>
  )
}

// Cream dots — for dark/photo backgrounds
export function StarsLight({ rating, max = 5, size = 11 }) {
  if (!rating) return null
  const r = Math.round(rating)
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {Array.from({ length: max }, (_, i) => (
        <Dot key={i} filled={i < r} size={size} color="rgba(255,245,230,.95)" emptyColor="rgba(255,245,230,.95)" />
      ))}
    </span>
  )
}
