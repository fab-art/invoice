import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext.jsx'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await signIn(email, password)
    setBusy(false)
    if (error) setError(error.message)
    else navigate('/')
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>RSSB Pharmacy Invoice Reception</h1>
        <p className="subtitle">Sign in to continue</p>
        {error && <div className="alert-error">{error}</div>}
        <label>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        <label>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        <button className="btn-primary" disabled={busy} type="submit">
          {busy ? 'Signing in...' : 'Sign in'}
        </button>
        <p className="hint">
          Local demo mode — data is stored in this browser's IndexedDB.<br/>
          Admin: <code>admin@rssb.local</code> / <code>admin123</code><br/>
          Receptionist: <code>reception@rssb.local</code> / <code>reception123</code>
        </p>
      </form>
    </div>
  )
}
