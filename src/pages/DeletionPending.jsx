import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useLang } from '../contexts/LangContext'
import './profile.css'

// Shown instead of the app while an account is waiting to be deleted (account_deletions, 30 days).
// The only ways out are cancelling or signing out; records stay private until then.
export default function DeletionPending({ purgeAfter, onCancelled }) {
  const { lang } = useLang()
  const L = (ja, zh, en) => (lang === 'ja' ? ja : lang === 'zh' ? zh : en)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const date = new Date(purgeAfter).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replaceAll('/', '.')

  const cancel = async () => {
    setBusy(true); setError('')
    const { error: err } = await supabase.rpc('cancel_account_deletion')
    setBusy(false)
    if (err) { setError(L('取り消せませんでした。もう一度お試しください。', '無法取消，請再試一次。', 'Could not cancel. Please try again.')); return }
    onCancelled()
  }

  return (
    <main className="kk-deletion">
      <img src="/icon-192.png" alt="" width="72" height="72" />
      <h1>{L('このアカウントは削除予定です', '這個帳戶即將刪除', 'This account is scheduled for deletion')}</h1>
      <p>
        {L(`${date} に、記録・写真・飲みたいリストがすべて削除されます。それまでの間、記録は非公開になっています。`,
          `${date} 將刪除所有記錄、照片和想喝清單。在那之前，記錄都設為不公開。`,
          `On ${date} all records, photos and your want-to-try list will be deleted. Until then your records are private.`)}
      </p>
      {error && <p className="kk-deletion__error" role="alert">{error}</p>}
      <div className="kk-deletion__actions">
        <button type="button" className="kk-btn kk-btn--primary" onClick={cancel} disabled={busy}>
          {L('削除を取り消す', '取消刪除', 'Cancel deletion')}
        </button>
        <button type="button" className="kk-btn" onClick={() => supabase.auth.signOut()} disabled={busy}>
          {L('ログアウト', '登出', 'Sign out')}
        </button>
      </div>
      <p className="kk-pf-hint">{L('取り消すと、公開していた記録も元に戻ります。', '取消後，原本公開的記錄也會恢復公開。', 'Cancelling also makes your shared records public again.')}</p>
    </main>
  )
}
