import { useState, useEffect, useCallback, Fragment } from 'react'
import { useAuth } from '../lib/AuthContext'
import { useLanguage } from '../lib/LanguageContext'
import { supabase } from '../lib/supabase'
import GeoniMark from '../GeoniMark'
import ThemeSwitcher from '../components/ThemeSwitcher'
import LanguageSwitcher from '../components/LanguageSwitcher'
import BarChart from '../components/BarChart'
import HBarList from '../components/HBarList'
import ResultsPage from '../ResultsPage'
import BrandCheckResultsPage from '../BrandCheckResultsPage'
import TicketJobCard from '../components/TicketJobCard'
import {
  LayoutDashboard, Users, ScrollText, Search, Shield, ShieldOff,
  Plus, Minus, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ArrowLeft,
  UserPlus, RotateCcw, Globe, User, Tag, ShoppingCart, TrendingDown, TrendingUp, Gift, ShieldAlert,
  CalendarDays, CalendarRange, Calendar, History, Wallet, PiggyBank, Database, Megaphone, Copy, Check, Wrench,
  MessageSquare,
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
  const { t } = useLanguage()
  const { data, error } = useAdminFetch(path)
  return (
    <div className="admin-widget">
      {title && <h3 className="admin-section__title">{title}</h3>}
      {hint && <p className="admin-hint">{hint}</p>}
      {error ? <div className="admin-error">{error}</div>
        : !data ? <div className="admin-loading admin-loading--widget">{t('admin_loading')}</div>
        : render(data)}
    </div>
  )
}

const getShortDate = (language) => (d) => new Date(d).toLocaleDateString(language === 'en' ? 'en-US' : 'tr-TR', { day: 'numeric', month: 'short' })

function AsOfNote({ asOf }) {
  const { t } = useLanguage()
  if (!asOf) return null
  const mins = Math.max(0, Math.round((Date.now() - new Date(asOf).getTime()) / 60000))
  const label = mins < 1 ? t('admin_time_just_now') : mins < 60 ? t('admin_time_minutes_ago', { n: mins }) : t('admin_time_hours_ago', { n: Math.round(mins / 60) })
  return <p className="admin-asof">{t('admin_asof_note', { time: label })}</p>
}

function getRangeOptions(t) {
  return [
    { days: 1, label: t('admin_range_today') },
    { days: 7, label: t('admin_range_week') },
    { days: 14, label: t('admin_range_14d') },
    { days: 30, label: t('admin_range_30d') },
    { days: 90, label: t('admin_range_90d') },
  ]
}

function RangeToggle({ days, onChange }) {
  const { t } = useLanguage()
  const options = getRangeOptions(t)
  return (
    <div className="admin-range-toggle">
      {options.map((opt) => (
        <button
          key={opt.days}
          className={opt.days === days ? 'admin-range-toggle__btn admin-range-toggle__btn--active' : 'admin-range-toggle__btn'}
          onClick={() => onChange(opt.days)}
        >{opt.label}</button>
      ))}
    </div>
  )
}

function getScanSeries(t) {
  return [
    { key: 'web', label: t('admin_stat_website'), color: 'var(--chart-1)' },
    { key: 'person', label: t('admin_stat_person'), color: 'var(--chart-2)' },
    { key: 'brand', label: t('admin_stat_brand'), color: 'var(--chart-3)' },
  ]
}

function getCreditSeries(t) {
  return [
    { key: 'granted', label: t('admin_stat_given'), color: 'var(--chart-1)' },
    { key: 'spent', label: t('admin_stat_spent'), color: 'var(--chart-4)' },
  ]
}

function getReasonLabels(t) {
  return {
    web_audit: t('admin_reason_web_audit'),
    person_check: t('admin_reason_person_check'),
    brand_check: t('admin_reason_brand_check'),
    admin_deduct: t('admin_reason_admin_deduct'),
  }
}

function getProviderMeta(t) {
  return {
    anthropic: { label: 'Anthropic', color: 'var(--chart-3)' },
    openai: { label: 'OpenAI', color: 'var(--chart-1)' },
    google: { label: 'Gemini', color: 'var(--chart-2)' },
    perplexity: { label: 'Perplexity', color: 'var(--chart-4)' },
    'tavily-1': { label: t('admin_provider_tavily1'), color: 'var(--chart-5)' },
    'tavily-2': { label: t('admin_provider_tavily2'), color: 'var(--chart-6)' },
  }
}

// Artik butun dis motorlarin ya gercek ya da kendi hesapladigimiz (tahmini)
// bir maliyet kaynagi var (Anthropic/AWS/Gemini: gercek API; OpenAI/Tavily:
// gercek; Perplexity: kendi hesapladigimiz) - manuel bakiye girisine gerek
// kalmadi.

