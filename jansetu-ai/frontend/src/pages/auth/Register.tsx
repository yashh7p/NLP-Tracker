import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'resident' | 'staff' | 'admin'>('resident')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { register, login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const cleanFullName = fullName.trim()
    const cleanEmail = email.trim().toLowerCase()
    const cleanPhone = phone.trim()

    if (!cleanFullName || cleanFullName.length < 2) {
      setError('Please enter a full name with at least 2 characters.')
      setLoading(false)
      return
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.')
      setLoading(false)
      return
    }

    let registeredSuccessfully = false
    try {
      await register({
        full_name: cleanFullName,
        email: cleanEmail,
        phone: cleanPhone || undefined,
        password,
        role,
      })
      registeredSuccessfully = true
    } catch (err: any) {
      console.error('Registration error:', err)
      const status = err?.response?.status
      const data = err?.response?.data
      if (err?.code === 'ERR_NETWORK' || status === 502 || status === 503 || status === 504 || (status && status >= 500) || !err?.response) {
        setError('Unable to reach backend server at http://localhost:8000. Please ensure the backend is running.')
      } else if (typeof data?.detail === 'string') {
        setError(data.detail)
      } else if (Array.isArray(data?.detail)) {
        const msgs = data.detail.map((d: any) => {
          const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : ''
          return field ? `${field}: ${d.msg}` : d.msg
        }).join('. ')
        setError(msgs)
      } else {
        setError(data?.message || 'Registration failed. Please check your details.')
      }
      setLoading(false)
      return
    }

    // Auto login if registration was successful
    if (registeredSuccessfully) {
      try {
        await login(cleanEmail, password)
        if (role === 'admin' || role === 'staff') {
          navigate('/admin')
        } else {
          navigate('/dashboard')
        }
      } catch (loginErr) {
        console.warn('Auto login after registration failed, redirecting to login page', loginErr)
        navigate('/login?registered=true')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
          Create an Account
        </h2>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '6px' }}>
          Join JanSetu AI to report and monitor civic issues
        </p>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#b91c1c',
          fontSize: '13px',
          marginBottom: '20px',
        }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
            Full Name
          </label>
          <input
            id="register-name-input"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="Aarav Sharma"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1.5px solid #cbd5e1',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
            Email Address
          </label>
          <input
            id="register-email-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="aarav@example.com"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1.5px solid #cbd5e1',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
            Phone Number (Optional)
          </label>
          <input
            id="register-phone-input"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1.5px solid #cbd5e1',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
            Password
          </label>
          <input
            id="register-password-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Minimum 6 characters"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1.5px solid #cbd5e1',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
            Role
          </label>
          <select
            id="register-role-select"
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1.5px solid #cbd5e1',
              fontSize: '14px',
              boxSizing: 'border-box',
              background: 'white'
            }}
          >
            <option value="resident">Resident / Citizen</option>
            <option value="staff">Civic Staff / Department Officer</option>
            <option value="admin">Administrator / Research Analyst</option>
          </select>
        </div>

        <button
          id="register-submit-button"
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            background: 'linear-gradient(135deg, #16a34a, #0d9488)',
            color: 'white',
            fontWeight: 600,
            borderRadius: '8px',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '15px',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Registering...' : 'Create Account'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#64748b' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: '#0d9488', fontWeight: 600, textDecoration: 'none' }}>
          Sign in
        </Link>
      </div>
    </div>
  )
}
