import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import GeoniMark from '../GeoniMark'
import {
  LayoutDashboard, Users, ScrollText, Search, Shield, ShieldOff,
  Plus, Minus, ChevronLeft, ChevronRight, ArrowLeft,
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'https://api.geoni.ai'
const PAGE_SIZE = 20

async function authedFetch(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token || ''
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || `İstek başarısız (${res.status})`)
  return res.json()
}

function StatTile({ label, value }) {
  return (
    <div className="admin-stat">
      <div className="admin-stat__value">{value}</div>
      <div className="admin-stat__label">{label}</div>
    </div>
  )
}

function OverviewTab() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    authedFetch('/api/admin/overview').then(setData).catch(e => setError(e.message))
  }, [])

  if (error) return <div className="admin-error">{error}</div>
  if (!data) return <div className="admin-loading">Yükleniyor…</div>

  const providers = Array.from(new Set([
    ...Object.keys(data.provider_usage?.today || {}),
    ...Object.keys(data.provider_usage?.week || {}),
  ]))

  return (
    <div className="admin-section">
      <div className="admin-stats-grid">
        <StatTile label="Toplam kullanıcı" value={data.total_users} />
        <StatTile label="Toplam tarama" value={data.total_audits} />
        <StatTile label="Bugünkü tarama" value={data.audits_today} />
        <StatTile label="Son 7 gün tarama" value={data.audits_week} />
        <StatTile label="Satılan kredi (toplam)" value={data.credits_purchased} />
        <StatTile label="Harcanan kredi (toplam)" value={data.credits_spent} />
      </div>

      <h3 className="admin-section__title">Dış AI motoru kullanımı</h3>
      <p className="admin-hint">
        Bu motorların kendi hesap bakiyeleri API üzerinden çekilemiyor (OpenAI, Anthropic, Google ve
        Perplexity bunun için bir uç nokta sunmuyor) — burada gösterilen, GEONI'nin bu motorlara yaptığı
        çağrı sayısıdır, gerçek kalan krediniz için sağlayıcı panellerine bakmanız gerekir.
      </p>
      {providers.length === 0 ? (
        <div className="admin-empty">Henüz kayıtlı motor çağrısı yok.</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr><th>Motor</th><th>Bugün</th><th>Son 7 gün</th></tr>
          </thead>
          <tbody>
            {providers.map(p => (
              <tr key={p}>
                <td style={{ textTransform: 'capitalize' }}>{p}</td>
                <td>{data.provider_usage?.today?.[p] ?? 0}</td>
                <td>{data.provider_usage?.week?.[p] ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function UsersTab() {
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [creditInputs, setCreditInputs] = useState({})

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ search, limit: PAGE_SIZE, offset: page * PAGE_SIZE })
    authedFetch(`/api/admin/users?${params}`)
      .then(res => { setUsers(res.users || []); setTotal(res.total || 0); setError(null) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [search, page])

  useEffect(() => { load() }, [load])

  const adjustCredits = async (userId, delta) => {
    if (!delta) return
    setBusyId(userId)
    try {
      await authedFetch(`/api/admin/users/${userId}/credits`, {
        method: 'POST',
        body: JSON.stringify({ delta, reason: 'Admin panelinden manuel duzeltme' }),
      })
      setCreditInputs(prev => ({ ...prev, [userId]: '' }))
      load()
    } catch (e) { setError(e.message) } finally { setBusyId(null) }
  }

  const toggleAdmin = async (userId, current) => {
    setBusyId(userId)
    try {
      await authedFetch(`/api/admin/users/${userId}/admin-flag`, {
        method: 'POST',
        body: JSON.stringify({ is_admin: !current }),
      })
      load()
    } catch (e) { setError(e.message) } finally { setBusyId(null) }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="admin-section">
      <div className="admin-search">
        <Search size={15} strokeWidth={1.5} />
        <input
          placeholder="E-posta veya isimle ara…"
          value={search}
          onChange={e => { setPage(0); setSearch(e.target.value) }}
        />
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Kullanıcı</th><th>Kredi</th><th>Alınan</th><th>Harcanan</th><th>Admin</th><th>Kredi düzelt</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="admin-loading">Yükleniyor…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="admin-empty">Kullanıcı bulunamadı.</td></tr>
            ) : users.map(u => (
              <tr key={u.id}>
                <td>
                  <div className="admin-user-cell">
                    <span>{u.email || '—'}</span>
                    {u.full_name && <span className="admin-user-cell__sub">{u.full_name}</span>}
                  </div>
                </td>
                <td>{u.credit_balance ?? 0}</td>
                <td>{u.total_credits_purchased ?? 0}</td>
                <td>{u.total_credits_spent ?? 0}</td>
                <td>
                  <button
                    className={`admin-admin-toggle ${u.is_admin ? 'admin-admin-toggle--on' : ''}`}
                    onClick={() => toggleAdmin(u.id, u.is_admin)}
                    disabled={busyId === u.id}
                    title={u.is_admin ? 'Admin yetkisini kaldır' : 'Admin yetkisi ver'}
                  >
                    {u.is_admin ? <Shield size={13} strokeWidth={1.5} /> : <ShieldOff size={13} strokeWidth={1.5} />}
                    {u.is_admin ? 'Admin' : '—'}
                  </button>
                </td>
                <td>
                  <div className="admin-credit-edit">
                    <input
                      type="number"
                      value={creditInputs[u.id] ?? ''}
                      onChange={e => setCreditInputs(prev => ({ ...prev, [u.id]: e.target.value }))}
                      placeholder="0"
                    />
                    <button
                      disabled={busyId === u.id || !creditInputs[u.id]}
                      onClick={() => adjustCredits(u.id, Math.abs(Number(creditInputs[u.id] || 0)))}
                      title="Kredi ekle"
                    ><Plus size={13} strokeWidth={2} /></button>
                    <button
                      disabled={busyId === u.id || !creditInputs[u.id]}
                      onClick={() => adjustCredits(u.id, -Math.abs(Number(creditInputs[u.id] || 0)))}
                      title="Kredi çıkar"
                    ><Minus size={13} strokeWidth={2} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-pagination">
        <button disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14} /></button>
        <span>{page + 1} / {totalPages}</span>
        <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></button>
      </div>
    </div>
  )
}

function AuditsTab() {
  const [audits, setAudits] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ limit: PAGE_SIZE, offset: page * PAGE_SIZE })
    authedFetch(`/api/admin/audits?${params}`)
      .then(res => { setAudits(res.audits || []); setTotal(res.total || 0); setError(null) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [page])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const locale = 'tr-TR'
  const formatDate = (d) => new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="admin-section">
      {error && <div className="admin-error">{error}</div>}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Kullanıcı</th><th>Tür</th><th>Hedef</th><th>Skor</th><th>Kredi</th><th>Tarih</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="admin-loading">Yükleniyor…</td></tr>
            ) : audits.length === 0 ? (
              <tr><td colSpan={6} className="admin-empty">Kayıt yok.</td></tr>
            ) : audits.map(a => (
              <tr key={a.id}>
                <td>{a.email || '—'}</td>
                <td>{a.type}</td>
                <td>{a.domain || a.name || '—'}</td>
                <td>{a.score ?? '—'}</td>
                <td>{a.credits_spent ?? 0}</td>
                <td>{formatDate(a.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="admin-pagination">
        <button disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14} /></button>
        <span>{page + 1} / {totalPages}</span>
        <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></button>
      </div>
    </div>
  )
}

export default function AdminPage({ onBack }) {
  const { profile } = useAuth()
  const [tab, setTab] = useState('overview')

  if (!profile?.is_admin) {
    return (
      <div className="admin-denied">
        <p>Bu sayfaya erişim yetkiniz yok.</p>
        <button className="dash-new-scan" onClick={onBack}>Geri dön</button>
      </div>
    )
  }

  return (
    <div className="dashboard admin-page">
      <header className="landing__nav">
        <button className="landing__brand landing__brand--clickable" onClick={onBack}>
          <GeoniMark />
          <span className="landing__logo">GEONI</span>
        </button>
        <button className="admin-back" onClick={onBack}><ArrowLeft size={14} strokeWidth={1.5} /> Dashboard'a dön</button>
      </header>

      <div className="dashboard__body">
        <aside className="dashboard__sidebar">
          <nav className="dash-nav">
            <button className={`dash-nav__item ${tab === 'overview' ? 'dash-nav__item--active' : ''}`} onClick={() => setTab('overview')}>
              <LayoutDashboard size={16} strokeWidth={1.5} /> Genel Bakış
            </button>
            <button className={`dash-nav__item ${tab === 'users' ? 'dash-nav__item--active' : ''}`} onClick={() => setTab('users')}>
              <Users size={16} strokeWidth={1.5} /> Kullanıcılar
            </button>
            <button className={`dash-nav__item ${tab === 'audits' ? 'dash-nav__item--active' : ''}`} onClick={() => setTab('audits')}>
              <ScrollText size={16} strokeWidth={1.5} /> Taramalar
            </button>
          </nav>
        </aside>

        <main className="dashboard__main">
          {tab === 'overview' && <OverviewTab />}
          {tab === 'users' && <UsersTab />}
          {tab === 'audits' && <AuditsTab />}
        </main>
      </div>
    </div>
  )
}
