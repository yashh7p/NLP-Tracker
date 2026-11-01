import React, { useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { complaintsApi } from '../../services/api'
import type { Complaint } from '../../types'

export default function ComplaintDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const { data: complaint, isLoading, error } = useQuery<Complaint>({
    queryKey: ['complaint', id],
    queryFn: () => complaintsApi.get(id!),
    enabled: !!id,
  })

  const reopenMutation = useMutation({
    mutationFn: () => complaintsApi.reopen(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaint', id] })
    },
  })

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !id) return
    setUploading(true)
    setUploadMsg(null)
    setUploadError(null)

    try {
      await complaintsApi.uploadAttachment(id, file)
      setUploadMsg('✅ Attachment uploaded successfully!')
      setFile(null)
      // Reset the file input
      if (fileInputRef.current) fileInputRef.current.value = ''
      queryClient.invalidateQueries({ queryKey: ['complaint', id] })
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      if (!err?.response) {
        setUploadError('Cannot reach backend server. Please ensure the backend is running.')
      } else if (typeof detail === 'string') {
        setUploadError(detail)
      } else {
        setUploadError('Failed to upload file. Please try again.')
      }
    } finally {
      setUploading(false)
    }
  }

  if (isLoading) {
    return <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Loading grievance details...</div>
  }

  if (error || !complaint) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Grievance Not Found</h2>
        <p style={{ color: '#64748b' }}>The complaint ID could not be found or you may not have permission to view it.</p>
        <Link to="/complaints" style={{ color: '#0d9488', fontWeight: 600 }}>Back to Complaints</Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Grievance #{complaint.reference_id}
            </h1>
            <span style={{
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 700,
              backgroundColor: complaint.status === 'resolved' ? '#dcfce7' : complaint.status === 'in_progress' ? '#ccfbf1' : '#fef3c7',
              color: complaint.status === 'resolved' ? '#15803d' : complaint.status === 'in_progress' ? '#0f766e' : '#b45309'
            }}>
              {complaint.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '6px' }}>
            Submitted on {new Date(complaint.created_at).toLocaleString()}
          </p>
        </div>

        {complaint.status === 'resolved' && (
          <button
            type="button"
            onClick={() => reopenMutation.mutate()}
            disabled={reopenMutation.isPending}
            style={{
              padding: '8px 16px',
              background: '#fef2f2',
              color: '#b91c1c',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            {reopenMutation.isPending ? 'Reopening...' : '🔄 Reopen Grievance'}
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        {/* Left Column: Complaint Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 12px 0' }}>
              Citizen Statement
            </h3>
            <p style={{ fontSize: '15px', color: '#334155', lineHeight: 1.6, margin: 0, background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
              "{complaint.original_text}"
            </p>
          </div>

          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              Location & Jurisdiction
            </h3>
            <div style={{ fontSize: '14px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <strong style={{ color: '#0f172a' }}>Address:</strong> {complaint.location_text || 'Not specified'}
              </div>
              {complaint.landmark && (
                <div>
                  <strong style={{ color: '#0f172a' }}>Landmark:</strong> {complaint.landmark}
                </div>
              )}
              {complaint.latitude && complaint.longitude && (
                <div>
                  <strong style={{ color: '#0f172a' }}>Coordinates:</strong> {complaint.latitude}, {complaint.longitude}
                </div>
              )}
            </div>
          </div>

          {/* Attachments Section */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 14px 0' }}>
              Evidence / Photo Upload
            </h3>
            <form onSubmit={handleFileUpload}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <label
                    htmlFor="file-upload-input"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      background: '#f1f5f9',
                      border: '1.5px dashed #94a3b8',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#334155',
                    }}
                  >
                    📎 Choose File
                    <input
                      id="file-upload-input"
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const selected = e.target.files?.[0] || null
                        setFile(selected)
                        setUploadMsg(null)
                        setUploadError(null)
                      }}
                    />
                  </label>

                  <span style={{ fontSize: '13px', color: file ? '#0f172a' : '#94a3b8', fontWeight: file ? 600 : 400 }}>
                    {file ? `📄 ${file.name} (${(file.size / 1024).toFixed(1)} KB)` : 'No file chosen'}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={!file || uploading}
                  style={{
                    padding: '9px 18px',
                    background: (!file || uploading) ? '#94a3b8' : '#0d9488',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: (!file || uploading) ? 'not-allowed' : 'pointer',
                    alignSelf: 'flex-start',
                    transition: 'background 0.2s',
                  }}
                >
                  {uploading ? '⏳ Uploading...' : '⬆️ Upload Evidence'}
                </button>
              </div>
            </form>

            {uploadMsg && (
              <div style={{ fontSize: '13px', color: '#059669', fontWeight: 600, marginTop: '10px', padding: '8px 12px', background: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                {uploadMsg}
              </div>
            )}
            {uploadError && (
              <div style={{ fontSize: '13px', color: '#b91c1c', fontWeight: 600, marginTop: '10px', padding: '8px 12px', background: '#fef2f2', borderRadius: '6px', border: '1px solid #fecaca' }}>
                ⚠️ {uploadError}
              </div>
            )}
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>
              Accepted: JPG, PNG, WebP, GIF, PDF • Max {10}MB
            </div>
          </div>
        </div>

        {/* Right Column: NLP Insights & Status History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🧠</span> NLP Engine Analysis
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Assigned Category</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{complaint.category_name || 'General'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Detected Language</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#2563eb' }}>{complaint.language?.toUpperCase() || 'EN'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Code-Mixed Text</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: complaint.is_code_mixed ? '#c026d3' : '#64748b' }}>
                  {complaint.is_code_mixed ? 'Yes (Romanized Dialect)' : 'No'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Urgency Level</span>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 700,
                  backgroundColor: complaint.priority === 'urgent' ? '#fee2e2' : '#f1f5f9',
                  color: complaint.priority === 'urgent' ? '#dc2626' : '#334155'
                }}>
                  {complaint.priority?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              Action Timeline
            </h3>
            {complaint.status_history && complaint.status_history.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                {complaint.status_history.map((item, index) => (
                  <div key={item.id || index} style={{ display: 'flex', gap: '12px', position: 'relative' }}>
                    <div style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: '#0d9488',
                      marginTop: '5px'
                    }} />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                        Status changed to {item.status.replace('_', ' ')}
                      </div>
                      {item.note && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{item.note}</div>}
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                        {new Date(item.created_at).toLocaleString()} {item.changed_by ? `by ${item.changed_by}` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                • Initial registration completed. Awaiting review by civic desk.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
