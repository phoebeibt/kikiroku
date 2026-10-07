import { useEffect } from 'react'
import './ui.css'

// Quiet confirmation after save. `stamp` is the 印章 word (保存 / 下書き).
export default function Toast({ toast, onDone }) {
  useEffect(() => {
    if (!toast) return
    const id = setTimeout(onDone, 2600)
    return () => clearTimeout(id)
  }, [toast, onDone])

  return (
    <div className="kk-toast-region" role="status" aria-live="polite">
      {toast && (
        <div className="kk-toast" key={toast.id}>
          <span className={`kk-toast__stamp${toast.tone === 'draft' ? ' kk-toast__stamp--draft' : ''}`} aria-hidden="true">{toast.stamp}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}
