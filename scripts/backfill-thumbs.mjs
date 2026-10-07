#!/usr/bin/env node
// Create ~240px-wide list thumbnails for existing photos and set sake_entries.thumb_url.
// Originals are never modified. Needs the 20261007_bottle_crop migration.
//   SUPABASE_URL=… SUPABASE_SERVICE_KEY=… node scripts/backfill-thumbs.mjs [--dry]
// Uses ImageMagick (`magick`) for resizing; reads originals from the latest local
// backup when present, otherwise downloads them.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const URL = process.env.SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_KEY
const DRY = process.argv.includes('--dry')
if (!URL || !KEY) { console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_KEY'); process.exit(1) }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` }
const BUCKET = 'sake-photos'
const backups = existsSync('backups') ? readdirSync('backups').filter(d => !d.startsWith('.')).sort() : []
const LOCAL = backups.length ? join('backups', backups.at(-1), 'storage', BUCKET) : null
const tmp = mkdtempSync(join(tmpdir(), 'kk-thumbs-'))

const res = await fetch(`${URL}/rest/v1/sake_entries?select=id,photo_url,thumb_url&photo_url=not.is.null&thumb_url=is.null`, { headers: H })
if (!res.ok) { console.error(await res.text()); process.exit(1) }
const rows = await res.json()
console.log(`${rows.length} records need a thumbnail${DRY ? ' (dry run)' : ''}`)

let done = 0, failed = 0
for (const r of rows) {
  try {
    const path = decodeURIComponent(r.photo_url.split(`/object/public/${BUCKET}/`)[1] || '')
    if (!path) throw new Error('unexpected photo_url')
    const src = join(tmp, 'src.jpg'), out = join(tmp, 'thumb.jpg')
    const local = LOCAL && join(LOCAL, path)
    if (local && existsSync(local)) writeFileSync(src, readFileSync(local))
    else writeFileSync(src, Buffer.from(await (await fetch(r.photo_url)).arrayBuffer()))
    execFileSync('magick', [src, '-auto-orient', '-resize', '240x', '-strip', '-quality', '80', out])
    const [dir, file] = [path.split('/').slice(0, -1).join('/'), path.split('/').at(-1)]
    const thumbPath = `${dir}/thumbs/${file.replace(/\.\w+$/, '')}.jpg`
    if (DRY) { console.log('  would write', thumbPath); done++; continue }
    const up = await fetch(`${URL}/storage/v1/object/${BUCKET}/${thumbPath}`, { method: 'POST', headers: { ...H, 'Content-Type': 'image/jpeg', 'x-upsert': 'true' }, body: readFileSync(out) })
    if (!up.ok) throw new Error(`upload ${up.status} ${await up.text()}`)
    const thumbUrl = `${URL}/storage/v1/object/public/${BUCKET}/${thumbPath}`
    const patch = await fetch(`${URL}/rest/v1/sake_entries?id=eq.${r.id}`, { method: 'PATCH', headers: { ...H, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify({ thumb_url: thumbUrl }) })
    if (!patch.ok) throw new Error(`patch ${patch.status} ${await patch.text()}`)
    done++
  } catch (e) { failed++; console.log('  ✗', r.id, e.message) }
}
console.log(`done ${done}, failed ${failed}`)
