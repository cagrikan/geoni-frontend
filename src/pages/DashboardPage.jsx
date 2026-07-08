import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../lib/LanguageContext'
import { useTheme } from '../lib/ThemeContext'
import GeoniMark from '../GeoniMark'
import Sparkline from '../components/Sparkline'
import LanguageSwitcher from '../components/LanguageSwitcher'
import ThemeSwitcher from '../components/ThemeSwitcher'
import ConfirmDialog from '../components/ConfirmDialog'
import { TICKET_STATUS_KEY } from '../components/TicketStatusBadge'
import TicketBoard from '../components/TicketBoard'
import TicketDetailOverlay from '../components/TicketDetailOverlay'
import {
  Gem, History, Bookmark, Settings, Globe, User, Building2, FileText,
  TrendingUp, TrendingDown, ChevronRight, X, RefreshCw, ShieldCheck, Wrench, ClipboardList,
  Ticket, Braces, Bot, Landmark, Link2, Search,
} from 'lucide-react'

const TICKET_TYPE_ICONS = {
  schema_setup: Braces,
  llms_robots: Bot,
  wikidata_entity: Landmark,
  content_package: FileText,
  citation_placement: Link2,
}

const API_URL = import.meta.env.VITE_API_URL || 'https://api.geoni.ai'

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

