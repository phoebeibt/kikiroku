import { useTags } from '../contexts/TagsContext'
import { cleanLabel } from '../lib/labels'
import ChipPicker from './ChipPicker'
import { METHOD_GROUPS } from '../lib/methodGroups'

// Chips carry no reading — readings live in the 事典.
export default function TastingTagPicker({ category, selected = [], onChange, lang, title }) {
  const tags = useTags(category).map(tg => ({ id: tg.id, label: cleanLabel(tg[lang] || tg.ja) }))
  // スタイル・製法 opens grouped by brewing step; anything not listed lands in the last group.
  let groups = null
  if (category === 'method') {
    const listed = new Set(METHOD_GROUPS.flatMap(g => g.ids))
    groups = METHOD_GROUPS.map((g, i) => ({ key: g.key, label: g[lang] || g.ja,
      ids: i === METHOD_GROUPS.length - 1 ? [...g.ids, ...tags.map(t => t.id).filter(id => !listed.has(id))] : g.ids }))
  }
  return <ChipPicker tags={tags} selected={selected} onChange={onChange} category={category} title={title} lang={lang} groups={groups} />
}
