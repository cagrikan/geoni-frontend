import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import GeoniMark from '../GeoniMark'
import ThemeSwitcher from '../components/ThemeSwitcher'
import BarChart from '../components/BarChart'
import HBarList from '../components/HBarList'
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

// Her widget kendi verisini bagimsiz ceker: sayfa iskeleti aninda gorunur,
// yavas olan (dis API'ye giden) widget'lar digerlerini bekletmez.
function useAdminFetch(path) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setData(null); setError(null)
    authedFetch(path)
      .then((d) => { if (!cancelled) setData(d) })
      .catch((e) => { if (!cancelled) setError(e.message) })
    return () => { cancelled = true }
  }, [path])

  return { data, error }
}

function Widget({ title, hint, path, render }) {
  const { data, error } = useAdminFetch(path)
  return (
    <div className="admin-widget">
      {title && <h3 className="admin-section__title">{title}</h3>}
      {hint && <p className="admin-hint">{hint}</p>}
      {error ? <div className="admin-error">{error}</div>
        : !data ? <div className="admin-loading admin-loading--widget">Yükleniyor…</div>
        : render(data)}
    </div>
  )
}

const shortDate = (d) => new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })

const SCAN_SERIES = [
  { key: 'web', label: 'Web Sitesi', color: 'var(--chart-1)' },
  { key: 'person', label: 'Kişi', color: 'var(--chart-2)' },
  { key: 'brand', label: 'Marka', color: 'var(--chart-3)' },
]

const CREDIT_SERIES = [
  { key: 'granted', label: 'Verilen', color: 'var(--chart-1)' },
  { key: 'spent', label: 'Harcanan', color: 'var(--chart-4)' },
]

const REASON_LABELS = {
  web_audit: 'Web taraması',
  person_check: 'Kişi kontrolü',
  brand_check: 'Marka kontrolü',
  admin_deduct: 'Admin düzeltmesi',
}

const PROVIDER_META = {
  anthropic: { label: 'Anthropic', color: 'var(--chart-3)' },
  openai: { label: 'OpenAI', color: 'var(--chart-1)' },
  google: { label: 'Gemini', color: 'var(--chart-2)' },
  perplexity: { label: 'Perplexity', color: 'var(--chart-4)' },
  'tavily-1': { label: 'Tavily (Hesap 1)', color: 'var(--chart-5)' },
  'tavily-2': { label: 'Tavily (Hesap 2)', color: 'var(--chart-6)' },
}

// Anthropic ve AWS'nin gercek API'den maliyeti var - geri kalani icin
// (bakiye API'si olmadigindan) admin panelden elle girilip guncelleniyor.
// OpenAI'nin kendi "OpenAI gercek maliyet" widget'i var (Costs API + yukleme
// gecmisi), Tavily'nin gercek /usage endpoint'i, Perplexity'nin de kendi
// hesapladigimiz (tahmini) maliyet widget'i var - burada sadece hicbir
// veri kaynagi olmayan Google kalir.
const MANUAL_BALANCE_PROVIDERS = ['google']

