import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import LangButton from '../components/LangButton'
import { useLang } from '../contexts/LangContext'
import './sakeDetail.css'
import './login.css'

const RESET_TEXT = {
  title:   { ja: 'パスワードをリセット', zh: '重設密碼',     en: 'Reset your password' },
  lead:    { ja: '登録したメールに、再設定のリンクを送ります。', zh: '我們會寄重設連結到你註冊的信箱。', en: 'We’ll email you a link to set a new password.' },
  btn:     { ja: 'リセットメールを送る', zh: '寄出重設郵件', en: 'Send reset email' },
  sending: { ja: '送信中…',             zh: '寄送中…',      en: 'Sending…' },
  done:    { ja: 'リセットメールを送りました。メールのリンクからパスワードを変更してください。',
             zh: '重設郵件已寄出，請點郵件裡的連結更改密碼。',
             en: 'Check your email for a password reset link.' },
  back:    { ja: 'ログインに戻る',       zh: '返回登入',     en: 'Back to sign in' },
  forgot:  { ja: 'パスワードを忘れた',   zh: '忘記密碼',     en: 'Forgot password?' },
}
const rt = (key, lang) => RESET_TEXT[key]?.[lang] || RESET_TEXT[key]?.en || key

// Supabase's English errors → something a person can act on.
function friendlyError(message, L) {
  const m = (message || '').toLowerCase()
  if (m.includes('invalid login')) return L('メールかパスワードが違います。', '信箱或密碼不正確。', 'Email or password is incorrect.')
  if (m.includes('email not confirmed')) return L('確認メールのリンクを開いてから、ログインしてください。', '請先打開確認郵件裡的連結再登入。', 'Open the link in your confirmation email first.')
  if (m.includes('already registered')) return L('このメールはもう登録されています。ログインしてください。', '這個信箱已經註冊過，請直接登入。', 'This email is already registered — please sign in.')
  if (m.includes('password should be')) return L('パスワードは6文字以上にしてください。', '密碼至少需要 6 個字元。', 'Use at least 6 characters for the password.')
  if (m.includes('rate limit') || m.includes('too many')) return L('しばらく待ってから、もう一度お試しください。', '請稍候再試一次。', 'Please wait a moment and try again.')
  return message
}

/**
 * ログイン (option A, 2026-10-07): one screen — tanuki icon, the line about records starting private,
 * ログイン / 新規登録 switch, then the form. Email + password + invite code (no Google, decision 11).
 */