function BuyCreditsSection({ t }) {
  const [packages, setPackages] = useState(null)
  const [error, setError] = useState(null)
  const [buyingId, setBuyingId] = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/api/credit-packages`)
      .then((r) => r.json())
      .then(setPackages)
      .catch(() => setPackages([]))
  }, [])

  const buy = async (packageId) => {
    setBuyingId(packageId)
    setError(null)
    try {
      const { checkout_url } = await authedFetch('/api/checkout/create', {
        method: 'POST',
        body: JSON.stringify({ package_id: packageId }),
      })
      window.location.href = checkout_url
    } catch (e) {
      setError(e.message)
      setBuyingId(null)
    }
  }

  if (packages === null) return <div className="dash-loading">{t('dash_loading')}</div>
  if (packages.length === 0) return null

  return (
    <div className="dash-buy-credits">
      {error && <div className="dash-buy-error">{error}</div>}
      <div className="dash-buy-credits__grid">
        {packages.map((pkg) => (
          <div key={pkg.id} className="dash-buy-credits__card">
            <div className="dash-buy-credits__credits">{pkg.credits}</div>
            <div className="dash-buy-credits__name">{pkg.name}</div>
            {pkg.display_price != null && (
              <div className="dash-buy-credits__price">{pkg.display_price} {pkg.currency}</div>
            )}
            <button
              className="dash-buy-btn"
              disabled={buyingId === pkg.id}
              onClick={() => buy(pkg.id)}
            >{t('dash_credits_buy')}</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function ServiceCatalogSection({ t, profile }) {
  const [types, setTypes] = useState(null)
  const [buyingId, setBuyingId] = useState(null)
  const [error, setError] = useState(null)
  const [justBoughtId, setJustBoughtId] = useState(null)
  const [targets, setTargets] = useState({})

  useEffect(() => {
    fetch(`${API_URL}/api/ticket-types`).then((r) => r.json()).then(setTypes).catch(() => setTypes([]))
  }, [])

  const buy = async (ticketTypeId) => {
    const target = (targets[ticketTypeId] || '').trim()
    if (!target) return
    setBuyingId(ticketTypeId)
    setError(null)
    try {
      await authedFetch('/api/tickets', { method: 'POST', body: JSON.stringify({ ticket_type_id: ticketTypeId, target }) })
      setJustBoughtId(ticketTypeId)
      setTargets((d) => ({ ...d, [ticketTypeId]: '' }))
      setTimeout(() => setJustBoughtId(null), 2500)
    } catch (e) {
      setError(e.message)
    }
    setBuyingId(null)
  }

  return (
    <div className="dash-section">
      <h2 className="dash-section__title">{t('dash_tickets_title')}</h2>
      <p className="dash-hint">{t('dash_tickets_hint')}</p>

      {error && <div className="dash-buy-error">{error}</div>}

      {types === null ? <div className="dash-loading">{t('dash_loading')}</div> : (
        <div className="dash-service-grid">
          {types.map((tt) => {
            const Icon = TICKET_TYPE_ICONS[tt.key] || Wrench
            return (
              <div key={tt.id} className="dash-service-card">
                <div className="dash-service-card__top">
                  <div className="dash-service-card__icon"><Icon size={16} strokeWidth={1.5} /></div>
                  <div className="dash-service-card__price">{tt.token_cost} <span className="dash-credit-unit">{t('dash_credit_unit')}</span></div>
                </div>
                <div className="dash-service-card__name">{tt.name}</div>
                <p className="dash-service-card__desc">{tt.description}</p>
                {tt.key === 'llms_robots' && (
                  <span className="dash-service-card__auto">{t('dash_service_auto_note')}</span>
                )}
                <input
                  type="text"
                  className="dash-service-card__target"
                  placeholder={t('dash_service_target_ph')}
                  value={targets[tt.id] || ''}
                  onChange={(e) => setTargets((d) => ({ ...d, [tt.id]: e.target.value }))}
                />
                <button
                  className="dash-buy-btn dash-buy-btn--full"
                  disabled={buyingId === tt.id || !(targets[tt.id] || '').trim() || (profile?.credit_balance ?? 0) < tt.token_cost}
                  onClick={() => buy(tt.id)}
                >{justBoughtId === tt.id ? t('dash_tickets_bought') : t('dash_tickets_buy')}</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const CUSTOMER_TICKET_COLUMNS_KEY = ['open', 'assigned', 'in_progress', 'submitted', 'verified']

function MyTicketsSection({ t, userId, language }) {
  const [myTickets, setMyTickets] = useState(null)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    authedFetch('/api/tickets').then(setMyTickets).catch(() => setMyTickets([]))
  }, [])

  const openTicket = (tk) => {
    setSelected(tk)
    setMyTickets((list) => list?.map((t) => (t.id === tk.id ? { ...t, has_unread: false } : t)))
  }

  if (selected) {
    return (
      <TicketDetailOverlay
        ticket={selected} canEdit={false} currentUserId={userId} authedFetch={authedFetch} t={t} language={language}
        onBack={() => setSelected(null)}
      />
    )
  }

  const columns = CUSTOMER_TICKET_COLUMNS_KEY.map((key) => ({ key, label: t(TICKET_STATUS_KEY[key]) }))

  return (
    <div className="dash-section">
      <h2 className="dash-section__title">{t('dash_tickets_mine')}</h2>
      <p className="dash-hint">{t('dash_tickets_mine_hint')}</p>
      {myTickets === null ? <div className="dash-loading">{t('dash_loading')}</div> : myTickets.length === 0 ? (
        <div className="dash-empty"><p>{t('dash_tickets_empty')}</p></div>
      ) : (
        <TicketBoard tickets={myTickets} columns={columns} authedFetch={authedFetch} onCardClick={openTicket} />
      )}
    </div>
  )
}

const EXPERT_TICKET_COLUMNS_KEY = ['assigned', 'in_progress', 'submitted', 'verified']

function ExpertPanelSection({ t, userId, language }) {
  const [tickets, setTickets] = useState(null)
  const [forms, setForms] = useState({})
  const [submittingId, setSubmittingId] = useState(null)
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')

  const load = () => authedFetch('/api/expert/tickets').then(setTickets).catch(() => setTickets([]))
  useEffect(() => { load() }, [])

  const openTicket = (tk) => {
    setSelected(tk)
    setTickets((list) => list?.map((t) => (t.id === tk.id ? { ...t, has_unread: false } : t)))
  }

  const submit = async (ticketId) => {
    const form = forms[ticketId] || {}
    if (!form.evidence_url) return
    setSubmittingId(ticketId)
    try {
      await authedFetch(`/api/expert/tickets/${ticketId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ evidence_url: form.evidence_url, evidence_note: form.evidence_note || '' }),
      })
      await load()
      setSelected(null)
    } catch { /* kullanici tekrar deneyebilir */ }
    setSubmittingId(null)
  }

  const start = async (ticketId) => {
    setSubmittingId(ticketId)
    try {
      await authedFetch(`/api/expert/tickets/${ticketId}/start`, { method: 'POST' })
      await load()
      setSelected(null)
    } catch { /* kullanici tekrar deneyebilir */ }
    setSubmittingId(null)
  }

  const q = search.trim().toLowerCase()
  const visibleTickets = tickets?.filter((tk) => (
    !q || String(tk.id).includes(q) || (tk.target || '').toLowerCase().includes(q) || (tk.ticket_type_name || '').toLowerCase().includes(q)
  ))

  if (selected) {
    const extra = (
      <div className="ticket-detail-overlay__actions">
        {selected.status === 'assigned' && (
          <button className="dash-buy-btn" disabled={submittingId === selected.id} onClick={() => start(selected.id)}>{t('dash_expert_start')}</button>
        )}
        {selected.status === 'in_progress' && (
          <div className="ticket-submit-form">
            <input
              type="text" placeholder={t('dash_expert_evidence_url_ph')}
              value={forms[selected.id]?.evidence_url || ''}
              onChange={(e) => setForms((f) => ({ ...f, [selected.id]: { ...f[selected.id], evidence_url: e.target.value } }))}
            />
            <input
              type="text" placeholder={t('dash_expert_evidence_note_ph')}
              value={forms[selected.id]?.evidence_note || ''}
              onChange={(e) => setForms((f) => ({ ...f, [selected.id]: { ...f[selected.id], evidence_note: e.target.value } }))}
            />
            <button disabled={submittingId === selected.id || !forms[selected.id]?.evidence_url} onClick={() => submit(selected.id)}>{t('dash_expert_submit')}</button>
          </div>
        )}
        {selected.status === 'rejected' && selected.reject_reason && <div className="ticket-reject-reason">{selected.reject_reason}</div>}
      </div>
    )
    return (
      <TicketDetailOverlay
        ticket={selected} canEdit={true} currentUserId={userId} authedFetch={authedFetch} t={t} language={language}
        onBack={() => setSelected(null)} extraActions={extra}
      />
    )
  }

  const columns = EXPERT_TICKET_COLUMNS_KEY.map((key) => ({ key, label: t(TICKET_STATUS_KEY[key]) }))

  return (
    <div className="dash-section">
      <h2 className="dash-section__title">{t('dash_expert_title')}</h2>
      <p className="dash-hint">{t('dash_expert_hint')}</p>
      <div className="admin-search dash-expert-search">
        <Search size={15} strokeWidth={1.5} />
        <input placeholder={t('dash_expert_search_ph')} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {tickets === null ? <div className="dash-loading">{t('dash_loading')}</div> : visibleTickets.length === 0 ? (
        <div className="dash-empty"><p>{t('dash_expert_empty')}</p></div>
      ) : (
        <TicketBoard tickets={visibleTickets} columns={columns} authedFetch={authedFetch} onCardClick={openTicket} subtitleFor={(tk) => tk.target || tk.user_email} />
      )}
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="dash-skeleton-row">
      <div className="skeleton dash-skeleton-icon" />
      <div className="dash-skeleton-info">
        <div className="skeleton dash-skeleton-line--name" />
        <div className="skeleton dash-skeleton-line--meta" />
      </div>
      <div className="skeleton dash-skeleton-badge" />
    </div>
  )
}

