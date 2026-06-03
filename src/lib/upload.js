import { supabase } from './supabase'

const BUCKET = 'sake-photos'
const MAX_BYTES = 500 * 1024  // 500 KB

// Compress image to JPEG, resize to maxWidth, and iterate quality until under MAX_BYTES.
// Returns a Blob.
export function compressImage(file, maxWidth = 1400) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxWidth / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)

      const tryQuality = (q) => {
        canvas.toBlob(blob => {
          if (!blob) return reject(new Error('canvas toBlob failed'))
          if (blob.size <= MAX_BYTES || q <= 0.3) return resolve(blob)
          tryQuality(Math.round((q - 0.1) * 10) / 10)
        }, 'image/jpeg', q)
      }
      tryQuality(0.85)
    }
    img.onerror = reject
    img.src = url
  })
}

// Upload an already-compressed Blob directly (no re-compression).
export async function uploadPhoto(blob, userId) {
  const path = `${userId}/${Date.now()}.jpg`
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: false,
  })
  if (error) throw error
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
