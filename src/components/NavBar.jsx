import { NavLink } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext.jsx'

export default function NavBar() {
  const { profile, isAdmin, signOut } = useAuth()

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <img src="/rssb-logo.png" alt="RSSB" className="navbar-logo" />
        Invoice Reception
      </div>
      <nav className="navbar-links">
        <NavLink to="/" end>Reception</NavLink>
        <NavLink to="/reports">Reports</NavLink>
        {isAdmin && <NavLink to="/admin">Admin</NavLink>}
        {isAdmin && <NavLink to="/admin/pharmacies">Pharmacies</NavLink>}
      </nav>
      <div className="navbar-user">
        <span>{profile?.full_name}</span>
        <button className="btn-link" onClick={signOut}>Sign out</button>
      </div>
    </header>
  )
}
