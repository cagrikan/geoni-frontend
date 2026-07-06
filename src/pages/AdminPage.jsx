import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../lib/AuthContext'
import { useLanguage } from '../lib/LanguageContext'
import { supabase } from '../lib/supabase'
import GeoniMark from '../GeoniMark'
import ThemeSwitcher from '../components/ThemeSwitcher'
import LanguageSwitcher from '../components/LanguageSwitcher'
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
  const { t } = useLanguage()
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
        body: JSON.stringify({ delta, reason: t('admin_credit_manual_note') }),
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
          placeholder={t('admin_search_placeholder')}
          value={search}
          onChange={e => { setPage(0); setSearch(e.target.value) }}
        />
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t('admin_table_user')}</th><th>{t('admin_table_credit')}</th><th>{t('admin_table_received')}</th><th>{t('admin_stat_spent')}</th><th>{t('admin_table_gifted')}</th><th>{t('admin_table_admin')}</th><th>{t('admin_table_credit_fix')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="admin-loading">{t('admin_loading')}</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="admin-empty">{t('admin_no_users')}</td></tr>
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
                    title={u.is_admin ? t('admin_admin_revoke_title') : t('admin_admin_grant_title')}
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
                      title={t('admin_credit_add_title')}
                    ><Plus size={13} strokeWidth={2} /></button>
                    <button
                      disabled={busyId === u.id || !creditInputs[u.id]}
                      onClick={() => adjustCredits(u.id, -Math.abs(Number(creditInputs[u.id] || 0)))}
                      title={t('admin_credit_remove_title')}
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
  const { t, language } = useLanguage()
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
  const locale = language === 'en' ? 'en-US' : 'tr-TR'
  const formatDate = (d) => new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="admin-section">
      {error && <div className="admin-error">{error}</div>}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>{t('admin_table_user')}</th><th>{t('admin_table_type')}</th><th>{t('admin_table_target')}</th><th>{t('admin_table_score')}</th><th>{t('admin_table_credit')}</th><th>{t('admin_table_date')}</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="admin-loading">{t('admin_loading')}</td></tr>
            ) : audits.length === 0 ? (
              <tr><td colSpan={6} className="admin-empty">{t('admin_no_records')}</td></tr>
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
  const { t } = useLanguage()
  const { profile } = useAuth()
  const [tab, setTab] = useState('overview')

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
