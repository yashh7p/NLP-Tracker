import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { adminApi } from '../../services/api'
import type { AdminOverview, CategoryStat } from '../../types'

export default function AdminDashboardPage() {
  const { data: overview, isLoading: overviewLoading } = useQuery<AdminOverview>({
    queryKey: ['admin-overview'],
    queryFn: () => adminApi.overview(),
  })

  const { data: categoryStats = [], isLoading: catsLoading } = useQuery<CategoryStat[]>({
    queryKey: ['admin-categories'],
    queryFn: () => adminApi.categories(),
  })

  const stats = [
    { label: 'Total Complaints', value: overview?.total ?? 0, icon: '📊', color: '#3b82f6', bg: '#eff6ff' },
    { label: 'New Today', value: overview?.new_today ?? 0, icon: '⚡', color: '#10b981', bg: '#ecfdf5' },
    { label: 'Pending / Open', value: overview?.open ?? 0, icon: '⏳', color: '#f59e0b', bg: '#fffbeb' },
    { label: 'In Progress', value: overview?.in_progress ?? 0, icon: '🔧', color: '#0d9488', bg: '#f0fdfa' },
    { label: 'Resolved', value: overview?.resolved ?? 0, icon: '✅', color: '#16a34a', bg: '#f0fdf4' },
    { label: 'Overdue / SLA Breach', value: overview?.overdue ?? 0, icon: '🚨', color: '#ef4444', bg: '#fef2f2' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Civic Operations & NLP Intelligence Command
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            Real-time municipal triage, multilingual dispatch, and AI model health
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link
            to="/admin/complaints"
            style={{
              padding: '8px 16px',
              background: '#0d9488',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            📋 Manage Complaints
          </Link>
          <Link
            to="/admin/models"
            style={{
              padding: '8px 16px',
              background: '#1e293b',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            🤖 Model Benchmark
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {stats.map((s, idx) => (
          <div key={idx} style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>{s.label}</span>
              <span style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: s.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}>{s.icon}</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>
              {overviewLoading ? '...' : s.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Category Breakdown */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
            🏷️ Grievance Distribution by Category
          </h3>
          {catsLoading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Loading categories...</div>
          ) : categoryStats.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No complaints filed yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {categoryStats.map((cat, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: '#334155' }}>{cat.category}</span>
                    <span style={{ color: '#64748b' }}>{cat.count} ({cat.percentage}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${cat.percentage}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #16a34a, #0d9488)',
                      borderRadius: '4px'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* NLP Model Status */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
            ⚡ Active NLP Pipeline Status
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>Primary Classifier</span>
                <span style={{ background: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700 }}>
                  ONLINE
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                TF-IDF + Calibrated Linear SVM (v1.0.0) • Avg Latency: ~2.1ms
              </div>
            </div>

            <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>Baseline Benchmark</span>
                <span style={{ background: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700 }}>
                  ONLINE
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                TF-IDF + Multinom Logistic Regression (v1.0.0) • Avg Latency: ~0.4ms
              </div>
            </div>

            <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>Semantic Deduplication</span>
                <span style={{ background: '#f0fdfa', color: '#0d9488', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700 }}>
                  ACTIVE
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                TF-IDF N-gram Cosine Vector Similarity (Threshold: 0.70)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