// Herhangi bir "gercek maliyet" karti icin ortak yukleme-gecmisi bolumu:
// toplam yuklenen kredi - API'den gelen tum-zamanlar harcama = tahmini kalan.
function TopupSection({ provider, spentAllTime, currency = '$' }) {
  const { t } = useLanguage()
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
  if (!local) return <div className="admin-loading admin-loading--widget">{t('admin_loading')}</div>

  const remaining = local.total - spentAllTime

  return (
    <>
      <div className="admin-stats-grid admin-stats-grid--compact">
        <StatTile icon={Wallet} label={t('admin_stat_total_loaded')} value={`${currency}${local.total.toFixed(2)}`} />
        <StatTile icon={PiggyBank} label={t('admin_stat_est_remaining')} value={`${currency}${remaining.toFixed(2)}`} />
      </div>
      {saveError && <div className="admin-error">{saveError}</div>}
      <div className="topup-form">
        <input type="number" step="0.01" placeholder={t('admin_topup_amount_placeholder', { currency })} value={amount} onChange={(e) => setAmount(e.target.value)} />
        <input type="text" placeholder={t('admin_topup_note_placeholder')} value={note} onChange={(e) => setNote(e.target.value)} />
        <button disabled={saving || !amount} onClick={addTopup}>{t('admin_topup_add_btn')}</button>
      </div>
      {local.history?.length > 0 && (
        <div className="topup-history">
          {local.history.slice(0, 5).map((item) => (
            <div key={item.id} className="topup-history__row">
              <span>{new Date(item.created_at).toLocaleDateString('tr-TR')}</span>
              <span>{item.note || '—'}</span>
              <span className="topup-history__amount">+{currency}{Number(item.amount).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function SupabaseCostWidget() {
  const { t } = useLanguage()
  const { data, error } = useAdminFetch('/api/admin/stats/manual-cost?provider=supabase')
  const [local, setLocal] = useState(null)
  const [currentCost, setCurrentCost] = useState('')
  const [projectedCost, setProjectedCost] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => { if (data) setLocal(data) }, [data])

  const save = async () => {
    const current = parseFloat(currentCost)
    if (Number.isNaN(current) || current < 0) return
    const projected = projectedCost ? parseFloat(projectedCost) : null
    setSaving(true)
    setSaveError(null)
    try {
      await authedFetch('/api/admin/stats/manual-cost', {
        method: 'POST',
        body: JSON.stringify({ provider: 'supabase', current_cost: current, projected_cost: projected }),
      })
      setLocal({ current_cost: current, projected_cost: projected, created_at: new Date().toISOString() })
      setCurrentCost(''); setProjectedCost('')
    } catch (e) { setSaveError(e.message) }
    setSaving(false)
  }

  if (error) return <div className="admin-widget"><h3 className="admin-section__title">{t('admin_title_supabase')}</h3><div className="admin-error">{error}</div></div>
  if (!local) return <div className="admin-widget"><h3 className="admin-section__title">{t('admin_title_supabase')}</h3><div className="admin-loading admin-loading--widget">{t('admin_loading')}</div></div>

  return (
    <div className="admin-widget">
      <h3 className="admin-section__title">{t('admin_title_supabase')}</h3>
      <p className="admin-hint">{t('admin_hint_supabase')}</p>
      {local.current_cost != null ? (
        <>
          <div className="admin-stats-grid admin-stats-grid--compact">
            <StatTile icon={Database} label={t('admin_stat_current_cost')} range="USD" value={`$${Number(local.current_cost).toFixed(2)}`} />
            {local.projected_cost != null && (
              <StatTile icon={TrendingUp} label={t('admin_stat_projected_cost')} range="USD" value={`$${Number(local.projected_cost).toFixed(2)}`} />
            )}
          </div>
          <AsOfNote asOf={local.created_at} />
        </>
      ) : (
        <div className="admin-empty">{t('admin_empty_supabase')}</div>
      )}
      {saveError && <div className="admin-error">{saveError}</div>}
      <div className="topup-form">
        <input type="number" step="0.01" placeholder={t('admin_stat_current_cost')} value={currentCost} onChange={(e) => setCurrentCost(e.target.value)} />
        <input type="number" step="0.01" placeholder={t('admin_stat_projected_cost')} value={projectedCost} onChange={(e) => setProjectedCost(e.target.value)} />
        <button disabled={saving || !currentCost} onClick={save}>{t('admin_topup_add_btn')}</button>
      </div>
    </div>
  )
}

function TotalCostWidget() {
  const { t, language } = useLanguage()
  const { data, error } = useAdminFetch('/api/admin/stats/total-cost')
  const monthLabel = new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'tr-TR', { month: 'long', year: 'numeric' })

  if (error) return <div className="admin-widget"><h3 className="admin-section__title">{t('admin_title_total_cost')}</h3><div className="admin-error">{error}</div></div>
  if (!data) return <div className="admin-widget"><h3 className="admin-section__title">{t('admin_title_total_cost')}</h3><div className="admin-loading admin-loading--widget">{t('admin_loading')}</div></div>

  const providerLabels = { anthropic: 'Anthropic', openai: 'OpenAI', aws: 'AWS', perplexity: 'Perplexity', gemini_usd: 'Gemini', supabase: 'Supabase' }
  const byProviderItems = Object.entries(data.by_provider_this_month || {})
    .sort((a, b) => b[1] - a[1])
    .map(([key, value]) => ({ label: providerLabels[key] || key, value, color: 'var(--chart-1)' }))

  return (
    <div className="admin-widget">
      <h3 className="admin-section__title">{t('admin_title_total_cost')}</h3>
      <p className="admin-hint">{t('admin_hint_total_cost')}</p>
      <div className="admin-stats-grid admin-stats-grid--compact">
        <StatTile icon={Wallet} label={t('admin_stat_month')} range="USD" value={`$${data.usd_this_month.toFixed(2)}`} />
        <StatTile icon={CalendarRange} label={t('admin_stat_2_months')} range="USD" value={`$${data.usd_2_months.toFixed(2)}`} />
        <StatTile icon={CalendarDays} label={t('admin_stat_3_months')} range="USD" value={`$${data.usd_3_months.toFixed(2)}`} />
        <StatTile icon={History} label={t('admin_stat_all_time')} range="USD" value={`$${data.usd_all_time.toFixed(2)}`} />
      </div>
      {byProviderItems.length > 0 && (
        <>
          <div className="admin-subtitle">{t('admin_subtitle_service_month', { month: monthLabel })}</div>
          <HBarList items={byProviderItems} valueFormatter={(v) => `$${v.toFixed(2)}`} />
        </>
      )}
      <AsOfNote asOf={data.as_of} />
    </div>
  )
}

function OpenAiCostWidget() {
  const { t, language } = useLanguage()
  const { data: cost, error: costError } = useAdminFetch('/api/admin/stats/openai-cost')

  if (costError || !cost) {
    return (
      <div className="admin-widget">
        <h3 className="admin-section__title">{t('admin_title_openai')}</h3>
        {costError ? <div className="admin-error">{costError}</div> : <div className="admin-loading admin-loading--widget">{t('admin_loading')}</div>}
      </div>
    )
  }
  if (cost.usd_today == null) {
    return (
      <div className="admin-widget">
        <h3 className="admin-section__title">{t('admin_title_openai')}</h3>
        <div className="admin-empty">{t('admin_empty_admin_key')}</div>
      </div>
    )
  }

  return (
    <div className="admin-widget">
      <h3 className="admin-section__title">{t('admin_title_openai')}</h3>
      <p className="admin-hint">{t('admin_hint_openai')}</p>
      <div className="admin-stats-grid admin-stats-grid--compact">
        <StatTile icon={COST_TILE_ICONS.today} label={t('admin_range_today')} range="USD" value={`$${cost.usd_today.toFixed(2)}`} />
        <StatTile icon={COST_TILE_ICONS.week} label={t('admin_range_week')} range="USD" value={`$${cost.usd_week.toFixed(2)}`} />
        <StatTile icon={COST_TILE_ICONS.month} label={t('admin_stat_month')} range="USD" value={`$${cost.usd_month.toFixed(2)}`} />
        <StatTile icon={COST_TILE_ICONS.allTime} label={t('admin_stat_all_time')} range="USD" value={`$${cost.usd_all_time.toFixed(2)}`} />
      </div>
      {cost.daily?.length > 0 && (
        <BarChart
          data={cost.daily}
          series={[{ key: 'usd', label: t('admin_series_cost_usd'), color: 'var(--chart-1)' }]}
          dateFormatter={getShortDate(language)}
          valueFormatter={(v) => `$${v.toFixed(2)}`}
        />
      )}
      <AsOfNote asOf={cost.as_of} />
      <TopupSection provider="openai" spentAllTime={cost.usd_all_time} />
    </div>
  )
}

function PerplexityCostWidget() {
  const { t, language } = useLanguage()
  const { data: cost, error: costError } = useAdminFetch('/api/admin/stats/perplexity-cost')

  if (costError || !cost) {
    return (
      <div className="admin-widget">
        <h3 className="admin-section__title">{t('admin_title_perplexity')}</h3>
        {costError ? <div className="admin-error">{costError}</div> : <div className="admin-loading admin-loading--widget">{t('admin_loading')}</div>}
      </div>
    )
  }
  if (cost.usd_today == null) {
    return (
      <div className="admin-widget">
        <h3 className="admin-section__title">{t('admin_title_perplexity')}</h3>
        <div className="admin-empty">{t('admin_empty_no_data')}</div>
      </div>
    )
  }

  return (
    <div className="admin-widget">
      <h3 className="admin-section__title">{t('admin_title_perplexity')}</h3>
      <p className="admin-hint">{t('admin_hint_perplexity')}</p>
      <div className="admin-stats-grid admin-stats-grid--compact">
        <StatTile icon={COST_TILE_ICONS.today} label={t('admin_range_today')} range="USD" value={`$${cost.usd_today.toFixed(2)}`} />
        <StatTile icon={COST_TILE_ICONS.week} label={t('admin_range_week')} range="USD" value={`$${cost.usd_week.toFixed(2)}`} />
        <StatTile icon={COST_TILE_ICONS.month} label={t('admin_stat_month')} range="USD" value={`$${cost.usd_month.toFixed(2)}`} />
        <StatTile icon={COST_TILE_ICONS.allTime} label={t('admin_stat_all_time')} range="USD" value={`$${cost.usd_all_time.toFixed(2)}`} />
      </div>
      {cost.daily?.length > 0 && (
        <BarChart
          data={cost.daily}
          series={[{ key: 'usd', label: t('admin_series_cost_usd_est'), color: 'var(--chart-4)' }]}
          dateFormatter={getShortDate(language)}
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
  const { t, language } = useLanguage()
  const [days, setDays] = useState(14)
  const { data: summary, error: summaryError } = useAdminFetch('/api/admin/stats/summary')
  const { data: scans, error: scansError } = useAdminFetch(`/api/admin/stats/scans-daily?days=${days}`)

  return (
    <div className="admin-widget">
      <h3 className="admin-section__title">{t('admin_title_users_scans')}</h3>
      {summaryError && <div className="admin-error">{summaryError}</div>}
      {!summary ? <div className="admin-loading admin-loading--widget">{t('admin_loading')}</div> : (
        <div className="admin-stats-grid">
          <StatTile icon={Users} label={t('admin_stat_total_users')} value={summary.total_users} />
          <StatTile icon={ScrollText} label={t('admin_stat_total_scans')} value={summary.total_audits} />
          <StatTile icon={UserPlus} label={t('admin_stat_new_user')} range={t('admin_range_today')} value={summary.new_users_today} />
          <StatTile icon={RotateCcw} label={t('admin_stat_returning_user')} range={t('admin_range_today')} value={summary.returning_users_today} />
          <StatTile icon={UserPlus} label={t('admin_stat_new_user')} range={t('admin_range_week')} value={summary.new_users_week} />
          <StatTile icon={RotateCcw} label={t('admin_stat_returning_user')} range={t('admin_range_week')} value={summary.returning_users_week} />
        </div>
      )}

      <RangeToggle days={days} onChange={setDays} />
      {scansError && <div className="admin-error">{scansError}</div>}
      {!scans ? <div className="admin-loading admin-loading--widget">{t('admin_loading')}</div> : (() => {
        const rangeLabel = getRangeOptions(t).find((o) => o.days === days)?.label || t('admin_range_days_suffix', { n: days })
        const webTotal = scans.days.reduce((sum, d) => sum + (d.web || 0), 0)
        const personTotal = scans.days.reduce((sum, d) => sum + (d.person || 0), 0)
        const brandTotal = scans.days.reduce((sum, d) => sum + (d.brand || 0), 0)
        return (
          <>
            <div className="admin-stats-grid admin-stats-grid--compact">
              <StatTile icon={ScrollText} label={t('admin_stat_total_scans')} range={rangeLabel} value={webTotal + personTotal + brandTotal} />
              <StatTile icon={Globe} label={t('admin_stat_website')} range={rangeLabel} value={webTotal} />
              <StatTile icon={User} label={t('admin_stat_person')} range={rangeLabel} value={personTotal} />
              <StatTile icon={Tag} label={t('admin_stat_brand')} range={rangeLabel} value={brandTotal} />
            </div>
            <BarChart data={scans.days} series={getScanSeries(t)} stacked dateFormatter={getShortDate(language)} />
          </>
        )
      })()}
    </div>
  )
}

function CreditsWidget() {
  const { t, language } = useLanguage()
  const [days, setDays] = useState(14)
  const { data, error } = useAdminFetch(`/api/admin/stats/credits?days=${days}`)

  return (
    <div className="admin-widget">
      <h3 className="admin-section__title">{t('admin_title_credits')}</h3>
      {error && <div className="admin-error">{error}</div>}
      {!data ? <div className="admin-loading admin-loading--widget">{t('admin_loading')}</div> : (() => {
        const reasonLabels = getReasonLabels(t)
        const reasonItems = Object.entries(data.by_reason || {})
          .sort((a, b) => b[1] - a[1])
          .map(([key, value]) => ({ label: reasonLabels[key] || key, value, color: 'var(--chart-4)' }))
        const rangeLabel = getRangeOptions(t).find((o) => o.days === days)?.label || t('admin_range_days_suffix', { n: days })
        const rangeSpent = data.daily.reduce((sum, d) => sum + (d.spent || 0), 0)
        const rangeGranted = data.daily.reduce((sum, d) => sum + (d.granted || 0), 0)
        return (
          <>
            <div className="admin-stats-grid admin-stats-grid--compact">
              <StatTile icon={ShoppingCart} label={t('admin_stat_sold_credit')} range={t('admin_range_total')} value={data.purchased} />
              <StatTile icon={TrendingDown} label={t('admin_stat_spent_credit')} range={t('admin_range_total')} value={data.spent} />
              <StatTile icon={Gift} label={t('admin_stat_gifted_credit')} range={t('admin_range_total')} value={data.gifted} />
              <StatTile icon={ShieldAlert} label={t('admin_stat_admin_spent')} range={t('admin_range_separate')} value={data.admin_spent} />
            </div>
            <RangeToggle days={days} onChange={setDays} />
            <div className="admin-stats-grid admin-stats-grid--compact">
              <StatTile icon={TrendingDown} label={t('admin_stat_spent')} range={rangeLabel} value={rangeSpent} />
              <StatTile icon={TrendingUp} label={t('admin_stat_given')} range={rangeLabel} value={rangeGranted} />
            </div>
            <BarChart data={data.daily} series={getCreditSeries(t)} dateFormatter={getShortDate(language)} />
            {reasonItems.length > 0 && (
              <>
                <div className="admin-subtitle">{t('admin_subtitle_reason', { range: rangeLabel })}</div>
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
  const { t, language } = useLanguage()
  const providerMeta = getProviderMeta(t)
  return (
    <div className="admin-section admin-overview-grid">
      <UsersAndScansWidget />

      <CreditsWidget />

      <TotalCostWidget />

      <Widget title={t('admin_title_anthropic')} hint={t('admin_hint_anthropic')} path="/api/admin/stats/anthropic-cost" render={(data) => {
        if (!data || data.usd_today == null) {
          return <div className="admin-empty">{t('admin_empty_admin_key')}</div>
        }
        return (
          <>
            <div className="admin-stats-grid admin-stats-grid--compact">
              <StatTile icon={COST_TILE_ICONS.today} label={t('admin_range_today')} range="USD" value={`$${data.usd_today.toFixed(2)}`} />
              <StatTile icon={COST_TILE_ICONS.week} label={t('admin_range_week')} range="USD" value={`$${data.usd_week.toFixed(2)}`} />
              <StatTile icon={COST_TILE_ICONS.month} label={t('admin_stat_month')} range="USD" value={`$${data.usd_month.toFixed(2)}`} />
              <StatTile icon={COST_TILE_ICONS.allTime} label={t('admin_stat_all_time')} range="USD" value={`$${data.usd_all_time.toFixed(2)}`} />
            </div>
            {data.daily?.length > 0 && (
              <BarChart
                data={data.daily}
                series={[{ key: 'usd', label: t('admin_series_cost_usd'), color: 'var(--chart-3)' }]}
                dateFormatter={getShortDate(language)}
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

      <SupabaseCostWidget />

      <Widget title={t('admin_title_aws')} hint={t('admin_hint_aws')} path="/api/admin/stats/aws-cost" render={(data) => {
        if (!data || data.usd_today == null) {
          return <div className="admin-empty">{t('admin_empty_aws')}</div>
        }
        const serviceItems = Object.entries(data.by_service || {}).map(([label, value]) => ({ label, value, color: 'var(--chart-1)' }))
        return (
          <>
            <div className="admin-stats-grid admin-stats-grid--compact">
              <StatTile icon={COST_TILE_ICONS.today} label={t('admin_range_today')} range="USD" value={`$${data.usd_today.toFixed(2)}`} />
              <StatTile icon={COST_TILE_ICONS.week} label={t('admin_range_week')} range="USD" value={`$${data.usd_week.toFixed(2)}`} />
              <StatTile icon={COST_TILE_ICONS.month} label={t('admin_stat_month')} range="USD" value={`$${data.usd_month.toFixed(2)}`} />
            </div>
            {data.daily?.length > 0 && (
              <BarChart
                data={data.daily}
                series={[{ key: 'usd', label: t('admin_series_cost_usd'), color: 'var(--chart-1)' }]}
                dateFormatter={getShortDate(language)}
                valueFormatter={(v) => `$${v.toFixed(2)}`}
              />
            )}
            {serviceItems.length > 0 && (
              <>
                <div className="admin-subtitle">{t('admin_subtitle_service')}</div>
                <HBarList items={serviceItems} valueFormatter={(v) => `$${v.toFixed(2)}`} />
              </>
            )}
          </>
        )
      }} />

      <Widget title={t('admin_title_gemini')} hint={t('admin_hint_gemini')} path="/api/admin/stats/gemini-cost" render={(data) => {
        if (!data || data.usd_today == null) {
          return <div className="admin-empty">{t('admin_empty_gemini')}</div>
        }
        return (
          <>
            <div className="admin-stats-grid admin-stats-grid--compact">
              <StatTile icon={COST_TILE_ICONS.today} label={t('admin_range_today')} range="₺" value={`₺${data.usd_today.toFixed(2)}`} />
              <StatTile icon={COST_TILE_ICONS.week} label={t('admin_range_week')} range="₺" value={`₺${data.usd_week.toFixed(2)}`} />
              <StatTile icon={COST_TILE_ICONS.month} label={t('admin_stat_month')} range="₺" value={`₺${data.usd_month.toFixed(2)}`} />
              <StatTile icon={COST_TILE_ICONS.allTime} label={t('admin_stat_all_time')} range="₺" value={`₺${data.usd_all_time.toFixed(2)}`} />
            </div>
            {data.daily?.length > 0 && (
              <BarChart
                data={data.daily}
                series={[{ key: 'usd', label: t('admin_series_cost_try'), color: 'var(--chart-2)' }]}
                dateFormatter={getShortDate(language)}
                valueFormatter={(v) => `₺${v.toFixed(2)}`}
              />
            )}
            <AsOfNote asOf={data.as_of} />
            <TopupSection provider="gemini" spentAllTime={data.usd_all_time} currency="₺" />
          </>
        )
      }} />

      <Widget
        title={t('admin_title_tavily')}
        hint={t('admin_hint_tavily')}
        path="/api/admin/stats/tavily-usage"
        render={(data) => {
          const accounts = Object.entries(data || {})
          if (accounts.length === 0) return <div className="admin-empty">{t('admin_empty_generic')}</div>
          return (
            <div className="tavily-accounts">
              {accounts.map(([key, acc]) => (
                <div key={key} className="tavily-account">
                  <div className="tavily-account__title">
                    {providerMeta[key]?.label || key}
                    {acc.plan && <span className="tavily-account__plan">{acc.plan}</span>}
                  </div>
                  <UsageBar label={t('admin_plan_quota')} used={acc.plan_usage} limit={acc.plan_limit} color={providerMeta[key]?.color || 'var(--chart-5)'} />
                  {acc.paygo_limit > 0 && (
                    <UsageBar label={t('admin_payg')} used={acc.paygo_usage} limit={acc.paygo_limit} color="var(--chart-4)" />
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
  const { t, language } = useLanguage()
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [sortBy, setSortBy] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedUserId, setSelectedUserId] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ search, sort_by: sortBy, sort_dir: sortDir, limit: PAGE_SIZE, offset: page * PAGE_SIZE })
    authedFetch(`/api/admin/users?${params}`)
      .then(res => { setUsers(res.users || []); setTotal(res.total || 0); setError(null) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [search, sortBy, sortDir, page])

  useEffect(() => { load() }, [load])

  const toggleSort = (field) => {
    setPage(0)
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortDir(field === 'email' ? 'asc' : 'desc')
    }
  }

  const SortHeader = ({ field, className, children }) => (
    <th className={`admin-table__sortable ${className || ''}`} onClick={() => toggleSort(field)}>
      <span className="admin-table__sort-label">
        {children}
        {sortBy === field && (sortDir === 'asc' ? <ChevronUp size={12} strokeWidth={2} /> : <ChevronDown size={12} strokeWidth={2} />)}
      </span>
    </th>
  )

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const locale = language === 'en' ? 'en-US' : 'tr-TR'
  const formatDate = (d) => new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })

  if (selectedUserId) {
    return <UserDetailView userId={selectedUserId} onBack={() => setSelectedUserId(null)} onChanged={load} />
  }

  return (
    <div className="admin-section">
      <div className="admin-search">
        <Search size={15} strokeWidth={1.5} />
        <input
          placeholder={t('admin_search_placeholder')}
          value={search}
          onChange={e => { setPage(0); setSearch(e.target.value) }}
        />
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-table-wrap">
        <table className="admin-table admin-table--users">
          <thead>
            <tr>
              <SortHeader field="email">{t('admin_table_user')}</SortHeader>
              <SortHeader field="credit_balance" className="admin-table__num">{t('admin_table_credit')}</SortHeader>
              <SortHeader field="total_credits_purchased" className="admin-table__num">{t('admin_table_received')}</SortHeader>
              <SortHeader field="total_credits_spent" className="admin-table__num">{t('admin_stat_spent')}</SortHeader>
              <SortHeader field="total_credits_gifted" className="admin-table__num">{t('admin_table_gifted')}</SortHeader>
              <SortHeader field="created_at" className="admin-table__num">{t('admin_user_joined')}</SortHeader>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="admin-loading">{t('admin_loading')}</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="admin-empty">{t('admin_no_users')}</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="admin-table__row--clickable" onClick={() => setSelectedUserId(u.id)}>
                <td>
                  <div className="admin-user-cell">
                    <div className="admin-user-avatar">{(u.full_name || u.email || '?')[0]?.toUpperCase()}</div>
                    <div>
                      <div className="admin-user-cell__name">
                        {u.email || '—'}
                        {u.is_admin && <span className="admin-badge admin-badge--admin">Admin</span>}
                        {u.is_expert && <span className="admin-badge admin-badge--expert">{t('admin_table_expert')}</span>}
                        {u.is_suspended && <span className="admin-badge admin-badge--suspended">{t('admin_suspended_badge')}</span>}
                      </div>
                      {u.full_name && <span className="admin-user-cell__sub">{u.full_name}</span>}
                    </div>
                  </div>
                </td>
                <td className="admin-table__num">{u.credit_balance ?? 0}</td>
                <td className="admin-table__num">{u.total_credits_purchased ?? 0}</td>
                <td className="admin-table__num">{u.total_credits_spent ?? 0}</td>
                <td className="admin-table__num">{u.total_credits_gifted ?? 0}</td>
                <td className="admin-table__muted admin-table__num">{formatDate(u.created_at)}</td>
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

const ADMIN_SCOPE_FIELDS = ['users', 'tickets', 'campaigns']

const SUBLIST_PAGE_SIZE = 8

function PaginatedSubList({ title, fetchPath, columns, renderRow, emptyLabel }) {
  const { t } = useLanguage()
  const [page, setPage] = useState(0)
  const [data, setData] = useState(null)

  useEffect(() => {
    setData(null)
    authedFetch(`${fetchPath}?limit=${SUBLIST_PAGE_SIZE}&offset=${page * SUBLIST_PAGE_SIZE}`)
      .then(setData)
      .catch(() => setData({ items: [], total: 0 }))
  }, [fetchPath, page])

  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / SUBLIST_PAGE_SIZE))

  return (
    <div className="admin-card">
      <div className="admin-card__title">{title}</div>
      {!data ? <div className="admin-loading admin-loading--widget">{t('admin_loading')}</div> : data.items.length === 0 ? (
        <div className="admin-empty">{emptyLabel}</div>
      ) : (
        <>
          <div className="admin-sublist">
            <div className="admin-sublist__head">
              {columns.map((c) => <span key={c}>{c}</span>)}
              <span className="admin-sublist__head-spacer" />
            </div>
            {data.items.map(renderRow)}
          </div>
          {totalPages > 1 && (
            <div className="admin-pagination admin-pagination--compact">
              <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={13} /></button>
              <span>{page + 1} / {totalPages}</span>
              <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}><ChevronRight size={13} /></button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function UserDetailView({ userId, onBack, onChanged }) {
  const { t, language } = useLanguage()
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notesDraft, setNotesDraft] = useState('')
  const [creditDraft, setCreditDraft] = useState('')
  const [pendingCreditDelta, setPendingCreditDelta] = useState(null)
  const [creditComment, setCreditComment] = useState('')
  const [viewingAuditId, setViewingAuditId] = useState(null)

  const load = useCallback(() => {
    authedFetch(`/api/admin/users/${userId}/detail`)
      .then((res) => { setDetail(res); setNotesDraft(res.profile.admin_notes || ''); setError(null) })
      .catch((e) => setError(e.message))
  }, [userId])

  useEffect(() => { load() }, [load])

  const locale = language === 'en' ? 'en-US' : 'tr-TR'
  const formatDate = (d) => d ? new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

  const confirmAdjustCredits = async () => {
    if (!pendingCreditDelta) return
    setBusy(true)
    try {
      await authedFetch(`/api/admin/users/${userId}/credits`, {
        method: 'POST',
        body: JSON.stringify({ delta: pendingCreditDelta, reason: creditComment || t('admin_credit_manual_note') }),
      })
      setCreditDraft('')
      setPendingCreditDelta(null)
      setCreditComment('')
      load(); onChanged?.()
    } catch (e) { setError(e.message) }
    setBusy(false)
  }

  const toggleAdmin = async () => {
    setBusy(true)
    try {
      await authedFetch(`/api/admin/users/${userId}/admin-flag`, { method: 'POST', body: JSON.stringify({ is_admin: !detail.profile.is_admin }) })
      load(); onChanged?.()
    } catch (e) { setError(e.message) }
    setBusy(false)
  }

  const toggleExpert = async () => {
    setBusy(true)
    try {
      await authedFetch(`/api/admin/users/${userId}/expert-flag`, { method: 'POST', body: JSON.stringify({ is_expert: !detail.profile.is_expert }) })
      load(); onChanged?.()
    } catch (e) { setError(e.message) }
    setBusy(false)
  }

  const toggleSuspended = async () => {
    setBusy(true)
    try {
      await authedFetch(`/api/admin/users/${userId}/suspend`, { method: 'POST', body: JSON.stringify({ suspended: !detail.profile.is_suspended }) })
      load(); onChanged?.()
    } catch (e) { setError(e.message) }
    setBusy(false)
  }

  const toggleScope = async (field) => {
    setBusy(true)
    try {
      await authedFetch(`/api/admin/users/${userId}/admin-scopes`, {
        method: 'POST',
        body: JSON.stringify({ [field]: !detail.profile[`admin_scope_${field}`] }),
      })
      load()
    } catch (e) { setError(e.message) }
    setBusy(false)
  }

  const saveNotes = async () => {
    setBusy(true)
    try {
      await authedFetch(`/api/admin/users/${userId}/notes`, { method: 'POST', body: JSON.stringify({ notes: notesDraft }) })
      load()
    } catch (e) { setError(e.message) }
    setBusy(false)
  }

  if (viewingAuditId) {
    return <AuditDetailOverlay auditId={viewingAuditId} onBack={() => setViewingAuditId(null)} />
  }

  return (
    <div className="admin-section admin-userpage">
      <button className="admin-back-link" onClick={onBack}><ArrowLeft size={14} strokeWidth={1.5} /> {t('admin_user_back_to_list')}</button>

      {error && <div className="admin-error">{error}</div>}
      {!detail ? <div className="admin-loading admin-loading--widget">{t('admin_loading')}</div> : (() => {
        const p = detail.profile
        return (
          <>
            <div className="admin-userpage__header">
              <div className="admin-user-avatar admin-user-avatar--lg">{(p.full_name || p.email || '?')[0]?.toUpperCase()}</div>
              <div className="admin-userpage__identity">
                <div className="admin-userpage__title">{p.email || '—'}</div>
                {p.full_name && <div className="admin-user-cell__sub">{p.full_name}</div>}
                <div className="admin-modal__meta">
                  {t('admin_user_joined')}: {formatDate(p.created_at)} · {t('admin_user_last_seen')}: {formatDate(p.last_sign_in_at)}
                  {p.utm_source && <> · {t('admin_user_source')}: {p.utm_source}</>}
                </div>
              </div>
              <div className="admin-userpage__stats">
                <div className="admin-stat-box"><span>{p.credit_balance ?? 0}</span>{t('admin_table_credit')}</div>
                <div className="admin-stat-box"><span>{p.total_credits_purchased ?? 0}</span>{t('admin_table_received')}</div>
                <div className="admin-stat-box"><span>{p.total_credits_spent ?? 0}</span>{t('admin_stat_spent')}</div>
                <div className="admin-stat-box"><span>{p.total_credits_gifted ?? 0}</span>{t('admin_table_gifted')}</div>
                <div className="admin-stat-box admin-stat-box--edit">
                  <span className="admin-stat-box__label">{t('admin_user_adjust_credit')}</span>
                  <div className="admin-modal__credit-edit">
                    <input
                      type="number" placeholder="0"
                      value={creditDraft}
                      onChange={(e) => setCreditDraft(e.target.value)}
                    />
                    <button disabled={busy || !creditDraft} onClick={() => setPendingCreditDelta(Math.abs(Number(creditDraft || 0)))} title={t('admin_credit_add_title')}>
                      <Plus size={13} strokeWidth={2} />
                    </button>
                    <button disabled={busy || !creditDraft} onClick={() => setPendingCreditDelta(-Math.abs(Number(creditDraft || 0)))} title={t('admin_credit_remove_title')}>
                      <Minus size={13} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-userpage__grid">
              <div className="admin-userpage__col">
                <div className="admin-card">
                  <div className="admin-card__title">{t('admin_user_permissions_title')}</div>

                  <div className="admin-card__row">
                    <span className="admin-card__row-label">{t('admin_user_status')}</span>
                    <button className={`admin-admin-toggle admin-admin-toggle--right ${p.is_suspended ? 'admin-admin-toggle--danger' : ''}`} disabled={busy} onClick={toggleSuspended}>
                      {p.is_suspended ? t('admin_user_unsuspend') : t('admin_user_suspend')}
                    </button>
                  </div>

                  <div className="admin-card__row admin-card__row--top">
                    <span className="admin-card__row-label">{t('admin_table_admin')}</span>
                    <div className="admin-card__row-content">
                      <button className={`admin-admin-toggle admin-admin-toggle--right ${p.is_admin ? 'admin-admin-toggle--on' : ''}`} disabled={busy} onClick={toggleAdmin}>
                        {p.is_admin ? <Shield size={13} strokeWidth={1.5} /> : <ShieldOff size={13} strokeWidth={1.5} />} {p.is_admin ? t('admin_admin_revoke_title') : t('admin_admin_grant_title')}
                      </button>
                      {p.is_admin && (
                        <div className="admin-modal__scopes">
                          {ADMIN_SCOPE_FIELDS.map((field) => (
                            <label key={field} className="admin-modal__scope-checkbox">
                              <input type="checkbox" checked={!!p[`admin_scope_${field}`]} disabled={busy} onChange={() => toggleScope(field)} />
                              {t(`admin_scope_${field}`)}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="admin-card__row admin-card__row--top">
                    <span className="admin-card__row-label">{t('admin_table_expert')}</span>
                    <div className="admin-card__row-content">
                      <button className={`admin-admin-toggle admin-admin-toggle--right ${p.is_expert ? 'admin-admin-toggle--on' : ''}`} disabled={busy} onClick={toggleExpert}>
                        {p.is_expert ? <Wrench size={13} strokeWidth={1.5} /> : '—'} {p.is_expert ? t('admin_expert_revoke_title') : t('admin_expert_grant_title')}
                      </button>
                      {p.is_expert && detail.expert_stats && (
                        <span className="admin-modal__expert-stats">
                          {t('admin_user_expert_verified')}: {detail.expert_stats.verified} · {t('admin_user_expert_rejected')}: {detail.expert_stats.rejected}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <PaginatedSubList
                  title={t('admin_user_recent_tickets')}
                  fetchPath={`/api/admin/users/${userId}/tickets`}
                  columns={[t('admin_sublist_col_type'), t('admin_sublist_col_status'), t('admin_sublist_col_date')]}
                  emptyLabel={t('admin_no_records')}
                  renderRow={(tk) => (
                    <div className="admin-sublist__row" key={tk.id}>
                      <span>{tk.ticket_type_name}</span>
                      <span><span className={`ticket-status ticket-status--${tk.status}`}>{t(TICKET_STATUS_KEY_MAP[tk.status] || tk.status)}</span></span>
                      <span>{formatDate(tk.created_at)}</span>
                    </div>
                  )}
                />

                <div className="admin-card">
                  <div className="admin-card__title">{t('admin_user_notes')}</div>
                  <textarea
                    className="admin-modal__notes"
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    placeholder={t('admin_user_notes_ph')}
                    rows={3}
                  />
                  <div className="admin-card__actions-right">
                    <button className="admin-card__save-btn" disabled={busy} onClick={saveNotes}>{t('admin_user_notes_save')}</button>
                  </div>
                </div>
              </div>

              <div className="admin-userpage__col">
                <PaginatedSubList
                  title={t('admin_user_recent_audits')}
                  fetchPath={`/api/admin/users/${userId}/audits`}
                  columns={[t('admin_sublist_col_target'), t('admin_sublist_col_score'), t('admin_sublist_col_date')]}
                  emptyLabel={t('admin_no_records')}
                  renderRow={(a) => (
                    <div
                      key={a.id}
                      className={`admin-sublist__row ${a.status === 'complete' ? 'admin-sublist__row--clickable' : ''}`}
                      onClick={() => a.status === 'complete' && setViewingAuditId(a.id)}
                    >
                      <span>{a.domain || a.name || '—'}</span>
                      <span>{a.score ?? '—'}</span>
                      <span>{formatDate(a.created_at)}</span>
                      {a.status === 'complete' && <ChevronRight size={13} strokeWidth={1.5} />}
                    </div>
                  )}
                />

                <PaginatedSubList
                  title={t('admin_user_recent_transactions')}
                  fetchPath={`/api/admin/users/${userId}/transactions`}
                  columns={[t('admin_sublist_col_desc'), t('admin_sublist_col_amount'), t('admin_sublist_col_date')]}
                  emptyLabel={t('admin_no_records')}
                  renderRow={(tx) => (
                    <div className="admin-sublist__row" key={tx.id}>
                      <span>{tx.description || tx.type}</span>
                      <span>{tx.amount > 0 ? '+' : ''}{tx.amount}</span>
                      <span>{formatDate(tx.created_at)}</span>
                    </div>
                  )}
                />
              </div>
            </div>
          </>
        )
      })()}

      {pendingCreditDelta !== null && (
        <div className="confirm-overlay" onClick={() => !busy && setPendingCreditDelta(null)}>
          <div className="confirm-dialog admin-credit-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-dialog__title">
              {pendingCreditDelta > 0
                ? t('admin_credit_confirm_add_title', { amount: pendingCreditDelta })
                : t('admin_credit_confirm_remove_title', { amount: Math.abs(pendingCreditDelta) })}
            </div>
            <div className="confirm-dialog__message">{t('admin_credit_confirm_message')}</div>
            <textarea
              className="admin-modal__notes admin-credit-confirm__input"
              value={creditComment}
              onChange={(e) => setCreditComment(e.target.value)}
              placeholder={t('admin_credit_confirm_ph')}
              rows={3}
              autoFocus
            />
            <div className="confirm-dialog__actions">
              <button type="button" className="confirm-dialog__cancel" disabled={busy} onClick={() => { setPendingCreditDelta(null); setCreditComment('') }}>{t('confirm_cancel')}</button>
              <button type="button" className="confirm-dialog__confirm" disabled={busy} onClick={confirmAdjustCredits}>{t('admin_credit_confirm_submit')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AuditDetailOverlay({ auditId, onBack }) {
  const { t } = useLanguage()
  const [audit, setAudit] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    authedFetch(`/api/admin/audits/${auditId}`)
      .then(setAudit)
      .catch((e) => setError(e.message))
  }, [auditId])

  if (error) {
    return (
      <div className="admin-section">
        <button className="admin-back-link" onClick={onBack}><ArrowLeft size={14} strokeWidth={1.5} /> {t('admin_user_back_to_card')}</button>
        <div className="admin-error">{error}</div>
      </div>
    )
  }
  if (!audit) {
    return (
      <div className="admin-section">
        <button className="admin-back-link" onClick={onBack}><ArrowLeft size={14} strokeWidth={1.5} /> {t('admin_user_back_to_card')}</button>
        <div className="admin-loading admin-loading--widget">{t('admin_loading')}</div>
      </div>
    )
  }

  const Report = audit.type === 'web' ? ResultsPage : BrandCheckResultsPage

  return (
    <div className="admin-audit-overlay">
      <button className="admin-audit-overlay__back" onClick={onBack}><ArrowLeft size={14} strokeWidth={1.5} /> {t('admin_user_back_to_card')}</button>
      <Report result={audit.result_json} onReset={onBack} isPro={true} />
    </div>
  )
}

function AuditsTab() {
  const { t, language } = useLanguage()
  const [audits, setAudits] = useState([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [sortBy, setSortBy] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewingAuditId, setViewingAuditId] = useState(null)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ search, sort_by: sortBy, sort_dir: sortDir, limit: PAGE_SIZE, offset: page * PAGE_SIZE })
    authedFetch(`/api/admin/audits?${params}`)
      .then(res => { setAudits(res.audits || []); setTotal(res.total || 0); setError(null) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [search, sortBy, sortDir, page])

  if (viewingAuditId) {
    return <AuditDetailOverlay auditId={viewingAuditId} onBack={() => setViewingAuditId(null)} />
  }

  const toggleSort = (field) => {
    setPage(0)
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortDir(field === 'email' || field === 'type' ? 'asc' : 'desc')
    }
  }

  const SortHeader = ({ field, className, children }) => (
    <th className={`admin-table__sortable ${className || ''}`} onClick={() => toggleSort(field)}>
      <span className="admin-table__sort-label">
        {children}
        {sortBy === field && (sortDir === 'asc' ? <ChevronUp size={12} strokeWidth={2} /> : <ChevronDown size={12} strokeWidth={2} />)}
      </span>
    </th>
  )

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const locale = language === 'en' ? 'en-US' : 'tr-TR'
  const formatDate = (d) => new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="admin-section">
      <div className="admin-search">
        <Search size={15} strokeWidth={1.5} />
        <input
          placeholder={t('admin_search_placeholder_audits')}
          value={search}
          onChange={e => { setPage(0); setSearch(e.target.value) }}
        />
      </div>

      {error && <div className="admin-error">{error}</div>}
      <div className="admin-table-wrap">
        <table className="admin-table admin-table--audits">
          <thead>
            <tr>
              <SortHeader field="email" className="admin-table__left">{t('admin_table_user')}</SortHeader>
              <SortHeader field="type" className="admin-table__left">{t('admin_table_type')}</SortHeader>
              <SortHeader field="target" className="admin-table__left">{t('admin_table_target')}</SortHeader>
              <SortHeader field="score" className="admin-table__num">{t('admin_table_score')}</SortHeader>
              <SortHeader field="credits_spent" className="admin-table__num">{t('admin_table_credit')}</SortHeader>
              <SortHeader field="created_at" className="admin-table__num">{t('admin_table_date')}</SortHeader>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="admin-loading">{t('admin_loading')}</td></tr>
            ) : audits.length === 0 ? (
              <tr><td colSpan={6} className="admin-empty">{t('admin_no_records')}</td></tr>
            ) : audits.map(a => (
              <tr
                key={a.id}
                className={a.status === 'complete' ? 'admin-table__row--clickable' : ''}
                onClick={() => a.status === 'complete' && setViewingAuditId(a.id)}
              >
                <td className="admin-table__left">{a.email || '—'}</td>
                <td className="admin-table__left">{a.type}</td>
                <td className="admin-table__left admin-table__ellipsis">{a.domain || a.name || '—'}</td>
                <td className="admin-table__num">{a.score ?? '—'}</td>
                <td className="admin-table__num">{a.credits_spent ?? 0}</td>
                <td className="admin-table__num admin-table__muted">
                  {formatDate(a.created_at)}
                  {a.status === 'complete' && <ChevronRight size={13} strokeWidth={1.5} className="admin-table__row-chevron" />}
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

function PricingTiersWidget() {
  const { t } = useLanguage()
  const { data: tiers, error } = useAdminFetch('/api/admin/pricing-tiers')
  const [local, setLocal] = useState(null)
  const [form, setForm] = useState({ platform: 'web', min_credits: '', max_credits: '', price_per_credit: '', currency: 'TRY' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (tiers) setLocal(tiers) }, [tiers])

  const addTier = async () => {
    if (!form.min_credits || !form.price_per_credit) return
    setSaving(true)
    try {
      await authedFetch('/api/admin/pricing-tiers', {
        method: 'POST',
        body: JSON.stringify({
          platform: form.platform,
          min_credits: Number(form.min_credits),
          max_credits: form.max_credits ? Number(form.max_credits) : null,
          price_per_credit: Number(form.price_per_credit),
          currency: form.currency,
        }),
      })
      setLocal((prev) => [...(prev || []), { id: `tmp-${Date.now()}`, ...form, max_credits: form.max_credits || null }])
      setForm((f) => ({ ...f, min_credits: '', max_credits: '', price_per_credit: '' }))
    } catch { /* ignore - kullanici tekrar deneyebilir */ }
    setSaving(false)
  }

  const deleteTier = async (id) => {
    try {
      await authedFetch(`/api/admin/pricing-tiers/${id}`, { method: 'DELETE' })
      setLocal((prev) => prev.filter((x) => x.id !== id))
    } catch { /* ignore */ }
  }

  if (error) return <div className="admin-error">{error}</div>
  if (!local) return <div className="admin-loading admin-loading--widget">{t('admin_loading')}</div>

  return (
    <div className="admin-widget">
      <h3 className="admin-section__title">{t('admin_sales_pricing_tiers')}</h3>
      <p className="admin-hint">{t('admin_sales_pricing_hint')}</p>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t('admin_pricing_range')}</th><th>{t('admin_pricing_price')}</th><th></th>
            </tr>
          </thead>
          <tbody>
            {local.map((tier) => (
              <tr key={tier.id}>
                <td>{tier.min_credits} - {tier.max_credits ?? t('admin_pricing_none')}</td>
                <td>{tier.price_per_credit} {tier.currency}</td>
                <td><button onClick={() => deleteTier(tier.id)}>{t('admin_pricing_delete')}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="topup-form">
        <input type="number" placeholder={t('admin_pricing_min')} value={form.min_credits} onChange={(e) => setForm((f) => ({ ...f, min_credits: e.target.value }))} />
        <input type="number" placeholder={t('admin_pricing_max')} value={form.max_credits} onChange={(e) => setForm((f) => ({ ...f, max_credits: e.target.value }))} />
        <input type="number" step="0.01" placeholder={t('admin_pricing_price')} value={form.price_per_credit} onChange={(e) => setForm((f) => ({ ...f, price_per_credit: e.target.value }))} />
        <button disabled={saving || !form.min_credits || !form.price_per_credit} onClick={addTier}>{t('admin_pricing_add')}</button>
      </div>
    </div>
  )
}

function CampaignsTab() {
  const { t } = useLanguage()
  const { data: campaigns, error } = useAdminFetch('/api/admin/campaigns')
  const [local, setLocal] = useState(null)
  const [form, setForm] = useState({ name: '', slug: '', target_url: 'https://geoni.ai', utm_source: 'instagram', utm_medium: 'bio', utm_campaign: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => { if (campaigns) setLocal(campaigns) }, [campaigns])

  const addCampaign = async () => {
    if (!form.name || !form.slug || !form.utm_source) return
    setSaving(true)
    setFormError(null)
    try {
      await authedFetch('/api/admin/campaigns', { method: 'POST', body: JSON.stringify(form) })
      const res = await authedFetch('/api/admin/campaigns')
      setLocal(res)
      setForm((f) => ({ ...f, name: '', slug: '', utm_campaign: '' }))
    } catch (e) {
      setFormError(e.message)
    }
    setSaving(false)
  }

  const deleteCampaign = async (id) => {
    try {
      await authedFetch(`/api/admin/campaigns/${id}`, { method: 'DELETE' })
      setLocal((prev) => prev.filter((c) => c.id !== id))
    } catch { /* ignore - kullanici tekrar deneyebilir */ }
  }

  const copyLink = (c) => {
    const url = `https://geoni.ai/r/${c.slug}`
    navigator.clipboard?.writeText(url)
    setCopiedId(c.id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  return (
    <div className="admin-section">
      <div className="admin-widget">
        <h3 className="admin-section__title">{t('admin_campaigns_title')}</h3>
        <p className="admin-hint">{t('admin_campaigns_hint')}</p>

        {error && <div className="admin-error">{error}</div>}
        {!local ? <div className="admin-loading admin-loading--widget">{t('admin_loading')}</div> : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('admin_campaigns_name')}</th>
                  <th>{t('admin_campaigns_link')}</th>
                  <th>{t('admin_campaigns_utm')}</th>
                  <th className="admin-table__num">{t('admin_campaigns_clicks')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {local.length === 0 ? (
                  <tr><td colSpan={5} className="admin-empty">{t('admin_campaigns_empty')}</td></tr>
                ) : local.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>
                      <button type="button" className="admin-copy-link" onClick={() => copyLink(c)} title={t('admin_campaigns_copy')}>
                        geoni.ai/r/{c.slug} {copiedId === c.id ? <Check size={13} strokeWidth={2} /> : <Copy size={13} strokeWidth={1.5} />}
                      </button>
                    </td>
                    <td className="admin-campaigns-utm">
                      {c.utm_source}{c.utm_medium ? ` / ${c.utm_medium}` : ''}{c.utm_campaign ? ` / ${c.utm_campaign}` : ''}
                    </td>
                    <td className="admin-table__num">{c.click_count ?? 0}</td>
                    <td><button onClick={() => deleteCampaign(c.id)}>{t('admin_pricing_delete')}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="topup-form">
          <input type="text" placeholder={t('admin_campaigns_name')} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <input type="text" placeholder={t('admin_campaigns_slug_placeholder')} value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.trim() }))} />
          <select value={form.target_url} onChange={(e) => setForm((f) => ({ ...f, target_url: e.target.value }))}>
            <option value="https://geoni.ai">geoni.ai</option>
            <option value="https://app.geoni.ai">app.geoni.ai</option>
          </select>
          <input type="text" placeholder="utm_source" value={form.utm_source} onChange={(e) => setForm((f) => ({ ...f, utm_source: e.target.value }))} />
          <input type="text" placeholder="utm_medium" value={form.utm_medium} onChange={(e) => setForm((f) => ({ ...f, utm_medium: e.target.value }))} />
          <input type="text" placeholder="utm_campaign" value={form.utm_campaign} onChange={(e) => setForm((f) => ({ ...f, utm_campaign: e.target.value }))} />
          <button disabled={saving || !form.name || !form.slug || !form.utm_source} onClick={addCampaign}>{t('admin_campaigns_add')}</button>
        </div>
        {formError && <div className="admin-error">{formError}</div>}
      </div>
    </div>
  )
}

const TICKET_STATUS_FILTERS = ['', 'open', 'assigned', 'in_progress', 'submitted', 'verified', 'rejected']

function TicketsAdminTab() {
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const [statusFilter, setStatusFilter] = useState('')
  const { data: tickets, error } = useAdminFetch(`/api/admin/tickets${statusFilter ? `?status=${statusFilter}` : ''}`)
  const [local, setLocal] = useState(null)
  const [experts, setExperts] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [rejectDrafts, setRejectDrafts] = useState({})
  const [openId, setOpenId] = useState(null)

  useEffect(() => { if (tickets) setLocal(tickets) }, [tickets])
  useEffect(() => { authedFetch('/api/admin/experts').then(setExperts).catch(() => setExperts([])) }, [])

  const assign = async (ticketId, expertId) => {
    if (!expertId) return
    setBusyId(ticketId)
    try {
      await authedFetch(`/api/admin/tickets/${ticketId}/assign`, { method: 'POST', body: JSON.stringify({ expert_id: expertId }) })
      const res = await authedFetch(`/api/admin/tickets${statusFilter ? `?status=${statusFilter}` : ''}`)
      setLocal(res)
    } catch { /* kullanici tekrar deneyebilir */ }
    setBusyId(null)
  }

  const verify = async (ticketId, approve) => {
    setBusyId(ticketId)
    try {
      await authedFetch(`/api/admin/tickets/${ticketId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ approve, reject_reason: approve ? '' : (rejectDrafts[ticketId] || '') }),
      })
      const res = await authedFetch(`/api/admin/tickets${statusFilter ? `?status=${statusFilter}` : ''}`)
      setLocal(res)
    } catch { /* kullanici tekrar deneyebilir */ }
    setBusyId(null)
  }

  return (
    <div className="admin-section">
      <div className="admin-widget">
        <h3 className="admin-section__title">{t('admin_tickets_title')}</h3>
        <p className="admin-hint">{t('admin_tickets_hint')}</p>

        <div className="admin-ticket-filters">
          {TICKET_STATUS_FILTERS.map((s) => (
            <button
              key={s || 'all'}
              className={`admin-ticket-filter ${statusFilter === s ? 'admin-ticket-filter--active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >{s ? t(TICKET_STATUS_KEY_MAP[s]) : t('admin_tickets_filter_all')}</button>
          ))}
        </div>

        {error && <div className="admin-error">{error}</div>}
        {!local ? <div className="admin-loading admin-loading--widget">{t('admin_loading')}</div> : local.length === 0 ? (
          <div className="admin-empty">{t('admin_tickets_empty')}</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t('admin_table_user')}</th>
                  <th>{t('admin_campaigns_name')}</th>
                  <th>{t('admin_tickets_target')}</th>
                  <th>{t('admin_tickets_status')}</th>
                  <th>{t('admin_tickets_expert')}</th>
                  <th>{t('admin_tickets_evidence')}</th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {local.map((tk) => (
                  <Fragment key={tk.id}>
                  <tr>
                    <td className="admin-table__muted">{tk.id}</td>
                    <td>{tk.user_email || '—'}</td>
                    <td>{tk.ticket_type_name}</td>
                    <td>{tk.target || '—'}</td>
                    <td><span className={`ticket-status ticket-status--${tk.status}`}>{t(TICKET_STATUS_KEY_MAP[tk.status] || tk.status)}</span></td>
                    <td>
                      {tk.ticket_type_key === 'llms_robots' && !tk.assigned_expert_id ? (
                        <span className="admin-badge admin-badge--auto">{t('admin_tickets_automated')}</span>
                      ) : tk.status === 'open' || tk.status === 'assigned' || tk.status === 'in_progress' ? (
                        <select disabled={busyId === tk.id} value={tk.assigned_expert_id || ''} onChange={(e) => assign(tk.id, e.target.value)}>
                          <option value="">{t('admin_tickets_pick_expert')}</option>
                          {(experts || []).map((ex) => <option key={ex.id} value={ex.id}>{ex.email || ex.full_name}</option>)}
                        </select>
                      ) : (tk.expert_email || '—')}
                    </td>
                    <td>
                      {tk.evidence_url ? <a href={tk.evidence_url} target="_blank" rel="noopener noreferrer">{t('admin_tickets_view_evidence')}</a> : '—'}
                      {tk.evidence_note && <div className="admin-table__muted">{tk.evidence_note}</div>}
                    </td>
                    <td>
                      {tk.status === 'submitted' && (
                        <div className="admin-ticket-verify">
                          <button disabled={busyId === tk.id} onClick={() => verify(tk.id, true)}>{t('admin_tickets_approve')}</button>
                          <input
                            type="text" placeholder={t('admin_tickets_reject_reason_ph')}
                            value={rejectDrafts[tk.id] || ''}
                            onChange={(e) => setRejectDrafts((d) => ({ ...d, [tk.id]: e.target.value }))}
                          />
                          <button disabled={busyId === tk.id} onClick={() => verify(tk.id, false)}>{t('admin_tickets_reject')}</button>
                        </div>
                      )}
                    </td>
                    <td>
                      <button
                        className="admin-icon-btn admin-icon-btn--relative"
                        title={t('admin_tickets_messages')}
                        onClick={() => {
                          setOpenId(openId === tk.id ? null : tk.id)
                          setLocal((list) => list.map((x) => (x.id === tk.id ? { ...x, has_unread: false } : x)))
                        }}
                      >
                        <MessageSquare size={14} strokeWidth={1.5} />
                        {tk.has_unread && <span className="ticket-unread-dot" />}
                      </button>
                    </td>
                  </tr>
                  {openId === tk.id && (
                    <tr>
                      <td colSpan={9} className="admin-table__thread-cell">
                        <TicketJobCard ticket={tk} canEdit={true} currentUserId={user?.id} authedFetch={authedFetch} t={t} language={language} />
                      </td>
                    </tr>
                  )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TicketTypesWidget />
    </div>
  )
}

const TICKET_STATUS_KEY_MAP = {
  open: 'ticket_status_open', assigned: 'ticket_status_assigned', in_progress: 'ticket_status_in_progress',
  submitted: 'ticket_status_submitted', verified: 'ticket_status_verified', rejected: 'ticket_status_rejected',
}

function TicketTypesWidget() {
  const { t } = useLanguage()
  const { data: types, error } = useAdminFetch('/api/admin/ticket-types')
  const [local, setLocal] = useState(null)
  const [form, setForm] = useState({ key: '', name: '', description: '', token_cost: '', verification_type: 'manual' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  useEffect(() => { if (types) setLocal(types) }, [types])

  const addType = async () => {
    if (!form.key || !form.name || !form.token_cost) return
    setSaving(true)
    setFormError(null)
    try {
      await authedFetch('/api/admin/ticket-types', {
        method: 'POST',
        body: JSON.stringify({ ...form, token_cost: Number(form.token_cost) }),
      })
      const res = await authedFetch('/api/admin/ticket-types')
      setLocal(res)
      setForm({ key: '', name: '', description: '', token_cost: '', verification_type: 'manual' })
    } catch (e) { setFormError(e.message) }
    setSaving(false)
  }

  const toggleActive = async (id, current) => {
    try {
      await authedFetch(`/api/admin/ticket-types/${id}/active`, { method: 'POST', body: JSON.stringify({ is_active: !current }) })
      setLocal((prev) => prev.map((tt) => tt.id === id ? { ...tt, is_active: !current } : tt))
    } catch { /* kullanici tekrar deneyebilir */ }
  }

  if (error) return <div className="admin-error">{error}</div>
  if (!local) return <div className="admin-loading admin-loading--widget">{t('admin_loading')}</div>

  return (
    <div className="admin-widget">
      <h3 className="admin-section__title">{t('admin_ticket_types_title')}</h3>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>{t('admin_campaigns_name')}</th><th className="admin-table__num">{t('admin_ticket_types_cost')}</th><th>{t('admin_ticket_types_verification')}</th><th></th></tr>
          </thead>
          <tbody>
            {local.map((tt) => (
              <tr key={tt.id}>
                <td>{tt.name}</td>
                <td className="admin-table__num">{tt.token_cost}</td>
                <td>{tt.verification_type === 'auto' ? t('admin_ticket_types_auto') : t('admin_ticket_types_manual')}</td>
                <td><button onClick={() => toggleActive(tt.id, tt.is_active)}>{tt.is_active ? t('admin_ticket_types_deactivate') : t('admin_ticket_types_activate')}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="topup-form">
        <input type="text" placeholder="key" value={form.key} onChange={(e) => setForm((f) => ({ ...f, key: e.target.value.trim() }))} />
        <input type="text" placeholder={t('admin_campaigns_name')} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <input type="text" placeholder={t('admin_ticket_types_desc_ph')} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        <input type="number" placeholder={t('admin_ticket_types_cost')} value={form.token_cost} onChange={(e) => setForm((f) => ({ ...f, token_cost: e.target.value }))} />
        <select value={form.verification_type} onChange={(e) => setForm((f) => ({ ...f, verification_type: e.target.value }))}>
          <option value="manual">{t('admin_ticket_types_manual')}</option>
          <option value="auto">{t('admin_ticket_types_auto')}</option>
        </select>
        <button disabled={saving || !form.key || !form.name || !form.token_cost} onClick={addType}>{t('admin_pricing_add')}</button>
      </div>
      {formError && <div className="admin-error">{formError}</div>}
    </div>
  )
}

function SalesTab() {
  const { t, language } = useLanguage()
  const [days, setDays] = useState(14)
  const { data, error } = useAdminFetch(`/api/admin/stats/sales?days=${days}`)

  return (
    <div className="admin-section admin-overview-grid">
      <div className="admin-widget">
        <h3 className="admin-section__title">{t('admin_title_sales')}</h3>
        <p className="admin-hint">{t('admin_sales_hint')}</p>
        {error && <div className="admin-error">{error}</div>}
        {!data ? <div className="admin-loading admin-loading--widget">{t('admin_loading')}</div> : (() => {
          const rangeLabel = getRangeOptions(t).find((o) => o.days === days)?.label || t('admin_range_days_suffix', { n: days })
          const channels = ['web', 'ios', 'android']
          const channelLabels = { web: t('admin_sales_channel_web'), ios: t('admin_sales_channel_ios'), android: t('admin_sales_channel_android') }
          return (
            <>
              <RangeToggle days={days} onChange={setDays} />
              <div className="admin-stats-grid admin-stats-grid--compact">
                {channels.map((c) => (
                  <StatTile
                    key={c}
                    icon={TrendingUp}
                    label={channelLabels[c]}
                    range={data.revenue_by_channel[c] != null ? data.currency : t('admin_sales_not_integrated')}
                    value={(data.revenue_by_channel[c] || 0).toFixed(2)}
                  />
                ))}
              </div>
              {data.daily?.length > 0 && (
                <BarChart
                  data={data.daily}
                  series={[{ key: 'revenue', label: t('admin_sales_revenue_chart', { range: rangeLabel }), color: 'var(--chart-1)' }]}
                  dateFormatter={getShortDate(language)}
                  valueFormatter={(v) => `${v.toFixed(2)} ${data.currency}`}
                />
              )}
            </>
          )
        })()}
      </div>

      <div className="admin-widget">
        <h3 className="admin-section__title">{t('admin_sales_traffic_source')}</h3>
        {!data ? <div className="admin-loading admin-loading--widget">{t('admin_loading')}</div> : (() => {
          const items = Object.entries(data.by_source || {})
            .sort((a, b) => b[1] - a[1])
            .map(([key, value]) => ({ label: key === 'direct' ? t('admin_sales_source_direct') : key, value, color: 'var(--chart-2)' }))
          return items.length > 0 ? <HBarList items={items} /> : <div className="admin-empty">{t('admin_empty_no_data')}</div>
        })()}
      </div>

      <div className="admin-widget">
        <h3 className="admin-section__title">{t('admin_sales_revenue_by_source')}</h3>
        <p className="admin-hint">{t('admin_sales_revenue_by_source_hint')}</p>
        {!data ? <div className="admin-loading admin-loading--widget">{t('admin_loading')}</div> : (() => {
          const items = Object.entries(data.revenue_by_source || {})
            .sort((a, b) => b[1] - a[1])
            .map(([key, value]) => ({ label: key === 'direct' ? t('admin_sales_source_direct') : key, value, color: 'var(--chart-1)' }))
          return items.length > 0
            ? <HBarList items={items} valueFormatter={(v) => `${v.toFixed(2)} ${data.currency}`} />
            : <div className="admin-empty">{t('admin_empty_no_data')}</div>
        })()}
      </div>

      <div className="admin-widget">
        <h3 className="admin-section__title">{t('admin_sales_recent_purchases')}</h3>
        {!data ? <div className="admin-loading admin-loading--widget">{t('admin_loading')}</div> : data.recent.length === 0 ? (
          <div className="admin-empty">{t('admin_no_sales')}</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>{t('admin_table_date')}</th><th>{t('admin_table_channel')}</th><th>{t('admin_table_amount')}</th></tr></thead>
              <tbody>
                {data.recent.map((p, i) => (
                  <tr key={i}>
                    <td>{new Date(p.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'tr-TR')}</td>
                    <td>{p.channel}</td>
                    <td>{p.amount_paid} {p.currency_paid}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PricingTiersWidget />
    </div>
  )
}

const ADMIN_TABS = ['overview', 'users', 'audits', 'sales', 'campaigns', 'tickets']

export default function AdminPage({ onBack }) {
  const { t } = useLanguage()
  const { profile } = useAuth()
  const [tab, setTabState] = useState(() => {
    const fromHash = window.location.hash.slice(1)
    return ADMIN_TABS.includes(fromHash) ? fromHash : 'overview'
  })
  const setTab = (next) => {
    setTabState(next)
    window.location.hash = next
  }

  if (!profile?.is_admin) {
    return (
      <div className="admin-denied">
        <p>{t('admin_denied_text')}</p>
        <button className="dash-new-scan" onClick={onBack}>{t('admin_denied_back')}</button>
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
          <LanguageSwitcher />
          <ThemeSwitcher />
          <button className="admin-back" onClick={onBack}><ArrowLeft size={14} strokeWidth={1.5} /> {t('admin_back_to_dashboard')}</button>
        </div>
      </header>

      <div className="dashboard__body">
        <aside className="dashboard__sidebar">
          <nav className="dash-nav">
            <button className={`dash-nav__item ${tab === 'overview' ? 'dash-nav__item--active' : ''}`} onClick={() => setTab('overview')}>
              <LayoutDashboard size={16} strokeWidth={1.5} /> {t('admin_nav_overview')}
            </button>
            <button className={`dash-nav__item ${tab === 'users' ? 'dash-nav__item--active' : ''}`} onClick={() => setTab('users')}>
              <Users size={16} strokeWidth={1.5} /> {t('admin_nav_users')}
            </button>
            <button className={`dash-nav__item ${tab === 'audits' ? 'dash-nav__item--active' : ''}`} onClick={() => setTab('audits')}>
              <ScrollText size={16} strokeWidth={1.5} /> {t('admin_nav_scans')}
            </button>
            <button className={`dash-nav__item ${tab === 'sales' ? 'dash-nav__item--active' : ''}`} onClick={() => setTab('sales')}>
              <TrendingUp size={16} strokeWidth={1.5} /> {t('admin_nav_sales')}
            </button>
            <button className={`dash-nav__item ${tab === 'campaigns' ? 'dash-nav__item--active' : ''}`} onClick={() => setTab('campaigns')}>
              <Megaphone size={16} strokeWidth={1.5} /> {t('admin_nav_campaigns')}
            </button>
            <button className={`dash-nav__item ${tab === 'tickets' ? 'dash-nav__item--active' : ''}`} onClick={() => setTab('tickets')}>
              <Wrench size={16} strokeWidth={1.5} /> {t('admin_nav_tickets')}
            </button>
          </nav>
        </aside>

        <main className="dashboard__main">
          {tab === 'overview' && <OverviewTab />}
          {tab === 'users' && <UsersTab />}
          {tab === 'audits' && <AuditsTab />}
          {tab === 'sales' && <SalesTab />}
          {tab === 'campaigns' && <CampaignsTab />}
          {tab === 'tickets' && <TicketsAdminTab />}
        </main>
      </div>
    </div>
  )
}
