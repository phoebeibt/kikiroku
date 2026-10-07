// Photos of the unsaved 新しい記録 draft, kept on this device (IndexedDB) so a
// photo-only draft survives closing the form. Text fields stay in localStorage.
const DB = 'kikiroku'
const STORE = 'draft'
const KEY = 'photos'

function open() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('no indexedDB'))
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function run(mode, fn) {
  const db = await open()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const req = fn(tx.objectStore(STORE))
    tx.oncomplete = () => { db.close(); resolve(req?.result) }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

// { main: Blob|null, back: Blob|null }
export const saveDraftPhotos = photos => run('readwrite', s => s.put(photos, KEY)).catch(() => {})
export const loadDraftPhotos = () => run('readonly', s => s.get(KEY)).catch(() => null)
export const clearDraftPhotos = () => run('readwrite', s => s.delete(KEY)).catch(() => {})
