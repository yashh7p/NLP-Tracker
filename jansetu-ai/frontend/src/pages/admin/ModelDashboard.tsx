import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { aiApi } from '../../services/api'
import { EXAMPLE_COMPLAINTS, type ModelInfo, type ClassifyResponse } from '../../types'

export default function AdminModelDashboardPage() {
  const [testText, setTestText] = useState('')
  const [lrResult, setLrResult] = useState<ClassifyResponse | null>(null)
  const [svmResult, setSvmResult] = useState<ClassifyResponse | null>(null)
  const [testing, setTesting] = useState(false)
  const [testError, setTestError] = useState<string | null>(null)

  const { data: models = [], isLoading: modelsLoading, isError: modelsError } = useQuery<ModelInfo[]>({
    queryKey: ['admin-models'],
    queryFn: () => aiApi.modelInfo(),
  })

  const { data: evalReport } = useQuery({
    queryKey: ['admin-eval-report'],
    queryFn: () => aiApi.evaluation(),
  })

  const handleBenchmark = async (textToTest: string) => {
    if (!textToTest.trim()) return
    setTesting(true)
    setTestError(null)
    try {
      const [lr, svm] = await Promise.all([
        aiApi.classify(textToTest, 'logistic_regression'),
        aiApi.classify(textToTest, 'svm'),
      ])
      setLrResult(lr)
      setSvmResult(svm)
    } catch (e: any) {
      console.error('Benchmark test error:', e)
      setTestError(e?.message || 'Error running model inference benchmark')
    } finally {
      setTesting(false)
    }
  }

  const modelList = Array.isArray(models) ? models : []

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
          🤖 NLP Model Benchmark & Evaluation Dashboard
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
          Empirical comparison between Model A (TF-IDF + Logistic Regression) and Model B (TF-IDF + Linear SVM)
        </p>
      </div>

      {modelsError && (
        <div style={{
          padding: '12px 16px',
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '8px',
          marginBottom: '20px',
          color: '#92400e',
          fontSize: '13px',
          fontWeight: 600,
        }}>
          ⚠️ Backend model metadata could not be refreshed from server. Displaying local cached model performance stats.
        </div>
      )}

      {/* Model Cards Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {modelsLoading ? (
          <div style={{ padding: '30px', color: '#64748b' }}>Loading model metadata...</div>
        ) : modelList.length === 0 ? (
          <div style={{ padding: '30px', color: '#64748b' }}>No models currently registered.</div>
        ) : (
          modelList.map((m) => {
            const displayName =
              m.name === 'logistic_regression'
                ? 'Model A: Logistic Regression'
                : m.name === 'svm'
                ? 'Model B: Linear SVM'
                : `Model: ${m.name}`

            return (
              <div key={m.name} style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                    {displayName}
                  </span>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: m.is_available ? '#ecfdf5' : '#fef2f2',
                    color: m.is_available ? '#059669' : '#dc2626'
                  }}>
                    {m.is_available ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>

                <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                  {m.description || (m.notes ? m.notes : 'Civic grievance classification model')}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>TEST ACCURACY</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                      {typeof m.accuracy === 'number' ? `${(m.accuracy * 100).toFixed(1)}%` : '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>MACRO F1-SCORE</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#0d9488' }}>
                      {typeof m.macro_f1 === 'number' ? m.macro_f1.toFixed(3) : '—'}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Model Sandbox Comparison */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '28px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>
          🧪 Side-by-Side Model Inference Sandbox
        </h3>
        <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
          Test any multilingual or code-mixed input across both classifiers concurrently to analyze confidence scores and latency.
        </p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {EXAMPLE_COMPLAINTS.slice(0, 4).map((ex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setTestText(ex.text)
                handleBenchmark(ex.text)
              }}
              style={{
                fontSize: '12px',
                padding: '6px 12px',
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '16px',
                cursor: 'pointer',
                color: '#334155'
              }}
            >
              {ex.lang}: {ex.text.slice(0, 24)}...
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <input
            type="text"
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder="Type a test complaint (e.g. 'Street light off aagide indiranagar alli')..."
            style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px' }}
          />
          <button
            type="button"
            onClick={() => handleBenchmark(testText)}
            disabled={testing || !testText.trim()}
            style={{
              padding: '10px 20px',
              background: '#0d9488',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: testing ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            {testing ? 'Benchmarking...' : 'Compare Models'}
          </button>
        </div>

        {testError && (
          <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '13px', marginBottom: '16px' }}>
            ⚠️ {testError}
          </div>
        )}

        {/* Results Comparison Grid */}
        {(lrResult || svmResult) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* Model A Result */}
            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                Model A: Logistic Regression
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                {lrResult?.predicted_category?.category_name || 'Unclassified'}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Confidence: {typeof lrResult?.predicted_category?.confidence === 'number' ? `${Math.round(lrResult.predicted_category.confidence * 100)}%` : 'N/A'}
                {' • '}
                Latency: {typeof lrResult?.latency_ms === 'number' ? `${lrResult.latency_ms.toFixed(2)} ms` : 'N/A'}
              </div>
            </div>

            {/* Model B Result */}
            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                Model B: Linear SVM (Calibrated)
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                {svmResult?.predicted_category?.category_name || 'Unclassified'}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Confidence: {typeof svmResult?.predicted_category?.confidence === 'number' ? `${Math.round(svmResult.predicted_category.confidence * 100)}%` : 'N/A'}
                {' • '}
                Latency: {typeof svmResult?.latency_ms === 'number' ? `${svmResult.latency_ms.toFixed(2)} ms` : 'N/A'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Raw Evaluation Report Details */}
      {evalReport && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 12px 0' }}>
            📑 Model Performance Evaluation Report
          </h3>
          <pre style={{
            background: '#0f172a',
            color: '#38bdf8',
            padding: '16px',
            borderRadius: '8px',
            fontSize: '12px',
            overflowX: 'auto',
            maxHeight: '300px'
          }}>
            {JSON.stringify(evalReport, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
