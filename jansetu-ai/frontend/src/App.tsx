import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'

// Layouts
import MainLayout from './layouts/MainLayout'
import AdminLayout from './layouts/AdminLayout'
import AuthLayout from './layouts/AuthLayout'

// Public pages
import LandingPage from './pages/Landing'
import LoginPage from './pages/auth/Login'
import RegisterPage from './pages/auth/Register'

// Resident pages
import DashboardPage from './pages/resident/Dashboard'
import TextComplaintPage from './pages/resident/TextComplaint'
import VoiceComplaintPage from './pages/resident/VoiceComplaint'
import MyComplaintsPage from './pages/resident/MyComplaints'
import ComplaintDetailPage from './pages/resident/ComplaintDetail'
import ComplaintMapPage from './pages/resident/ComplaintMap'
import NotificationsPage from './pages/resident/Notifications'
import ProfilePage from './pages/resident/Profile'
import AboutPage from './pages/About'

// Admin pages
import AdminDashboardPage from './pages/admin/Dashboard'
import AdminComplaintsPage from './pages/admin/Complaints'
import AdminModelPage from './pages/admin/ModelDashboard'
import AdminResearchPage from './pages/admin/Research'

function PrivateRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="spinner" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin' && user.role !== 'staff') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<AboutPage />} />

      {/* Auth */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Resident */}
      <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/complaints/new/text" element={<TextComplaintPage />} />
        <Route path="/complaints/new/voice" element={<VoiceComplaintPage />} />
        <Route path="/complaints" element={<MyComplaintsPage />} />
        <Route path="/complaints/:id" element={<ComplaintDetailPage />} />
        <Route path="/map" element={<ComplaintMapPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Admin */}
      <Route element={<PrivateRoute adminOnly><AdminLayout /></PrivateRoute>}>
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/complaints" element={<AdminComplaintsPage />} />
        <Route path="/admin/models" element={<AdminModelPage />} />
        <Route path="/admin/research" element={<AdminResearchPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
