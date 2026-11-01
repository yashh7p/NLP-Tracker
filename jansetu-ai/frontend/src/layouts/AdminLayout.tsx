import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const adminNav = [
  { to: '/admin',           label: 'Overview',   icon: '📊' },
  { to: '/admin/complaints', label: 'Complaints', icon: '📋' },
  { to: '/admin/models',    label: 'AI Models',  icon: '🤖' },
  { to: '/admin/research',  label: 'Research',   icon: '🔬' },
  { to: '/dashboard',       label: '← Resident', icon: '🏠' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Sidebar */}
      <aside style={{
        width: '240px', background: '#0f172a',
        borderRight: '1px solid #1e293b',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
        boxShadow: '2px 0 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ color: '#38bdf8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '4px' }}>
            🛡️ Municipal Admin
          </div>
          <div style={{ color: '#ffffff', fontFamily: "'Outfit'", fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
            JanSetu AI
          </div>
        </div>
        <nav style={{ flex: 1, padding: '16px 10px' }}>
          {adminNav.map((item) => {
            const active = location.pathname === item.to
            return (
              <Link key={item.to} to={item.to} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '11px 14px', borderRadius: '10px', marginBottom: '6px',
                textDecoration: 'none', fontSize: '0.92rem', fontWeight: active ? 700 : 500,
                color: active ? '#ffffff' : '#cbd5e1',
                background: active ? 'linear-gradient(135deg, #0d9488, #10b981)' : 'transparent',
                boxShadow: active ? '0 2px 8px rgba(13,148,136,0.35)' : 'none',
                transition: 'all 0.2s ease',
              }}>
                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div style={{ padding: '20px', borderTop: '1px solid #1e293b', background: '#090d16' }}>
          <div style={{ color: '#f8fafc', fontSize: '0.85rem', fontWeight: 600, marginBottom: '2px' }}>{user?.full_name || 'Admin User'}</div>
          <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '12px' }}>{user?.email}</div>
          <button onClick={logout} style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '6px',
            padding: '6px 12px',
            color: '#fca5a5',
            cursor: 'pointer',
            fontSize: '0.82rem',
            fontWeight: 600,
            width: '100%',
            transition: 'background 0.2s',
          }}>
            Sign Out
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, marginLeft: '240px', minHeight: '100vh', background: '#f8fafc', color: '#0f172a', padding: '32px' }}>
        <Outlet />
      </main>
    </div>
  )
}
