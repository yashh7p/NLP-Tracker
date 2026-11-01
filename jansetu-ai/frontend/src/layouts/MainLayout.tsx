import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { notificationsApi } from '../services/api'
import type { Notification } from '../types'
import { useState, useEffect } from 'react'

const navItems = [
  { to: '/dashboard',           label: 'Dashboard',    icon: '🏠' },
  { to: '/complaints/new/text', label: 'File Complaint', icon: '📝' },
  { to: '/complaints',          label: 'My Complaints', icon: '📋' },
  { to: '/map',                 label: 'Complaint Map', icon: '🗺️' },
  { to: '/notifications',       label: 'Notifications', icon: '🔔' },
  { to: '/profile',             label: 'Profile',       icon: '👤' },
]

export default function MainLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900)

  // Track viewport width for responsive layout
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 900
      setIsMobile(mobile)
      if (!mobile) setSidebarOpen(false) // auto-close when expanding to desktop
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (isMobile) setSidebarOpen(false)
  }, [location.pathname, isMobile])

  const { data: notifs } = useQuery<Notification[]>({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationsApi.list(true),
    refetchInterval: 30000,
  })
  const unreadCount = notifs?.length ?? 0

  const sidebarVisible = !isMobile || sidebarOpen

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Mobile overlay backdrop */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(15,23,42,0.5)',
            zIndex: 99,
          }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: '240px',
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-sm)',
        transform: sidebarVisible ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s cubic-bezier(.4,0,.2,1)',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border)' }}>
          <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px',
              background: 'linear-gradient(135deg, #1a6b4a, #0d9488)',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', flexShrink: 0,
            }}>🏛️</div>
            <div>
              <div style={{ fontFamily: "'Outfit'", fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-forest)' }}>
                JanSetu AI
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-3)' }}>Civic Portal</div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {navItems.map((item) => {
            const active = location.pathname === item.to || location.pathname.startsWith(item.to + '/')
            return (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 12px', borderRadius: '10px', marginBottom: '4px',
                  textDecoration: 'none', fontSize: '0.9rem', fontWeight: active ? 600 : 400,
                  color: active ? 'var(--color-forest)' : 'var(--color-text-2)',
                  background: active ? 'rgba(26, 107, 74, 0.1)' : 'transparent',
                  transition: 'var(--transition)',
                  position: 'relative',
                }}
              >
                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                {item.label}
                {item.label === 'Notifications' && unreadCount > 0 && (
                  <span style={{
                    marginLeft: 'auto', background: 'var(--color-red)',
                    color: 'white', borderRadius: '10px', fontSize: '0.7rem',
                    fontWeight: 700, padding: '1px 6px',
                  }}>{unreadCount}</span>
                )}
              </Link>
            )
          })}

          {(user?.role === 'admin' || user?.role === 'staff') && (
            <>
              <div style={{ padding: '12px 12px 4px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                Admin
              </div>
              <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', textDecoration: 'none', fontSize: '0.9rem', color: 'var(--color-text-2)' }}>
                <span>⚙️</span> Admin Dashboard
              </Link>
            </>
          )}
        </nav>

        {/* User */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #1a6b4a, #0d9488)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0,
            }}>
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.full_name}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-3)', textTransform: 'capitalize' }}>{user?.role}</div>
            </div>
          </div>
          <button onClick={logout} className="btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem', color: 'var(--color-red-light)' }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{
        flex: 1,
        marginLeft: isMobile ? 0 : '240px',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-bg)',
      }}>
        {/* Mobile top bar with hamburger */}
        {isMobile && (
          <div style={{
            position: 'sticky', top: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 16px',
            background: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <button
              id="sidebar-toggle-btn"
              onClick={() => setSidebarOpen((o) => !o)}
              aria-label="Toggle navigation"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '22px', lineHeight: 1, padding: '4px',
                color: 'var(--color-text)',
              }}
            >
              {sidebarOpen ? '✕' : '☰'}
            </button>
            <span style={{ fontFamily: "'Outfit'", fontWeight: 800, fontSize: '1rem', color: 'var(--color-forest)' }}>
              JanSetu AI
            </span>
            {unreadCount > 0 && (
              <Link to="/notifications" style={{ marginLeft: 'auto', textDecoration: 'none' }}>
                <span style={{
                  background: 'var(--color-red)', color: 'white',
                  borderRadius: '10px', fontSize: '0.75rem',
                  fontWeight: 700, padding: '2px 8px',
                }}>🔔 {unreadCount}</span>
              </Link>
            )}
          </div>
        )}

        <div style={{ padding: isMobile ? '20px 16px' : '32px 36px', flex: 1 }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}

