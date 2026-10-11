import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

// Scroll positions per history entry, kept for the tab's lifetime (survives a reload of the same tab).
const KEY = 'kk-scroll'
const read = () => { try { return JSON.parse(sessionStorage.getItem(KEY)) || {} } catch { return {} } }
const write = map => { try { sessionStorage.setItem(KEY, JSON.stringify(map)) } catch { /* private mode */ } }

/**
 * Back / forward returns to where you were (e.g. マイ帳 → 酒詳情 → back lands on the same row).
 * Lists load their rows asynchronously, so the restore retries until the page is tall enough
 * or ~2s pass. A new page (PUSH / REPLACE to another path) starts at the top.
 *
 * The entry a scroll belongs to is read from a ref that switches during the navigation commit,
 * so the page swap's own scroll events (jump to top, height clamp) never overwrite the old entry.
 */
export default function ScrollMemory() {
  const location = useLocation()
  const navType = useNavigationType()
  const positions = useRef(read())
  const currentKey = useRef(location.key)
  const prevPath = useRef(location.pathname)
  const restoring = useRef(false)

  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
    const map = positions.current
    let timer = 0
    const onScroll = () => {
      if (restoring.current) return
      map[currentKey.current] = window.scrollY
      clearTimeout(timer)
      timer = setTimeout(() => write(map), 200)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); clearTimeout(timer); write(map) }
  }, [])

  useLayoutEffect(() => {
    currentKey.current = location.key
    const samePath = prevPath.current === location.pathname
    prevPath.current = location.pathname
    if (navType !== 'POP') {
      if (!samePath && !location.hash) window.scrollTo(0, 0)
      return
    }
    const target = positions.current[location.key]
    if (!target) return
    const until = Date.now() + 2000
    let raf = 0
    restoring.current = true
    const done = () => { cancelAnimationFrame(raf); restoring.current = false; positions.current[location.key] = window.scrollY }
    const tick = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      window.scrollTo(0, Math.min(target, Math.max(0, max)))
      if (max < target && Date.now() < until) raf = requestAnimationFrame(tick)
      else requestAnimationFrame(done) // let the last programmatic scroll event pass first
    }
    tick()
    // The reader took over — stop pulling the page.
    const stop = () => done()
    window.addEventListener('wheel', stop, { passive: true, once: true })
    window.addEventListener('touchstart', stop, { passive: true, once: true })
    return () => { cancelAnimationFrame(raf); restoring.current = false; window.removeEventListener('wheel', stop); window.removeEventListener('touchstart', stop) }
  }, [location.key]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
