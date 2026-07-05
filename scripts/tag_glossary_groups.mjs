// One-shot: add `group:` field to each glossary entry in src/lib/wiki.js
import fs from 'node:fs'

const CATEGORIES = {
  // 分類・タイプ
  type: ['junmai', 'ginjo', 'daiginjo', 'honjozo', 'tokubetsu-junmai', 'futsushu', 'kijoshu'],
  // 製法
  method: ['kimoto', 'yamahai', 'hiire', 'namazake', 'genshu', 'shiboritate', 'kobo-mutenka'],
  // 原料・素材
  ingredient: ['seimaibuai', 'sake-rice', 'sake-yeast', 'kura-tsuki-kobo', 'shirokoji'],
  // 味わい・数値
  flavor: ['nihonshu-do', 'sando', 'amakuchi', 'karakuchi', 'umami', 'kire'],
  // 人・銘柄
  people: ['toji', 'kuramoto', 'meigara'],
}

const idToGroup = {}
for (const [group, ids] of Object.entries(CATEGORIES)) {
  for (const id of ids) idToGroup[id] = group
}
console.log('Assigning groups to', Object.keys(idToGroup).length, 'ids')

const path = 'src/lib/wiki.js'
let src = fs.readFileSync(path, 'utf8')

let changed = 0
const missing = []
for (const [id, group] of Object.entries(idToGroup)) {
  // Anchor: matches "id: '<id>',\n    terms:" — inserts "group: '<group>',\n    " before terms
  const re = new RegExp(`(id: '${id}',\\n    )(terms:)`, 'g')
  if (!re.test(src)) {
    missing.push(id)
    continue
  }
  src = src.replace(new RegExp(`(id: '${id}',\\n    )(terms:)`, 'g'),
    `$1group: '${group}',\n    $2`)
  changed++
}

if (missing.length) {
  console.error('!! missing / already-grouped ids:', missing)
}
fs.writeFileSync(path, src)
console.log(`✓ Modified ${changed} entries in ${path}`)
