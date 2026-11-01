import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '../../services/api'
import type { Notification } from '../../types'

export default function NotificationsPage() {
  const queryClient = useQueryClient()
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list(),
  })

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markOneMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            🔔 Notifications
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            Updates on complaint status, department assignments, and resolutions
          </p>
        </div>
        {notifications.some(n => !n.is_read) && (
          <button
            type="button"
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            style={{
              padding: '8px 14px',
              background: '#f1f5f9',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Mark All as Read
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div style={{ background: 'white', padding: '48px', textAlign: 'center', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>✨</div>
            <p style={{ color: '#64748b', margin: 0 }}>No new notifications at this time.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              style={{
                background: n.is_read ? 'white' : '#f0fdfa',
                border: `1px solid ${n.is_read ? '#e2e8f0' : '#99f6e4'}`,
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                  {n.title}
                </div>
                <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>
                  {n.message}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                  {new Date(n.created_at).toLocaleString()}
                </div>
              </div>

              {!n.is_read && (
                <button
                  type="button"
                  onClick={() => markOneMutation.mutate(n.id)}
                  style={{
                    padding: '6px 12px',
                    background: '#0d9488',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Mark Read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
