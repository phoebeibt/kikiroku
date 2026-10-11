import { useTags } from '../contexts/TagsContext'
import { cleanLabel } from '../lib/labels'
import ChipPicker from './ChipPicker'

// Chips carry no reading — readings live in the 事典.
export default function TastingTagPicker({ category, selected = [], onChange, lang, title }) {
  const tags = useTags(category).map(tg => ({ id: tg.id, label: cleanLabel(tg[lang] || tg.ja) }))
  return <ChipPicker tags={tags} selected={selected} onChange={onChange} category={category} title={title} lang={lang} />
}