export default function Login() {
  const { lang, changeLang, t } = useLang()
  const L = (ja, zh, en) => (lang === 'ja' ? ja : lang === 'zh' ? zh : en)
  const [mode, setMode] = useState('signin') // 'signin' | 'signup' | 'reset'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)

  const switchMode = m => { setMode(m); setErr(''); setInviteCode(''); setDone(false) }

  const submit = async e => {
    e.preventDefault(); setErr(''); setLoading(true)
    try {
      if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin + '/login' })
        if (error) throw error
        setDone(true)
      } else if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) throw error
      } else {
        const code = inviteCode.trim().toUpperCase()
        const { data: valid, error: checkErr } = await supabase.rpc('check_invite_code', { invite_code: code })
        if (checkErr) throw checkErr
        if (!valid) { setErr(t('login.inviteError')); return }
        const { error: signUpErr } = await supabase.auth.signUp({ email: email.trim(), password })
        if (signUpErr) throw signUpErr
        await supabase.rpc('use_invite_code', { invite_code: code })
        setDone(true)
      }
    } catch (e2) { setErr(friendlyError(e2.message, L)) } finally { setLoading(false) }
  }

  const tabs = [['signin', L('ログイン', '登入', 'Sign in')], ['signup', L('新規登録', '註冊', 'Sign up')]]

  return (
    <div className="kk-login">
      <header className="kk-login__top">
        <span className="kk-login__name">Kikiroku</span>
        <LangButton lang={lang} onChange={changeLang} label={L('表示言語', '介面語言', 'Language')} />
      </header>

      <main className="kk-login__body">
        <img className="kk-login__icon" src="/icon-512.png" alt="" width="96" height="96" />
        {mode === 'reset' ? (
          <>
            <h1>{rt('title', lang)}</h1>
            <p className="kk-login__lead">{rt('lead', lang)}</p>
          </>
        ) : (
          <>
            <h1>{L('あなたの酒札棚をはじめる', '開始你的酒札櫃', 'Start your shelf of sake tags')}</h1>
            <p className="kk-login__lead">
              <span>{L('記録は最初から非公開。', '記錄一開始都是不公開的。', 'Records start private.')}</span>
              <span>{L('公開したい酒札だけ、あとで廣場へ。', '想分享的酒札，之後再放到廣場。', 'Share only the tags you want, later.')}</span>
            </p>
          </>
        )}

        {done ? (
          <div className="kk-login__done" role="status">
            <p>{mode === 'reset' ? rt('done', lang) : t('login.checkEmail')}</p>
            <button type="button" className="kk-btn kk-btn--block" onClick={() => switchMode('signin')}>{rt('back', lang)}</button>
          </div>
        ) : (
          <>
            {mode !== 'reset' && (
              <div className="kk-seg kk-login__tabs" role="tablist" aria-label={L('ログインか新規登録', '登入或註冊', 'Sign in or sign up')}>
                {tabs.map(([k, label]) => (
                  <button key={k} type="button" role="tab" aria-selected={mode === k} className={mode === k ? 'is-active' : ''} onClick={() => switchMode(k)}>{label}</button>
                ))}
              </div>
            )}

            <form className="kk-login__form" onSubmit={submit} noValidate={false}>
              {err && <p className="kk-login__err" role="alert">{err}</p>}
              <label className="kk-login__field">
                <span>{L('メール', '信箱', 'Email')}</span>
                <input className="kk-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" inputMode="email" placeholder="you@example.com" />
              </label>
              {mode !== 'reset' && (
                <label className="kk-login__field">
                  <span>{L('パスワード', '密碼', 'Password')}</span>
                  <input className="kk-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} placeholder={mode === 'signup' ? L('6文字以上', '至少 6 個字元', '6+ characters') : ''} />
                </label>
              )}
              {mode === 'signup' && (
                <label className="kk-login__field">
                  <span>{L('招待コード', '邀請碼', 'Invite code')}</span>
                  <input className="kk-input kk-login__code" type="text" value={inviteCode} onChange={e => setInviteCode(e.target.value)}
                    placeholder="XXXX-0000" required autoComplete="off" autoCapitalize="characters" spellCheck={false} />
                  <small>{t('login.inviteHint')}</small>
                </label>
              )}
              <button className="kk-btn kk-btn--primary kk-btn--block" type="submit" disabled={loading}>
                {mode === 'reset' ? (loading ? rt('sending', lang) : rt('btn', lang))
                  : mode === 'signin' ? (loading ? t('login.signingIn') : L('ログイン', '登入', 'Sign in'))
                    : (loading ? t('login.checking') : L('登録する', '註冊', 'Create account'))}
              </button>
              {mode === 'signup' && (
                <p className="kk-login__small">
                  {L('登録すると', '註冊即表示同意', 'By signing up you agree to the ')}
                  <a href="/terms" target="_blank" rel="noopener noreferrer">{L('利用規約', '服務條款', 'Terms of Service')}</a>
                  {L('に同意したことになります。', '。', '.')}
                </p>
              )}
            </form>

            {mode === 'signin' && <button type="button" className="kk-login__link" onClick={() => switchMode('reset')}>{rt('forgot', lang)}</button>}
            {mode === 'reset' && <button type="button" className="kk-login__link" onClick={() => switchMode('signin')}>{rt('back', lang)}</button>}
          </>
        )}

        <Link className="kk-login__link kk-login__browse" to="/">{L('ログインせずに廣場を見る', '先不登入，逛逛廣場', 'Browse Discover without signing in')} ›</Link>
      </main>
    </div>
  )
}
