import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { toJP } from '../lib/cjkNormalize'

const dropStyle = {
  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 10, boxShadow: '0 4px 16px rgba(26,22,20,.12)',
  marginTop: 4, overflow: 'hidden',
}

// Product search result dropdown (objects with name + subtitle)
function ProductDropdown({ items, onSelect, inputRef }) {
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
        <div key={item.id ?? i}
          style={{ padding: '9px 13px', cursor: 'pointer', background: i === hover ? 'var(--accent-bg)' : 'transparent', borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none' }}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(-1)}
          onMouseDown={e => { e.preventDefault(); onSelect(item) }}>
          <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{item.name}</div>
          {(item.brewery_name || item.region) && (
            <div style={{ fontSize: 11, color: 'var(--sub)', marginTop: 2 }}>
              {[item.brewery_name, item.region].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// Generic autocomplete hook.
// searchColumns: extra columns to also match against (e.g., name_zh, name_en,
// furigana, romaji). Results always return the display `column` value.
function useAutocomplete(table, column, query, enabled = true, searchColumns = []) {
  const [results, setResults] = useState([])
  useEffect(() => {
    if (!enabled || !query || query.length < 1) { setResults([]); return }
    const t = setTimeout(async () => {
      const jp = toJP(query)
      const cols = [column, ...searchColumns]
      const filterParts = cols.flatMap(c =>
        jp !== query
          ? [`${c}.ilike.%${query}%`, `${c}.ilike.%${jp}%`]
          : [`${c}.ilike.%${query}%`]
      )
      const { data } = await supabase
        .from(table).select(column)
        .or(filterParts.join(','))
        .limit(8)
      setResults((data || []).map(r => r[column]))
    }, 120)
    return () => clearTimeout(t)
  }, [query, enabled])
  return results
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
  const results = useAutocomplete('sake_breweries', 'name', value, open, ['name_zh', 'name_en', 'furigana', 'romaji'])

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
  const results = useAutocomplete('sake_brands', 'name', value, open, ['name_zh', 'name_en', 'furigana', 'romaji'])

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

// Product autocomplete — searches sake_products, falls back to sake_brands
// onProductFill receives the full product object when selected from sake_products
export function ProductInput({ value, onChange, onProductFill, onBreweryFill, onRegionFill, onBlur, style, placeholder }) {
  const [open, setOpen] = useState(false)
  const [products, setProducts] = useState([])
  const [brands, setBrands] = useState([])
  const [goldBrands, setGoldBrands] = useState(new Set())
  const [hover, setHover] = useState(-1)
  const inputRef = useRef()
  const timerRef = useRef()

  // All items in order: products first, then brand-only fallbacks
  const allItems = [
    ...products.map(p => ({ kind: 'product', data: p })),
    ...brands.map(b => ({ kind: 'brand', data: b })),
  ]

  useEffect(() => { setHover(-1) }, [products, brands])

  useEffect(() => {
    if (!open || !value || value.length < 1) { setProducts([]); setBrands([]); setGoldBrands(new Set()); return }
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      const jp = toJP(value)
      // Pass converted query to edge function so it searches Japanese kanji form
      const { data: pd } = await supabase.functions.invoke('search-products', { body: { query: jp } })
      const productList = Array.isArray(pd) ? pd : []
      setProducts(productList)
      // Brand fallback: search both original and converted
      const brandFilter = jp !== value
        ? `name.ilike.%${value}%,name.ilike.%${jp}%`
        : `name.ilike.%${value}%`
      const { data: bd } = await supabase
        .from('sake_brands').select('name').or(brandFilter).limit(6)
      const productNames = new Set(productList.map(p => p.name))
      setBrands((bd || []).map(r => r.name).filter(n => !productNames.has(n)))
      // Gold award lookup — search both forms
      const awardFilter = jp !== value
        ? `brand_name.ilike.%${value}%,brand_name.ilike.%${jp}%`
        : `brand_name.ilike.%${value}%`
      const { data: ad } = await supabase
        .from('sake_awards')
        .select('brand_name')
        .or(awardFilter)
        .eq('is_gold', true)
        .gte('year', 2019)
        .limit(20)
      setGoldBrands(new Set((ad || []).map(a => a.brand_name)))
    }, 150)
    return () => clearTimeout(timerRef.current)
  }, [value, open])

  // Keyboard navigation
  useEffect(() => {
    const el = inputRef.current
    if (!el || !allItems.length) return
    const onKey = e => {
      if (!open) return
      if (e.key === 'ArrowDown') { e.preventDefault(); setHover(h => Math.min(h + 1, allItems.length - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setHover(h => Math.max(h - 1, 0)) }
      if (e.key === 'Enter' && hover >= 0) { e.preventDefault(); selectItem(allItems[hover]) }
      if (e.key === 'Escape') { setOpen(false) }
    }
    el.addEventListener('keydown', onKey)
    return () => el.removeEventListener('keydown', onKey)
  }, [open, allItems, hover])

  const selectItem = (item) => {
    if (item.kind === 'product') selectProduct(item.data)
    else selectBrand(item.data)
  }

  const selectProduct = (p) => {
    onChange(p.name)
    setOpen(false); setProducts([]); setBrands([])
    onProductFill?.({
      brewery:  p.brewery_name,
      region:   p.region,
      type:     p.type,
      rice:     p.rice,
      yeast:    p.yeast,
      polishing: p.polishing != null ? String(p.polishing) : '',
      alcohol:   p.alcohol   != null ? String(p.alcohol)   : '',
      smv:       p.smv ?? '',
      acidity:   p.acidity   != null ? String(p.acidity)   : '',
    })
  }

  const selectBrand = async (name) => {
    onChange(name)
    setOpen(false); setProducts([]); setBrands([])
    const { data } = await supabase
      .from('sake_brands').select('sake_breweries(name, sake_areas(name))')
      .eq('name', name).limit(1)
    const brewery = data?.[0]?.sake_breweries
    if (brewery?.name) {
      onBreweryFill?.(brewery.name)
      if (brewery.sake_areas?.name) onRegionFill?.(brewery.sake_areas.name)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <input ref={inputRef} style={style} value={value} placeholder={placeholder}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => { setTimeout(() => setOpen(false), 150); onBlur?.() }} />
      {open && allItems.length > 0 && (
        <div style={dropStyle}>
          {allItems.map((item, i) => {
            const isProduct = item.kind === 'product'
            const p = item.data
            const showDivider = !isProduct && i > 0 && allItems[i - 1].kind === 'product'
            const isGold = isProduct && [...goldBrands].some(b => p.name.startsWith(b) || b.startsWith(p.name.split(' ')[0]))
            return (
              <div key={isProduct ? p.id : `b-${p}`}>
                {showDivider && <div style={{ borderTop: '1px solid var(--border)' }} />}
                <div
                  style={{ padding: '9px 13px', cursor: 'pointer', background: i === hover ? 'var(--accent-bg)' : 'transparent', borderBottom: i < allItems.length - 1 && !showDivider ? '1px solid var(--border)' : 'none' }}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(-1)}
                  onMouseDown={e => { e.preventDefault(); selectItem(item) }}>
                  {isProduct ? (
                    <>
                      <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
                        {p.name}
                        {isGold && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 8, background: 'rgba(180,140,0,.12)', color: '#8A6C00', border: '1px solid rgba(180,140,0,.25)', flexShrink: 0 }}>★ 金賞</span>}
                      </div>
                      {(p.brewery_name || p.region) && (
                        <div style={{ fontSize: 11, color: 'var(--sub)', marginTop: 2 }}>
                          {[p.brewery_name, p.region].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ fontSize: 13, color: 'var(--sub)' }}>{p}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Name (品名) autocomplete — searches sake_products with brand prefix, strips brand on select
export function NameInput({ value, onChange, brand, onBrandFill, onProductFill, onBreweryFill, onRegionFill, onNoResults, style, placeholder }) {
  const [open, setOpen] = useState(false)
  const [products, setProducts] = useState([])
  const [goldBrands, setGoldBrands] = useState(new Set())
  const [hover, setHover] = useState(-1)
  const inputRef = useRef()
  const timerRef = useRef()
  const hasResultsRef = useRef(true)

  useEffect(() => { setHover(-1) }, [products])

  useEffect(() => {
    const query = [brand, value].filter(Boolean).join(' ')
    if (!open || !query || query.length < 1) { setProducts([]); setGoldBrands(new Set()); return }
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      const jp = toJP(query)
      const { data: pd } = await supabase.functions.invoke('search-products', { body: { query: jp } })
      const productList = Array.isArray(pd) ? pd : []
      setProducts(productList)
      hasResultsRef.current = productList.length > 0
      const awardFilter = jp !== query ? `brand_name.ilike.%${query}%,brand_name.ilike.%${jp}%` : `brand_name.ilike.%${query}%`
      const { data: ad } = await supabase.from('sake_awards').select('brand_name').or(awardFilter).eq('is_gold', true).gte('year', 2019).limit(20)
      setGoldBrands(new Set((ad || []).map(a => a.brand_name)))
    }, 150)
    return () => clearTimeout(timerRef.current)
  }, [value, brand, open])

  useEffect(() => {
    const el = inputRef.current
    if (!el || !products.length) return
    const onKey = e => {
      if (!open) return
      if (e.key === 'ArrowDown') { e.preventDefault(); setHover(h => Math.min(h + 1, products.length - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setHover(h => Math.max(h - 1, 0)) }
      if (e.key === 'Enter' && hover >= 0) { e.preventDefault(); selectProduct(products[hover]) }
      if (e.key === 'Escape') { setOpen(false) }
    }
    el.addEventListener('keydown', onKey)
    return () => el.removeEventListener('keydown', onKey)
  }, [open, products, hover])

  const selectProduct = async (p) => {
    setOpen(false); setProducts([])
    // Strip brand prefix to get pure product name
    let pureName = p.name
    let resolvedBrand = brand
    if (brand && p.name.startsWith(brand)) {
      pureName = p.name.slice(brand.length).trim()
    } else if (!brand) {
      // Find brand prefix from sake_brands
      const { data } = await supabase.from('sake_brands').select('name').ilike('name', `${p.name.slice(0, 1)}%`).limit(50)
      const match = (data || []).filter(b => p.name.startsWith(b.name)).sort((a, b) => b.name.length - a.name.length)[0]
      if (match) {
        resolvedBrand = match.name
        pureName = p.name.slice(match.name.length).trim()
        onBrandFill?.(match.name)
      }
    }
    onChange(pureName || p.name)
    onProductFill?.({
      brewery:  p.brewery_name,
      region:   p.region,
      type:     p.type,
      rice:     p.rice,
      yeast:    p.yeast,
      polishing: p.polishing != null ? String(p.polishing) : '',
      alcohol:   p.alcohol   != null ? String(p.alcohol)   : '',
      smv:       p.smv ?? '',
      acidity:   p.acidity   != null ? String(p.acidity)   : '',
    })
  }

  return (
    <div style={{ position: 'relative' }}>
      <input ref={inputRef} style={style} value={value} placeholder={placeholder}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setTimeout(() => setOpen(false), 150)
          if (brand && value && !hasResultsRef.current) onNoResults?.()
        }} />
      {open && products.length > 0 && (
        <div style={dropStyle}>
          {products.map((p, i) => {
            const displayName = brand && p.name.startsWith(brand) ? p.name.slice(brand.length).trim() : p.name
            const isGold = [...goldBrands].some(b => p.name.startsWith(b) || b.startsWith(p.name.split(' ')[0]))
            return (
              <div key={p.id}
                style={{ padding: '9px 13px', cursor: 'pointer', background: i === hover ? 'var(--accent-bg)' : 'transparent', borderBottom: i < products.length - 1 ? '1px solid var(--border)' : 'none' }}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(-1)}
                onMouseDown={e => { e.preventDefault(); selectProduct(p) }}>
                <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
                  {displayName}
                  {isGold && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 8, background: 'rgba(180,140,0,.12)', color: '#8A6C00', border: '1px solid rgba(180,140,0,.25)', flexShrink: 0 }}>★ 金賞</span>}
                </div>
                {(p.brewery_name || p.region) && (
                  <div style={{ fontSize: 11, color: 'var(--sub)', marginTop: 2 }}>{[p.brewery_name, p.region].filter(Boolean).join(' · ')}</div>
                )}
              </div>
            )
          })}
        </div>
      )}
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
