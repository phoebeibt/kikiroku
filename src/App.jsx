import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { LangProvider } from './contexts/LangContext'
import Login from './pages/Login'
import Journal from './pages/Journal'
import Display from './pages/Display'

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
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/journal" replace /> : <Login />} />
        <Route path="/journal" element={session ? <Journal session={session} /> : <Navigate to="/login" replace />} />
        <Route path="/" element={<Display session={session} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </LangProvider>
  )
}
