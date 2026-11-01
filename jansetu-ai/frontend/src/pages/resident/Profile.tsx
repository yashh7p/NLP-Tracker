import { useAuth } from '../../hooks/useAuth'

export default function ProfilePage() {
  const { user, logout } = useAuth()

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
          User Profile
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
          Account settings and personal identity information
        </p>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '28px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #16a34a, #0d9488)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 700
          }}>
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
              {user?.full_name || 'Resident Citizen'}
            </h2>
            <div style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '12px', background: '#ecfdf5', color: '#059669', fontSize: '12px', fontWeight: 600 }}>
              {user?.role?.toUpperCase()}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
          <div>
            <span style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '2px' }}>Email Address</span>
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>{user?.email}</span>
          </div>

          <div>
            <span style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '2px' }}>Phone</span>
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>{user?.phone || 'Not registered'}</span>
          </div>

          <div>
            <span style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '2px' }}>Account Status</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: user?.is_active ? '#16a34a' : '#dc2626' }}>
              {user?.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '2px' }}>Member Since</span>
            <span style={{ fontSize: '14px', color: '#475569' }}>
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Recent'}
            </span>
          </div>
        </div>

        <div style={{ marginTop: '32px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
          <button
            type="button"
            onClick={logout}
            style={{
              padding: '10px 20px',
              background: '#fee2e2',
              color: '#dc2626',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Sign Out of JanSetu AI
          </button>
        </div>
      </div>
    </div>
  )
}
