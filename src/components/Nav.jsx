import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import BrandMark from './BrandMark'

const s = {
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 20px', borderBottom: '1px solid var(--border)',
    background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 10,
  },
  brand: { display: 'flex', alignItems: 'center', gap: 10 },
  logo: {
    fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600,
    color: 'var(--accent)', letterSpacing: '0.05em',
  },
  logoEm: { fontStyle: 'normal', color: 'var(--text)' },
  logoSmall: { display: 'block', fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 400, color: 'var(--sub)', letterSpacing: '0.12em', marginTop: 1 },
  links: { display: 'flex', alignItems: 'center', gap: 4 },
  link: { fontSize: 13, padding: '6px 12px', borderRadius: 20, color: 'var(--sub)', transition: 'background .15s' },
  signout: {
    fontSize: 13, padding: '6px 14px', borderRadius: 20,
    background: 'var(--accent-bg)', color: 'var(--accent)', border: 'none',
    cursor: 'pointer',
  },
}

export default function Nav({ session }) {
  const nav = useNavigate()

  const signOut = async () => {
    await supabase.auth.signOut()
    nav('/login')
  }

  return (
    <nav style={s.nav}>
      <Link to="/" style={s.brand}>
        <BrandMark size={30} />
        <div style={s.logo}>
          酒<em style={s.logoEm}>記</em>録
          <small style={s.logoSmall}>Kikiroku</small>
        </div>
      </Link>
      <div style={s.links}>
        {session ? (
          <>
            <Link to="/" style={s.link}>みんなの記録</Link>
            <Link to="/journal" style={s.link}>マイ帳</Link>
            <button style={s.signout} onClick={signOut}>ログアウト</button>
          </>
        ) : (
          <Link to="/login" style={{ ...s.signout, display: 'inline-block' }}>ログイン</Link>
        )}
      </div>
    </nav>
  )
}
