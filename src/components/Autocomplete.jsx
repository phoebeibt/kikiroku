import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

// Generic autocomplete hook
function useAutocomplete(table, column, query, enabled = true) {
  const [results, setResults] = useState([])
  useEffect(() => {
    if (!enabled || !query || query.length < 1) { setResults([]); return }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from(table).select(column)
        .ilike(column, `%${query}%`)
        .limit(8)
      setResults((data || []).map(r => r[column]))
    }, 120)
    return () => clearTimeout(t)
  }, [query, enabled])
  return results
}

// Dropdown list shared style
const dropStyle = {
  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 10, boxShadow: '0 4px 16px rgba(26,22,20,.12)',
  marginTop: 4, overflow: 'hidden',
}
const itemStyle = (hover) => ({
  padding: '10px 13px', fontSize: 14, cursor: 'pointer',
  color: 'var(--text)', background: hover ? 'var(--accent-bg)' : 'transparent',
})

function DropdownList({ items, onSelect, inputRef }) {
  const [hover, setHover] = useState(-1)

  useEffect(() => { setHover(-1) }, [items])

  useEffect(() => {
    const el = inputRef?.current
    if (!el) return
    const onKey = e => {
      if (!items.length) return
      if (e.key === 'ArrowDown') { e.preventDefault(); setHover(h => Math.min(h + 1, items.length - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setHover(h => Math.max(h - 1, 0)) }
      if (e.key === 'Enter' && hover >= 0) { e.preventDefault(); onSelect(items[hover]) }
      if (e.key === 'Escape') onSelect(null)
    }
    el.addEventListener('keydown', onKey)
    return () => el.removeEventListener('keydown', onKey)
  }, [items, hover, onSelect])

  if (!items.length) return null
  return (
    <div style={dropStyle}>
      {items.map((item, i) => (
        <div key={item} style={itemStyle(i === hover)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(-1)}
          onMouseDown={e => { e.preventDefault(); onSelect(item) }}>
          {item}
        </div>
      ))}
    </div>
  )
}

// Brewery autocomplete — also returns the region when selected
export function BreweryInput({ value, onChange, onRegionFill, style, placeholder }) {
  const [open, setOpen] = useState(false)
  const inputRef = useRef()
  const results = useAutocomplete('sake_breweries', 'name', value, open)

  const select = async (name) => {
    if (!name) { setOpen(false); return }
    onChange(name)
    setOpen(false)
    // Auto-fill region
    const { data } = await supabase
      .from('sake_breweries')
      .select('area_id, sake_areas(name)')
      .eq('name', name)
      .limit(1)
    if (data?.[0]?.sake_areas?.name) onRegionFill?.(data[0].sake_areas.name)
  }

  return (
    <div style={{ position: 'relative' }}>
      <input ref={inputRef} style={style} value={value} placeholder={placeholder}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)} />
      {open && <DropdownList items={results} onSelect={select} inputRef={inputRef} />}
    </div>
  )
}

// Brand (銘柄) autocomplete — fills brewery and region on select or blur
export function BrandInput({ value, onChange, onBreweryFill, onRegionFill, onBlur, style, placeholder }) {
  const [open, setOpen] = useState(false)
  const inputRef = useRef()
  const results = useAutocomplete('sake_brands', 'name', value, open)

  const fillBrewery = async (brandName) => {
    if (!onBreweryFill || !brandName) return
    const { data } = await supabase
      .from('sake_brands')
      .select('sake_breweries(name, sake_areas(name))')
      .eq('name', brandName)
      .limit(1)
    const brewery = data?.[0]?.sake_breweries
    if (brewery?.name) {
      onBreweryFill(brewery.name)
      if (brewery.sake_areas?.name) onRegionFill?.(brewery.sake_areas.name)
    }
  }

  const select = async (name) => {
    if (!name) { setOpen(false); return }
    onChange(name)
    setOpen(false)
    await fillBrewery(name)
  }

  const handleBlur = () => {
    setTimeout(() => setOpen(false), 150)
    onBlur?.()
  }

  return (
    <div style={{ position: 'relative' }}>
      <input ref={inputRef} style={style} value={value} placeholder={placeholder}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur} />
      {open && <DropdownList items={results} onSelect={select} inputRef={inputRef} />}
    </div>
  )
}

// Rice autocomplete
export function RiceInput({ value, onChange, style, placeholder }) {
  const [open, setOpen] = useState(false)
  const inputRef = useRef()
  const results = useAutocomplete('sake_rice', 'name', value, open)

  const select = (name) => { if (name) onChange(name); setOpen(false) }

  return (
    <div style={{ position: 'relative' }}>
      <input ref={inputRef} style={style} value={value} placeholder={placeholder}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)} />
      {open && <DropdownList items={results} onSelect={select} inputRef={inputRef} />}
    </div>
  )
}
