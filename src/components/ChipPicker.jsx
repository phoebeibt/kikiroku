import { useMemo, useState } from 'react'
import Sheet from './ui/Sheet'
import { recentTags } from '../lib/recentTags'

/**
 * Compact chip choice (design 2026-10-08 §3): up to 3 recently used, then the first 6 common ones,
 * with any other selected chip pinned in front; everything else (and any extra controls such as a custom-tag
 * input) lives in a もっと見る sheet, so 香り・味わい・整理 never become a tag wall.
 * `tags` = [{ id, label }] in "most common first" order.
 */
export default function ChipPicker({ tags, selected = [], onChange, category, title, lang, outline = false, extra = null, renderSelected, groups = null }) {
  const [open, setOpen] = useState(false)
  const L = (ja, zh, en) => (lang === 'ja' ? ja : lang === 'zh' ? zh : en)
  const toggle = id => onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id])
  // Read once per mount: the inline set should not reshuffle while someone is tapping.
  const recent = useMemo(() => recentTags(category), [category])

  // The base row (recent + common) does not depend on what is selected, so tapping a chip never
  // moves it; a selection outside that row (from the sheet, or an edited record) is pinned in front.
  // A short list (e.g. スタイル・製法, 10 chips) is shown whole — folding it would only hide 貴醸酒 & co.
  if (tags.length <= 10) {
    return <div className="kk-tagpick">{tags.map(tg => {
      const on = selected.includes(tg.id)
      return <button key={tg.id} type="button" className={`kk-chip${outline ? ' kk-chip--outline' : ''}${on ? ' is-active' : ''}`} aria-pressed={on} onClick={() => toggle(tg.id)}>{tg.label}</button>
    })}</div>
  }
  const byId = new Map(tags.map(tg => [tg.id, tg]))
  const recentShown = recent.filter(id => byId.has(id)).slice(0, 3).map(id => byId.get(id))
  const base = new Set(recentShown.map(tg => tg.id))
  const common = tags.filter(tg => !base.has(tg.id)).slice(0, 6)
  common.forEach(tg => base.add(tg.id))
  const picked = selected.filter(id => byId.has(id) && !base.has(id)).map(id => byId.get(id))
  const hidden = tags.length - base.size - picked.length

  const chip = tg => {
    const on = selected.includes(tg.id)
    return (
      <button key={tg.id} type="button" className={`kk-chip${outline ? ' kk-chip--outline' : ''}${on ? ' is-active' : ''}`} aria-pressed={on} onClick={() => toggle(tg.id)}>
        {tg.label}
      </button>
    )
  }

  return (
    <div className="kk-tagpick">
      {picked.map(chip)}
      {renderSelected}
      {recentShown.map(chip)}
      {common.map(chip)}
      {(hidden > 0 || extra) && (
        <button type="button" className="kk-chip kk-chip--more" aria-haspopup="dialog" onClick={() => setOpen(true)}>
          {L('もっと見る', '更多', 'More')}{hidden > 0 && ` +${hidden}`}
        </button>
      )}
      <Sheet open={open} onClose={() => setOpen(false)} className="kk-panel--fit kk-chipsheet" title={title}
        footer={<button type="button" className="kk-btn kk-btn--primary" onClick={() => setOpen(false)}>{L('完了', '完成', 'Done')}{selected.length > 0 && `（${selected.length}）`}</button>}>
        {groups ? groups.map(g => {
          const items = g.ids.map(id => byId.get(id)).filter(Boolean)
          return items.length > 0 && (
            <section key={g.key} className="kk-chipsheet__group" aria-label={g.label}>
              <h3 className="kk-chipsheet__heading">{g.label}</h3>
              <div className="kk-tagpick">{items.map(chip)}</div>
            </section>
          )
        }) : <div className="kk-tagpick kk-chipsheet__all">{tags.map(chip)}</div>}
        {extra && <div className="kk-chipsheet__extra">{extra}</div>}
      </Sheet>
    </div>
  )
}
