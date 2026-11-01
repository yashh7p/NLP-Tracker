import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { complaintsApi } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import type { Complaint } from '../../types'

export default function DashboardPage() {
  const { user } = useAuth()
  const { data, isLoading } = useQuery({
    queryKey: ['my-complaints-recent'],
    queryFn: () => complaintsApi.list({ per_page: 5 }),
  })

  const complaints: Complaint[] = data?.items || []

  const openStatuses = ['submitted', 'under_review', 'assigned', 'reopened']
  const stats = [
    { label: 'Total Complaints', value: data?.total ?? 0, icon: '📋', color: '#2563eb', bg: '#eff6ff' },
    { label: 'Open / Pending', value: complaints.filter(c => openStatuses.includes(c.status)).length, icon: '⏳', color: '#d97706', bg: '#fef3c7' },
    { label: 'In Progress', value: complaints.filter(c => c.status === 'in_progress').length, icon: '🔧', color: '#0d9488', bg: '#ccfbf1' },
    { label: 'Resolved', value: complaints.filter(c => c.status === 'resolved').length, icon: '✅', color: '#16a34a', bg: '#dcfce7' },
  ]

  return (
    <div>
      {/* Welcome Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #0f766e 0%, #065f46 100%)',
        borderRadius: '16px',
        padding: '32px',
        color: 'white',
        marginBottom: '28px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 700, margin: '0 0 8px 0' }}>
            Namaste, {user?.full_name || 'Citizen'}! 🙏
          </h1>
          <p style={{ margin: '0 0 24px 0', opacity: 0.9, fontSize: '15px', lineHeight: 1.5 }}>
            Submit grievances in English, Hinglish, or Kanglish. Our multilingual NLP engine will analyze, route, and prioritize your complaint automatically.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link
              to="/complaints/new/text"
              id="dash-new-complaint-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                backgroundColor: 'white',
                color: '#0f766e',
                fontWeight: 700,
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              ✍️ Register Grievance
            </Link>
            <Link
              to="/complaints/new/voice"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontWeight: 600,
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                backdropFilter: 'blur(4px)'
              }}
            >
              🎙️ Voice Assistant
            </Link>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {stats.map((s, idx) => (
          <div key={idx} style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              backgroundColor: s.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px'
            }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>{s.label}</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent complaints table */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
            Recent Complaints
          </h2>
          <Link to="/complaints" style={{ color: '#0d9488', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
            View all →
          </Link>
        </div>

        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading complaints...</div>
        ) : complaints.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>🌱</div>
            <p style={{ margin: 0 }}>No complaints submitted yet. Experience our NLP classification now!</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid #f1f5f9', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>ID</th>
                  <th style={{ padding: '12px 16px' }}>Category</th>
                  <th style={{ padding: '12px 16px' }}>Description</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Priority</th>
                  <th style={{ padding: '12px 16px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0f172a' }}>{c.reference_id}</td>
                    <td style={{ padding: '14px 16px', color: '#334155' }}>{c.category_name || 'Analyzing...'}</td>
                    <td style={{ padding: '14px 16px', color: '#64748b', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.original_text}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: c.status === 'resolved' ? '#dcfce7' : c.status === 'in_progress' ? '#ccfbf1' : '#fef3c7',
                        color: c.status === 'resolved' ? '#15803d' : c.status === 'in_progress' ? '#0f766e' : '#b45309'
                      }}>
                        {c.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: c.priority === 'urgent' ? '#fee2e2' : c.priority === 'high' ? '#ffedd5' : '#f1f5f9',
                        color: c.priority === 'urgent' ? '#b91c1c' : c.priority === 'high' ? '#c2410c' : '#475569'
                      }}>
                        {c.priority}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <Link to={`/complaints/${c.id}`} style={{ color: '#0d9488', fontWeight: 600, textDecoration: 'none' }}>
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
