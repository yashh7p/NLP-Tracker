import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { complaintsApi } from '../../services/api'
import type { Complaint } from '../../types'

// Leaflet dynamic import to avoid SSR issues
declare global {
  interface Window {
    L: any
  }
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#dc2626',
  high: '#ea580c',
  normal: '#0d9488',
  low: '#16a34a',
}

export default function ComplaintMapPage() {
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const mapRef = useRef<any>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<any[]>([])

  const { data, isLoading } = useQuery({
    queryKey: ['map-complaints'],
    queryFn: () => complaintsApi.list({ per_page: 100 }),
  })

  const complaints: Complaint[] = data?.items || []

  // Attach Leaflet CSS
  useEffect(() => {
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    // Load Leaflet JS dynamically
    if (!(window as any).L) {
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = () => setMapReady(true)
      document.head.appendChild(script)
    } else {
      setMapReady(true)
    }

    return () => {
      // Cleanup map on unmount
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Initialize map once Leaflet is loaded
  useEffect(() => {
    if (!mapReady || !mapContainerRef.current || mapRef.current) return

    const L = (window as any).L

    // Fix default icon path issue with Leaflet + bundlers
    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })

    const map = L.map(mapContainerRef.current, {
      center: [12.9716, 77.5946],
      zoom: 13,
      zoomControl: true,
    })

    // OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map
  }, [mapReady])

  // Add/update markers when complaints load
  useEffect(() => {
    if (!mapReady || !mapRef.current || !complaints.length) return

    const L = (window as any).L
    const map = mapRef.current

    // Remove old markers
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    complaints.forEach((c, i) => {
      const lat = (c as any).latitude || (12.9716 + (Math.sin(i * 1.7) * 0.04))
      const lng = (c as any).longitude || (77.5946 + (Math.cos(i * 1.7) * 0.04))

      const pinColor = PRIORITY_COLORS[c.priority] || '#6b7280'

      // Custom SVG marker
      const svgIcon = L.divIcon({
        className: '',
        html: `<div style="
          width: 32px; height: 32px; border-radius: 50% 50% 50% 0;
          background: ${pinColor}; border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.35);
          transform: rotate(-45deg);
          display: flex; align-items: center; justify-content: center;
        ">
          <div style="transform: rotate(45deg); font-size: 13px; line-height: 1;">
            ${c.priority === 'urgent' ? '🚨' : c.priority === 'high' ? '⚠️' : c.status === 'resolved' ? '✅' : '📍'}
          </div>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -36],
      })

      const marker = L.marker([lat, lng], { icon: svgIcon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width: 200px; font-family: Inter, sans-serif;">
            <div style="font-weight: 700; color: #0f172a; font-size: 13px; margin-bottom: 4px;">
              #${c.reference_id}
            </div>
            <div style="color: #0d9488; font-size: 12px; font-weight: 600; margin-bottom: 6px;">
              ${c.category_name || 'General Civic'}
            </div>
            <div style="color: #475569; font-size: 12px; line-height: 1.4; margin-bottom: 8px; max-width: 240px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
              "${c.original_text}"
            </div>
            <div style="display: flex; gap: 6px; margin-bottom: 8px; flex-wrap: wrap;">
              <span style="padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 700;
                background: ${c.priority === 'urgent' ? '#fee2e2' : c.priority === 'high' ? '#ffedd5' : '#dcfce7'};
                color: ${c.priority === 'urgent' ? '#b91c1c' : c.priority === 'high' ? '#c2410c' : '#166534'};">
                ⚡ ${c.priority?.toUpperCase()}
              </span>
              <span style="padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 700;
                background: ${c.status === 'resolved' ? '#dcfce7' : c.status === 'in_progress' ? '#ccfbf1' : '#fef3c7'};
                color: ${c.status === 'resolved' ? '#166534' : c.status === 'in_progress' ? '#0f766e' : '#b45309'};">
                ${c.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            ${c.location_text ? `<div style="font-size: 11px; color: #64748b;">📍 ${c.location_text}</div>` : ''}
          </div>
        `)

      marker.on('click', () => {
        setSelectedComplaint(c)
      })

      markersRef.current.push(marker)
    })
  }, [mapReady, complaints])

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
          🗺️ Live Grievance Map
        </h1>
        <p style={{ color: '#475569', fontSize: '14px', marginTop: '4px', margin: '4px 0 0' }}>
          Real-time map of civic complaints across Bengaluru wards — powered by OpenStreetMap
        </p>
      </div>

      {/* Stats Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Pins', value: complaints.length, color: '#0f172a', bg: '#f1f5f9' },
          { label: 'Urgent', value: complaints.filter(c => c.priority === 'urgent').length, color: '#b91c1c', bg: '#fee2e2' },
          { label: 'Open', value: complaints.filter(c => c.status === 'open').length, color: '#b45309', bg: '#fef3c7' },
          { label: 'Resolved', value: complaints.filter(c => c.status === 'resolved').length, color: '#166534', bg: '#dcfce7' },
        ].map((s) => (
          <div key={s.label} style={{
            padding: '8px 16px', borderRadius: '10px',
            background: s.bg, display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{ fontSize: '18px', fontWeight: 800, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: s.color }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedComplaint ? '1fr 340px' : '1fr', gap: '20px' }}>
        {/* Real Leaflet Map */}
        <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #cbd5e1', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', position: 'relative', height: '600px' }}>
          {isLoading && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 1000,
              background: 'rgba(248,250,252,0.9)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: '12px',
              fontSize: '15px', fontWeight: 600, color: '#475569',
            }}>
              <div className="spinner" /> Loading map data...
            </div>
          )}
          {!mapReady && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 999,
              background: '#f1f5f9', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: '12px',
              fontSize: '15px', fontWeight: 600, color: '#475569',
            }}>
              <div className="spinner" /> Initializing OpenStreetMap...
            </div>
          )}
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
        </div>

        {/* Selected Complaint Details */}
        {selectedComplaint && (
          <div style={{
            background: 'white', borderRadius: '16px', padding: '24px',
            border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
            display: 'flex', flexDirection: 'column', gap: '16px', height: '600px', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0d9488' }}>
                #{selectedComplaint.reference_id}
              </span>
              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#94a3b8', lineHeight: 1 }}
              >✕</button>
            </div>

            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                {selectedComplaint.category_name || 'General Civic'}
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <span style={{
                  padding: '3px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 700,
                  background: selectedComplaint.priority === 'urgent' ? '#fee2e2' : selectedComplaint.priority === 'high' ? '#ffedd5' : '#dcfce7',
                  color: selectedComplaint.priority === 'urgent' ? '#b91c1c' : selectedComplaint.priority === 'high' ? '#c2410c' : '#166534',
                }}>
                  ⚡ {selectedComplaint.priority?.toUpperCase()}
                </span>
                <span style={{
                  padding: '3px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 700,
                  background: selectedComplaint.status === 'resolved' ? '#dcfce7' : selectedComplaint.status === 'in_progress' ? '#ccfbf1' : '#fef3c7',
                  color: selectedComplaint.status === 'resolved' ? '#166534' : selectedComplaint.status === 'in_progress' ? '#0f766e' : '#b45309',
                }}>
                  {selectedComplaint.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, background: '#f8fafc', padding: '12px', borderRadius: '8px', margin: 0 }}>
              "{selectedComplaint.original_text}"
            </p>

            <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedComplaint.location_text && (
                <div>📍 <strong style={{ color: '#334155' }}>Location:</strong> {selectedComplaint.location_text}</div>
              )}
              {selectedComplaint.language && (
                <div>🌐 <strong style={{ color: '#334155' }}>Language:</strong> {selectedComplaint.language.toUpperCase()} {selectedComplaint.is_code_mixed ? '(Code-Mixed)' : ''}</div>
              )}
            </div>

            <Link
              to={`/complaints/${selectedComplaint.id}`}
              style={{
                display: 'block', padding: '10px', textAlign: 'center',
                background: 'linear-gradient(135deg, #0f766e, #0d9488)',
                color: 'white', borderRadius: '8px', textDecoration: 'none',
                fontWeight: 600, fontSize: '13px', marginTop: 'auto',
              }}
            >
              Open Full Details →
            </Link>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{
        marginTop: '16px', padding: '14px 18px', background: 'white',
        borderRadius: '12px', border: '1px solid #e2e8f0',
        display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center',
      }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Legend:</span>
        {[
          { label: 'Urgent', color: '#dc2626' },
          { label: 'High Priority', color: '#ea580c' },
          { label: 'Normal', color: '#0d9488' },
          { label: 'Resolved', color: '#16a34a' },
        ].map((l) => (
          <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#334155' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: l.color, display: 'inline-block' }} />
            {l.label}
          </span>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#94a3b8' }}>
          Map data © OpenStreetMap contributors
        </span>
      </div>
    </div>
  )
}
