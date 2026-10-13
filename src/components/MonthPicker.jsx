import { useEffect, useRef, useState } from 'react'

/**
 * 装瓶日 picker. Labels print 製造年月 (year + month), so the calendar is a year switcher over a
 * 12-month grid. Value is 'yyyy-mm' (or '' for none), the format sake_entries.bottling_date keeps.
 */
export default function MonthPicker({ id, value, onChange, lang = 'ja' }) {
  const L = (ja, zh, en) => (lang === 'ja' ? ja : lang === 'zh' ? zh : en)
  const now = new Date()
  // Older records also hold '202609' or '2026-6'; read them, write back as 'yyyy-mm'.
  const parsed = /^(\d{4})[-./年]?(\d{1,2})/.exec(value || '')
  const [y0, m0] = parsed && +parsed[2] >= 1 && +parsed[2] <= 12 ? [+parsed[1], +parsed[2]] : [null, null]
  const [open, setOpen] = useState(false)
  const [year, setYear] = useState(y0 || now.getFullYear())
  const wrapRef = useRef(null)

  // Close on outside tap / Escape; the trigger keeps focus semantics simple (no modal).
  useEffect(() => {
    if (!open) return
    const onDown = e => { if (!wrapRef.current?.contains(e.target)) setOpen(false) }
    const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); wrapRef.current?.querySelector('button')?.focus() } }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey, true)
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey, true) }
  }, [open])

  const label = y0 ? L(`${y0}年${m0}月`, `${y0} 年 ${m0} 月`, new Date(y0, m0 - 1).toLocaleString('en', { month: 'short', year: 'numeric' })) : L('選ぶ', '選擇', 'Choose')
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const future = (yy, mm) => yy > now.getFullYear() || (yy === now.getFullYear() && mm > now.getMonth() + 1)
  const pick = mm => { onChange(`${year}-${String(mm).padStart(2, '0')}`); setOpen(false) }

  return (
    <div className="kk-month" ref={wrapRef}>
      <button type="button" id={id} className={`kk-input kk-month__trigger${y0 ? '' : ' is-empty'}`} aria-haspopup="dialog" aria-expanded={open}
        onClick={() => { setYear(y0 || now.getFullYear()); setOpen(o => !o) }}>
        <span>{label}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
      </button>
      {open && (
        <div className="kk-month__pop" role="dialog" aria-label={L('装瓶年月を選ぶ', '選擇裝瓶年月', 'Choose bottling month')}>
          <div className="kk-month__head">
            <button type="button" onClick={() => setYear(v => v - 1)} aria-label={L('前の年', '上一年', 'Previous year')}>‹</button>
            <strong aria-live="polite">{L(`${year}年`, `${year} 年`, String(year))}</strong>
            <button type="button" onClick={() => setYear(v => v + 1)} disabled={year >= now.getFullYear()} aria-label={L('次の年', '下一年', 'Next year')}>›</button>
          </div>
          <div className="kk-month__grid">
            {months.map(mm => (
              <button key={mm} type="button" aria-pressed={year === y0 && mm === m0} disabled={future(year, mm)} onClick={() => pick(mm)}>
                {L(`${mm}月`, `${mm} 月`, new Date(2000, mm - 1).toLocaleString('en', { month: 'short' }))}
              </button>
            ))}
          </div>
          <div className="kk-month__foot">
            {y0 && <button type="button" onClick={() => { onChange(''); setOpen(false) }}>{L('クリア', '清除', 'Clear')}</button>}
            <button type="button" onClick={() => { setYear(now.getFullYear()); pick(now.getMonth() + 1) }}>{L('今月', '本月', 'This month')}</button>
          </div>
        </div>
      )}
    </div>
  )
}
