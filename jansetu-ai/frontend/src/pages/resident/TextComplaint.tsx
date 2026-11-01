import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { aiApi, complaintsApi } from '../../services/api'
import { CATEGORIES, EXAMPLE_COMPLAINTS, type ClassifyResponse } from '../../types'

export default function TextComplaintPage() {
  const [text, setText] = useState('')
  const [locationText, setLocationText] = useState('')
  const [landmark, setLandmark] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [analysis, setAnalysis] = useState<ClassifyResponse | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [micLang, setMicLang] = useState('hi-IN')
  const recognitionRef = useRef<any>(null)
  const navigate = useNavigate()

  // Setup inline speech recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    const rec = new SpeechRecognition()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = micLang

    rec.onresult = (event: any) => {
      let current = ''
      for (let i = 0; i < event.results.length; i++) {
        current += event.results[i][0].transcript + ' '
      }
      setText(current.trim())
    }

    rec.onerror = () => {
      setIsListening(false)
    }

    rec.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = rec
  }, [micLang])

  const toggleInlineMic = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      setError(null)
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (err) {
        console.error(err)
      }
    }
  }

  // Debounced live NLP analysis
  useEffect(() => {
    if (text.trim().length < 4) {
      setAnalysis(null)
      return
    }

    const timer = setTimeout(async () => {
      setIsAnalyzing(true)
      try {
        const res: ClassifyResponse = await aiApi.classify(text)
        setAnalysis(res)
        if (res.predicted_category?.category_id && selectedCategory === null) {
          setSelectedCategory(res.predicted_category.category_id)
        }
      } catch (err) {
        console.warn('Live NLP preview failed:', err)
      } finally {
        setIsAnalyzing(false)
      }
    }, 600)

    return () => clearTimeout(timer)
  }, [text])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      const payload = {
        original_text: text,
        category_id: selectedCategory || analysis?.predicted_category?.category_id || 8,
        location_text: locationText || undefined,
        landmark: landmark || undefined,
        language: analysis?.detected_language || 'en',
        is_code_mixed: analysis?.is_code_mixed || false,
        priority: analysis?.suggested_priority || 'normal',
      }

      const res = await complaintsApi.create(payload)
      navigate(`/complaints/${res.id}`)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to submit complaint. Please check your connection.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', color: '#0f172a' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
          📝 Register a Civic Grievance
        </h1>
        <p style={{ color: '#334155', fontSize: '15px', marginTop: '6px' }}>
          Type or speak naturally in English, Hindi/Hinglish, Kannada/Kanglish, or regional languages. Our NLP engine will analyze in real time.
        </p>
      </div>

      {/* Multilingual Example Chips */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px', letterSpacing: '0.04em' }}>
          TRY 1-CLICK MULTILINGUAL EXAMPLES:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {EXAMPLE_COMPLAINTS.map((ex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setText(ex.text)}
              style={{
                fontSize: '13px',
                padding: '7px 14px',
                backgroundColor: '#ffffff',
                border: '1.5px solid #cbd5e1',
                borderRadius: '20px',
                cursor: 'pointer',
                color: '#0f172a',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                fontWeight: 500,
              }}
            >
              <span style={{
                background: '#e0f2fe',
                color: '#0369a1',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: 700
              }}>
                {ex.lang}
              </span>
              <span>{ex.text}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Form Column */}
        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '26px', border: '1.5px solid #cbd5e1', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                padding: '12px 16px',
                background: '#fef2f2',
                color: '#b91c1c',
                border: '1.5px solid #fecaca',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '18px'
              }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <label htmlFor="complaint-text-input" style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                  Complaint Description *
                </label>

                {/* Inline Voice Input Button & Language Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <select
                    value={micLang}
                    onChange={(e) => setMicLang(e.target.value)}
                    style={{
                      fontSize: '12px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      background: '#f8fafc',
                      color: '#0f172a',
                      fontWeight: 600
                    }}
                  >
                    <option value="hi-IN">🇮🇳 हिन्दी (Hindi)</option>
                    <option value="kn-IN">🇮🇳 ಕನ್ನಡ (Kannada)</option>
                    <option value="en-IN">🇮🇳 English / Hinglish</option>
                    <option value="mr-IN">🇮🇳 मराठी (Marathi)</option>
                    <option value="ta-IN">🇮🇳 தமிழ் (Tamil)</option>
                    <option value="te-IN">🇮🇳 తెలుగు (Telugu)</option>
                  </select>

                  <button
                    type="button"
                    onClick={toggleInlineMic}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '20px',
                      border: 'none',
                      background: isListening ? '#dc2626' : '#0d9488',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: isListening ? '0 0 0 3px rgba(220,38,38,0.2)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {isListening ? '⏹️ Stop Mic' : '🎙️ Speak'}
                  </button>

                  {isAnalyzing && <span style={{ color: '#0d9488', fontSize: '12px', fontWeight: 700 }}>⚡ NLP analyzing...</span>}
                </div>
              </div>

              <textarea
                id="complaint-text-input"
                rows={5}
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
                placeholder="Describe your issue... e.g. 'Hamare street mein drainage overflow ho raha hai' or speak using the mic above"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '15px',
                  fontFamily: 'inherit',
                  color: '#0f172a',
                  backgroundColor: '#ffffff',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label htmlFor="complaint-location-input" style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                Location / Address *
              </label>
              <input
                id="complaint-location-input"
                type="text"
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                required
                placeholder="e.g. 5th Cross, Indiranagar, Bengaluru"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '14px',
                  color: '#0f172a',
                  backgroundColor: '#ffffff',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="complaint-landmark-input" style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                Nearby Landmark (Optional)
              </label>
              <input
                id="complaint-landmark-input"
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Near Metro Station / BDA Complex"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '14px',
                  color: '#0f172a',
                  backgroundColor: '#ffffff',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="category-select" style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                Override Category (Optional)
              </label>
              <select
                id="category-select"
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '14px',
                  color: '#0f172a',
                  boxSizing: 'border-box',
                  background: '#ffffff'
                }}
              >
                <option value="">AI Auto-Select</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>

            <button
              id="submit-complaint-btn"
              type="submit"
              disabled={isSubmitting || !text.trim()}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #16a34a, #0d9488)',
                color: 'white',
                fontWeight: 700,
                borderRadius: '8px',
                border: 'none',
                cursor: (isSubmitting || !text.trim()) ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
                opacity: (isSubmitting || !text.trim()) ? 0.6 : 1,
                transition: 'all 0.2s ease',
              }}
            >
              {isSubmitting ? '⏳ Registering Grievance...' : '✅ Submit Grievance'}
            </button>
          </form>
        </div>

        {/* Live NLP Analysis Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            padding: '24px',
            border: '1.5px solid #cbd5e1',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
          }}>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🧠</span> Real-Time NLP Intelligence
            </h3>

            {!analysis ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: '#475569' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>💬</div>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, lineHeight: 1.5 }}>
                  Start typing or speaking above to see live language detection, priority extraction, and category classification.
                </p>
              </div>
            ) : (
              <div>
                {/* Language & Code-mixing Badges */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '5px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    background: '#eff6ff',
                    color: '#1e40af',
                  }}>
                    🌐 Language: {analysis.detected_language?.toUpperCase() || 'UNKNOWN'}
                  </span>
                  {analysis.is_code_mixed && (
                    <span style={{
                      padding: '5px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      background: '#fdf4ff',
                      color: '#a21caf',
                    }}>
                      🔀 Code-Mixed Dialect
                    </span>
                  )}
                  <span style={{
                    padding: '5px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    background: analysis.suggested_priority === 'urgent' ? '#fee2e2' : analysis.suggested_priority === 'high' ? '#ffedd5' : '#f8fafc',
                    color: analysis.suggested_priority === 'urgent' ? '#b91c1c' : analysis.suggested_priority === 'high' ? '#c2410c' : '#334155',
                  }}>
                    ⚡ Priority: {analysis.suggested_priority?.toUpperCase()}
                  </span>
                </div>

                {/* Top Prediction */}
                <div style={{
                  padding: '16px',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  marginBottom: '16px',
                }}>
                  <div style={{ fontSize: '12px', color: '#475569', fontWeight: 600, textTransform: 'uppercase' }}>
                    Predicted Civic Category
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                    {analysis.predicted_category?.category_name}
                  </div>
                  {analysis.predicted_category?.confidence !== undefined && (
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#334155', fontWeight: 600 }}>
                        <span>AI Confidence</span>
                        <span>{Math.round(analysis.predicted_category.confidence * 100)}%</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', marginTop: '4px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${Math.round(analysis.predicted_category.confidence * 100)}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #16a34a, #0d9488)',
                          borderRadius: '4px',
                        }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Priority Reason */}
                {analysis.priority_reason && (
                  <div style={{ fontSize: '13px', color: '#334155', marginBottom: '16px', background: '#f1f5f9', padding: '10px 14px', borderRadius: '8px' }}>
                    <strong style={{ color: '#0f172a' }}>Priority Reasoning:</strong> {analysis.priority_reason}
                  </div>
                )}

                {/* Model Info */}
                <div style={{ fontSize: '12px', color: '#475569', borderTop: '1px solid #e2e8f0', paddingTop: '10px', fontWeight: 500 }}>
                  Model: {analysis.model_name} • Latency: {analysis.latency_ms?.toFixed(1)} ms
                </div>
              </div>
            )}
          </div>

          {/* Duplicates Alert */}
          {analysis?.similar_complaints && analysis.similar_complaints.length > 0 && (
            <div style={{
              background: '#fffbeb',
              border: '1.5px solid #fde68a',
              borderRadius: '14px',
              padding: '18px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#92400e', fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>
                <span>⚠️</span> Potential Existing Complaints Found
              </div>
              <p style={{ fontSize: '13px', color: '#78350f', margin: '0 0 12px 0' }}>
                We detected similar reports in the system. Check if your issue has already been logged:
              </p>
              {analysis.similar_complaints.map((sim, i) => (
                <div key={i} style={{
                  padding: '10px 14px',
                  background: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #fef3c7',
                  marginBottom: '8px',
                  fontSize: '13px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#0f172a' }}>
                    <span>#{sim.reference_id}</span>
                    <span style={{ color: '#d97706' }}>{Math.round(sim.similarity_score * 100)}% match</span>
                  </div>
                  <div style={{ color: '#475569', marginTop: '3px' }}>{sim.text_snippet}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
