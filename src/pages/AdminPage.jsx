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
  UserPlus, RotateCcw, Globe, User, Tag, ShoppingCart, TrendingDown, TrendingUp, Gift, ShieldAlert,
  CalendarDays, CalendarRange, Calendar, History, Wallet, PiggyBank,
} from 'lucide-react'

const COST_TILE_ICONS = { today: CalendarDays, week: CalendarRange, month: Calendar, allTime: History }

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

function StatTile({ label, value, icon: Icon, range }) {
  return (
    <div className="admin-stat">
      <div className="admin-stat__value">{value}</div>
      <div className="admin-stat__label">
        {Icon && <Icon size={12} strokeWidth={1.75} className="admin-stat__icon" />}
        {label}
      </div>
      {range && <div className="admin-stat__range">{range}</div>}
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

function AsOfNote({ asOf }) {
  if (!asOf) return null
  const mins = Math.max(0, Math.round((Date.now() - new Date(asOf).getTime()) / 60000))
  const label = mins < 1 ? 'az önce' : mins < 60 ? `${mins} dakika önce` : `${Math.round(mins / 60)} saat önce`
  return <p className="admin-asof">Veri {label} alındı - önbelleklenmiş olabilir, yeni yükleme eklediğinizde kalan bakiye birkaç dakika gecikmeli güncellenebilir.</p>
}

const RANGE_OPTIONS = [
  { days: 1, label: 'Bugün' },
  { days: 7, label: 'Son 7 gün' },
  { days: 14, label: '14 gün' },
  { days: 30, label: '30 gün' },
  { days: 90, label: '90 gün' },
]

function RangeToggle({ days, onChange }) {
  return (
    <div className="admin-range-toggle">
      {RANGE_OPTIONS.map((opt) => (
        <button
          key={opt.days}
          className={opt.days === days ? 'admin-range-toggle__btn admin-range-toggle__btn--active' : 'admin-range-toggle__btn'}
          onClick={() => onChange(opt.days)}
        >{opt.label}</button>
      ))}
    </div>
  )
}

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

// Artik butun dis motorlarin ya gercek ya da kendi hesapladigimiz (tahmini)
// bir maliyet kaynagi var (Anthropic/AWS/Gemini: gercek API; OpenAI/Tavily:
// gercek; Perplexity: kendi hesapladigimiz) - manuel bakiye girisine gerek
// kalmadi.

// Herhangi bir "gercek maliyet" karti icin ortak yukleme-gecmisi bolumu:
// toplam yuklenen kredi - API'den gelen tum-zamanlar harcama = tahmini kalan.
function TopupSection({ provider, spentAllTime, currency = '$' }) {
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
        <StatTile icon={Wallet} label="Toplam yüklenen kredi" value={`${currency}${local.total.toFixed(2)}`} />
        <StatTile icon={PiggyBank} label="Tahmini kalan bakiye" value={`${currency}${remaining.toFixed(2)}`} />
      </div>
      {saveError && <div className="admin-error">{saveError}</div>}
      <div className="topup-form">
        <input type="number" step="0.01" placeholder={`Yüklenen tutar (${currency})`} value={amount} onChange={(e) => setAmount(e.target.value)} />
        <input type="text" placeholder="Not (opsiyonel)" value={note} onChange={(e) => setNote(e.target.value)} />
        <button disabled={saving || !amount} onClick={addTopup}>Yükleme ekle</button>
      </div>
      {local.history?.length > 0 && (
        <div className="topup-history">
          {local.history.slice(0, 5).map((t) => (
            <div key={t.id} className="topup-history__row">
              <span>{new Date(t.created_at).toLocaleDateString('tr-TR')}</span>
              <span>{t.note || '—'}</span>
              <span className="topup-history__amount">+{currency}{Number(t.amount).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function OpenAiCostWidget() {
  const { data: cost, error: costError } = useAdminFetch('/api/admin/stats/openai-cost')

  if (costError || !cost) {
    return (
      <div className="admin-widget">
        <h3 className="admin-section__title">OpenAI gerçek maliyet</h3>
        {costError ? <div className="admin-error">{costError}</div> : <div className="admin-loading admin-loading--widget">Yükleniyor…</div>}
      </div>
    )
  }
  if (cost.usd_today == null) {
    return (
      <div className="admin-widget">
        <h3 className="admin-section__title">OpenAI gerçek maliyet</h3>
        <div className="admin-empty">Admin API key tanımlı değil, gerçek maliyet verisi yok.</div>
      </div>
    )
  }

  return (
    <div className="admin-widget">
      <h3 className="admin-section__title">OpenAI gerçek maliyet</h3>
      <p className="admin-hint">OpenAI kalan bakiyeyi API üzerinden vermiyor — her kredi yüklemenizi aşağıya kaydedin, gerçek harcamayı Costs API'den çekip kalanı buradan hesaplarız.</p>
      <div className="admin-stats-grid admin-stats-grid--compact">
        <StatTile icon={COST_TILE_ICONS.today} label="Bugün" range="USD" value={`$${cost.usd_today.toFixed(2)}`} />
        <StatTile icon={COST_TILE_ICONS.week} label="Son 7 gün" range="USD" value={`$${cost.usd_week.toFixed(2)}`} />
        <StatTile icon={COST_TILE_ICONS.month} label="Bu ay - Toplam" range="USD" value={`$${cost.usd_month.toFixed(2)}`} />
        <StatTile icon={COST_TILE_ICONS.allTime} label="Tüm zamanlar harcama" range="USD" value={`$${cost.usd_all_time.toFixed(2)}`} />
      </div>
      {cost.daily?.length > 0 && (
        <BarChart
          data={cost.daily}
          series={[{ key: 'usd', label: 'Maliyet (USD)', color: 'var(--chart-1)' }]}
          dateFormatter={shortDate}
          valueFormatter={(v) => `$${v.toFixed(2)}`}
        />
      )}
      <AsOfNote asOf={cost.as_of} />
      <TopupSection provider="openai" spentAllTime={cost.usd_all_time} />
    </div>
  )
}

function PerplexityCostWidget() {
  const { data: cost, error: costError } = useAdminFetch('/api/admin/stats/perplexity-cost')

  if (costError || !cost) {
    return (
      <div className="admin-widget">
        <h3 className="admin-section__title">Perplexity gerçek maliyet (tahmini)</h3>
        {costError ? <div className="admin-error">{costError}</div> : <div className="admin-loading admin-loading--widget">Yükleniyor…</div>}
      </div>
    )
  }
  if (cost.usd_today == null) {
    return (
      <div className="admin-widget">
        <h3 className="admin-section__title">Perplexity gerçek maliyet (tahmini)</h3>
        <div className="admin-empty">Henüz veri yok.</div>
      </div>
    )
  }

  return (
    <div className="admin-widget">
      <h3 className="admin-section__title">Perplexity gerçek maliyet (tahmini)</h3>
      <p className="admin-hint">Perplexity'nin ne kalan bakiye ne de maliyet API'si var — her isteğin token sayısından ve yayınlanan fiyatlandırmadan GEONI kendisi hesaplıyor. Kredi yüklemenizi aşağıya kaydedin, kalanı buradan tahmin ederiz.</p>
      <div className="admin-stats-grid admin-stats-grid--compact">
        <StatTile icon={COST_TILE_ICONS.today} label="Bugün" range="USD" value={`$${cost.usd_today.toFixed(2)}`} />
        <StatTile icon={COST_TILE_ICONS.week} label="Son 7 gün" range="USD" value={`$${cost.usd_week.toFixed(2)}`} />
        <StatTile icon={COST_TILE_ICONS.month} label="Bu ay - Toplam" range="USD" value={`$${cost.usd_month.toFixed(2)}`} />
        <StatTile icon={COST_TILE_ICONS.allTime} label="Tüm zamanlar harcama" range="USD" value={`$${cost.usd_all_time.toFixed(2)}`} />
      </div>
      {cost.daily?.length > 0 && (
        <BarChart
          data={cost.daily}
          series={[{ key: 'usd', label: 'Maliyet (USD, tahmini)', color: 'var(--chart-4)' }]}
          dateFormatter={shortDate}
          valueFormatter={(v) => `$${v.toFixed(2)}`}
        />
      )}
      <AsOfNote asOf={cost.as_of} />
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

function UsersAndScansWidget() {
  const [days, setDays] = useState(14)
  const { data: summary, error: summaryError } = useAdminFetch('/api/admin/stats/summary')
  const { data: scans, error: scansError } = useAdminFetch(`/api/admin/stats/scans-daily?days=${days}`)

  return (
    <div className="admin-widget">
      <h3 className="admin-section__title">Kullanıcılar & Taramalar</h3>
      {summaryError && <div className="admin-error">{summaryError}</div>}
      {!summary ? <div className="admin-loading admin-loading--widget">Yükleniyor…</div> : (
        <div className="admin-stats-grid">
          <StatTile icon={Users} label="Toplam kullanıcı" value={summary.total_users} />
          <StatTile icon={ScrollText} label="Toplam tarama" value={summary.total_audits} />
          <StatTile icon={UserPlus} label="Yeni kullanıcı" range="Bugün" value={summary.new_users_today} />
          <StatTile icon={RotateCcw} label="Geri dönen kullanıcı" range="Bugün" value={summary.returning_users_today} />
          <StatTile icon={UserPlus} label="Yeni kullanıcı" range="Son 7 gün" value={summary.new_users_week} />
          <StatTile icon={RotateCcw} label="Geri dönen kullanıcı" range="Son 7 gün" value={summary.returning_users_week} />
        </div>
      )}

      <RangeToggle days={days} onChange={setDays} />
      {scansError && <div className="admin-error">{scansError}</div>}
      {!scans ? <div className="admin-loading admin-loading--widget">Yükleniyor…</div> : (() => {
        const rangeLabel = RANGE_OPTIONS.find((o) => o.days === days)?.label || `${days} gün`
        const webTotal = scans.days.reduce((sum, d) => sum + (d.web || 0), 0)
        const personTotal = scans.days.reduce((sum, d) => sum + (d.person || 0), 0)
        const brandTotal = scans.days.reduce((sum, d) => sum + (d.brand || 0), 0)
        return (
          <>
            <div className="admin-stats-grid admin-stats-grid--compact">
              <StatTile icon={ScrollText} label="Toplam tarama" range={rangeLabel} value={webTotal + personTotal + brandTotal} />
              <StatTile icon={Globe} label="Web Sitesi" range={rangeLabel} value={webTotal} />
              <StatTile icon={User} label="Kişi" range={rangeLabel} value={personTotal} />
              <StatTile icon={Tag} label="Marka" range={rangeLabel} value={brandTotal} />
            </div>
            <BarChart data={scans.days} series={SCAN_SERIES} stacked dateFormatter={shortDate} />
          </>
        )
      })()}
    </div>
  )
}

function CreditsWidget() {
  const [days, setDays] = useState(14)
  const { data, error } = useAdminFetch(`/api/admin/stats/credits?days=${days}`)

  return (
    <div className="admin-widget">
      <h3 className="admin-section__title">Krediler</h3>
      {error && <div className="admin-error">{error}</div>}
      {!data ? <div className="admin-loading admin-loading--widget">Yükleniyor…</div> : (() => {
        const reasonItems = Object.entries(data.by_reason || {})
          .sort((a, b) => b[1] - a[1])
          .map(([key, value]) => ({ label: REASON_LABELS[key] || key, value, color: 'var(--chart-4)' }))
        const rangeLabel = RANGE_OPTIONS.find((o) => o.days === days)?.label || `${days} gün`
        const rangeSpent = data.daily.reduce((sum, d) => sum + (d.spent || 0), 0)
        const rangeGranted = data.daily.reduce((sum, d) => sum + (d.granted || 0), 0)
        return (
          <>
            <div className="admin-stats-grid admin-stats-grid--compact">
              <StatTile icon={ShoppingCart} label="Satılan kredi" range="Toplam" value={data.purchased} />
              <StatTile icon={TrendingDown} label="Harcanan kredi" range="Toplam" value={data.spent} />
              <StatTile icon={Gift} label="Hediye edilen kredi" range="Toplam" value={data.gifted} />
              <StatTile icon={ShieldAlert} label="Admin harcaması" range="Ayrı" value={data.admin_spent} />
            </div>
            <RangeToggle days={days} onChange={setDays} />
            <div className="admin-stats-grid admin-stats-grid--compact">
              <StatTile icon={TrendingDown} label="Harcanan" range={rangeLabel} value={rangeSpent} />
              <StatTile icon={TrendingUp} label="Verilen" range={rangeLabel} value={rangeGranted} />
            </div>
            <BarChart data={data.daily} series={CREDIT_SERIES} dateFormatter={shortDate} />
            {reasonItems.length > 0 && (
              <>
                <div className="admin-subtitle">Harcama nedeni ({rangeLabel})</div>
                <HBarList items={reasonItems} />
              </>
            )}
          </>
        )
      })()}
    </div>
  )
}

function OverviewTab() {
  return (
    <div className="admin-section admin-overview-grid">
      <UsersAndScansWidget />

      <CreditsWidget />

      <Widget title="Anthropic gerçek maliyet" hint="Anthropic kalan bakiyeyi API üzerinden vermiyor — her kredi yüklemenizi aşağıya kaydedin, gerçek harcamayı Cost API'den çekip kalanı buradan hesaplarız." path="/api/admin/stats/anthropic-cost" render={(data) => {
        if (!data || data.usd_today == null) {
          return <div className="admin-empty">Admin API key tanımlı değil, gerçek maliyet verisi yok.</div>
        }
        return (
          <>
            <div className="admin-stats-grid admin-stats-grid--compact">
              <StatTile icon={COST_TILE_ICONS.today} label="Bugün" range="USD" value={`$${data.usd_today.toFixed(2)}`} />
              <StatTile icon={COST_TILE_ICONS.week} label="Son 7 gün" range="USD" value={`$${data.usd_week.toFixed(2)}`} />
              <StatTile icon={COST_TILE_ICONS.month} label="Bu ay - Toplam" range="USD" value={`$${data.usd_month.toFixed(2)}`} />
              <StatTile icon={COST_TILE_ICONS.allTime} label="Tüm zamanlar harcama" range="USD" value={`$${data.usd_all_time.toFixed(2)}`} />
            </div>
            {data.daily?.length > 0 && (
              <BarChart
                data={data.daily}
                series={[{ key: 'usd', label: 'Maliyet (USD)', color: 'var(--chart-3)' }]}
                dateFormatter={shortDate}
                valueFormatter={(v) => `$${v.toFixed(2)}`}
              />
            )}
            <AsOfNote asOf={data.as_of} />
            <TopupSection provider="anthropic" spentAllTime={data.usd_all_time} />
          </>
        )
      }} />

      <OpenAiCostWidget />

      <PerplexityCostWidget />

      <Widget title="AWS gerçek maliyet" hint="Amazon Cost Explorer'dan gelen gerçek altyapı maliyeti (ECS, ALB, ECR vb.). AWS faturalı (postpaid) çalıştığı için diğerlerinden farklı olarak kalan bakiye/kredi kavramı yok, yükleme takibi gerekmiyor. Bu yüzden burada sadece gerçek harcama gösterilir." path="/api/admin/stats/aws-cost" render={(data) => {
        if (!data || data.usd_today == null) {
          return <div className="admin-empty">AWS maliyet verisi alınamadı (IAM izni gerekebilir).</div>
        }
        const serviceItems = Object.entries(data.by_service || {}).map(([label, value]) => ({ label, value, color: 'var(--chart-1)' }))
        return (
          <>
            <div className="admin-stats-grid admin-stats-grid--compact">
              <StatTile icon={COST_TILE_ICONS.today} label="Bugün" range="USD" value={`$${data.usd_today.toFixed(2)}`} />
              <StatTile icon={COST_TILE_ICONS.week} label="Son 7 gün" range="USD" value={`$${data.usd_week.toFixed(2)}`} />
              <StatTile icon={COST_TILE_ICONS.month} label="Bu ay - Toplam" range="USD" value={`$${data.usd_month.toFixed(2)}`} />
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

      <Widget title="Gemini gerçek maliyet" hint="GCP Billing export → BigQuery üzerinden gelen gerçek maliyet, faturalandırma hesabınızın para biriminde (₺). AI Studio ön ödemeli (prepay) çalıştığı için kredi yüklemenizi aşağıya kaydedin, kalanı buradan hesaplarız. Not: export verisi ~24 saat gecikmeli akabilir." path="/api/admin/stats/gemini-cost" render={(data) => {
        if (!data || data.usd_today == null) {
          return <div className="admin-empty">Gemini maliyet verisi yok - service account key tanımlı değil ya da export verisi henüz oluşmadı.</div>
        }
        return (
          <>
            <div className="admin-stats-grid admin-stats-grid--compact">
              <StatTile icon={COST_TILE_ICONS.today} label="Bugün" range="₺" value={`₺${data.usd_today.toFixed(2)}`} />
              <StatTile icon={COST_TILE_ICONS.week} label="Son 7 gün" range="₺" value={`₺${data.usd_week.toFixed(2)}`} />
              <StatTile icon={COST_TILE_ICONS.month} label="Bu ay - Toplam" range="₺" value={`₺${data.usd_month.toFixed(2)}`} />
              <StatTile icon={COST_TILE_ICONS.allTime} label="Tüm zamanlar harcama" range="₺" value={`₺${data.usd_all_time.toFixed(2)}`} />
            </div>
            {data.daily?.length > 0 && (
              <BarChart
                data={data.daily}
                series={[{ key: 'usd', label: 'Maliyet (₺)', color: 'var(--chart-2)' }]}
                dateFormatter={shortDate}
                valueFormatter={(v) => `₺${v.toFixed(2)}`}
              />
            )}
            <AsOfNote asOf={data.as_of} />
            <TopupSection provider="gemini" spentAllTime={data.usd_all_time} currency="₺" />
          </>
        )
      }} />

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
              <th>Kullanıcı</th><th>Kredi</th><th>Alınan</th><th>Harcanan</th><th>Hediye</th><th>Admin</th><th>Kredi düzelt</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="admin-loading">Yükleniyor…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="admin-empty">Kullanıcı bulunamadı.</td></tr>
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
                <td>{u.total_credits_gifted ?? 0}</td>
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
