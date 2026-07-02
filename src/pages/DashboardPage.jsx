import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import GeoniMark from '../GeoniMark'

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

export default function DashboardPage({ onReset, onNewScan }) {
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

  const formatDate = (d) => new Date(d).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  const typeLabel = { web: 'Web Sitesi', person: 'Kişi', brand: 'Marka' }
  const typeIcon = { web: '🌐', person: '👤', brand: '🏢' }

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
            <span className="dash-credit-icon">◈</span>
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
              📊 Tarama Geçmişi
            </button>
            <button className={`dash-nav__item ${tab === 'assets' ? 'dash-nav__item--active' : ''}`} onClick={() => setTab('assets')}>
              📌 Takip Listesi
            </button>
            <button className={`dash-nav__item ${tab === 'credits' ? 'dash-nav__item--active' : ''}`} onClick={() => setTab('credits')}>
              ◈ Kontörlerim
            </button>
            <button className={`dash-nav__item ${tab === 'settings' ? 'dash-nav__item--active' : ''}`} onClick={() => setTab('settings')}>
              ⚙ Ayarlar
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

          {/* Audits tab */}
          {tab === 'audits' && (
            <div className="dash-section">
              <h2 className="dash-section__title">Tarama Geçmişi</h2>
              {loading ? (
                <div className="dash-empty">Yükleniyor...</div>
              ) : audits.length === 0 ? (
                <div className="dash-empty">
                  <p>Henüz tarama yapmadınız.</p>
                  <button className="dash-new-scan" onClick={onNewScan}>İlk Taramayı Başlat</button>
                </div>
              ) : (
                <div className="dash-audit-list">
                  {audits.map(audit => (
                    <div key={audit.id} className="dash-audit-row">
                      <span className="dash-audit-icon">{typeIcon[audit.type] || '📄'}</span>
                      <div className="dash-audit-info">
                        <div className="dash-audit-name">{audit.domain || audit.name || '—'}</div>
                        <div className="dash-audit-meta">
                          {typeLabel[audit.type]} · {formatDate(audit.created_at)}
                        </div>
                      </div>
                      <div className="dash-audit-right">
                        {audit.score != null ? <ScoreBadge score={audit.score} /> : <span className="dash-audit-pending">İşleniyor</span>}
                        <span className="dash-audit-credits">-{audit.credits_spent} ◈</span>
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
