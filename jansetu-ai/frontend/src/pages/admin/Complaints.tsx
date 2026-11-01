import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../services/api'
import type { Complaint } from '../../types'

export default function AdminComplaintsPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [statusNote, setStatusNote] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-complaints', statusFilter, priorityFilter],
    queryFn: () => adminApi.complaints({
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
    }),
  })

  const complaints: Complaint[] = data?.items || []

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note?: string }) =>
      adminApi.updateStatus(id, { status, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-complaints'] })
      setSelectedComplaint(null)
      setStatusNote('')
    },
  })

  const handleUpdate = () => {
    if (!selectedComplaint || !newStatus) return
    updateStatusMutation.mutate({
      id: selectedComplaint.id,
      status: newStatus,
      note: statusNote || undefined,
    })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Municipal Triage & Resolution Center
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            Inspect NLP classification, assign to field engineers, and update citizen ticket lifecycle
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        gap: '16px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
            STATUS
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
            PRIORITY
          </label>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>Loading complaints...</div>
        ) : complaints.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>No grievances found matching criteria.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '12px' }}>
                <tr>
                  <th style={{ padding: '12px 16px' }}>REF</th>
                  <th style={{ padding: '12px 16px' }}>CITIZEN STATEMENT</th>
                  <th style={{ padding: '12px 16px' }}>CATEGORY</th>
                  <th style={{ padding: '12px 16px' }}>LANG</th>
                  <th style={{ padding: '12px 16px' }}>PRIORITY</th>
                  <th style={{ padding: '12px 16px' }}>STATUS</th>
                  <th style={{ padding: '12px 16px' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>{c.reference_id}</td>
                    <td style={{ padding: '14px 16px', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#334155' }}>
                      {c.original_text}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#0f172a', fontWeight: 500 }}>{c.category_name || 'Classified'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: '#eff6ff', color: '#2563eb' }}>
                        {c.language?.toUpperCase() || 'EN'} {c.is_code_mixed ? '🔀' : ''}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: c.priority === 'urgent' ? '#fee2e2' : c.priority === 'high' ? '#ffedd5' : '#f1f5f9',
                        color: c.priority === 'urgent' ? '#dc2626' : c.priority === 'high' ? '#c2410c' : '#475569'
                      }}>
                        {c.priority}
                      </span>
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
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedComplaint(c)
                          setNewStatus(c.status)
                        }}
                        style={{
                          padding: '6px 12px',
                          background: '#0d9488',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Triage / Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Status Update */}
      {selectedComplaint && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '28px',
            maxWidth: '520px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                Update Grievance #{selectedComplaint.reference_id}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#475569', background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
              "{selectedComplaint.original_text}"
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Change Lifecycle Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              >
                <option value="open">Open (Under Review)</option>
                <option value="in_progress">In Progress (Dispatched)</option>
                <option value="resolved">Resolved (Completed)</option>
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Official Resolution Note
              </label>
              <textarea
                rows={3}
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="e.g. Municipal repair crew dispatched to site. Pipe leak sealed."
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                style={{ padding: '10px 16px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdate}
                disabled={updateStatusMutation.isPending}
                style={{
                  padding: '10px 18px',
                  background: '#0d9488',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px'
                }}
              >
                {updateStatusMutation.isPending ? 'Updating...' : 'Save Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