function StatCard({ label, value, sub }) {
  return (
    <div className="dash-stat">
      <div className="dash-stat__value">{value}</div>
      <div className="dash-stat__label">{label}</div>
      {sub && <div className="dash-stat__sub">{sub}</div>}
    </div>
  )
}

/* Skor rakamı eşik rengiyle: >=65 iyi, >=40 orta, altı zayıf */
function ScoreBadge({ score }) {
  const color = score >= 65 ? 'var(--good)' : score >= 40 ? 'var(--warn)' : 'var(--bad)'
  return <b style={{ color }}>{score}</b>
}

function DeltaBadge({ delta }) {
  if (delta == null || delta === 0) return null
  const positive = delta > 0
  const color = positive ? 'var(--good)' : 'var(--bad)'
  const TrendIcon = positive ? TrendingUp : TrendingDown
  return (
    <span className="dash-delta-badge" style={{ color }}>
      <TrendIcon size={12} strokeWidth={2} /> {positive ? '+' : ''}{delta}
    </span>
  )
}

// Bir taramayı, aynı hedefin (domain/isim) kronolojik geçmişindeki
// bir öncekiyle karşılaştırıp skor deltasını döndürür.
function targetKey(audit) {
  const raw = audit.type === 'web' ? audit.domain : audit.name
  return raw ? raw.toLowerCase().trim() : null
}

