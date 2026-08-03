/**
 * Authentication Context Provider
 * 
 * Manages user authentication state using local IndexedDB storage.
 * Provides signIn, signOut, and session management throughout the app.
 */
import { createContext, useContext, useEffect, useState } from 'react'
import { ensureSeeded, login as dbLogin, logout as dbLogout, getSession } from './localDb'

interface Session {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'receptionist'
}

interface AuthContextType {
  session: Session | null
  profile: Session | null
  loading: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<{ error: { message: string } | null }>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      await ensureSeeded()
      setSession(getSession())
      setLoading(false)
    }
    init()
  }, [])

  async function signIn(email: string, password: string) {
    try {
      const sess = await dbLogin(email, password)
      setSession(sess)
      return { error: null }
    } catch (err) {
      return { error: { message: (err as Error).message } }
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
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
