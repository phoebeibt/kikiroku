import { useState } from 'react'
import { useTags } from '../contexts/TagsContext'

export default function FlavorTagPicker({ selected = [], onChange, lang, t }) {
  const flavorTags = useTags('flavor')
  const [input, setInput] = useState('')

  const toggle = id =>
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id])

  const addCustom = () => {
    const v = input.trim()
    if (v && !selected.includes(v)) onChange([...selected, v])
    setInput('')
  }

  // Predefined IDs currently selected
  const selectedIds = new Set(selected.filter(s => flavorTags.some(t => t.id === s)))
  // Custom raw strings currently selected
  const customTags = selected.filter(s => !flavorTags.some(t => t.id === s))

  return (
    <div>
      {/* Predefined chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 10 }}>
        {flavorTags.map(tag => {
          const on = selectedIds.has(tag.id)
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

      {/* Custom tags */}
      {customTags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {customTags.map(tag => (
            <span key={tag} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, background: 'var(--accent-bg)', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 5 }}>
              {tag}
              <span onClick={() => onChange(selected.filter(x => x !== tag))}
                style={{ cursor: 'pointer', fontWeight: 700, fontSize: 11, opacity: .6 }}>×</span>
            </span>
          ))}
        </div>
      )}

      {/* Custom text input */}
      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        <input
          style={{ flex: 1, padding: '9px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, outline: 'none' }}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addCustom() } }}
          placeholder={t('form.tagPH')} />
        <button type="button" onClick={addCustom}
          style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--accent)', fontSize: 13, cursor: 'pointer' }}>
          {t('form.tagAdd')}
        </button>
      </div>
    </div>
  )
}
