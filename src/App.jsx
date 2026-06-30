import { useState } from 'react'
import LandingPage from './LandingPage'
import ResultsPage from './ResultsPage'
import './App.css'

function App() {
  const [view, setView] = useState('landing') // 'landing' | 'loading' | 'results'
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [statusText, setStatusText] = useState('queued')

  const apiUrl = import.meta.env.VITE_API_URL || 'https://api.geoni.ai'

  const pollJob = async (jobId) => {
    const statusLabels = {
      queued: 'Sıraya alındı',
      crawling: 'Site taranıyor',
      indexing: 'Dizin durumu kontrol ediliyor',
      scoring: 'Skor hesaplanıyor',
    }

    const maxAttempts = 60 // ~3 minutes at 3s interval
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 3000))
      try {
        const res = await fetch(`${apiUrl}/api/audit/${jobId}`)
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.detail || 'Tarama başarısız oldu')
        }
        const data = await res.json()
        if (data.status === 'complete') {
          setResult(data.result)
          setView('results')
          return
        }
        if (data.status === 'failed') {
          throw new Error('Tarama başarısız oldu')
        }
        setStatusText(statusLabels[data.status] || data.status)
      } catch (err) {
        setError(err.message)
        setView('landing')
        return
      }
    }
    setError('Tarama zaman aşımına uğradı, lütfen tekrar deneyin.')
    setView('landing')
  }

  const handleAudit = async (domain, email) => {
    setError(null)
    setView('loading')
    setStatusText('queued')
    try {
      const res = await fetch(`${apiUrl}/api/audit/quick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, email, competitors: [] }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail || 'İstek başarısız oldu')
      }
      const data = await res.json()
      await pollJob(data.job_id)
    } catch (err) {
      setError(err.message || 'Bağlantı hatası')
      setView('landing')
    }
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
    setView('landing')
  }

  return (
    <div className="app-shell">
      {view !== 'results' && (
        <LandingPage
          onSubmit={handleAudit}
          loading={view === 'loading'}
          statusText={statusText}
          error={error}
        />
      )}
      {view === 'results' && result && (
        <ResultsPage result={result} onReset={handleReset} />
      )}
    </div>
  )
}

export default App

