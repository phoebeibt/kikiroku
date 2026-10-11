import { useState } from 'react'
import { useTags } from '../contexts/TagsContext'
import { cleanLabel } from '../lib/labels'
import ChipPicker from './ChipPicker'

// 整理 labels: fixed tags plus free-text ones. The free-text input is kept in the もっと見る sheet.
export default function FlavorTagPicker({ selected = [], onChange, lang, t, title }) {
  const tags = useTags('flavor').map(tg => ({ id: tg.id, label: cleanLabel(tg[lang] || tg.ja) }))
  const [input, setInput] = useState('')
  const known = new Set(tags.map(tg => tg.id))
  const customTags = selected.filter(s => !known.has(s))
  const L = (ja, zh, en) => (lang === 'ja' ? ja : lang === 'zh' ? zh : en)

  const addCustom = () => {
    const v = input.trim()
    if (v && !selected.includes(v)) onChange([...selected, v])
    setInput('')
  }
  const removeCustom = tag => onChange(selected.filter(x => x !== tag))

  const customChips = customTags.map(tag => (
    <button key={tag} type="button" className="kk-chip kk-chip--outline is-active" aria-pressed="true"
      aria-label={L(`${tag} を外す`, `移除 ${tag}`, `Remove ${tag}`)} onClick={() => removeCustom(tag)}>
      {tag} <span aria-hidden="true">×</span>
    </button>
  ))

  const extra = (
    <div className="kk-custom-tag">
      <label className="kk-field__label" htmlFor="kk-custom-tag">{L('自分のラベルを追加', '新增自訂標籤', 'Add your own label')}</label>
      {customChips.length > 0 && <div className="kk-tagpick">{customChips}</div>}
      <div className="kk-custom-tag__row">
        <input id="kk-custom-tag" className="kk-input" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addCustom() } }}
          placeholder={t('form.tagPH')} />
        <button type="button" className="kk-btn" onClick={addCustom}>{t('form.tagAdd')}</button>
      </div>
    </div>
  )

  return <ChipPicker tags={tags} selected={selected} onChange={onChange} category="flavor" title={title} lang={lang} outline extra={extra} renderSelected={customChips} />
}
