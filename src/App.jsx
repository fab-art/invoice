/**
 * RSSB Pharmacy Invoice Reception - Application Entry Point
 * 
 * Main application shell with authentication-aware routing.
 * Private routes protect admin-only views.
 */
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSettings } from './lib/SettingsContext.jsx'
import Reception from './pages/Reception.jsx'
import Verification from './pages/Verification.jsx'
import DailyReport from './pages/DailyReport.jsx'
import PharmacyManager from './pages/PharmacyManager.jsx'
import NavBar from './components/NavBar.jsx'

export default function App() {
  const { ready } = useSettings()
  if (!ready) return <div className="loading-screen">Loading...</div>

  return (
    <div className="app-shell">
      <NavBar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Reception />} />
          <Route path="/reports" element={<DailyReport />} />
          <Route path="/verification" element={<Verification />} />
          <Route path="/pharmacies" element={<PharmacyManager />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
