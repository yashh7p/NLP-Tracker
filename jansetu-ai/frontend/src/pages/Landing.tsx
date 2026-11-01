import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { CATEGORIES, EXAMPLE_COMPLAINTS } from '../types'

const features = [
  { icon: '🌐', title: 'Multilingual NLP', desc: 'Understands English, Hinglish, and Kanglish — no translation needed.' },
  { icon: '🤖', title: 'AI Classification', desc: 'TF-IDF & transformer models predict category and priority instantly.' },
  { icon: '🎙️', title: 'Voice Complaints', desc: 'Speak in your language using the browser microphone.' },
  { icon: '📍', title: 'Location Mapping', desc: 'Pin your location on an interactive map with OpenStreetMap.' },
  { icon: '🔍', title: 'Duplicate Detection', desc: 'Semantic similarity finds related complaints automatically.' },
  { icon: '📊', title: 'Research Dashboard', desc: 'Compare model metrics, confusion matrices, and F1 scores live.' },
]

const steps = [
  { num: '01', title: 'Describe the Issue', desc: 'Type or speak your complaint in any language — Hindi, Kannada, English, or mixed.' },
  { num: '02', title: 'AI Analysis', desc: 'Our NLP pipeline classifies the complaint, detects language, and suggests priority.' },
  { num: '03', title: 'Review & Confirm', desc: 'Correct the AI prediction if needed, add your location, and submit.' },
  { num: '04', title: 'Track Progress', desc: 'Get real-time updates as your complaint is assigned and resolved.' },
]

function WaveAnimation() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '40px' }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  )
}