export default function DashboardPage({ onReset, onNewScan, onViewAudit, onRescanWeb, onRescanBrand, onAdmin }) {
  const { user, profile, signOut } = useAuth()
  const { t, language } = useLanguage()
  const { theme } = useTheme()
  const [audits, setAudits] = useState([])
  const [loading, setLoading] = useState(true)
  const [watchlist, setWatchlist] = useState([])
  const [watchlistLoading, setWatchlistLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [confirmState, setConfirmState] = useState(null)
  const [tab, setTab] = useState(() => {
    try {
      const pending = localStorage.getItem('geoni_pending_tab')
      if (pending) { localStorage.removeItem('geoni_pending_tab'); return pending }
    } catch { /* ignore */ }
    return 'audits'
  }) // 'audits' | 'assets' | 'credits' | 'settings'

  useEffect(() => {
    if (user) { fetchAudits(); fetchWatchlist() }
  }, [user])

  const fetchAudits = async () => {
    const { data } = await supabase
      .from('audits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    setAudits(data || [])
    setLoading(false)
  }

  const fetchWatchlist = async () => {
    const { data } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setWatchlist(data || [])
    setWatchlistLoading(false)
  }

  const removeWatchlistItem = async (e, id) => {
    e.stopPropagation()
    await supabase.from('watchlist').delete().eq('id', id)
    setWatchlist(prev => prev.filter(w => w.id !== id))
  }

  const rescanItem = (item) => {
    if (item.type === 'web') {
      onRescanWeb(item.target?.domain || item.label, user?.email)
    } else {
      onRescanBrand({
        type: item.type,
        name: item.target?.name || item.label,
        topic: item.target?.topic || '',
        email: user?.email,
      })
    }
  }

  // Hedef bazlı (domain/isim) en son tam audit kaydi (result_json dahil) -
  // Takip Listesi'nde bir satira tiklandiginda raporu acabilmek icin.
  const latestAuditByTarget = useMemo(() => {
    const map = {}
    audits.filter(a => a.result_json).forEach(a => {
      const key = targetKey(a)
      if (!key) return
      if (!map[key] || new Date(a.created_at) > new Date(map[key].created_at)) map[key] = a
    })
    return map
  }, [audits])

  // Hedef bazlı (domain/isim) kronolojik skor geçmişi — aynı siteyi/kişiyi
  // birden çok kez tarayan kullanıcılar için sparkline + delta hesaplanır.
  const trendsByTarget = useMemo(() => {
    const map = {}
    audits.filter(a => a.score != null).forEach(a => {
      const key = targetKey(a)
      if (!key) return
      if (!map[key]) map[key] = []
      map[key].push({ date: a.created_at, score: a.score, scoring_version: a.result_json?.scoring_version })
    })
    Object.values(map).forEach(arr => arr.sort((a, b) => new Date(a.date) - new Date(b.date)))
    return map
  }, [audits])

  const deltaFor = (audit) => {
    const key = targetKey(audit)
    if (!key) return null
    const series = trendsByTarget[key]
    if (!series || series.length < 2) return null
    const idx = series.findIndex(p => p.date === audit.created_at)
    if (idx <= 0) return null
    return audit.score - series[idx - 1].score
  }

  // Genel trend: tüm hedeflerden bağımsız, kronolojik son taramalar.
  const overallTrend = useMemo(() => {
    return audits
      .filter(a => a.score != null)
      .map(a => ({ date: a.created_at, score: a.score, scoring_version: a.result_json?.scoring_version }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-20)
  }, [audits])
  const overallDelta = overallTrend.length >= 2
    ? overallTrend[overallTrend.length - 1].score - overallTrend[overallTrend.length - 2].score
    : null

  const deleteAudit = (e, auditId) => {
    e.stopPropagation()
    setConfirmState({
      message: t('dash_delete_confirm'),
      onConfirm: async () => {
        setConfirmState(null)
        await supabase.from('audits').delete().eq('id', auditId)
        setAudits(prev => prev.filter(a => a.id !== auditId))
        setSelectedIds(prev => { const next = new Set(prev); next.delete(auditId); return next })
      },
    })
  }

  const toggleSelect = (e, auditId) => {
    e.stopPropagation()
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(auditId)) next.delete(auditId)
      else next.add(auditId)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelectedIds(prev => prev.size === audits.length ? new Set() : new Set(audits.map(a => a.id)))
  }

  const clearSelection = () => setSelectedIds(new Set())

  const bulkDelete = () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    setConfirmState({
      message: t('dash_bulk_delete_confirm', { count: ids.length }),
      onConfirm: async () => {
        setConfirmState(null)
        await supabase.from('audits').delete().in('id', ids)
        setAudits(prev => prev.filter(a => !selectedIds.has(a.id)))
        clearSelection()
      },
    })
  }

  const bulkAddToWatchlist = async () => {
    const targets = audits.filter(a => selectedIds.has(a.id))
    for (const a of targets) {
      const label = a.type === 'web' ? a.domain : a.name
      if (!label) continue
      const target = a.type === 'web' ? { domain: a.domain } : { name: a.name, topic: a.topic }
      const { error } = await supabase.from('watchlist').insert({ user_id: user.id, type: a.type, label, target })
      if (error && error.code !== '23505') console.error('Bulk watchlist insert failed:', error)
    }
    fetchWatchlist()
    clearSelection()
  }

  const locale = language === 'en' ? 'en-US' : 'tr-TR'
  const formatDate = (d) => new Date(d).toLocaleDateString(locale, {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  const typeLabel = { web: t('dash_type_web'), person: t('dash_type_person'), brand: t('dash_type_brand') }
  const typeIcon = { web: Globe, person: User, brand: Building2 }

  return (
    <div className="dashboard">
      {/* Nav */}
      <header className="landing__nav">
        <button className="landing__brand landing__brand--clickable" onClick={onReset}>
          <GeoniMark />
          <span className="landing__logo">GEONI</span>
        </button>
        <div className="dash-nav-right">
          <LanguageSwitcher />
          <ThemeSwitcher />
          <div className="dash-credit-badge">
            <Gem size={14} strokeWidth={1.5} className="dash-credit-icon" />
            <span className="dash-credit-val">{profile?.credit_balance ?? '—'}</span>
            <span className="dash-credit-label">{t('dash_credit_unit')}</span>
          </div>
          <div className="dash-user-chip" title={profile?.full_name || ''}>
            <span className="dash-user-chip__avatar">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" />
                : <span>{(profile?.full_name || user?.email || '?')[0].toUpperCase()}</span>
              }
            </span>
            <span className="dash-user-chip__mail">{user?.email}</span>
          </div>
          <button className="dash-signout" onClick={signOut}>{t('dash_signout')}</button>
        </div>
      </header>

      <div className="dashboard__body">
        {/* Sidebar */}
        <aside className="dashboard__sidebar">
          <nav className="dash-nav">
            <button className={`dash-nav__item ${tab === 'audits' ? 'dash-nav__item--active' : ''}`} onClick={() => setTab('audits')}>
              <History size={16} strokeWidth={1.5} /> {t('dash_nav_history')}
            </button>
            <button className={`dash-nav__item ${tab === 'assets' ? 'dash-nav__item--active' : ''}`} onClick={() => setTab('assets')}>
              <Bookmark size={16} strokeWidth={1.5} /> {t('dash_nav_watchlist')}
            </button>
            <button className={`dash-nav__item ${tab === 'credits' ? 'dash-nav__item--active' : ''}`} onClick={() => setTab('credits')}>
              <Gem size={16} strokeWidth={1.5} /> {t('dash_nav_credits')}
            </button>
            <button className={`dash-nav__item ${tab === 'tickets' ? 'dash-nav__item--active' : ''}`} onClick={() => setTab('tickets')}>
              <Wrench size={16} strokeWidth={1.5} /> {t('dash_nav_tickets')}
            </button>
            <button className={`dash-nav__item ${tab === 'my_tickets' ? 'dash-nav__item--active' : ''}`} onClick={() => setTab('my_tickets')}>
              <Ticket size={16} strokeWidth={1.5} /> {t('dash_nav_my_tickets')}
            </button>
            {profile?.is_expert && (
              <button className={`dash-nav__item ${tab === 'expert' ? 'dash-nav__item--active' : ''}`} onClick={() => setTab('expert')}>
                <ClipboardList size={16} strokeWidth={1.5} /> {t('dash_nav_expert')}
              </button>
            )}
            <button className={`dash-nav__item ${tab === 'settings' ? 'dash-nav__item--active' : ''}`} onClick={() => setTab('settings')}>
              <Settings size={16} strokeWidth={1.5} /> {t('dash_nav_settings')}
            </button>
            {onAdmin && (
              <button className="dash-nav__item" onClick={onAdmin}>
                <ShieldCheck size={16} strokeWidth={1.5} /> Admin Paneli
              </button>
            )}
          </nav>

          <button className="dash-new-scan" onClick={onNewScan}>
            {t('dash_new_scan')}
          </button>
        </aside>

        {/* Main */}
        <main className="dashboard__main">
          {/* Stats */}
          <div className="dash-stats">
            <StatCard label={t('dash_stat_total_scans')} value={audits.length} />
            <StatCard label={t('dash_stat_credit_balance')} value={profile?.credit_balance ?? '—'} sub={t('dash_credit_unit')} />
            <StatCard
              label={t('dash_stat_avg_score')}
              value={audits.length ? Math.round(audits.filter(a => a.score).reduce((s, a) => s + a.score, 0) / audits.filter(a => a.score).length) || '—' : '—'}
            />
            <StatCard
              label={t('dash_stat_last_scan')}
              value={audits[0] ? new Date(audits[0].created_at).toLocaleDateString(locale, { day: 'numeric', month: 'short' }) : '—'}
            />
          </div>

          {/* Genel Skor Trendi */}
          {tab === 'audits' && overallTrend.length >= 2 && (
            <div className="dash-trend-card">
              <div className="dash-trend-card__info">
                <div className="dash-trend-card__title">{t('dash_trend_title')}</div>
                <div className="dash-trend-card__meta">
                  {t('dash_trend_meta_prefix')} {overallTrend.length} {t('dash_trend_meta_suffix')}
                  {overallDelta != null && <DeltaBadge delta={overallDelta} />}
                </div>
              </div>
              <Sparkline points={overallTrend} width={220} height={44} />
            </div>
          )}

          {/* Audits tab */}
          {tab === 'audits' && (
            <div className="dash-section">
              <h2 className="dash-section__title">{t('dash_history_title')}</h2>
              {loading ? (
                <div className="dash-audit-list">
                  {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
                </div>
              ) : audits.length === 0 ? (
                <div className="dash-empty">
                  <p>{t('dash_history_empty')}</p>
                  <button className="dash-new-scan" onClick={onNewScan}>{t('dash_history_start_first')}</button>
                </div>
              ) : (
                <>
                  {selectedIds.size > 0 && (
                    <div className="dash-bulk-bar">
                      <input type="checkbox" className="dash-audit-checkbox" checked={selectedIds.size === audits.length} onChange={toggleSelectAll} title={t('dash_select_all')} />
                      <span className="dash-bulk-bar__count">{t('dash_bulk_selected', { count: selectedIds.size })}</span>
                      <span className="dash-bulk-bar__spacer" />
                      <button type="button" onClick={bulkAddToWatchlist}><Bookmark size={13} strokeWidth={1.5} /> {t('watchlist_add')}</button>
                      <button type="button" className="dash-bulk-bar__delete" onClick={bulkDelete}><X size={13} strokeWidth={1.5} /> {t('dash_delete_title')}</button>
                      <button type="button" onClick={clearSelection}>{t('confirm_cancel')}</button>
                    </div>
                  )}
                <div className="dash-audit-list">
                  <div className="dash-audit-head">
                    <span />
                    <span>{t('dash_col_target')}</span>
                    <span>{t('dash_col_type')}</span>
                    <span>{t('dash_col_score')}</span>
                    <span className="dash-audit-head__date">{t('dash_col_date')}</span>
                    <span />
                  </div>
                  {audits.map(audit => {
                    const TypeIcon = typeIcon[audit.type] || FileText
                    const pages = audit.result_json?.total_pages
                    return (
                    <div key={audit.id} className={`dash-audit-row ${audit.result_json ? 'dash-audit-row--clickable' : ''}`} onClick={() => audit.result_json && onViewAudit && onViewAudit(audit)} style={{ cursor: audit.result_json ? 'pointer' : 'default' }}>
                      <input
                        type="checkbox"
                        className="dash-audit-checkbox"
                        checked={selectedIds.has(audit.id)}
                        onChange={(e) => toggleSelect(e, audit.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="dash-audit-target">
                        <span className="dash-audit-ico"><TypeIcon size={14} strokeWidth={1.5} /></span>
                        <div className="dash-audit-info">
                          <div className="dash-audit-name">{audit.domain || (audit.name?.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')) || '—'}</div>
                          <div className="dash-audit-meta">
                            {pages ? `${pages} ${t('dash_meta_pages')} · ` : ''}−{audit.credits_spent} {t('dash_credit_unit')}
                          </div>
                        </div>
                      </div>
                      <span className="dash-audit-tag">{typeLabel[audit.type]}</span>
                      <div className="dash-audit-score">
                        {audit.score != null ? (
                          <><ScoreBadge score={audit.score} /><DeltaBadge delta={deltaFor(audit)} /></>
                        ) : <span className="dash-audit-pending">{t('dash_processing')}</span>}
                      </div>
                      <span className="dash-audit-date">{formatDate(audit.created_at)}</span>
                      <div className="dash-audit-actions">
                        {audit.result_json && <ChevronRight size={14} strokeWidth={1.5} className="dash-audit-chev" />}
                        <button
                          onClick={(e) => deleteAudit(e, audit.id)}
                          className="dash-audit-delete"
                          title={t('dash_delete_title')}
                        ><X size={13} strokeWidth={1.5} /></button>
                      </div>
                    </div>
                    )
                  })}
                </div>
                </>
              )}
            </div>
          )}

          {/* Assets tab */}
          {tab === 'assets' && (
            <div className="dash-section">
              <h2 className="dash-section__title">{t('dash_watchlist_title')}</h2>
              {watchlistLoading ? (
                <div className="dash-audit-list">
                  {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
                </div>
              ) : watchlist.length === 0 ? (
                <div className="dash-empty">
                  <p>{t('dash_watchlist_empty')}</p>
                  <span style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>{t('dash_watchlist_empty_hint')}</span>
                </div>
              ) : (
                <div className="dash-audit-list">
                  <div className="dash-audit-head dash-audit-head--watch">
                    <span>{t('dash_col_target')}</span>
                    <span>{t('dash_col_type')}</span>
                    <span>{t('dash_col_score')}</span>
                    <span />
                  </div>
                  {watchlist.map(item => {
                    const key = item.label?.toLowerCase().trim()
                    const series = key ? trendsByTarget[key] : null
                    const latest = series && series.length ? series[series.length - 1] : null
                    const delta = series && series.length >= 2 ? series[series.length - 1].score - series[series.length - 2].score : null
                    const matchedAudit = key ? latestAuditByTarget[key] : null
                    const TypeIcon = typeIcon[item.type] || FileText
                    return (
                      <div
                        key={item.id}
                        className={`dash-audit-row dash-audit-row--watch ${matchedAudit ? 'dash-audit-row--clickable' : ''}`}
                        onClick={() => matchedAudit && onViewAudit && onViewAudit(matchedAudit)}
                        style={{ cursor: matchedAudit ? 'pointer' : 'default' }}
                      >
                        <div className="dash-audit-target">
                          <span className="dash-audit-ico"><TypeIcon size={14} strokeWidth={1.5} /></span>
                          <div className="dash-audit-info">
                            <div className="dash-audit-name">{item.label}</div>
                          </div>
                        </div>
                        <span className="dash-audit-tag">{typeLabel[item.type]}</span>
                        <div className="dash-audit-score">
                          {latest ? (
                            <><ScoreBadge score={latest.score} /><DeltaBadge delta={delta} /></>
                          ) : <span className="dash-audit-pending">{t('watchlist_not_scanned_yet')}</span>}
                        </div>
                        <div className="dash-audit-actions">
                          {matchedAudit && <ChevronRight size={14} strokeWidth={1.5} className="dash-audit-chev" />}
                          <button
                            onClick={(e) => { e.stopPropagation(); rescanItem(item) }}
                            className="dash-audit-delete"
                            title={t('watchlist_rescan')}
                          ><RefreshCw size={13} strokeWidth={1.5} /></button>
                          <button
                            onClick={(e) => removeWatchlistItem(e, item.id)}
                            className="dash-audit-delete"
                            title={t('dash_delete_title')}
                          ><X size={13} strokeWidth={1.5} /></button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Credits tab */}
          {tab === 'credits' && (
            <div className="dash-section">
              <h2 className="dash-section__title">{t('dash_credits_title')}</h2>
              <div className="dash-credit-summary">
                <div className="dash-credit-big">
                  <span className="dash-credit-big__val">{profile?.credit_balance ?? '—'}</span>
                  <span className="dash-credit-big__label">{t('dash_credits_current')}</span>
                </div>
                <div className="dash-credit-info">
                  <div>{t('dash_credits_purchased')} <strong>{profile?.total_credits_purchased ?? 0}</strong></div>
                  <div>{t('dash_credits_spent')} <strong>{profile?.total_credits_spent ?? 0}</strong></div>
                </div>
              </div>
              <BuyCreditsSection t={t} />
            </div>
          )}

          {tab === 'tickets' && <ServiceCatalogSection t={t} profile={profile} />}
          {tab === 'my_tickets' && <MyTicketsSection t={t} userId={user?.id} language={language} />}
          {tab === 'expert' && profile?.is_expert && <ExpertPanelSection t={t} userId={user?.id} language={language} />}

          {/* Settings tab */}
          {tab === 'settings' && (
            <div className="dash-section">
              <h2 className="dash-section__title">{t('dash_settings_title')}</h2>
              <div className="dash-settings">
                <div className="dash-setting-row">
                  <div>
                    <div className="dash-setting-label">{t('dash_settings_fullname')}</div>
                    <div className="dash-setting-val">{profile?.full_name || '—'}</div>
                  </div>
                </div>
                <div className="dash-setting-row">
                  <div>
                    <div className="dash-setting-label">{t('dash_settings_email')}</div>
                    <div className="dash-setting-val">{user?.email}</div>
                  </div>
                </div>
                <div className="dash-setting-row">
                  <div>
                    <div className="dash-setting-label">{t('dash_settings_login_method')}</div>
                    <div className="dash-setting-val" style={{ textTransform: 'capitalize' }}>{profile?.auth_provider || '—'}</div>
                  </div>
                </div>
                <div className="dash-setting-row">
                  <div>
                    <div className="dash-setting-label">{t('dash_settings_theme')}</div>
                    <div className="dash-setting-val">{theme === 'dark' ? t('dash_settings_theme_dark') : t('dash_settings_theme_light')}</div>
                  </div>
                  <ThemeSwitcher />
                </div>
                <div className="dash-setting-row">
                  <div>
                    <div className="dash-setting-label">{t('dash_settings_membership')}</div>
                    <div className="dash-setting-val">
                      {profile?.is_admin
                        ? t('dash_settings_admin_plan')
                        : (profile?.total_credits_purchased > 0)
                          ? t('dash_settings_pro_plan')
                          : t('dash_settings_free_plan')}
                    </div>
                  </div>
                  {!profile?.is_admin && !(profile?.total_credits_purchased > 0) && (
                    <button type="button" className="dash-upgrade-btn" onClick={() => setTab('credits')}>{t('dash_settings_upgrade')}</button>
                  )}
                </div>
                <button className="dash-signout-full" onClick={signOut}>{t('dash_settings_signout')}</button>
              </div>
            </div>
          )}
        </main>
      </div>
      <ConfirmDialog
        open={!!confirmState}
        message={confirmState?.message}
        confirmLabel={t('dash_delete_title')}
        onConfirm={() => confirmState?.onConfirm()}
        onCancel={() => setConfirmState(null)}
      />
    </div>
  )
}
