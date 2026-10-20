import { useEffect, useState, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { initTheme } from './lib/theme'
import { LangProvider } from './contexts/LangContext'
import { TagsProvider } from './contexts/TagsContext'
import { WikiProvider } from './contexts/WikiContext'
import ScrollMemory from './components/ScrollMemory'
// Eager: initial landing (Plaza) + Login (tiny)
import Login from './pages/Login'
import Plaza from './pages/plaza/Plaza'
// Lazy: heavy or rarely-hit routes
const Journal = lazy(() => import('./pages/Journal'))
const Wiki = lazy(() => import('./pages/Wiki'))
const Profile = lazy(() => import('./pages/Profile'))
const SakeDetail = lazy(() => import('./pages/SakeDetail'))
const ProductDetail = lazy(() => import('./pages/wiki/ProductDetail'))
const BreweryDetail = lazy(() => import('./pages/wiki/BreweryDetail'))
const RegionPage = lazy(() => import('./pages/wiki/RegionPage'))
const Wishlist = lazy(() => import('./pages/wishlist/Wishlist'))
const Terms = lazy(() => import('./pages/Terms'))
const DeletionPending = lazy(() => import('./pages/DeletionPending'))

const EntryRedirect = () => { const { id } = useParams(); return <Navigate to={`/journal/${id}`} replace /> }

// Neutral loading fallback — avoids flash of theme-inconsistent background.
const RouteFallback = () => (
  <div style={{ minHeight: '100svh', background: 'var(--bg)' }} />
)

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    initTheme()
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  // An account waiting to be deleted (プロフ › アカウントを削除, 30 days) only sees the cancel screen.
  // undefined = still checking; a missing table (SQL not run yet) counts as "not pending".
  const uid = session?.user?.id
  const [pending, setPending] = useState(undefined)
  const [checkedFor, setCheckedFor] = useState(null)
  useEffect(() => {
    if (!uid) return
    supabase.from('account_deletions').select('purge_after').eq('user_id', uid).maybeSingle()
      .then(({ data }) => { setPending(data?.purge_after || null); setCheckedFor(uid) })
  }, [uid])

  if (session === undefined) return null
  if (uid && checkedFor !== uid) return null

  return (
    <LangProvider>
    <TagsProvider>
    <WikiProvider>
      <ScrollMemory />
      <Suspense fallback={<RouteFallback />}>
        {uid && pending ? <DeletionPending purgeAfter={pending} onCancelled={() => setPending(null)} /> : (
        <Routes>
          <Route path="/login" element={session ? <Navigate to="/journal" replace /> : <Login />} />
          <Route path="/journal" element={session ? <Journal session={session} /> : <Navigate to="/login" replace />} />
          <Route path="/wishlist" element={session ? <Wishlist session={session} /> : <Navigate to="/login" replace />} />
          <Route path="/journal/:id" element={<SakeDetail session={session} />} />
          <Route path="/wiki" element={<Wiki session={session} />} />
          <Route path="/wiki/sake/recorded" element={<ProductDetail session={session} recorded />} />
          <Route path="/wiki/sake/:id" element={<ProductDetail session={session} />} />
          <Route path="/wiki/brewery/:id" element={<BreweryDetail session={session} />} />
          <Route path="/region/:name" element={<RegionPage session={session} />} />
          <Route path="/profile" element={session ? <Profile session={session} /> : <Navigate to="/login" replace />} />
          {/* Old share links (/entry/:id) now open the redesigned 酒詳情, which also serves guests. */}
          <Route path="/entry/:id" element={<EntryRedirect />} />
          <Route path="/" element={<Plaza session={session} />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        )}
      </Suspense>
    </WikiProvider>
    </TagsProvider>
    </LangProvider>
  )
}
