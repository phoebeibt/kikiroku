import { formatRating } from '../../lib/rating'
import './record.css'

// 0.5-step rating as five dots, each split into a left (x.5) and right (x.0) half.
// Behaves as a slider for keyboard / screen-reader users (arrows ±0.5, Home/End, Delete clears).
export default function RatingPicker({ value, onChange, label, invalid, id }) {
  const v = Number(value) || 0
  const set = n => onChange(Math.max(0, Math.min(5, Math.round(n * 2) / 2)))

  const onKeyDown = e => {
    const step = { ArrowRight: 0.5, ArrowUp: 0.5, ArrowLeft: -0.5, ArrowDown: -0.5 }[e.key]
    if (step) { e.preventDefault(); set((v || (step > 0 ? 0 : 0.5)) + step) }
    else if (e.key === 'Home') { e.preventDefault(); set(0.5) }
    else if (e.key === 'End') { e.preventDefault(); set(5) }
    else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); set(0) }
  }

  return (
    <div
      id={id}
      className={`kk-rating${invalid ? ' is-invalid' : ''}`}
      role="slider" tabIndex={0}
      aria-label={label}
      aria-valuemin={0.5} aria-valuemax={5} aria-valuenow={v || undefined}
      aria-valuetext={v ? `${formatRating(v)} / 5` : '—'}
      aria-invalid={invalid || undefined}
      onKeyDown={onKeyDown}
    >
      <div className="kk-rating__dots">
        {[1, 2, 3, 4, 5].map(n => {
          const fill = v >= n ? 'full' : v >= n - 0.5 ? 'half' : 'empty'
          return (
            <span key={n} className={`kk-rating__dot is-${fill}`}>
              {/* Tapping the half that is already the value clears it, so a mis-tap is easy to undo. */}
              <button type="button" tabIndex={-1} aria-hidden="true" className="kk-rating__hit kk-rating__hit--l"
                onClick={() => set(v === n - 0.5 ? 0 : n - 0.5)} />
              <button type="button" tabIndex={-1} aria-hidden="true" className="kk-rating__hit kk-rating__hit--r"
                onClick={() => set(v === n ? 0 : n)} />
            </span>
          )
        })}
      </div>
      <span className="kk-rating__num" aria-hidden="true">{v ? formatRating(v) : '—'}</span>
    </div>
  )
}