function ManualBalancesWidget() {
  const { data, error } = useAdminFetch('/api/admin/stats/manual-balances')
  const [balances, setBalances] = useState(null)
  const [inputs, setInputs] = useState({})
  const [savingKey, setSavingKey] = useState(null)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => { if (data) setBalances(data) }, [data])

  const save = async (providerKey) => {
    const raw = inputs[providerKey]
    const value = parseFloat(raw)
    if (Number.isNaN(value)) return
    setSavingKey(providerKey)
    setSaveError(null)
    try {
      await authedFetch('/api/admin/stats/manual-balances', {
        method: 'POST',
        body: JSON.stringify({ provider: providerKey, balance: value }),
      })
      setBalances((prev) => ({ ...prev, [providerKey]: { provider: providerKey, balance: value, updated_at: new Date().toISOString() } }))
      setInputs((prev) => ({ ...prev, [providerKey]: '' }))
    } catch (e) { setSaveError(e.message) }
    setSavingKey(null)
  }

  return (
    <div className="admin-widget">
      <h3 className="admin-section__title">Manuel bakiyeler</h3>
      <p className="admin-hint">Gemini'nin kendi hesap bakiyesini API üzerinden sunan bir yolu yok — gerçek bakiyeyi Google AI Studio/Cloud Console'dan bakıp buraya elle girip düzenli güncelleyebilirsiniz.</p>
      {error && <div className="admin-error">{error}</div>}
      {saveError && <div className="admin-error">{saveError}</div>}
      {!balances ? <div className="admin-loading admin-loading--widget">Yükleniyor…</div> : (
        <div className="manual-balance-list">
          {MANUAL_BALANCE_PROVIDERS.map((key) => {
            const row = balances[key]
            return (
              <div key={key} className="manual-balance-row">
                <div className="manual-balance-info">
                  <span className="manual-balance-label">{PROVIDER_META[key]?.label || key}</span>
                  <span className="manual-balance-meta">
                    {row ? `$${Number(row.balance).toFixed(2)} — ${new Date(row.updated_at).toLocaleDateString('tr-TR')}` : 'henüz girilmedi'}
                  </span>
                </div>
                <input
                  type="number" step="0.01" placeholder="Yeni bakiye ($)"
                  value={inputs[key] ?? ''}
                  onChange={(e) => setInputs((prev) => ({ ...prev, [key]: e.target.value }))}
                />
                <button
                  disabled={savingKey === key || !inputs[key]}
                  onClick={() => save(key)}
                >Kaydet</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Herhangi bir "gercek maliyet" karti icin ortak yukleme-gecmisi bolumu:
// toplam yuklenen kredi - API'den gelen tum-zamanlar harcama = tahmini kalan.
function TopupSection({ provider, spentAllTime }) {
  const { data: topups, error } = useAdminFetch(`/api/admin/stats/topups?provider=${provider}`)
  const [local, setLocal] = useState(null)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => { if (topups) setLocal(topups) }, [topups])

  const addTopup = async () => {
    const value = parseFloat(amount)
    if (Number.isNaN(value) || value <= 0) return
    setSaving(true)
    setSaveError(null)
    try {
      await authedFetch('/api/admin/stats/topups', {
        method: 'POST',
        body: JSON.stringify({ provider, amount: value, note }),
      })
      setLocal((prev) => ({
        total: (prev?.total || 0) + value,
        history: [{ id: `tmp-${Date.now()}`, amount: value, note, created_at: new Date().toISOString() }, ...(prev?.history || [])],
      }))
      setAmount(''); setNote('')
    } catch (e) { setSaveError(e.message) }
    setSaving(false)
  }

  if (error) return <div className="admin-error">{error}</div>
  if (!local) return <div className="admin-loading admin-loading--widget">Yükleniyor…</div>

  const remaining = local.total - spentAllTime

  return (
    <>
      <div className="admin-stats-grid admin-stats-grid--compact">
        <StatTile label="Toplam yüklenen kredi" value={`$${local.total.toFixed(2)}`} />
        <StatTile label="Tahmini kalan bakiye" value={`$${remaining.toFixed(2)}`} />
      </div>
      {saveError && <div className="admin-error">{saveError}</div>}
      <div className="topup-form">
        <input type="number" step="0.01" placeholder="Yüklenen tutar ($)" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <input type="text" placeholder="Not (opsiyonel)" value={note} onChange={(e) => setNote(e.target.value)} />
        <button disabled={saving || !amount} onClick={addTopup}>Yükleme ekle</button>
      </div>
      {local.history?.length > 0 && (
        <div className="topup-history">
          {local.history.slice(0, 5).map((t) => (
            <div key={t.id} className="topup-history__row">
              <span>{new Date(t.created_at).toLocaleDateString('tr-TR')}</span>
              <span>{t.note || '—'}</span>
              <span className="topup-history__amount">+${Number(t.amount).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function OpenAiCostWidget() {
  const { data: cost, error: costError } = useAdminFetch('/api/admin/stats/openai-cost')

  if (!cost || cost.usd_today == null) {
    return (
      <div className="admin-widget">
        <h3 className="admin-section__title">OpenAI gerçek maliyet</h3>
        {costError && <div className="admin-error">{costError}</div>}
        {!costError && <div className="admin-empty">Admin API key tanımlı değil, gerçek maliyet verisi yok.</div>}
      </div>
    )
  }

  return (
    <div className="admin-widget">
      <h3 className="admin-section__title">OpenAI gerçek maliyet</h3>
      <p className="admin-hint">OpenAI kalan bakiyeyi API üzerinden vermiyor — her kredi yüklemenizi aşağıya kaydedin, gerçek harcamayı Costs API'den çekip kalanı buradan hesaplarız.</p>
      <div className="admin-stats-grid admin-stats-grid--compact">
        <StatTile label="Bugün (USD)" value={`$${cost.usd_today.toFixed(2)}`} />
        <StatTile label="Son 7 gün (USD)" value={`$${cost.usd_week.toFixed(2)}`} />
        <StatTile label="Bu ay - Toplam (USD)" value={`$${cost.usd_month.toFixed(2)}`} />
        <StatTile label="Tüm zamanlar harcama (USD)" value={`$${cost.usd_all_time.toFixed(2)}`} />
      </div>
      {cost.daily?.length > 0 && (
        <BarChart
          data={cost.daily}
          series={[{ key: 'usd', label: 'Maliyet (USD)', color: 'var(--chart-1)' }]}
          dateFormatter={shortDate}
          valueFormatter={(v) => `$${v.toFixed(2)}`}
        />
      )}
      <TopupSection provider="openai" spentAllTime={cost.usd_all_time} />
    </div>
  )
}

function PerplexityCostWidget() {
  const { data: cost, error: costError } = useAdminFetch('/api/admin/stats/perplexity-cost')

  if (!cost || cost.usd_today == null) {
    return (
      <div className="admin-widget">
        <h3 className="admin-section__title">Perplexity gerçek maliyet (tahmini)</h3>
        {costError && <div className="admin-error">{costError}</div>}
        {!costError && <div className="admin-empty">Henüz veri yok.</div>}
      </div>
    )
  }

  return (
    <div className="admin-widget">
      <h3 className="admin-section__title">Perplexity gerçek maliyet (tahmini)</h3>
      <p className="admin-hint">Perplexity'nin ne kalan bakiye ne de maliyet API'si var — her isteğin token sayısından ve yayınlanan fiyatlandırmadan GEONI kendisi hesaplıyor. Kredi yüklemenizi aşağıya kaydedin, kalanı buradan tahmin ederiz.</p>
      <div className="admin-stats-grid admin-stats-grid--compact">
        <StatTile label="Bugün (USD)" value={`$${cost.usd_today.toFixed(2)}`} />
        <StatTile label="Son 7 gün (USD)" value={`$${cost.usd_week.toFixed(2)}`} />
        <StatTile label="Bu ay - Toplam (USD)" value={`$${cost.usd_month.toFixed(2)}`} />
        <StatTile label="Tüm zamanlar harcama (USD)" value={`$${cost.usd_all_time.toFixed(2)}`} />
      </div>
      {cost.daily?.length > 0 && (
        <BarChart
          data={cost.daily}
          series={[{ key: 'usd', label: 'Maliyet (USD, tahmini)', color: 'var(--chart-4)' }]}
          dateFormatter={shortDate}
          valueFormatter={(v) => `$${v.toFixed(2)}`}
        />
      )}
      <TopupSection provider="perplexity" spentAllTime={cost.usd_all_time} />
    </div>
  )
}

function UsageBar({ label, used, limit, color }) {
  if (limit == null) return null
  const pct = Math.min(100, (used / limit) * 100)
  return (
    <div className="usage-bar">
      <div className="usage-bar__label">
        <span>{label}</span>
        <span>{used} / {limit}</span>
      </div>
      <div className="usage-bar__track">
        <div className="usage-bar__fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function OverviewTab() {
  return (
    <div className="admin-section admin-overview-grid">
      <Widget title="Kullanıcı istatistikleri" path="/api/admin/stats/summary" render={(data) => (
        <div className="admin-stats-grid">
          <StatTile label="Toplam kullanıcı" value={data.total_users} />
          <StatTile label="Toplam tarama" value={data.total_audits} />
          <StatTile label="Bugünkü yeni kullanıcı" value={data.new_users_today} />
          <StatTile label="Bugün geri dönen kullanıcı" value={data.returning_users_today} />
        </div>
      )} />

      <Widget title="Taramalar (son 14 gün)" path="/api/admin/stats/scans-daily" render={(data) => (
        <>
          <div className="admin-stats-grid admin-stats-grid--compact">
            <StatTile label="Bugünkü tarama" value={data.today} />
            <StatTile label="Son 7 gün tarama" value={data.week} />
          </div>
          <BarChart data={data.days} series={SCAN_SERIES} stacked dateFormatter={shortDate} />
        </>
      )} />

      <Widget title="Krediler" path="/api/admin/stats/credits" render={(data) => {
        const reasonItems = Object.entries(data.by_reason || {})
          .sort((a, b) => b[1] - a[1])
          .map(([key, value]) => ({ label: REASON_LABELS[key] || key, value, color: 'var(--chart-4)' }))
        return (
          <>
            <div className="admin-stats-grid admin-stats-grid--compact">
              <StatTile label="Satılan kredi (toplam)" value={data.purchased} />
              <StatTile label="Harcanan kredi (toplam)" value={data.spent} />
            </div>
            <BarChart data={data.daily} series={CREDIT_SERIES} dateFormatter={shortDate} />
            {reasonItems.length > 0 && (
              <>
                <div className="admin-subtitle">Harcama nedeni (son 14 gün)</div>
                <HBarList items={reasonItems} />
              </>
            )}
          </>
        )
      }} />

      <Widget title="Anthropic gerçek maliyet" path="/api/admin/stats/anthropic-cost" render={(data) => {
        if (!data || data.usd_today == null) {
          return <div className="admin-empty">Admin API key tanımlı değil, gerçek maliyet verisi yok.</div>
        }
        return (
          <>
            <div className="admin-stats-grid admin-stats-grid--compact">
              <StatTile label="Bugün (USD)" value={`$${data.usd_today.toFixed(2)}`} />
              <StatTile label="Son 7 gün (USD)" value={`$${data.usd_week.toFixed(2)}`} />
              <StatTile label="Bu ay - Toplam (USD)" value={`$${data.usd_month.toFixed(2)}`} />
              <StatTile label="Tüm zamanlar harcama (USD)" value={`$${data.usd_all_time.toFixed(2)}`} />
            </div>
            {data.daily?.length > 0 && (
              <BarChart
                data={data.daily}
                series={[{ key: 'usd', label: 'Maliyet (USD)', color: 'var(--chart-3)' }]}
                dateFormatter={shortDate}
                valueFormatter={(v) => `$${v.toFixed(2)}`}
              />
            )}
            <TopupSection provider="anthropic" spentAllTime={data.usd_all_time} />
          </>
        )
      }} />

      <OpenAiCostWidget />

      <PerplexityCostWidget />

      <Widget title="AWS gerçek maliyet" hint="Amazon Cost Explorer'dan gelen gerçek altyapı maliyeti (ECS, ALB, ECR vb.)." path="/api/admin/stats/aws-cost" render={(data) => {
        if (!data || data.usd_today == null) {
          return <div className="admin-empty">AWS maliyet verisi alınamadı (IAM izni gerekebilir).</div>
        }
        const serviceItems = Object.entries(data.by_service || {}).map(([label, value]) => ({ label, value, color: 'var(--chart-1)' }))
        return (
          <>
            <div className="admin-stats-grid admin-stats-grid--compact">
              <StatTile label="Bugün (USD)" value={`$${data.usd_today.toFixed(2)}`} />
              <StatTile label="Son 7 gün (USD)" value={`$${data.usd_week.toFixed(2)}`} />
              <StatTile label="Bu ay - Toplam (USD)" value={`$${data.usd_month.toFixed(2)}`} />
            </div>
            {data.daily?.length > 0 && (
              <BarChart
                data={data.daily}
                series={[{ key: 'usd', label: 'Maliyet (USD)', color: 'var(--chart-1)' }]}
                dateFormatter={shortDate}
                valueFormatter={(v) => `$${v.toFixed(2)}`}
              />
            )}
            {serviceItems.length > 0 && (
              <>
                <div className="admin-subtitle">Servis bazlı (bu ay)</div>
                <HBarList items={serviceItems} valueFormatter={(v) => `$${v.toFixed(2)}`} />
              </>
            )}
          </>
        )
      }} />

      <Widget
        title="Dış AI motoru kullanımı"
        hint="Burada gösterilen GEONI'nin bu motorlara yaptığı çağrı sayısıdır - gerçek/tahmini USD maliyetleri her motorun kendi kartında (Gemini hariç, onun hiçbir API'si yok)."
        path="/api/admin/stats/provider-usage"
        render={(data) => {
          const providers = Array.from(new Set([...Object.keys(data.today || {}), ...Object.keys(data.week || {})]))
          if (providers.length === 0) return <div className="admin-empty">Henüz kayıtlı motor çağrısı yok.</div>
          const weekItems = providers.map((p) => ({
            label: PROVIDER_META[p]?.label || p,
            value: data.week?.[p] ?? 0,
            color: PROVIDER_META[p]?.color || 'var(--chart-1)',
          })).sort((a, b) => b.value - a.value)
          return (
            <>
              <HBarList items={weekItems} />
              <table className="admin-table">
                <thead><tr><th>Motor</th><th>Bugün</th><th>Son 7 gün</th></tr></thead>
                <tbody>
                  {providers.map((p) => (
                    <tr key={p}>
                      <td>{PROVIDER_META[p]?.label || p}</td>
                      <td>{data.today?.[p] ?? 0}</td>
                      <td>{data.week?.[p] ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )
        }}
      />

      <Widget
        title="Tavily gerçek kullanım"
        hint="Tavily diğerlerinden farklı olarak gerçek kalan kotayı normal API key ile veriyor - tahmin ya da manuel giriş gerekmiyor."
        path="/api/admin/stats/tavily-usage"
        render={(data) => {
          const accounts = Object.entries(data || {})
          if (accounts.length === 0) return <div className="admin-empty">Veri alınamadı.</div>
          return (
            <div className="tavily-accounts">
              {accounts.map(([key, acc]) => (
                <div key={key} className="tavily-account">
                  <div className="tavily-account__title">
                    {PROVIDER_META[key]?.label || key}
                    {acc.plan && <span className="tavily-account__plan">{acc.plan}</span>}
                  </div>
                  <UsageBar label="Plan kotası" used={acc.plan_usage} limit={acc.plan_limit} color={PROVIDER_META[key]?.color || 'var(--chart-5)'} />
                  {acc.paygo_limit > 0 && (
                    <UsageBar label="Pay-as-you-go" used={acc.paygo_usage} limit={acc.paygo_limit} color="var(--chart-4)" />
                  )}
                </div>
              ))}
            </div>
          )
        }}
      />

      <ManualBalancesWidget />
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
        <div className="admin-nav-right">
          <ThemeSwitcher />
          <button className="admin-back" onClick={onBack}><ArrowLeft size={14} strokeWidth={1.5} /> Dashboard'a dön</button>
        </div>
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
