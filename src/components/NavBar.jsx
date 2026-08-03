import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useSettings } from '../lib/SettingsContext.jsx'

const LINKS = [
  { to: '/', label: 'Reception', end: true },
  { to: '/reports', label: 'Reports' },
  { to: '/verification', label: 'Verification' },
  { to: '/pharmacies', label: 'Pharmacies' },
]

export default function NavBar() {
  const { operatorName, setOperatorName } = useSettings()
  const [menuOpen, setMenuOpen] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(operatorName)

  function saveName(e) {
    e.preventDefault()
    setOperatorName(nameDraft)
    setEditingName(false)
  }

  return (
    <header className="navbar">
      <div className="navbar-row">
        <div className="navbar-brand">
          <img src="/rssb-logo.png" alt="RSSB" className="navbar-logo" />
          <span>Invoice Reception</span>
        </div>
        <button
          type="button"
          className="navbar-toggle"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(o => !o)}
        >
          <span /><span /><span />
        </button>
      </div>

      <nav className={`navbar-links${menuOpen ? ' open' : ''}`}>
        {LINKS.map(link => (
          <NavLink key={link.to} to={link.to} end={link.end} onClick={() => setMenuOpen(false)}>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className={`navbar-user${menuOpen ? ' open' : ''}`}>
        {editingName ? (
          <form className="operator-form" onSubmit={saveName}>
            <input
              autoFocus
              value={nameDraft}
              onChange={e => setNameDraft(e.target.value)}
              placeholder="Your name"
              aria-label="Operator name"
            />
            <button type="submit" className="btn-gold btn-sm">Save</button>
          </form>
        ) : (
          <button
            type="button"
            className="operator-chip"
            onClick={() => { setNameDraft(operatorName); setEditingName(true) }}
            title="Set the name printed on receipts and reports"
          >
            {operatorName ? `Signed as ${operatorName}` : 'Set your name'}
          </button>
        )}
      </div>
    </header>
  )
}