export default function LandingPage() {
  const [exampleIdx, setExampleIdx] = useState(0)
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setIsTyping(true)
      setTimeout(() => {
        setExampleIdx((i) => (i + 1) % EXAMPLE_COMPLAINTS.length)
        setIsTyping(false)
      }, 500)
    }, 3500)
    return () => clearInterval(timer)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* ── Navbar ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(250,250,249,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-border)',
        padding: '0 24px',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #1a6b4a, #0d9488)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🏛️</div>
            <span style={{ fontFamily: "'Outfit'", fontWeight: 800, fontSize: '1.3rem', background: 'linear-gradient(135deg, #1a6b4a, #0d9488)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              JanSetu AI
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link to="/about" style={{ color: 'var(--color-text-2)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>About</Link>
            <Link to="/login" className="btn-ghost" style={{ fontSize: '0.9rem' }}>Sign In</Link>
            <Link to="/register" className="btn-primary" style={{ fontSize: '0.9rem', padding: '8px 20px' }}>Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 50%, #f0fdfa 100%)',
        padding: '80px 24px 100px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(26, 107, 74, 0.1)', border: '1px solid rgba(26, 107, 74, 0.2)',
            borderRadius: '20px', padding: '6px 16px', marginBottom: '28px',
          }}>
            <span style={{ fontSize: '14px' }}>🎓</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-forest)', letterSpacing: '.02em' }}>
              University NLP Research Project
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.2rem, 5vw, 4rem)',
            fontFamily: "'Outfit'", fontWeight: 800,
            marginBottom: '20px', lineHeight: 1.15,
            color: '#0f172a',
          }}>
            Report Civic Issues in{' '}
            <span className="gradient-text">Your Own Language</span>
          </h1>

          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: '#334155', maxWidth: '680px', margin: '0 auto 40px', lineHeight: 1.7 }}>
            JanSetu AI understands English, Hindi, Kannada, and regional accents. File civic complaints using text or voice — our NLP pipeline classifies, prioritises, and routes your complaint automatically.
          </p>

          {/* Live example */}
          <div style={{
            background: 'white', border: '1.5px solid #cbd5e1',
            borderRadius: '16px', padding: '20px 24px', maxWidth: '600px', margin: '0 auto 40px',
            boxShadow: 'var(--shadow-md)', textAlign: 'left',
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <WaveAnimation />
              <span>Live AI Analysis</span>
              <span style={{ marginLeft: 'auto', background: 'rgba(26,107,74,0.1)', color: '#166534', padding: '2px 8px', borderRadius: '8px' }}>
                {EXAMPLE_COMPLAINTS[exampleIdx].lang}
              </span>
            </div>
            <p style={{
              fontSize: '1rem', color: '#0f172a', fontStyle: 'italic',
              opacity: isTyping ? 0.3 : 1, transition: 'opacity 0.3s',
              margin: '0 0 12px',
            }}>
              "{EXAMPLE_COMPLAINTS[exampleIdx].text}"
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ background: '#dbeafe', color: '#1e40af', padding: '4px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600 }}>💧 Water Supply</span>
              <span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600 }}>⚡ Priority: High</span>
              <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600 }}>✓ Classified</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/complaints/new/text" className="btn-primary" style={{ fontSize: '1rem', padding: '14px 28px' }}>
              📝 Type a Complaint
            </Link>
            <Link to="/complaints/new/voice" className="btn-secondary" style={{ fontSize: '1rem', padding: '12px 26px' }}>
              🎙️ Speak a Complaint
            </Link>
            <Link to="/register" className="btn-ghost" style={{ fontSize: '1rem', padding: '12px 20px' }}>
              Track My Complaint →
            </Link>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ padding: '80px 24px', background: 'var(--color-surface)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{ fontSize: '2rem', fontFamily: "'Outfit'", fontWeight: 800, marginBottom: '12px' }}>How It Works</h2>
            <p style={{ color: 'var(--color-text-2)', maxWidth: '500px', margin: '0 auto' }}>Four simple steps to get your civic issue addressed</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
            {steps.map((step) => (
              <div key={step.num} className="card" style={{ padding: '28px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ fontSize: '3.5rem', fontFamily: "'Outfit'", fontWeight: 900, color: 'rgba(26,107,74,0.08)', position: 'absolute', top: '8px', right: '16px', lineHeight: 1 }}>
                  {step.num}
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-forest)', marginBottom: '12px' }}>{step.num}</div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '8px' }}>{step.title}</h3>
                <p style={{ color: 'var(--color-text-2)', fontSize: '0.9rem', lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{ fontSize: '2rem', fontFamily: "'Outfit'", fontWeight: 800, marginBottom: '12px' }}>Powered by Real NLP</h2>
            <p style={{ color: 'var(--color-text-2)', maxWidth: '500px', margin: '0 auto' }}>Academic-grade multilingual NLP research, accessible to every citizen</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {features.map((f) => (
              <div key={f.title} className="card" style={{ padding: '24px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '2rem', flexShrink: 0 }}>{f.icon}</div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>{f.title}</h3>
                  <p style={{ color: 'var(--color-text-2)', fontSize: '0.88rem', lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Language Support ── */}
      <section style={{ padding: '64px 24px', background: 'var(--color-surface)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontFamily: "'Outfit'", fontWeight: 800, marginBottom: '12px' }}>Multilingual Support</h2>
          <p style={{ color: 'var(--color-text-2)', marginBottom: '36px' }}>
            Our NLP models handle code-mixed text — the natural way people actually write.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {[
              { lang: 'English', status: 'Full Support', color: '#dcfce7', text: '#166534', ex: '"Road has many potholes."' },
              { lang: 'Hinglish', status: 'Full Support', color: '#dbeafe', text: '#1e40af', ex: '"Paani nahi aa raha hai."' },
              { lang: 'Kanglish', status: 'Full Support', color: '#e0e7ff', text: '#3730a3', ex: '"Neeru bartha illa alli."' },
              { lang: 'Hindi (Devanagari)', status: 'Planned', color: '#fef3c7', text: '#92400e', ex: 'पानी नहीं आ रहा है।' },
            ].map((l) => (
              <div key={l.lang} style={{ background: l.color, borderRadius: '12px', padding: '20px' }}>
                <div style={{ fontWeight: 700, color: l.text, marginBottom: '6px' }}>{l.lang}</div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: l.text, opacity: 0.7, marginBottom: '10px', textTransform: 'uppercase' }}>{l.status}</div>
                <div style={{ fontSize: '0.85rem', color: l.text, fontStyle: 'italic' }}>{l.ex}</div>
              </div>
            ))}
          </div>
          <p style={{ marginTop: '20px', fontSize: '0.8rem', color: 'var(--color-text-3)' }}>
            * "Full Support" means the current model was trained and evaluated on these language combinations.
            Devanagari script support is planned for a future version.
          </p>
        </div>
      </section>

      {/* ── Categories ── */}
      <section style={{ padding: '64px 24px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontFamily: "'Outfit'", fontWeight: 800, textAlign: 'center', marginBottom: '12px' }}>8 Complaint Categories</h2>
          <p style={{ textAlign: 'center', color: 'var(--color-text-2)', marginBottom: '36px' }}>Our AI automatically classifies your complaint into the right department</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
            {CATEGORIES.map((cat) => (
              <div key={cat.id} style={{
                background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center',
                gap: '10px', transition: 'var(--transition)', cursor: 'default',
              }}>
                <span style={{ fontSize: '1.6rem' }}>{cat.icon}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-2)' }}>{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        padding: '80px 24px',
        background: 'linear-gradient(135deg, #1a6b4a 0%, #0d9488 100%)',
        textAlign: 'center', color: 'white',
      }}>
        <h2 style={{ fontSize: '2.2rem', fontFamily: "'Outfit'", fontWeight: 800, marginBottom: '16px', color: 'white' }}>
          Ready to Report a Civic Issue?
        </h2>
        <p style={{ fontSize: '1.1rem', opacity: 0.9, marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px' }}>
          Join JanSetu AI and make your voice heard — in whatever language feels natural.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register" style={{ background: 'white', color: '#1a6b4a', textDecoration: 'none', padding: '14px 28px', borderRadius: '40px', fontWeight: 700, fontSize: '1rem' }}>
            Get Started Free
          </Link>
          <Link to="/about" style={{ border: '2px solid rgba(255,255,255,0.5)', color: 'white', textDecoration: 'none', padding: '12px 26px', borderRadius: '40px', fontWeight: 600, fontSize: '1rem' }}>
            Learn About the Research
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: '#1c1917', color: '#a8a29e', padding: '40px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ color: 'white', fontFamily: "'Outfit'", fontWeight: 800, fontSize: '1.2rem', marginBottom: '6px' }}>JanSetu AI</div>
            <div style={{ fontSize: '0.85rem' }}>Multilingual Civic Complaint Classification — University NLP Project</div>
          </div>
          <div style={{ display: 'flex', gap: '24px', fontSize: '0.85rem' }}>
            <Link to="/about" style={{ color: '#a8a29e', textDecoration: 'none' }}>About</Link>
            <Link to="/register" style={{ color: '#a8a29e', textDecoration: 'none' }}>Register</Link>
            <Link to="/login" style={{ color: '#a8a29e', textDecoration: 'none' }}>Login</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
