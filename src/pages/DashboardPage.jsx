import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import GeoniMark from '../GeoniMark'
import Sparkline from '../components/Sparkline'
import {
  Gem, History, Bookmark, Settings, Globe, User, Building2, FileText,
  TrendingUp, TrendingDown, ChevronRight, X,
} from 'lucide-react'

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

function ScoreBadge({ score }) {
  const color = score >= 65 ? 'var(--good)' : score >= 40 ? 'var(--warn)' : 'var(--bad)'
  return <span className="dash-score-badge" style={{ color, borderColor: color }}>{score}</span>
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

export default function DashboardPage({ onReset, onNewScan, onViewAudit }) {
  const { user, profile, signOut } = useAuth()
  const [audits, setAudits] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('audits') // 'audits' | 'assets'

  useEffect(() => {
    if (user) fetchAudits()
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

  const deleteAudit = async (e, auditId) => {
    e.stopPropagation()
    if (!window.confirm('Bu taramayı silmek istediğinize emin misiniz?')) return
    await supabase.from('audits').delete().eq('id', auditId)
    setAudits(prev => prev.filter(a => a.id !== auditId))
  }

  const formatDate = (d) => new Date(d).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  const typeLabel = { web: 'Web Sitesi', person: 'Kişi', brand: 'Marka' }
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
          <div className="dash-credit-badge">
            <Gem size={14} strokeWidth={1.5} className="dash-credit-icon" />
            <span className="dash-credit-val">{profile?.credit_balance ?? '—'}</span>
            <span className="dash-credit-label">kontör</span>
          </div>
          <div className="dash-avatar" title={user?.email}>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="" />
              : <span>{(profile?.full_name || user?.email || '?')[0].toUpperCase()}</span>
            }
          </div>
          <button className="dash-signout" onClick={signOut}>Çıkış</button>
        </div>
      </header>

      <div className="dashboard__body">
        {/* Sidebar */}
        <aside className="dashboard__sidebar">
          <div className="dash-user">
            <div className="dash-user__avatar">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" />
                : <span>{(profile?.full_name || '?')[0]?.toUpperCase()}</span>
              }
            </div>
            <div>
              <div className="dash-user__name">{profile?.full_name || 'Kullanıcı'}</div>
              <div className="dash-user__email">{user?.email}</div>
            </div>
          </div>

          <nav className="dash-nav">
            <button className={`dash-nav__item ${tab === 'audits' ? 'dash-nav__item--active' : ''}`} onClick={() => setTab('audits')}>
              <History size={16} strokeWidth={1.5} /> Tarama Geçmişi
            </button>
            <button className={`dash-nav__item ${tab === 'assets' ? 'dash-nav__item--active' : ''}`} onClick={() => setTab('assets')}>
              <Bookmark size={16} strokeWidth={1.5} /> Takip Listesi
            </button>
            <button className={`dash-nav__item ${tab === 'credits' ? 'dash-nav__item--active' : ''}`} onClick={() => setTab('credits')}>
              <Gem size={16} strokeWidth={1.5} /> Kontörlerim
            </button>
            <button className={`dash-nav__item ${tab === 'settings' ? 'dash-nav__item--active' : ''}`} onClick={() => setTab('settings')}>
              <Settings size={16} strokeWidth={1.5} /> Ayarlar
            </button>
          </nav>

          <button className="dash-new-scan" onClick={onNewScan}>
            + Yeni Tarama
          </button>
        </aside>

        {/* Main */}
        <main className="dashboard__main">
          {/* Stats */}
          <div className="dash-stats">
            <StatCard label="Toplam Tarama" value={audits.length} />
            <StatCard label="Kontör Bakiyesi" value={profile?.credit_balance ?? '—'} sub="kontör" />
            <StatCard
              label="Ortalama Skor"
              value={audits.length ? Math.round(audits.filter(a => a.score).reduce((s, a) => s + a.score, 0) / audits.filter(a => a.score).length) || '—' : '—'}
            />
            <StatCard
              label="Son Tarama"
              value={audits[0] ? new Date(audits[0].created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : '—'}
            />
          </div>

          {/* Genel Skor Trendi */}
          {tab === 'audits' && overallTrend.length >= 2 && (
            <div className="dash-trend-card">
              <div className="dash-trend-card__info">
                <div className="dash-trend-card__title">Genel Skor Trendi</div>
                <div className="dash-trend-card__meta">
                  Son {overallTrend.length} puanlı tarama
                  {overallDelta != null && <DeltaBadge delta={overallDelta} />}
                </div>
              </div>
              <Sparkline points={overallTrend} width={220} height={44} />
            </div>
          )}

          {/* Audits tab */}
          {tab === 'audits' && (
            <div className="dash-section">
              <h2 className="dash-section__title">Tarama Geçmişi</h2>
              {loading ? (
                <div className="dash-audit-list">
                  {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
                </div>
              ) : audits.length === 0 ? (
                <div className="dash-empty">
                  <p>Henüz tarama yapmadınız.</p>
                  <button className="dash-new-scan" onClick={onNewScan}>İlk Taramayı Başlat</button>
                </div>
              ) : (
                <div className="dash-audit-list">
                  {audits.map(audit => (
                    <div key={audit.id} className={`dash-audit-row ${audit.result_json ? 'dash-audit-row--clickable' : ''}`} onClick={() => audit.result_json && onViewAudit && onViewAudit(audit)} style={{ cursor: audit.result_json ? 'pointer' : 'default' }}>
                      {(() => {
                        const TypeIcon = typeIcon[audit.type] || FileText
                        return <TypeIcon size={18} strokeWidth={1.5} className="dash-audit-icon" />
                      })()}
                      <div className="dash-audit-info">
                        <div className="dash-audit-name">{audit.domain || (audit.name?.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')) || '—'}</div>
                        <div className="dash-audit-meta">
                          {typeLabel[audit.type]} · {formatDate(audit.created_at)}
                        </div>
                      </div>
                      <div className="dash-audit-right">
                        {audit.score != null ? (
                          <>
                            <DeltaBadge delta={deltaFor(audit)} />
                            <ScoreBadge score={audit.score} />
                          </>
                        ) : <span className="dash-audit-pending">İşleniyor</span>}
                        <span className="dash-audit-credits">-{audit.credits_spent} <Gem size={11} strokeWidth={1.5} /></span>
                        {audit.result_json && <ChevronRight size={14} strokeWidth={1.5} style={{ color: 'var(--accent)' }} />}
                        <button
                          onClick={(e) => deleteAudit(e, audit.id)}
                          className="dash-audit-delete"
                          title="Sil"
                        ><X size={13} strokeWidth={1.5} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Assets tab */}
          {tab === 'assets' && (
            <div className="dash-section">
              <h2 className="dash-section__title">Takip Listesi</h2>
              <div className="dash-empty">
                <p>Takip listesi yakında aktif olacak.</p>
                <span style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>Taramalarınızı kaydedin, skor değişimlerini takip edin.</span>
              </div>
            </div>
          )}

          {/* Credits tab */}
          {tab === 'credits' && (
            <div className="dash-section">
              <h2 className="dash-section__title">Kontörlerim</h2>
              <div className="dash-credit-summary">
                <div className="dash-credit-big">
                  <span className="dash-credit-big__val">{profile?.credit_balance ?? '—'}</span>
                  <span className="dash-credit-big__label">mevcut kontör</span>
                </div>
                <div className="dash-credit-info">
                  <div>Toplam satın alınan: <strong>{profile?.total_credits_purchased ?? 0}</strong></div>
                  <div>Toplam harcanan: <strong>{profile?.total_credits_spent ?? 0}</strong></div>
                </div>
              </div>
              <a href="https://geoni.ai#paketler" className="dash-buy-btn" target="_blank" rel="noopener">
                Kontör Satın Al →
              </a>
            </div>
          )}

          {/* Settings tab */}
          {tab === 'settings' && (
            <div className="dash-section">
              <h2 className="dash-section__title">Ayarlar</h2>
              <div className="dash-settings">
                <div className="dash-setting-row">
                  <div>
                    <div className="dash-setting-label">Ad Soyad</div>
                    <div className="dash-setting-val">{profile?.full_name || '—'}</div>
                  </div>
                </div>
                <div className="dash-setting-row">
                  <div>
                    <div className="dash-setting-label">E-posta</div>
                    <div className="dash-setting-val">{user?.email}</div>
                  </div>
                </div>
                <div className="dash-setting-row">
                  <div>
                    <div className="dash-setting-label">Giriş Yöntemi</div>
                    <div className="dash-setting-val" style={{ textTransform: 'capitalize' }}>{profile?.auth_provider || '—'}</div>
                  </div>
                </div>
                <div className="dash-setting-row">
                  <div>
                    <div className="dash-setting-label">Üyelik</div>
                    <div className="dash-setting-val">Ücretsiz Plan</div>
                  </div>
                  <a href="https://geoni.ai#paketler" className="dash-upgrade-btn" target="_blank" rel="noopener">Pro'ya Geç</a>
                </div>
                <button className="dash-signout-full" onClick={signOut}>Çıkış Yap</button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
