import { useEffect, useState, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { applyTheme, getTheme } from './lib/theme'
import { LangProvider } from './contexts/LangContext'
import { TagsProvider } from './contexts/TagsContext'
import { WikiProvider } from './contexts/WikiContext'
// Eager: initial landing (Display) + Login (tiny)
import Login from './pages/Login'
import Display from './pages/Display'
// Lazy: heavy or rarely-hit routes
const Journal = lazy(() => import('./pages/Journal'))
const Wiki = lazy(() => import('./pages/Wiki'))
const Profile = lazy(() => import('./pages/Profile'))
const EntryDetail = lazy(() => import('./pages/EntryDetail'))
const Terms = lazy(() => import('./pages/Terms'))

// Neutral loading fallback — avoids flash of theme-inconsistent background.
const RouteFallback = () => (
  <div style={{ minHeight: '100svh', background: 'var(--bg)' }} />
)

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
    <TagsProvider>
    <WikiProvider>
      <Suspense fallback={<RouteFallback />}>
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
      </Suspense>
    </WikiProvider>
    </TagsProvider>
    </LangProvider>
  )
}
