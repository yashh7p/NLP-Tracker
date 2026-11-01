import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { complaintsApi } from '../../services/api'
import type { Complaint } from '../../types'

export default function MyComplaintsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['my-complaints', statusFilter],
    queryFn: () => complaintsApi.list(statusFilter ? { status: statusFilter } : {}),
  })

  const complaints: Complaint[] = (data?.items || []).filter((c: Complaint) => {
    if (!search.trim()) return true
    const term = search.toLowerCase()
    return (
      c.reference_id?.toLowerCase().includes(term) ||
      c.original_text?.toLowerCase().includes(term) ||
      c.category_name?.toLowerCase().includes(term) ||
      c.location_text?.toLowerCase().includes(term)
    )
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            My Grievances
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            Track progress, view department responses, or follow up on previous submissions
          </p>
        </div>
        <Link
          to="/complaints/new/text"
          style={{
            padding: '10px 18px',
            background: 'linear-gradient(135deg, #16a34a, #0d9488)',
            color: 'white',
            fontWeight: 600,
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '14px',
          }}
        >
          + New Grievance
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <input
            type="text"
            placeholder="Search by ID, keyword, or locality..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1.5px solid #cbd5e1',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {['', 'open', 'in_progress', 'resolved'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                background: statusFilter === s ? '#0d9488' : '#f1f5f9',
                color: statusFilter === s ? 'white' : '#475569',
              }}
            >
              {s === '' ? 'All' : s.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Complaints List */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>Loading grievances...</div>
        ) : complaints.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>📂</div>
            <p style={{ margin: 0, fontWeight: 500 }}>No matching complaints found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '12px' }}>
                <tr>
                  <th style={{ padding: '12px 16px' }}>REFERENCE</th>
                  <th style={{ padding: '12px 16px' }}>CATEGORY</th>
                  <th style={{ padding: '12px 16px' }}>GRIEVANCE</th>
                  <th style={{ padding: '12px 16px' }}>LOCATION</th>
                  <th style={{ padding: '12px 16px' }}>STATUS</th>
                  <th style={{ padding: '12px 16px' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0f172a' }}>
                      {c.reference_id}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#334155' }}>
                      {c.category_name || 'Classified'}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.original_text}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b' }}>
                      {c.location_text || c.landmark || '—'}
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
                      <Link
                        to={`/complaints/${c.id}`}
                        style={{ color: '#0d9488', fontWeight: 600, textDecoration: 'none' }}
                      >
                        Details →
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
