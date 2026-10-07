import { useState } from 'react'
import { useTags } from '../contexts/TagsContext'
import { cleanLabel } from '../lib/labels'

// Shows the first `limit` tags (plus anything already selected) and a もっと見る toggle.
// Chips carry no reading — readings live in the 事典.
export default function TastingTagPicker({ category, selected = [], onChange, lang, limit = 12 }) {
  const tags = useTags(category)
  const [all, setAll] = useState(false)
  const toggle = id => onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id])
  const L = (ja, zh, en) => (lang === 'ja' ? ja : lang === 'zh' ? zh : en)

  const visible = all || tags.length <= limit
    ? tags
    : [...tags.slice(0, limit), ...tags.slice(limit).filter(tg => selected.includes(tg.id))]
  const hidden = tags.length - visible.length

  return (
    <div className="kk-tagpick">
      {visible.map(tag => {
        const on = selected.includes(tag.id)
        return (
          <button key={tag.id} type="button" className={`kk-chip${on ? ' is-active' : ''}`} aria-pressed={on} onClick={() => toggle(tag.id)}>
            {cleanLabel(tag[lang] || tag.ja)}
          </button>
        )
      })}
      {tags.length > limit && (
        <button type="button" className="kk-chip kk-chip--more" aria-expanded={all} onClick={() => setAll(a => !a)}>
          {all ? L('閉じる', '收起', 'Less') : `${L('もっと見る', '更多', 'More')} +${hidden}`}
        </button>
      )}
    </div>
  )
}
