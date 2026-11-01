import { Link } from 'react-router-dom'

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a' }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🏛️</span>
          <span style={{ fontWeight: 800, fontSize: '18px', background: 'linear-gradient(135deg, #16a34a, #0d9488)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            JanSetu AI
          </span>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link to="/" style={{ color: '#475569', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Home</Link>
          <Link to="/login" style={{ color: '#0d9488', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>Login</Link>
          <Link to="/register" style={{
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #16a34a, #0d9488)',
            color: 'white',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 600,
          }}>Register</Link>
        </div>
      </header>

      {/* Main content */}
      <main style={{ maxWidth: '960px', margin: '40px auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: '20px',
            background: '#ecfdf5',
            color: '#059669',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '12px'
          }}>
            Academic NLP Project
          </span>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
            About JanSetu AI
          </h1>
          <p style={{ fontSize: '16px', color: '#64748b', maxWidth: '640px', margin: '0 auto' }}>
            Multilingual and Code-Mixed Civic Complaint Classification Using Natural Language Processing
          </p>
        </div>

        <section style={{ background: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', color: '#1e293b' }}>
            🎯 Problem Statement & Motivation
          </h2>
          <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: '16px' }}>
            In multilingual societies such as India, citizens express their civic grievances using their native languages or code-mixed dialects like <strong>Hinglish</strong> (Hindi + English) and <strong>Kanglish</strong> (Kannada + English) written in Roman script. Traditional civic redressal portals typically support only standardized English, leading to significant reporting barriers, misclassification, duplicate entries, and delayed municipal action.
          </p>
          <p style={{ color: '#475569', lineHeight: 1.7 }}>
            JanSetu AI bridges this gap with an end-to-end NLP architecture capable of recognizing code-mixed and vernacular text, classifying complaints into 8 civic categories, determining urgency/priority, and flagging semantic duplicates.
          </p>
        </section>

        <section style={{ background: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', color: '#1e293b' }}>
            🔬 NLP Architecture & Models
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginTop: '16px' }}>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
                1. Text Normalization
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
                Transliteration mapping, repeated character compression (e.g. "paaaani" → "paani"), slang resolution, and language identification.
              </p>
            </div>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
                2. Multi-Model Benchmark
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
                Comparative evaluation of <strong>TF-IDF + Logistic Regression</strong>, <strong>Linear SVM</strong>, and multilingual transformer embeddings.
              </p>
            </div>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
                3. Semantic Deduplication
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
                Cosine similarity scoring across vector embeddings to identify duplicate citizen reports within the same locality.
              </p>
            </div>
          </div>
        </section>

        <section style={{ background: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', color: '#1e293b' }}>
            👥 Academic Information
          </h2>
          <p style={{ color: '#475569', lineHeight: 1.7 }}>
            Developed as a comprehensive university course project for <strong>Natural Language Processing</strong>. Complete with live inference pipelines, empirical performance comparisons, automated priority routing, and voice-assisted grievance submission.
          </p>
        </section>
      </main>
    </div>
  )
}
