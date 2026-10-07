import { supabase } from './supabase'

// プロフ › データを書き出す: the user's own records as CSV (opens in Excel / Numbers) or JSON.
const COLUMNS = [
  ['tasted_at', '飲んだ日'], ['brand', '銘柄'], ['name', '酒名'], ['brewery', '酒造'], ['region', '産地'], ['type', '種類'],
  ['rating', '評価'], ['polishing', '精米歩合'], ['alcohol', 'アルコール'], ['smv', '日本酒度'], ['acidity', '酸度'],
  ['rice', '原料米'], ['yeast', '酵母'], ['aroma_tags', '香り'], ['taste_tags', '味わい'], ['notes', 'メモ'],
  ['is_public', '公開'], ['status', '状態'], ['photo_url', '写真'], ['created_at', '作成日時'],
]

const cell = v => {
  const s = Array.isArray(v) ? v.join(' / ') : v == null ? '' : String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function download(name, type, text) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** format: 'csv' | 'json'. tagLabel(id, cat) turns tag ids into the current language's names for CSV. */
export async function exportEntries(userId, format, tagLabel) {
  const { data, error } = await supabase.from('sake_entries').select('*').eq('user_id', userId).order('tasted_at', { ascending: false })
  if (error) throw new Error(error.message)
  const stamp = new Date().toISOString().slice(0, 10)
  if (format === 'json') {
    download(`kikiroku-${stamp}.json`, 'application/json', JSON.stringify(data, null, 2))
    return data.length
  }
  const rows = data.map(e => COLUMNS.map(([k]) => {
    if (k === 'aroma_tags') return cell((e[k] || []).map(t => tagLabel(t, 'aroma')))
    if (k === 'taste_tags') return cell((e[k] || []).map(t => tagLabel(t, 'taste')))
    return cell(e[k])
  }).join(','))
  // BOM so Excel reads the Japanese text as UTF-8.
  download(`kikiroku-${stamp}.csv`, 'text/csv;charset=utf-8', '﻿' + [COLUMNS.map(([, h]) => h).join(','), ...rows].join('\r\n'))
  return data.length
}
