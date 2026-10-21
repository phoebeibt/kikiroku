import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Nav from '../components/Nav'
import Sheet from '../components/ui/Sheet'
import JapanMap, { JA_TO_CODE } from '../components/JapanMap'
import { useLang } from '../contexts/LangContext'
import { useTagResolver } from '../contexts/TagsContext'
import { cleanLabel } from '../lib/labels'
import { normalizeType } from '../lib/sakeType'
import { normalizeRegion, regionPath } from '../lib/region'
import { AVATARS, avatarSrc } from '../lib/avatars'
import { exportEntries } from '../lib/exportEntries'
import './sakeDetail.css'
import './journal/ledger.css'
import './wiki/wiki.css'
import './profile.css'

const LANGS = [['ja', '日本語'], ['zh', '中文'], ['en', 'English']]
const REPEAT_TAGS = ['repeat', 'bottle-worthy', 'osusume'] // same as マイ帳's また飲みたい shelf

/**
 * プロフ (option B, 2026-10-07): who you are and what you've been drinking, then settings.
 * Avatar is picked from the designer's tanuki set; language, privacy defaults, export and sign-out
 * live here now that the top brand bar is gone.
 */
export default function Profile({ session }) {
  const { lang, changeLang } = useLang()
  const L = (ja, zh, en) => (lang === 'ja' ? ja : lang === 'zh' ? zh : en)
  const rawTag = useTagResolver()
  const tagLabel = (id, cat) => cleanLabel(rawTag(id, cat))
  const nav = useNavigate()
  const meta = session?.user?.user_metadata || {}
  const [entries, setEntries] = useState(null)
  const [name, setName] = useState(meta.display_name || '')
  const [publicName, setPublicName] = useState(meta.public_name || '')
  const [defaultPublic, setDefaultPublic] = useState(meta.default_public === true)
  const [avatar, setAvatar] = useState(meta.avatar || null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [editing, setEditing] = useState(null) // 'name' | 'publicName'
  const [notice, setNotice] = useState(null)
  const [confirmOut, setConfirmOut] = useState(false)
  // アカウント削除（2026-10-21 本人：30 日後に削除・パスワードで確認）。done = 削除予定日
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletePw, setDeletePw] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleteDone, setDeleteDone] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!session) { nav('/login'); return }
    supabase.from('sake_entries')
      .select('id, rating, is_public, type, region, aroma_tags, taste_tags, tags, status, photo_url, brand, name')
      .eq('user_id', session.user.id)
      .then(({ data }) => setEntries(data || []))
  }, [session?.user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(() => {
    const all = entries || []
    const done = all.filter(e => e.status !== 'draft')
    const count = list => list.reduce((m, k) => (k ? { ...m, [k]: (m[k] || 0) + 1 } : m), {})
    // Flavour tendency from 4.0+ records when there are enough, otherwise from everything.
    const high = done.filter(e => Number(e.rating) >= 4)
    const pool = high.length >= 3 ? high : done
    const flavours = count(pool.flatMap(e => [...(e.aroma_tags || []).map(t => `a:${t}`), ...(e.taste_tags || []).map(t => `t:${t}`)]))
    const regions = count(done.map(e => normalizeRegion(e.region)))
    return {
      total: done.length,
      shared: done.filter(e => e.is_public).length,
      repeat: done.filter(e => e.tags?.some(t => REPEAT_TAGS.includes(t))).length,
      treasure: done.filter(e => Number(e.rating) >= 4.5).length,
      private: done.filter(e => !e.is_public).length,
      drafts: all.length - done.length,
      flavourBase: pool === high ? 'high' : 'all',
      flavours: Object.entries(flavours).sort((a, b) => b[1] - a[1]).slice(0, 8),
      types: Object.entries(count(done.map(e => normalizeType(e.type) || null))).sort((a, b) => b[1] - a[1]).slice(0, 5),
      regions: Object.entries(regions).sort((a, b) => b[1] - a[1]),
    }
  }, [entries])

  if (!session) return null

  const since = session.user.created_at ? session.user.created_at.slice(0, 7).replace('-', '.') : ''
  const shownName = name || session.user.email.split('@')[0]
  const flash = msg => { setNotice(msg); setTimeout(() => setNotice(null), 2400) }
  const saveMeta = async patch => {
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ data: patch })
    setBusy(false)
    if (error) { flash(L('保存できませんでした', '儲存失敗', 'Could not save')); return false }
    flash(L('保存しました', '已儲存', 'Saved'))
    return true
  }
  const go = view => nav('/journal', { state: { view } })
  const regionCounts = Object.fromEntries(stats.regions)
  const codeToRegion = Object.fromEntries(Object.keys(regionCounts).map(r => [JA_TO_CODE[r], r]))
  const maxType = stats.types[0]?.[1] || 1
  const doExport = async format => {
    try {
      setBusy(true)
      const n = await exportEntries(session.user.id, format, tagLabel)
      flash(L(`${n} 件を書き出しました`, `已匯出 ${n} 筆`, `Exported ${n} records`))
    } catch { flash(L('書き出せませんでした', '匯出失敗', 'Export failed')) } finally { setBusy(false) }
  }
  const signOut = async () => { await supabase.auth.signOut(); nav('/login') }
  const requestDeletion = async e => {
    e.preventDefault()
    setBusy(true); setDeleteError('')
    // Re-check the password first, so an unlocked phone in someone else's hands cannot do this.
    const { error: pwErr } = await supabase.auth.signInWithPassword({ email: session.user.email, password: deletePw })
    if (pwErr) { setBusy(false); setDeleteError(L('パスワードが違います', '密碼不正確', 'That password is not right')); return }
    const { data, error } = await supabase.rpc('request_account_deletion')
    setBusy(false)
    if (error) { setDeleteError(L('申し込めませんでした。時間をおいてもう一度お試しください。', '申請失敗，請稍後再試。', 'Could not request deletion. Please try again later.')); return }
    setDeletePw('')
    setDeleteDone(new Date(data).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replaceAll('/', '.'))
  }

  const numbers = [
    ['repeat', L('また飲みたい', '想再喝', 'Drink again'), stats.repeat, { kind: 'collection', value: 'repeat' }],
    ['treasure', L('4.5以上', '4.5 以上', '4.5+'), stats.treasure, { kind: 'collection', value: 'treasure' }],
    ['private', L('非公開', '不公開', 'Private'), stats.private, { kind: 'private' }],
    ['drafts', L('下書き', '草稿', 'Drafts'), stats.drafts, { kind: 'drafts' }],
  ]

  return (
    <div className="kk-wiki-page">
      <Nav session={session} topbar={false} />
      <div className="kk-wiki kk-profile">
        <header className="kk-ledger__head">
          <h1 className="kk-ledger__title">{L('プロフ', '個人', 'Profile')}</h1>
        </header>

        {/* Who */}
        <section className="kk-pf-card">
          <button type="button" className="kk-pf-card__avatar" onClick={() => setPickerOpen(true)} aria-label={L('アイコンを変える', '更換頭像', 'Change icon')}>
            <img src={avatarSrc(avatar)} alt="" width="64" height="64" />
            <span aria-hidden="true">✎</span>
          </button>
          <div className="kk-pf-card__text">
            <h2>{shownName}</h2>
            <p>{L(`記録 ${stats.total} · 公開中の酒札 ${stats.shared}`, `記錄 ${stats.total} · 公開酒札 ${stats.shared}`, `${stats.total} records · ${stats.shared} public`)}{since && ` · ${since}〜`}</p>
          </div>
        </section>

        <div className="kk-pf-numbers">
          {numbers.map(([k, label, n, view]) => (
            <button key={k} type="button" className="kk-pf-number" onClick={() => go(view)} disabled={!entries}>
              <b>{entries ? n : '…'}</b><span>{label}</span>
            </button>
          ))}
        </div>

        {/* Looking back */}
        {stats.flavours.length > 0 && (
          <>
            <h2 className="kk-wiki__sec">{L('よく選ぶ香り・味', '常選的香氣・味道', 'Aromas & tastes you pick')}<small>{stats.flavourBase === 'high' ? L('4.0以上の記録から', '來自 4.0 以上的記錄', 'from 4.0+ records') : ''}</small></h2>
            <ul className="kk-pf-tags">
              {stats.flavours.map(([key, n]) => {
                const [cat, id] = [key[0] === 'a' ? 'aroma' : 'taste', key.slice(2)]
                return <li key={key} className={`is-${cat}`}>{tagLabel(id, cat)}<span>{n}</span></li>
              })}
            </ul>
          </>
        )}

        {stats.types.length > 0 && (
          <>
            <h2 className="kk-wiki__sec">{L('種類', '種類', 'Types')}</h2>
            <ul className="kk-pf-bars">
              {stats.types.map(([t, n]) => (
                <li key={t}><span>{tagLabel(t, 'type')}</span><i style={{ width: `${(n / maxType) * 100}%` }} /><b>{n}</b></li>
              ))}
            </ul>
          </>
        )}

        {stats.regions.length > 0 && (
          <>
            <h2 className="kk-wiki__sec">{L('飲んだ産地', '喝過的產地', 'Where they came from')}<small>{L(`${stats.regions.length} 県 · タップで産地ページ`, `${stats.regions.length} 縣 · 點選看產地頁`, `${stats.regions.length} prefectures · tap to open`)}</small></h2>
            <div className="kk-pf-map">
              <JapanMap regionCounts={regionCounts} selected={null} onSelect={code => { const r = codeToRegion[code]; if (r) nav(regionPath(r)) }} />
            </div>
            <ul className="kk-shelf">
              {stats.regions.slice(0, 5).map(([r, n]) => (
                <li key={r}>
                  <button type="button" className="kk-shelf__item kk-shelf__item--plain" onClick={() => nav(regionPath(r))}>
                    <span className="kk-shelf__main"><span className="kk-shelf__title">{r}</span></span>
                    <span className="kk-shelf__side">{L(`${n} 件`, `${n} 筆`, n)}<span className="kk-shelf__chev" aria-hidden="true">›</span></span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Settings */}
        <h2 className="kk-wiki__sec">{L('設定', '設定', 'Settings')}</h2>
        <ul className="kk-pf-settings">
          <li>
            <span className="kk-pf-settings__label">{L('表示名', '顯示名稱', 'Display name')}</span>
            {editing === 'name' ? (
              <form className="kk-pf-inline" onSubmit={async e => { e.preventDefault(); if (await saveMeta({ display_name: name.trim() })) setEditing(null) }}>
                <input className="kk-input" value={name} onChange={e => setName(e.target.value)} autoFocus maxLength={40} aria-label={L('表示名', '顯示名稱', 'Display name')} />
                <button type="submit" className="kk-btn kk-btn--sm kk-btn--primary" disabled={busy}>{L('保存', '儲存', 'Save')}</button>
              </form>
            ) : (
              <button type="button" className="kk-pf-settings__value" onClick={() => setEditing('name')}>{shownName} ›</button>
            )}
          </li>
          <li>
            <span className="kk-pf-settings__label">{L('表示言語', '介面語言', 'Language')}</span>
            <div className="kk-seg kk-pf-seg" role="radiogroup" aria-label={L('表示言語', '介面語言', 'Language')}>
              {LANGS.map(([code, label]) => (
                <button key={code} type="button" role="radio" aria-checked={lang === code} className={lang === code ? 'is-active' : ''} onClick={() => changeLang(code)}>{label}</button>
              ))}
            </div>
          </li>
          <li className="kk-pf-settings__group">
            <span className="kk-pf-settings__label">{L('プライバシー', '隱私', 'Privacy')}</span>
            <label className="kk-pf-toggle">
              <span>{L('新しい記録を最初から公開にする', '新記錄預設為公開', 'New records start public')}</span>
              <input type="checkbox" checked={defaultPublic} disabled={busy}
                onChange={async e => { const v = e.target.checked; setDefaultPublic(v); if (!(await saveMeta({ default_public: v }))) setDefaultPublic(!v) }} />
            </label>
            <div className="kk-pf-sub">
              <span>{L('公開するときの名前', '公開時顯示的名字', 'Name on public tags')}</span>
              {editing === 'publicName' ? (
                <form className="kk-pf-inline" onSubmit={async e => { e.preventDefault(); if (await saveMeta({ public_name: publicName.trim() })) setEditing(null) }}>
                  <input className="kk-input" value={publicName} onChange={e => setPublicName(e.target.value)} autoFocus maxLength={40} placeholder={shownName} aria-label={L('公開するときの名前', '公開時顯示的名字', 'Name on public tags')} />
                  <button type="submit" className="kk-btn kk-btn--sm kk-btn--primary" disabled={busy}>{L('保存', '儲存', 'Save')}</button>
                </form>
              ) : (
                <button type="button" className="kk-pf-settings__value" onClick={() => setEditing('publicName')}>{publicName || shownName} ›</button>
              )}
            </div>
            <p className="kk-pf-hint">{L('これから公開する記録に使われます。公開済みの酒札は変わりません。', '之後公開的記錄會使用這個名字，已公開的酒札不會改變。', 'Used for records you share from now on; existing public tags keep their name.')}</p>
          </li>
          <li>
            <span className="kk-pf-settings__label">{L('データを書き出す', '匯出資料', 'Export')}</span>
            <div className="kk-pf-actions">
              <button type="button" className="kk-btn kk-btn--sm" disabled={busy} onClick={() => doExport('csv')}>CSV</button>
              <button type="button" className="kk-btn kk-btn--sm" disabled={busy} onClick={() => doExport('json')}>JSON</button>
            </div>
          </li>
          <li>
            <span className="kk-pf-settings__label">{L('アカウント', '帳戶', 'Account')}</span>
            <span className="kk-pf-settings__muted">{session.user.email}</span>
          </li>
          <li>
            <button type="button" className="kk-pf-signout" onClick={() => setConfirmOut(true)}>{L('ログアウト', '登出', 'Sign out')}</button>
          </li>
          <li>
            <button type="button" className="kk-pf-delete" onClick={() => { setDeleteError(''); setDeleteOpen(true) }}>{L('アカウントを削除', '刪除帳戶', 'Delete account')}</button>
          </li>
        </ul>

        {notice && <p className="kk-pf-notice" role="status">{notice}</p>}
      </div>

      <Sheet open={pickerOpen} onClose={() => setPickerOpen(false)} title={L('アイコンを選ぶ', '選擇頭像', 'Choose an icon')} label={L('アイコンを選ぶ', '選擇頭像', 'Choose an icon')}>
        <ul className="kk-pf-avatars" role="radiogroup" aria-label={L('アイコン', '頭像', 'Icons')}>
          {AVATARS.map(id => (
            <li key={id}>
              <button type="button" role="radio" aria-checked={avatarSrc(avatar) === avatarSrc(id)} disabled={busy}
                onClick={async () => { const prev = avatar; setAvatar(id); setPickerOpen(false); if (!(await saveMeta({ avatar: id }))) setAvatar(prev) }}>
                <img src={avatarSrc(id)} alt="" width="72" height="72" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      </Sheet>

      <Sheet open={deleteOpen} onClose={() => { if (deleteDone) { signOut(); return } setDeleteOpen(false); setDeletePw('') }}
        title={L('アカウントを削除', '刪除帳戶', 'Delete account')} label={L('アカウントを削除', '刪除帳戶', 'Delete account')}>
        {deleteDone ? (
          <div className="kk-pf-delete-sheet">
            <p><strong>{L(`${deleteDone} に削除されます。`, `將於 ${deleteDone} 刪除。`, `Your account will be deleted on ${deleteDone}.`)}</strong></p>
            <p>{L('記録はすべて非公開にしました。それまでにログインすれば、削除を取り消せます。', '所有記錄已設為不公開。在那之前登入就可以取消刪除。', 'All your records are now private. Sign in before then to cancel.')}</p>
            <div className="kk-confirm__actions">
              <button type="button" className="kk-btn kk-btn--primary" data-autofocus onClick={signOut}>{L('ログアウトする', '登出', 'Sign out')}</button>
            </div>
          </div>
        ) : (
          <form className="kk-pf-delete-sheet" onSubmit={requestDeletion}>
            <p>{L('申し込みから 30 日後に、次のものがすべて削除されます。', '申請 30 天後，以下內容將全部刪除。', 'Thirty days after you ask, all of this is deleted:')}</p>
            <ul>
              <li>{L(`記録 ${(entries || []).length} 件（下書きを含む）`, `記錄 ${(entries || []).length} 筆（含草稿）`, `${(entries || []).length} records (drafts included)`)}</li>
              <li>{L(`うち公開中の ${stats.shared} 件は、すぐに広場から外れます`, `其中公開中的 ${stats.shared} 筆會立即從廣場移除`, `${stats.shared} shared records leave Discover right away`)}</li>
              <li>{L('ラベルの写真、飲みたいリスト、プロフの設定', '酒標照片、想喝清單、個人設定', 'Label photos, your want-to-try list and settings')}</li>
            </ul>
            <p className="kk-pf-hint">{L('事典に加わったお酒の情報は残ります（誰が加えたかは残りません）。30 日以内にログインすれば取り消せます。', '加入事典的酒款資料會保留（不會留下是誰加的）。30 天內登入就可以取消。', 'Sake you added to the wiki stays (without your name). Sign in within 30 days to cancel.')}</p>
            <div className="kk-pf-actions kk-pf-delete-sheet__export">
              <span>{L('先に書き出しておく', '先匯出備份', 'Export first')}</span>
              <button type="button" className="kk-btn kk-btn--sm" disabled={busy} onClick={() => doExport('csv')}>CSV</button>
              <button type="button" className="kk-btn kk-btn--sm" disabled={busy} onClick={() => doExport('json')}>JSON</button>
            </div>
            <div className="kk-field">
              <label className="kk-field__label" htmlFor="kk-delete-pw">{L('確認のためパスワードを入力', '請輸入密碼確認', 'Enter your password to confirm')}</label>
              <input id="kk-delete-pw" className="kk-input" type="password" autoComplete="current-password" value={deletePw}
                onChange={e => setDeletePw(e.target.value)} aria-invalid={!!deleteError || undefined} aria-describedby={deleteError ? 'kk-delete-error' : undefined} />
              {deleteError && <p className="kk-field-error" id="kk-delete-error" role="alert">{deleteError}</p>}
            </div>
            <div className="kk-confirm__actions">
              <button type="button" className="kk-btn" data-autofocus onClick={() => { setDeleteOpen(false); setDeletePw('') }}>{L('やめる', '取消', 'Cancel')}</button>
              <button type="submit" className="kk-btn kk-btn--danger" disabled={busy || !deletePw}>{L('削除を申し込む', '申請刪除', 'Request deletion')}</button>
            </div>
          </form>
        )}
      </Sheet>

      <Sheet open={confirmOut} onClose={() => setConfirmOut(false)} variant="dialog" label={L('ログアウトしますか？', '要登出嗎？', 'Sign out?')}>
        <h2 className="kk-confirm__title">{L('ログアウトしますか？', '要登出嗎？', 'Sign out?')}</h2>
        <p className="kk-confirm__note">{L('記録はそのまま残ります。', '記錄會保留。', 'Your records stay as they are.')}</p>
        <div className="kk-confirm__actions">
          <button type="button" className="kk-btn" data-autofocus onClick={() => setConfirmOut(false)}>{L('キャンセル', '取消', 'Cancel')}</button>
          <button type="button" className="kk-btn kk-btn--primary" onClick={signOut}>{L('ログアウト', '登出', 'Sign out')}</button>
        </div>
      </Sheet>
    </div>
  )
}
