import { useTags } from '../contexts/TagsContext'

export default function TastingTagPicker({ category, selected = [], onChange, lang }) {
  const tags = useTags(category)
  const toggle = id =>
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id])

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
      {tags.map(tag => {
        const on = selected.includes(tag.id)
        return (
          <button key={tag.id} type="button" onClick={() => toggle(tag.id)}
            style={{
              padding: '6px 13px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
              border: on ? 'none' : '1px solid var(--border)',
              background: on ? 'var(--accent)' : 'var(--bg)',
              color: on ? '#fff' : 'var(--sub)',
              fontFamily: 'var(--font-sans)',
              transition: 'all .15s',
            }}>
            {tag[lang] || tag.ja}
          </button>
        )
      })}
    </div>
  )
}
