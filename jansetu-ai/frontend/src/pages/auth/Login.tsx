import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function LoginPage() {
  const [searchParams] = useSearchParams()
  const justRegistered = searchParams.get('registered') === 'true'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingRole, setLoadingRole] = useState<string | null>(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  const doLogin = async (loginEmail: string, loginPass: string, roleHint?: 'resident' | 'admin' | 'staff') => {
    setError(null)
    setLoading(true)
    if (roleHint) setLoadingRole(roleHint)

    const cleanEmail = loginEmail.trim().toLowerCase()

    try {
      const data = await login(cleanEmail, loginPass)

      // Determine where to navigate based on JWT payload role
      let targetRole: string = roleHint || 'resident'
      try {
        if (data?.access_token) {
          const payload = JSON.parse(atob(data.access_token.split('.')[1]))
          if (payload.role) targetRole = payload.role
        }
      } catch {}

      if (targetRole === 'admin' || targetRole === 'staff') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    } catch (err: any) {
      console.error('Login error:', err)
      const status = err?.response?.status
      const data = err?.response?.data
      if (err?.code === 'ERR_NETWORK' || status === 502 || status === 503 || status === 504 || (status && status >= 500) || !err?.response) {
        setError('Unable to reach backend server at http://localhost:8000. Please ensure the backend is running, or use 1-Click Demo Login below.')
      } else if (status === 401) {
        setError('Invalid email or password. Please verify your credentials or use the 1-Click Demo Login below.')
      } else if (typeof data?.detail === 'string') {
        setError(data.detail)
      } else if (Array.isArray(data?.detail)) {
        setError(data.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', '))
      } else {
        setError('Login failed. Please check your credentials.')
      }
    } finally {
      setLoading(false)
      setLoadingRole(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('Please enter both email and password.')
      return
    }
    await doLogin(email.trim(), password)
  }

  // 1-Click Instant Demo Login
  const handleInstantDemo = async (role: 'resident' | 'admin' | 'staff') => {
    if (role === 'resident') {
      setEmail('resident@jansetu.in')
      setPassword('Resident@123')
      await doLogin('resident@jansetu.in', 'Resident@123', 'resident')
    } else if (role === 'admin') {
      setEmail('admin@jansetu.in')
      setPassword('Admin@123')
      await doLogin('admin@jansetu.in', 'Admin@123', 'admin')
    } else {
      setEmail('staff@jansetu.in')
      setPassword('Staff@123')
      await doLogin('staff@jansetu.in', 'Staff@123', 'staff')
    }
  }

  // Fill form inputs only
  const handleFillFields = (role: 'resident' | 'admin' | 'staff') => {
    setError(null)
    if (role === 'resident') {
      setEmail('resident@jansetu.in')
      setPassword('Resident@123')
    } else if (role === 'admin') {
      setEmail('admin@jansetu.in')
      setPassword('Admin@123')
    } else {
      setEmail('staff@jansetu.in')
      setPassword('Staff@123')
    }
  }

  return (
    <div style={{ color: '#0f172a' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
          Welcome to JanSetu AI
        </h2>
        <p style={{ color: '#334155', fontSize: '14px', marginTop: '6px' }}>
          Sign in to track grievances, triage tickets, or manage municipal services
        </p>
      </div>

      {justRegistered && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#f0fdf4',
          border: '1.5px solid #86efac',
          borderRadius: '10px',
          color: '#166534',
          fontSize: '13px',
          fontWeight: 600,
          marginBottom: '20px',
          lineHeight: 1.4
        }}>
          ✅ Registration successful! Please sign in with your email and password below.
        </div>
      )}

      {error && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#fef2f2',
          border: '1.5px solid #fecaca',
          borderRadius: '10px',
          color: '#b91c1c',
          fontSize: '13px',
          fontWeight: 600,
          marginBottom: '20px',
          lineHeight: 1.4
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* 1-Click Quick Demo Login Box */}
      <div style={{
        marginBottom: '24px',
        padding: '16px',
        background: '#f8fafc',
        borderRadius: '12px',
        border: '1.5px solid #cbd5e1',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            ⚡ 1-Click Instant Demo Login:
          </span>
          <span style={{ fontSize: '11px', color: '#0d9488', fontWeight: 700 }}>No typing needed</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: '10px' }}>
          <button
            type="button"
            id="demo-resident-login-btn"
            disabled={loading}
            onClick={() => handleInstantDemo('resident')}
            style={{
              padding: '10px 8px',
              background: 'linear-gradient(135deg, #16a34a, #0d9488)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: 700,
              boxShadow: '0 2px 6px rgba(13,148,136,0.25)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              transition: 'all 0.2s ease',
              opacity: loading && loadingRole === 'resident' ? 0.7 : 1,
            }}
          >
            <span>{loading && loadingRole === 'resident' ? '⏳ Logging in...' : '👤 Resident'}</span>
            <span style={{ fontSize: '10px', opacity: 0.9, fontWeight: 500 }}>Pass: Resident@123</span>
          </button>

          <button
            type="button"
            id="demo-staff-login-btn"
            disabled={loading}
            onClick={() => handleInstantDemo('staff')}
            style={{
              padding: '10px 8px',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: 700,
              boxShadow: '0 2px 6px rgba(37,99,235,0.25)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              transition: 'all 0.2s ease',
              opacity: loading && loadingRole === 'staff' ? 0.7 : 1,
            }}
          >
            <span>{loading && loadingRole === 'staff' ? '⏳ Logging in...' : '👔 Staff'}</span>
            <span style={{ fontSize: '10px', opacity: 0.9, fontWeight: 500 }}>Pass: Staff@123</span>
          </button>

          <button
            type="button"
            id="demo-admin-login-btn"
            disabled={loading}
            onClick={() => handleInstantDemo('admin')}
            style={{
              padding: '10px 8px',
              background: 'linear-gradient(135deg, #0f172a, #1e293b)',
              color: 'white',
              border: '1px solid #334155',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: 700,
              boxShadow: '0 2px 6px rgba(15,23,42,0.25)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              transition: 'all 0.2s ease',
              opacity: loading && loadingRole === 'admin' ? 0.7 : 1,
            }}
          >
            <span>{loading && loadingRole === 'admin' ? '⏳ Logging in...' : '🛡️ Admin'}</span>
            <span style={{ fontSize: '10px', opacity: 0.9, fontWeight: 500 }}>Pass: Admin@123</span>
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', fontSize: '11px', color: '#64748b', flexWrap: 'wrap' }}>
          <span>Fill fields:</span>
          <button
            type="button"
            onClick={() => handleFillFields('resident')}
            style={{ background: 'none', border: 'none', color: '#0d9488', cursor: 'pointer', fontWeight: 600, padding: 0 }}
          >
            Resident
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => handleFillFields('staff')}
            style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 600, padding: 0 }}
          >
            Staff
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => handleFillFields('admin')}
            style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontWeight: 600, padding: 0 }}
          >
            Admin
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '20px 0' }}>
        <div style={{ flex: 1, height: '1px', background: '#cbd5e1' }} />
        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Or Sign in manually</span>
        <div style={{ flex: 1, height: '1px', background: '#cbd5e1' }} />
      </div>

      {/* Manual Login Form */}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="email-input" style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
            Email Address *
          </label>
          <input
            id="email-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="resident@jansetu.in or admin@jansetu.in"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '8px',
              border: '1.5px solid #cbd5e1',
              fontSize: '14px',
              color: '#0f172a',
              backgroundColor: '#ffffff',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label htmlFor="password-input" style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
              Password *
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                background: 'none',
                border: 'none',
                color: '#0d9488',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0
              }}
            >
              {showPassword ? '🙈 Hide' : '👁️ Show'}
            </button>
          </div>
          <input
            id="password-input"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="Enter your password (e.g. Resident@123)"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '8px',
              border: '1.5px solid #cbd5e1',
              fontSize: '14px',
              color: '#0f172a',
              backgroundColor: '#ffffff',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <button
          id="login-submit-button"
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg, #16a34a, #0d9488)',
            color: 'white',
            fontWeight: 700,
            borderRadius: '8px',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '15px',
            boxShadow: '0 4px 12px rgba(13,148,136,0.25)',
            transition: 'opacity 0.2s',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Signing in...' : 'Sign In with Credentials'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '22px', fontSize: '13px', color: '#475569' }}>
        Don't have an account?{' '}
        <Link to="/register" style={{ color: '#0d9488', fontWeight: 700, textDecoration: 'none' }}>
          Register here
        </Link>
      </div>
    </div>
  )
}
