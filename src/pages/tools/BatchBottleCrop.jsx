import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Nav from '../../components/Nav'
import BottleCropEditor from '../../components/bottle/BottleCropEditor'
import SakeBottleCrop from '../../components/bottle/SakeBottleCrop'
import { useLang } from '../../contexts/LangContext'
import '../sakeDetail.css'
import '../wiki/wiki.css'

/**
 * TEMPORARY tool (2026-10-07): walk through your own photos one by one and fit each bottle to the
 * template. Saves sake_entries.photo_crop only — the original photo is untouched.
 * New records already open the same editor right after a photo is chosen.
 */
export default function BatchBottleCrop({ session }) {
  const navigate = useNavigate()
  const { lang } = useLang()
  const L = (ja, zh, en) => (lang === 'ja' ? ja : lang === 'zh' ? zh : en)
  const [entries, setEntries] = useState(null)
  const [queue, setQueue] = useState(null)   // ids to walk through
  const [index, setIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [savedCount, setSavedCount] = useState(0)

  useEffect(() => {
    if (!session) return
    supabase.from('sake_entries').select('id,brand,name,photo_url,thumb_url,photo_crop,tasted_at')
      .eq('user_id', session.user.id).not('photo_url', 'is', null).order('tasted_at', { ascending: false })
      .then(({ data, error: err }) => { if (err) setError(err.message); setEntries(data || []) })
  }, [session?.user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const byId = useMemo(() => new Map((entries || []).map(e => [e.id, e])), [entries])
  const todo = (entries || []).filter(e => !e.photo_crop)
  const current = queue ? byId.get(queue[index]) : null
  const next = queue ? byId.get(queue[index + 1]) : null

  // Warm the next photo so stepping through feels instant.
  useEffect(() => { if (next?.photo_url) { const img = new Image(); img.src = next.photo_url } }, [next?.photo_url])

  if (!session) return <Navigate to="/login" replace />

  const start = list => { setQueue(list.map(e => e.id)); setIndex(0); setSavedCount(0); setError(null) }
  const advance = () => setIndex(i => i + 1)
  const save = async crop => {
    setSaving(true); setError(null)
    const { error: err } = await supabase.from('sake_entries').update({ photo_crop: crop }).eq('id', current.id)
    setSaving(false)
    if (err) { setError(err.message); return }
    setEntries(list => list.map(e => (e.id === current.id ? { ...e, photo_crop: crop } : e)))
    setSavedCount(n => n + 1)
    advance()
  }

  const name = e => [e.brand, e.name].filter(Boolean).join(' ') || L('(名前なし)', '(未命名)', '(untitled)')
  const finished = queue && index >= queue.length

  return (
    <div className="kk-wiki-page">
      <Nav session={session} topbar={false} />
      <div className="kk-wdetail">
        <button type="button" className="kk-wdetail__back" onClick={() => navigate('/journal')}>‹ {L('マイ帳', '酒帳', 'My shelf')}</button>
        <h1 style={{ marginTop: 6 }}>{L('瓶身をまとめて調整', '批量調整瓶身', 'Fit bottles in bulk')}</h1>
        <p className="kk-wdetail__sub">{L('一枚ずつ、瓶が枠に収まるように動かして保存します。元の写真はそのまま残ります。（臨時ツール）', '一張一張把酒瓶移進框裡再保存，原始照片不會改動。（臨時工具）', 'One photo at a time: fit the bottle and save. Originals stay untouched. (Temporary tool)')}</p>

        {error && <p className="kk-wdetail__empty" role="alert" style={{ marginTop: 12, color: 'var(--danger)' }}>{L('保存できませんでした：', '儲存失敗：', 'Could not save: ')}{error}</p>}

        {!entries && <div className="kk-skeleton" aria-hidden="true" style={{ marginTop: 16 }}><div className="kk-skeleton__row"><span /><span /><span /></div></div>}

        {entries && (!queue || finished) && (
          <>
            {finished && (
              <p className="kk-wdetail__empty" style={{ marginTop: 16 }}>
                {L(`完了しました。${savedCount} 枚を保存しました。`, `完成，共保存 ${savedCount} 張。`, `Done — ${savedCount} saved.`)}
              </p>
            )}
            <h2 className="kk-wiki__sec">{L('写真のある記録', '有照片的記錄', 'Records with photos')}<small>{entries.length}</small></h2>
            <div style={{ display: 'grid', gap: 8 }}>
              <button type="button" className="kk-btn kk-btn--primary kk-btn--block" disabled={!todo.length} onClick={() => start(todo)}>
                {todo.length ? L(`未調整の ${todo.length} 枚から始める`, `從未調整的 ${todo.length} 張開始`, `Start with ${todo.length} not yet fitted`) : L('未調整の写真はありません', '沒有未調整的照片', 'Nothing left to fit')}
              </button>
              <button type="button" className="kk-btn kk-btn--block" disabled={!entries.length} onClick={() => start(entries)}>
                {L(`全部（${entries.length} 枚）を見直す`, `重新檢查全部（${entries.length} 張）`, `Review all ${entries.length}`)}
              </button>
            </div>
            <h2 className="kk-wiki__sec">{L('いまの見え方', '目前的樣子', 'How they look now')}</h2>
            <ul className="kk-crop-grid" aria-label={L('一覧', '一覽', 'Overview')}>
              {entries.map(e => (
                <li key={e.id}>
                  <button type="button" onClick={() => { setQueue(entries.map(x => x.id)); setIndex(entries.findIndex(x => x.id === e.id)); setSavedCount(0) }}
                    aria-label={`${name(e)}${e.photo_crop ? '' : L('（未調整）', '（未調整）', ' (not fitted)')}`}>
                    <SakeBottleCrop imageUrl={e.thumb_url || e.photo_url} crop={e.photo_crop} height="84px" />
                    {!e.photo_crop && <span className="kk-crop-grid__dot" aria-hidden="true" />}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {current && (
        <BottleCropEditor
          key={current.id} open src={current.photo_url} initial={current.photo_crop} lang={lang} saving={saving}
          title={name(current)} sideLabel={`${index + 1} / ${queue.length}`}
          onSave={save} onSkip={advance} onClose={() => setQueue(null)}
          extraActions={index > 0 && (
            <button type="button" className="kk-btn kk-btn--ghost" onClick={() => setIndex(i => i - 1)} disabled={saving}>{L('前へ', '上一張', 'Back')}</button>
          )}
        />
      )}
    </div>
  )
}
