import { useState } from 'react'
import { supabase } from '../lib/supabase'
import BrandMark from '../components/BrandMark'
import { useLang } from '../contexts/LangContext'

const s = {
  page: { minHeight: '100svh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg)' },
  card: { background: 'var(--surface)', borderRadius: 20, padding: '36px 32px', width: '100%', maxWidth: 380, boxShadow: '0 4px 32px rgba(26,22,20,.08)' },
  brand: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 32 },
  logo: { fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.05em', textAlign: 'center' },
  logoEm: { fontStyle: 'normal', color: 'var(--text)' },
  logoSub: { fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--sub)', letterSpacing: '0.14em', marginTop: 2 },
  langRow: { display: 'flex', justifyContent: 'center', marginBottom: 24 },
  langSelect: {
    padding: '6px 32px 6px 14px', borderRadius: 20, border: '1px solid var(--border)',
    background: `var(--surface) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='rgba(180,210,245,0.45)'/%3E%3C/svg%3E") no-repeat right 12px center`,
    color: 'var(--sub)', fontSize: 13, outline: 'none', appearance: 'none', cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 12, color: 'var(--sub)', marginBottom: 6, letterSpacing: '0.04em' },
  input: { width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 15, outline: 'none', boxSizing: 'border-box' },
  inviteInput: { width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid var(--accent)', background: 'var(--accent-bg)', color: 'var(--text)', fontSize: 15, outline: 'none', boxSizing: 'border-box', letterSpacing: '0.08em', fontFamily: 'monospace' },
  btn: { width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 15, fontWeight: 500, cursor: 'pointer', marginTop: 8 },
  toggle: { textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--sub)' },
  toggleLink: { color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' },
  err: { color: '#C0392B', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  hint: { fontSize: 11, color: 'var(--sub)', marginTop: 6, textAlign: 'center' },
}

const LANG_LABELS = [{ code: 'ja', label: '日本語' }, { code: 'zh', label: '中文' }, { code: 'en', label: 'English' }]

const RESET_TEXT = {
  title:   { ja: 'パスワードをリセット', zh: '重置密碼',     en: 'Reset Password' },
  btn:     { ja: 'リセットメールを送信', zh: '發送重置郵件', en: 'Send Reset Email' },
  sending: { ja: '送信中…',             zh: '發送中…',      en: 'Sending…' },
  done:    { ja: 'リセットメールを送りました。\nメールのリンクからパスワードを変更してください。',
             zh: '重置郵件已發送。\n請點擊郵件中的連結重置密碼。',
             en: 'Check your email for a password reset link.' },
  back:    { ja: 'ログインに戻る',       zh: '返回登錄',     en: 'Back to sign in' },
  forgot:  { ja: 'パスワードをお忘れですか？', zh: '忘記密碼？', en: 'Forgot password?' },
}
const rt = (key, lang) => RESET_TEXT[key]?.[lang] || RESET_TEXT[key]?.en || key

export default function Login() {
  const { lang, changeLang, t } = useLang()
  const [mode, setMode] = useState('signin')
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
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin + '/login',
        })
        if (error) throw error
        setDone(true)
      } else if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const code = inviteCode.trim().toUpperCase()
        const { data: valid, error: checkErr } = await supabase.rpc('check_invite_code', { invite_code: code })
        if (checkErr) throw checkErr
        if (!valid) { setErr(t('login.inviteError')); return }
        const { error: signUpErr } = await supabase.auth.signUp({ email, password })
        if (signUpErr) throw signUpErr
        await supabase.rpc('use_invite_code', { invite_code: code })
        setDone(true)
      }
    } catch (e) { setErr(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.brand}>
          <BrandMark size={44} />
          <div>
            <div style={s.logo}>酒<em style={s.logoEm}>記</em>録</div>
            <div style={s.logoSub}>Kikiroku</div>
          </div>
        </div>

        {/* Language selector */}
        <div style={s.langRow}>
          <select style={s.langSelect} value={lang} onChange={e => changeLang(e.target.value)}>
            {LANG_LABELS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>

        {mode === 'reset' && done ? (
          <>
            <p style={{ textAlign: 'center', color: 'var(--sub)', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-line' }}>
              {rt('done', lang)}
            </p>
            <p style={s.toggle}>
              <span style={s.toggleLink} onClick={() => switchMode('signin')}>{rt('back', lang)}</span>
            </p>
          </>
        ) : mode === 'reset' ? (
          <>
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 20, textAlign: 'center' }}>
              {rt('title', lang)}
            </p>
            <form onSubmit={submit}>
              {err && <p style={s.err}>{err}</p>}
              <div style={s.field}>
                <label style={s.label}>{t('login.email')}</label>
                <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
              </div>
              <button style={s.btn} type="submit" disabled={loading}>
                {loading ? rt('sending', lang) : rt('btn', lang)}
              </button>
            </form>
            <p style={s.toggle}>
              <span style={s.toggleLink} onClick={() => switchMode('signin')}>{rt('back', lang)}</span>
            </p>
          </>
        ) : (
          <>
            {done ? (
              <p style={{ textAlign: 'center', color: 'var(--sub)', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                {t('login.checkEmail')}
              </p>
            ) : (
              <form onSubmit={submit}>
                {err && <p style={s.err}>{err}</p>}
                <div style={s.field}>
                  <label style={s.label}>{t('login.email')}</label>
                  <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
                </div>
                <div style={s.field}>
                  <label style={s.label}>{t('login.password')}</label>
                  <input style={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} />
                </div>
                {mode === 'signup' && (
                  <div style={s.field}>
                    <label style={s.label}>{t('login.invite')}</label>
                    <input style={s.inviteInput} type="text" value={inviteCode}
                      onChange={e => setInviteCode(e.target.value)}
                      placeholder="XXXX-0000" required autoComplete="off"
                      autoCapitalize="characters" spellCheck={false} />
                    <p style={s.hint}>{t('login.inviteHint')}</p>
                  </div>
                )}
                <button style={s.btn} type="submit" disabled={loading}>
                  {loading ? t(mode === 'signin' ? 'login.signingIn' : 'login.checking')
                           : t(mode === 'signin' ? 'login.signin' : 'login.signup')}
                </button>
                {mode === 'signup' && (
                  <p style={{ fontSize: 11, color: 'var(--sub)', textAlign: 'center', marginTop: 10, lineHeight: 1.6 }}>
                    {lang === 'ja' ? '登録により' : lang === 'zh' ? '註冊即表示您同意' : 'By signing up, you agree to our'}{' '}
                    <a href="/terms" target="_blank" rel="noopener noreferrer"
                      style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                      {lang === 'ja' ? '利用規約' : lang === 'zh' ? '服務條款' : 'Terms of Service'}
                    </a>
                    {lang === 'ja' ? 'に同意したものとみなされます。' : lang === 'zh' ? '。' : '.'}
                  </p>
                )}
                {mode === 'signin' && (
                  <p style={{ textAlign: 'center', marginTop: 12, fontSize: 12 }}>
                    <span style={s.toggleLink} onClick={() => switchMode('reset')}>{rt('forgot', lang)}</span>
                  </p>
                )}
              </form>
            )}
            {!done && (
              <p style={s.toggle}>
                {t(mode === 'signin' ? 'login.noAccount' : 'login.hasAccount')}{' '}
                <span style={s.toggleLink} onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}>
                  {t(mode === 'signin' ? 'login.signup' : 'login.signin')}
                </span>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
