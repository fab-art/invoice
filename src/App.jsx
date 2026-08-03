import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/AuthContext.jsx'
import Login from './pages-vite/Login.jsx'
import Reception from './pages-vite/Reception.jsx'
import AdminDashboard from './pages-vite/AdminDashboard.jsx'
import DailyReport from './pages-vite/DailyReport.jsx'
import PharmacyManager from './pages-vite/PharmacyManager.jsx'
import NavBar from './components/NavBar.jsx'

function PrivateRoute({ children, adminOnly = false }) {
  const { session, isAdmin, loading } = useAuth()
  if (loading) return <div className="loading-screen">Loading...</div>
  if (!session) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { session } = useAuth()
  return (
    <div className="app-shell">
      {session && <NavBar />}
      <main className="app-main">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Reception /></PrivateRoute>} />
          <Route path="/reports" element={<PrivateRoute><DailyReport /></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute adminOnly><AdminDashboard /></PrivateRoute>} />
          <Route path="/admin/pharmacies" element={<PrivateRoute adminOnly><PharmacyManager /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
