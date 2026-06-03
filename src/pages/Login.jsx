import { useState } from 'react'
import { supabase } from '../lib/supabase'
import BrandMark from '../components/BrandMark'

const s = {
  page: { minHeight: '100svh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg)' },
  card: { background: 'var(--surface)', borderRadius: 20, padding: '36px 32px', width: '100%', maxWidth: 380, boxShadow: '0 4px 32px rgba(26,22,20,.08)' },
  brand: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 32 },
  logo: { fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.05em', textAlign: 'center' },
  logoEm: { fontStyle: 'normal', color: 'var(--text)' },
  logoSub: { fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--sub)', letterSpacing: '0.14em', marginTop: 2 },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 12, color: 'var(--sub)', marginBottom: 6, letterSpacing: '0.04em' },
  input: {
    width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid var(--border)',
    background: 'var(--bg)', color: 'var(--text)', fontSize: 15, outline: 'none',
  },
  btn: {
    width: '100%', padding: '13px', borderRadius: 12, border: 'none',
    background: 'var(--accent)', color: '#fff', fontSize: 15, fontWeight: 500,
    cursor: 'pointer', marginTop: 8,
  },
  toggle: { textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--sub)' },
  toggleLink: { color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' },
  err: { color: '#C0392B', fontSize: 13, marginBottom: 12, textAlign: 'center' },
}

export default function Login() {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)

  const submit = async e => {
    e.preventDefault()
    setErr('')
    setLoading(true)
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setDone(true)
      }
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
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

        {done ? (
          <p style={{ textAlign: 'center', color: 'var(--sub)', fontSize: 14, lineHeight: 1.7 }}>
            確認メールを送りました。<br />メールのリンクをクリックしてログインしてください。
          </p>
        ) : (
          <form onSubmit={submit}>
            {err && <p style={s.err}>{err}</p>}
            <div style={s.field}>
              <label style={s.label}>メールアドレス</label>
              <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div style={s.field}>
              <label style={s.label}>パスワード</label>
              <input style={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} />
            </div>
            <button style={s.btn} type="submit" disabled={loading}>
              {loading ? '...' : mode === 'signin' ? 'ログイン' : '新規登録'}
            </button>
          </form>
        )}

        {!done && (
          <p style={s.toggle}>
            {mode === 'signin' ? 'アカウントがない？' : 'すでにアカウントをお持ち？'}
            {' '}
            <span style={s.toggleLink} onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setErr('') }}>
              {mode === 'signin' ? '新規登録' : 'ログイン'}
            </span>
          </p>
        )}
      </div>
    </div>
  )
}
