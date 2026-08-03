import { createContext, useContext, useEffect, useState } from 'react'
import { ensureSeeded } from './localDb'

// This app runs entirely on-device with no accounts and no login screen.
// The only thing worth remembering between visits is the name of whoever
// is operating the reception desk right now, so it can be printed on
// receipts and reports. It's stored in localStorage, not IndexedDB, since
// it's a UI preference rather than app data.
const OPERATOR_KEY = 'rssb_operator_name'
const SUPERVISOR_EMAIL_KEY = 'rssb_supervisor_email'

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [operatorName, setOperatorNameState] = useState('')
  const [supervisorEmail, setSupervisorEmailState] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    (async () => {
      await ensureSeeded()
      setOperatorNameState(localStorage.getItem(OPERATOR_KEY) || '')
      setSupervisorEmailState(localStorage.getItem(SUPERVISOR_EMAIL_KEY) || '')
      setReady(true)
    })()
  }, [])

  function setOperatorName(name) {
    const trimmed = name.trim()
    setOperatorNameState(trimmed)
    if (trimmed) localStorage.setItem(OPERATOR_KEY, trimmed)
    else localStorage.removeItem(OPERATOR_KEY)
  }

  function setSupervisorEmail(email) {
    const trimmed = email.trim()
    setSupervisorEmailState(trimmed)
    if (trimmed) localStorage.setItem(SUPERVISOR_EMAIL_KEY, trimmed)
    else localStorage.removeItem(SUPERVISOR_EMAIL_KEY)
  }

  return (
    <SettingsContext.Provider value={{
      operatorName, setOperatorName, supervisorEmail, setSupervisorEmail, ready,
    }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
