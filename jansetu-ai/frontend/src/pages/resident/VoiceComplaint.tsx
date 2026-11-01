import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { aiApi, complaintsApi } from '../../services/api'
import { type ClassifyResponse } from '../../types'

interface SupportedLanguage {
  code: string
  name: string
  nativeName: string
  flag: string
  sample: string
}

const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', sample: 'हमारे इलाके में पानी नहीं आ रहा है, कृपया समाधान करें।' },
  { code: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳', sample: 'ನಮ್ಮ ರಸ್ತೆಯಲ್ಲಿ ದೊಡ್ಡ ಗುಂಡಿಗಳು ಇವೆ ಮತ್ತು ವಾಹನಗಳಿಗೆ ತೊಂದರೆಯಾಗಿದೆ.' },
  { code: 'en-IN', name: 'English / Hinglish', nativeName: 'English', flag: '🇮🇳', sample: 'Street light is broken near bus stop and garbage is overflowing.' },
  { code: 'mr-IN', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳', sample: 'रस्त्यावरील दिवे बंद आहेत आणि कचरा साचला आहे.' },
  { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', sample: 'எங்கள் பகுதியில் குடிநீர் குழாய் உடைந்து தண்ணீர் வீணாகிறது.' },
  { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳', sample: 'మా వీధిలో విద్యుత్ స్తంభం దెబ్బతింది, లైట్లు వెలగడం లేదు.' },
  { code: 'bn-IN', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳', sample: 'আমাদের এলাকায় নোংরা জল উপচে পড়ছে এবং নর্দমা বন্ধ।' },
  { code: 'gu-IN', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳', sample: 'અમારા વિસ્તારમાં પીવાનું પાણી આવતું નથી.' },
]

export default function VoiceComplaintPage() {
  const [selectedLang, setSelectedLang] = useState('hi-IN')
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [locationText, setLocationText] = useState('')
  const [analysis, setAnalysis] = useState<ClassifyResponse | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [voiceCommandFeedback, setVoiceCommandFeedback] = useState<string | null>(null)
  const [speechSupported, setSpeechSupported] = useState(true)

  const recognitionRef = useRef<any>(null)
  const isRecordingRef = useRef(false)
  const currentLangRef = useRef(selectedLang)
  const navigate = useNavigate()

  // Keep ref updated
  useEffect(() => {
    currentLangRef.current = selectedLang
  }, [selectedLang])

  // Process Voice Commands
  const handleVoiceCommand = useCallback((spokenText: string) => {
    const lower = spokenText.toLowerCase().trim()

    // 1. Submit commands
    const submitTriggers = [
      'submit', 'submit complaint', 'submit grievance',
      'जमा करें', 'दर्ज करें', 'सब्मिट', 'सबमिट करो', 'शिकायत दर्ज करें',
      'ದಾಖಲಿಸಿ', 'ಕಳುಹಿಸು', 'ಸಲ್ಲಿಕೆ',
      'पाठवा', 'नोंदवा', 'సమర్పించు', 'சமர்ப்பிக்கவும்'
    ]
    const matchedSubmit = submitTriggers.find(cmd => lower.endsWith(cmd) || lower === cmd)
    if (matchedSubmit) {
      setVoiceCommandFeedback(`⚡ Voice Command Recognized: "${matchedSubmit}" → Submitting complaint!`)
      // Clean command from transcript
      const cleanText = spokenText.replace(new RegExp(`${matchedSubmit}$`, 'i'), '').trim()
      if (cleanText) setTranscript(cleanText)
      setTimeout(() => {
        handleSubmit()
      }, 800)
      return true
    }

    // 2. Clear / Reset commands
    const clearTriggers = [
      'clear', 'reset', 'start over',
      'साफ़ करें', 'हटाएं', 'मिटाएं', 'रद्द करें', 'फिर से',
      'ರದ್ದು', 'ತೆರವುಗೊಳಿಸು', 'ಹೊಸದಾಗಿ',
      'पुन्हा', 'తొలగించు', 'அழிக்கவும்'
    ]
    const matchedClear = clearTriggers.find(cmd => lower.endsWith(cmd) || lower === cmd)
    if (matchedClear) {
      setVoiceCommandFeedback(`🧹 Voice Command Recognized: "${matchedClear}" → Cleared transcript!`)
      setTranscript('')
      setAnalysis(null)
      setTimeout(() => setVoiceCommandFeedback(null), 3000)
      return true
    }

    // 3. Stop command
    const stopTriggers = ['stop', 'रोकें', 'रुकें', 'बंद करो', 'ನಿಲ್ಲಿಸು', 'थांबा', 'ఆపు', 'நிறுத்து']
    const matchedStop = stopTriggers.find(cmd => lower.endsWith(cmd) || lower === cmd)
    if (matchedStop) {
      setVoiceCommandFeedback(`⏹️ Voice Command Recognized: "${matchedStop}" → Stopped listening`)
      isRecordingRef.current = false
      recognitionRef.current?.stop()
      setIsRecording(false)
      setTimeout(() => setVoiceCommandFeedback(null), 3000)
      return true
    }

    return false
  }, [])

  // Initialize or update SpeechRecognition
  const initSpeechRecognition = useCallback((langCode: string) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSpeechSupported(false)
      return null
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = langCode

    recognition.onresult = (event: any) => {
      let current = ''
      for (let i = 0; i < event.results.length; i++) {
        current += event.results[i][0].transcript + ' '
      }
      const fullText = current.trim()
      setTranscript(fullText)

      // Test for voice command
      handleVoiceCommand(fullText)
    }

    recognition.onerror = (e: any) => {
      if (e.error === 'no-speech') {
        // Keep listening unless intentionally stopped
        return
      }
      console.warn('Speech recognition error:', e.error)
      if (e.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone permissions in your browser bar.')
        setIsRecording(false)
        isRecordingRef.current = false
      }
    }

    recognition.onend = () => {
      // Auto-restart if user has not explicitly stopped
      if (isRecordingRef.current) {
        try {
          recognition.start()
        } catch {
          setIsRecording(false)
          isRecordingRef.current = false
        }
      } else {
        setIsRecording(false)
      }
    }

    return recognition
  }, [handleVoiceCommand])

  // Setup on mount
  useEffect(() => {
    const rec = initSpeechRecognition(selectedLang)
    if (rec) {
      recognitionRef.current = rec
    }
    return () => {
      isRecordingRef.current = false
      try {
        recognitionRef.current?.stop()
      } catch {}
    }
  }, [initSpeechRecognition, selectedLang])

  // Switch Language
  const changeLanguage = (langCode: string) => {
    setSelectedLang(langCode)
    const wasRecording = isRecordingRef.current

    if (wasRecording) {
      recognitionRef.current?.stop()
    }

    const rec = initSpeechRecognition(langCode)
    if (rec) {
      recognitionRef.current = rec
      if (wasRecording) {
        try {
          rec.start()
          setIsRecording(true)
          isRecordingRef.current = true
        } catch {}
      }
    }
  }

  const toggleRecording = () => {
    if (!speechSupported) {
      setError('Web Speech API is not supported in this browser. Please use Google Chrome or Microsoft Edge.')
      return
    }

    if (isRecording) {
      isRecordingRef.current = false
      recognitionRef.current?.stop()
      setIsRecording(false)
    } else {
      setError(null)
      setVoiceCommandFeedback(null)
      try {
        isRecordingRef.current = true
        recognitionRef.current?.start()
        setIsRecording(true)
      } catch (err) {
        console.error('Start recording error:', err)
        // If already started, stop then restart
        try {
          recognitionRef.current?.stop()
          setTimeout(() => {
            recognitionRef.current?.start()
            setIsRecording(true)
            isRecordingRef.current = true
          }, 200)
        } catch {}
      }
    }
  }

  // Analyze transcript with NLP when updated
  useEffect(() => {
    if (transcript.trim().length < 4) return

    const timer = setTimeout(async () => {
      setIsAnalyzing(true)
      try {
        const res: ClassifyResponse = await aiApi.classify(transcript)
        setAnalysis(res)
      } catch (err) {
        console.warn('Voice NLP analysis error:', err)
      } finally {
        setIsAnalyzing(false)
      }
    }, 600)

    return () => clearTimeout(timer)
  }, [transcript])

  const handleSubmit = async () => {
    if (!transcript.trim()) return
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await complaintsApi.create({
        original_text: transcript,
        category_id: analysis?.predicted_category?.category_id || 8,
        location_text: locationText || 'Location from voice submission',
        language: analysis?.detected_language || selectedLang.split('-')[0],
        is_code_mixed: analysis?.is_code_mixed || false,
        priority: analysis?.suggested_priority || 'medium',
      })
      navigate(`/complaints/${res.id}`)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to submit voice complaint. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const activeLangObj = SUPPORTED_LANGUAGES.find(l => l.code === selectedLang) || SUPPORTED_LANGUAGES[0]

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', color: '#0f172a' }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
          🎙️ Multilingual Voice Grievance Assistant
        </h1>
        <p style={{ color: '#334155', fontSize: '15px', margin: 0, maxWidth: '640px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
          Speak naturally in your preferred language or code-mixed dialects. Our NLP engine will detect spoken words, classify categories, and extract urgency in real time.
        </p>
      </div>

      {/* Language Selector Banner */}
      <div style={{
        background: '#ffffff',
        borderRadius: '14px',
        padding: '16px 20px',
        border: '1.5px solid #cbd5e1',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            🗣️ Step 1: Select Spoken Language
          </span>
          <span style={{ fontSize: '12px', color: '#0f766e', fontWeight: 600 }}>
            Active: {activeLangObj.flag} {activeLangObj.name} ({activeLangObj.nativeName})
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = selectedLang === lang.code
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => changeLanguage(lang.code)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '24px',
                  border: isSelected ? '2px solid #0f766e' : '1px solid #cbd5e1',
                  background: isSelected ? '#0f766e' : '#f8fafc',
                  color: isSelected ? '#ffffff' : '#1e293b',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: isSelected ? '0 2px 6px rgba(15,118,110,0.25)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{lang.flag}</span>
                <span>{lang.nativeName}</span>
                <span style={{ fontSize: '11px', opacity: isSelected ? 0.9 : 0.7 }}>({lang.name})</span>
              </button>
            )
          })}
        </div>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px',
          background: '#fef2f2',
          border: '1.5px solid #fecaca',
          borderRadius: '10px',
          color: '#b91c1c',
          fontSize: '14px',
          fontWeight: 600,
          marginBottom: '20px',
        }}>
          ⚠️ {error}
        </div>
      )}

      {voiceCommandFeedback && (
        <div style={{
          padding: '12px 16px',
          background: '#ecfdf5',
          border: '1.5px solid #a7f3d0',
          borderRadius: '10px',
          color: '#065f46',
          fontSize: '14px',
          fontWeight: 700,
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'shimmer 1.5s ease-in-out'
        }}>
          {voiceCommandFeedback}
        </div>
      )}

      {/* Voice Recording Control Box */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '36px 24px',
        border: '1.5px solid #cbd5e1',
        textAlign: 'center',
        marginBottom: '20px',
        boxShadow: '0 4px 20px rgba(15,23,42,0.06)'
      }}>
        <button
          id="voice-record-btn"
          type="button"
          onClick={toggleRecording}
          style={{
            width: '96px',
            height: '96px',
            borderRadius: '50%',
            border: 'none',
            background: isRecording
              ? 'linear-gradient(135deg, #ef4444, #dc2626)'
              : 'linear-gradient(135deg, #16a34a, #0d9488)',
            color: 'white',
            fontSize: '38px',
            cursor: 'pointer',
            boxShadow: isRecording
              ? '0 0 0 14px rgba(239, 68, 68, 0.25)'
              : '0 4px 18px rgba(13, 148, 136, 0.35)',
            transition: 'all 0.3s ease',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isRecording ? '⏹️' : '🎙️'}
        </button>

        <div style={{ marginTop: '20px' }}>
          <div style={{ fontSize: '18px', fontWeight: 800, color: isRecording ? '#dc2626' : '#0f172a' }}>
            {isRecording
              ? `🔴 Listening in ${activeLangObj.name} (${activeLangObj.nativeName})...`
              : `Tap Microphone to Speak in ${activeLangObj.nativeName}`}
          </div>
          <div style={{ fontSize: '14px', color: '#475569', marginTop: '6px' }}>
            {isRecording
              ? 'Speak your complaint clearly into the mic. Tap again when finished.'
              : 'Or try speaking any grievance in Hindi, Kannada, English, Marathi, Tamil, etc.'}
          </div>
        </div>

        {/* Live Audio Visualizer Dots */}
        {isRecording && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                style={{
                  width: '8px',
                  height: `${16 + (i % 3) * 10}px`,
                  backgroundColor: '#ef4444',
                  borderRadius: '4px',
                  animation: `wave 0.8s ease-in-out ${i * 0.12}s infinite alternate`
                }}
              />
            ))}
          </div>
        )}

        {/* Voice Commands Cheat Sheet */}
        <div style={{
          marginTop: '24px',
          padding: '12px 16px',
          background: '#f8fafc',
          borderRadius: '10px',
          border: '1px dashed #cbd5e1',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          fontSize: '12px',
          color: '#334155'
        }}>
          <strong style={{ color: '#0f172a' }}>💡 Built-in Voice Commands:</strong>
          <span style={{ background: '#e2e8f0', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
            Say "Submit" or "जमा करें" to submit
          </span>
          <span style={{ background: '#e2e8f0', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
            Say "Clear" or "साफ़ करें" to reset
          </span>
          <span style={{ background: '#e2e8f0', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
            Say "Stop" or "रोकें" to pause
          </span>
        </div>
      </div>

      {/* Quick 1-Click Samples for Easy Testing */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        padding: '14px 18px',
        border: '1px solid #cbd5e1',
        marginBottom: '20px'
      }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>
          ⚡ Or click a sample phrase in {activeLangObj.name}:
        </div>
        <button
          type="button"
          onClick={() => setTranscript(activeLangObj.sample)}
          style={{
            padding: '8px 14px',
            background: '#f1f5f9',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#0f172a',
            cursor: 'pointer',
            textAlign: 'left',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>💬 "{activeLangObj.sample}"</span>
          <span style={{ color: '#0f766e', fontSize: '11px', fontWeight: 700 }}>[Use Sample]</span>
        </button>
      </div>

      {/* Transcription & NLP Feedback */}
      <div style={{ background: '#ffffff', borderRadius: '14px', padding: '24px', border: '1.5px solid #cbd5e1', marginBottom: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <label htmlFor="voice-transcript-input" style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
            Transcribed Grievance Text
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {transcript && (
              <button
                type="button"
                onClick={() => { setTranscript(''); setAnalysis(null); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#dc2626',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Clear Text
              </button>
            )}
            {isAnalyzing && <span style={{ fontSize: '12px', color: '#0f766e', fontWeight: 700 }}>⚡ NLP Analyzing...</span>}
          </div>
        </div>

        <textarea
          id="voice-transcript-input"
          rows={4}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder={`Speak using the mic above in ${activeLangObj.name} or type directly here...`}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '8px',
            border: '1.5px solid #cbd5e1',
            fontSize: '15px',
            lineHeight: 1.5,
            color: '#0f172a',
            backgroundColor: '#ffffff',
            boxSizing: 'border-box'
          }}
        />

        <div style={{ marginTop: '16px' }}>
          <label htmlFor="voice-location-input" style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
            Location / Ward / Area *
          </label>
          <input
            id="voice-location-input"
            type="text"
            value={locationText}
            onChange={(e) => setLocationText(e.target.value)}
            placeholder="e.g. Near Bus Stand, Sector 4, MG Road"
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

        {/* Live NLP Results */}
        {analysis && (
          <div style={{
            marginTop: '20px',
            padding: '18px',
            background: '#f8fafc',
            borderRadius: '10px',
            border: '1.5px solid #cbd5e1'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>Predicted Category: </span>
                <strong style={{ fontSize: '16px', color: '#0f172a', marginLeft: '4px' }}>
                  {analysis.predicted_category?.category_name}
                </strong>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  background: '#dbeafe',
                  color: '#1e40af'
                }}>
                  🌐 {analysis.detected_language?.toUpperCase()}
                </span>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  background: analysis.suggested_priority === 'urgent' ? '#fee2e2' : analysis.suggested_priority === 'high' ? '#ffedd5' : '#f1f5f9',
                  color: analysis.suggested_priority === 'urgent' ? '#b91c1c' : analysis.suggested_priority === 'high' ? '#c2410c' : '#334155'
                }}>
                  ⚡ {analysis.suggested_priority?.toUpperCase()} PRIORITY
                </span>
              </div>
            </div>

            {analysis.predicted_category?.confidence && (
              <div style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569' }}>
                  <span>AI Confidence Score</span>
                  <strong>{Math.round(analysis.predicted_category.confidence * 100)}%</strong>
                </div>
                <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.round(analysis.predicted_category.confidence * 100)}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #16a34a, #0d9488)',
                    borderRadius: '3px'
                  }} />
                </div>
              </div>
            )}
          </div>
        )}

        <button
          id="voice-submit-btn"
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !transcript.trim()}
          style={{
            marginTop: '22px',
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg, #16a34a, #0d9488)',
            color: 'white',
            fontWeight: 700,
            borderRadius: '8px',
            border: 'none',
            cursor: (isSubmitting || !transcript.trim()) ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
            opacity: (isSubmitting || !transcript.trim()) ? 0.6 : 1,
            transition: 'all 0.2s ease',
          }}
        >
          {isSubmitting ? '⏳ Submitting Grievance...' : '✅ Confirm and Submit Grievance'}
        </button>
      </div>
    </div>
  )
}
