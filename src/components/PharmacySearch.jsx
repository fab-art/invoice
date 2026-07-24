import { useState, useEffect, useRef } from 'react'

export default function PharmacySearch({ pharmacies, onSelect, selected }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = query.trim().length === 0
    ? []
    : pharmacies.filter(p =>
        p.pharmacy_name.toLowerCase().includes(query.toLowerCase()) ||
        p.pharmacy_code.toLowerCase().includes(query.toLowerCase()) ||
        (p.district || '').toLowerCase().includes(query.toLowerCase())
      ).slice(0, 20)

  return (
    <div className="pharmacy-search" ref={wrapRef}>
      <label>Search pharmacy (name, code, or district)</label>
      <input
        type="text"
        value={selected ? `${selected.pharmacy_name} (${selected.pharmacy_code})` : query}
        onChange={e => { setQuery(e.target.value); setOpen(true); onSelect(null) }}
        onFocus={() => setOpen(true)}
        placeholder="Start typing..."
      />
      {open && filtered.length > 0 && (
        <ul className="pharmacy-search-results">
          {filtered.map(p => (
            <li key={p.id} onClick={() => { onSelect(p); setOpen(false); setQuery('') }}>
              <strong>{p.pharmacy_name}</strong> — {p.pharmacy_code} · {p.district}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
