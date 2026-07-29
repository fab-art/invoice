import { createContext, useContext, useEffect, useState } from 'react'
import { ensureSeeded, login as dbLogin, logout as dbLogout, getSession } from './localDb'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      await ensureSeeded()
      setSession(getSession())
      setLoading(false)
    })()
  }, [])

  async function signIn(email, password) {
    try {
      const sess = await dbLogin(email, password)
      setSession(sess)
      return { error: null }
    } catch (err) {
      return { error: { message: err.message } }
    }
  }

  function signOut() {
    dbLogout()
    setSession(null)
  }

  const isAdmin = session?.role === 'admin'

  return (
    <AuthContext.Provider value={{ session, profile: session, loading, isAdmin, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
