import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 50%, #f0fdfa 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '8px',
          }}>
            <div style={{
              width: '44px', height: '44px',
              background: 'linear-gradient(135deg, #1a6b4a, #0d9488)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
            }}>🏛️</div>
            <span style={{
              fontSize: '1.6rem',
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              background: 'linear-gradient(135deg, #1a6b4a, #0d9488)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>JanSetu AI</span>
          </div>
          <p style={{ color: '#78716c', fontSize: '0.9rem', margin: 0 }}>
            Your Voice. Your Language. Your City.
          </p>
        </div>

        <div className="card" style={{ padding: '32px' }}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
