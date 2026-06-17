import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { applyTheme, getTheme } from './lib/theme'
import { LangProvider } from './contexts/LangContext'
import { WikiProvider } from './contexts/WikiContext'
import Login from './pages/Login'
import Journal from './pages/Journal'
import Display from './pages/Display'
import Wiki from './pages/Wiki'
import Profile from './pages/Profile'
import EntryDetail from './pages/EntryDetail'
import Terms from './pages/Terms'

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    applyTheme(getTheme())
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
        <Route path="/entry/:id" element={<EntryDetail session={session} />} />
        <Route path="/" element={<Display session={session} />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </WikiProvider>
    </LangProvider>
  )
}
