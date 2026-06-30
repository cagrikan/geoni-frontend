import { useState } from 'react'

function App() {
  const [domain, setDomain] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleAudit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/audit/quick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, email, competitors: [] })
      })
      const data = await res.json()
      setResult(data)
    } catch (err) {
      alert('Error: ' + err.message)
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', fontFamily: 'sans-serif' }}>
      <h1>GEONI Visibility Scanner</h1>
      {!result ? (
        <form onSubmit={handleAudit}>
          <input type="text" placeholder="Domain" value={domain} onChange={(e) => setDomain(e.target.value)} required style={{ width: '100%', padding: '8px', marginBottom: '10px' }} />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '8px', marginBottom: '10px' }} />
          <button type="submit" disabled={loading}>{loading ? 'Running...' : 'Start Audit'}</button>
        </form>
      ) : (
        <div>
          <h2>Result</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
          <button onClick={() => setResult(null)}>New Audit</button>
        </div>
      )}
    </div>
  )
}

export default App
