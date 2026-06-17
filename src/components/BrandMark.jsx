export default function BrandMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 88 88" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <g transform="translate(44,44)">
        <path d="M-10,-27 C-22,-22 -30,-10 -30,4 C-30,18 -22,28 -10,32 C2,36 16,30 24,20 C30,12 30,-2 24,-14 C18,-24 6,-30 -4,-30"
          fill="none" style={{ stroke: 'var(--mark-outer)' }} strokeWidth="3" strokeLinecap="round" />
        <path d="M-6,-18 C-14,-14 -20,-6 -20,4 C-20,14 -14,20 -4,22 C6,24 16,18 20,10 C22,4 20,-6 14,-12 C8,-18 0,-20 -4,-20"
          fill="none" style={{ stroke: 'var(--mark-inner)' }} strokeWidth="4" strokeLinecap="round" />
        <circle r="10" style={{ fill: 'var(--mark-dot)' }} />
        <circle r="10" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="1.5" />
      </g>
    </svg>
  )
}

export function BrandMarkFull({ size = 280, opacity = 0.04 }) {
  return (
    <svg
      style={{ position: 'fixed', right: -50, bottom: -50, width: size, height: size, opacity, pointerEvents: 'none', zIndex: 0 }}
      viewBox="0 0 88 88" xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(44,44)">
        <path d="M-15,-37 C-30,-30 -40,-14 -40,4 C-40,22 -32,36 -18,40 C-4,44 14,40 26,28 C36,18 40,2 36,-14 C32,-28 20,-38 4,-40"
          fill="none" style={{ stroke: 'var(--mark-outer)' }} strokeWidth="1.1" strokeLinecap="round" />
        <path d="M-10,-27 C-22,-22 -30,-10 -30,4 C-30,18 -22,28 -10,32 C2,36 16,30 24,20 C30,12 30,-2 24,-14 C18,-24 6,-30 -4,-30"
          fill="none" style={{ stroke: 'var(--mark-outer)' }} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M-6,-18 C-14,-14 -20,-6 -20,4 C-20,14 -14,20 -4,22 C6,24 16,18 20,10 C22,4 20,-6 14,-12 C8,-18 0,-20 -4,-20"
          fill="none" style={{ stroke: 'var(--mark-inner)' }} strokeWidth="2" strokeLinecap="round" />
        <circle r="10" style={{ fill: 'var(--mark-dot)' }} />
      </g>
    </svg>
  )
}
