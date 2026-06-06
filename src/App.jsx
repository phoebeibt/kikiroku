import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { LangProvider } from './contexts/LangContext'
import { WikiProvider } from './contexts/WikiContext'
import Login from './pages/Login'
import Journal from './pages/Journal'
import Display from './pages/Display'
import Wiki from './pages/Wiki'
import Profile from './pages/Profile'

function FAB({ session }) {
  const navigate = useNavigate()
  const location = useLocation()
  if (!session) return null

  const handleClick = () => {
    if (location.pathname === '/journal') {
      // Already on journal — trigger via URL param so Journal detects it
      navigate('/journal?new=1')
    } else {
      navigate('/journal?new=1')
    }
  }

  return (
    <button
      onClick={handleClick}
      title="Add entry"
      style={{
        position: 'fixed', bottom: 24, right: 20, zIndex: 50,
        width: 52, height: 52, borderRadius: '50%',
        background: 'var(--accent)', color: '#fff', border: 'none',
        boxShadow: '0 4px 18px rgba(124,58,40,.35)',
        cursor: 'pointer', fontSize: 26, lineHeight: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'transform .15s, box-shadow .15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(124,58,40,.45)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(124,58,40,.35)' }}
    >
      +
    </button>
  )
}

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return null

  return (
    <LangProvider>
    <WikiProvider>
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/journal" replace /> : <Login />} />
        <Route path="/journal" element={session ? <Journal session={session} /> : <Navigate to="/login" replace />} />
        <Route path="/wiki" element={<Wiki session={session} />} />
        <Route path="/profile" element={session ? <Profile session={session} /> : <Navigate to="/login" replace />} />
        <Route path="/" element={<Display session={session} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <FAB session={session} />
    </WikiProvider>
    </LangProvider>
  )
}
