import { useEffect, useMemo, useRef, useState } from 'react'
import './TestPackageSearchSelect.css'

/**
 * A search-as-you-type picker over the combined packages + individual
 * tests catalog. Purely a UI widget — the parent owns whatever it does
 * with the pick (store an id, a label, both, etc.) via onSelect.
 */
export default function TestPackageSearchSelect({
  tests = [],
  packages = [],
  onSelect,
  value = '', // controlled display text, e.g. the currently-picked name
  onChangeText, // called as the user types, before anything is picked
  placeholder = 'Search tests or packages…',
}) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => setQuery(value), [value])

  const options = useMemo(
    () => [
      ...packages.map((p) => ({ key: `pkg:${p.id}`, id: p.id, kind: 'package', name: p.name, price: p.price })),
      ...tests.map((t) => ({ key: `test:${t.id}`, id: t.id, kind: 'test', name: t.name, price: t.price })),
    ],
    [tests, packages],
  )

  const q = query.trim().toLowerCase()
  const filtered = q ? options.filter((o) => o.name.toLowerCase().includes(q)) : options

  function handlePick(opt) {
    setQuery(opt.name)
    setOpen(false)
    onSelect?.(opt)
  }

  return (
    <div className="tp-search" ref={wrapRef}>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
          onChangeText?.(e.target.value)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <ul className="tp-search__list">
          {filtered.slice(0, 40).map((opt) => (
            <li key={opt.key} onMouseDown={() => handlePick(opt)}>
              <span className="tp-search__name">{opt.name}</span>
              <span className="tp-search__meta">
                <span className={`tp-search__kind tp-search__kind--${opt.kind}`}>{opt.kind === 'package' ? 'Package' : 'Test'}</span>
                ₹{opt.price}
              </span>
            </li>
          ))}
        </ul>
      )}
      {open && q && filtered.length === 0 && (
        <ul className="tp-search__list">
          <li className="tp-search__empty">No matching tests or packages.</li>
        </ul>
      )}
    </div>
  )
}
