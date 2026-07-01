import GeoniMark from './GeoniMark'

const MODEL_LABELS = {
  claude: 'Claude',
  openai: 'ChatGPT',
  gemini: 'Gemini',
}

const GEO_OPPORTUNITIES = [
  'AI motorlarının tarayabileceği yapılandırılmış içerik oluşturma',
  'Sektörünüzde otorite kazandıracak makale ve blog içerikleri',
  'Wikipedia, LinkedIn ve sektör yayınlarında varlık oluşturma',
  'AI motorlarında kaynak olarak gösterilmek için alıntılanabilir içerik üretimi',
  'Rakiplerinizin AI görünürlüğünü analiz edip boşlukları doldurma',
]

export default function BrandCheckResultsPage({ result, onReset }) {
  const { name, topic, recognized, recognition_count, model_results = {}, raw_list, created_at } = result

  const formattedDate = created_at
    ? new Date(created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const total = Object.keys(model_results).length || 3
  const count = recognition_count ?? (recognized ? 1 : 0)
  const notRecognizedModels = Object.entries(model_results).filter(([, v]) => !v.recognized).map(([, v]) => v.model)

  const statusLabel = count === 3 ? 'Yüksek AI Bilinirliği'
    : count === 2 ? 'Orta AI Bilinirliği'
    : count === 1 ? 'Düşük AI Bilinirliği'
    : 'AI Bilinirliği Yok'

  const statusClass = count >= 2 ? 'found' : count === 1 ? 'partial' : 'notfound'
  const statusColor = count >= 2 ? 'var(--good)' : count === 1 ? 'var(--warn)' : 'var(--bad)'

  const rawSections = raw_list
    ? raw_list.split('\n\n').filter(s => s.trim()).map(section => {
        const lines = section.trim().split('\n')
        const header = lines[0].startsWith('[') ? lines[0].replace(/[\[\]]/g, '') : null
        const body = header ? lines.slice(1).join('\n').trim() : section.trim()
        return { header, body }
      })
    : []

  return (
    <>
      <header className="landing__nav">
        <button className="landing__brand landing__brand--clickable" onClick={onReset}>
          <GeoniMark />
          <span className="landing__logo">GEONI</span>
        </button>
      </header>

      <div className="results">
        {/* ── HEADER ── */}
        <div className="results__header">
          <div>
            <h1 className="results__title">AI Bilinirlik Raporu</h1>
            {formattedDate && <div className="results__date">{formattedDate} tarihinde oluşturuldu</div>}
          </div>
          <div className="results__scanned">
            <span className="results__scanned-label">Sorgulanan</span>
            <span className="results__scanned-value">{name}</span>
            {topic && topic !== name && (
              <span className="results__scanned-topic">{topic}</span>
            )}
          </div>
        </div>

        {/* ── SCORE + MODEL GRID ── */}
        <div className="results__top brand-check__top">
          <div className="score-gauge">
            <svg viewBox="0 0 160 160" className="score-gauge__svg">
              <circle cx="80" cy="80" r="64" fill="none" stroke="var(--border)" strokeWidth="10" />
              <circle
                cx="80" cy="80" r="64"
                fill="none"
                stroke={statusColor}
                strokeWidth="10"
                strokeDasharray={`${(count / total) * 402} 402`}
                strokeLinecap="round"
                transform="rotate(-90 80 80)"
                style={{ transition: 'stroke-dasharray .6s ease' }}
              />
            </svg>
            <div className="score-gauge__num" style={{ color: statusColor }}>{count}/{total}</div>
            <div className="score-gauge__label">AI TANINMA SKORU</div>
            <div className="score-gauge__sub" style={{ color: statusColor, marginTop: 6, fontSize: '.8rem', fontFamily: 'var(--mono)' }}>{statusLabel}</div>
          </div>

          <div className="brand-check__model-grid">
            <h3 className="brand-check__model-grid-title">Model Bazlı Sonuçlar</h3>
            {Object.entries(model_results).map(([key, val]) => (
              <div key={key} className={`brand-check__model-row ${val.recognized ? 'brand-check__model-row--found' : 'brand-check__model-row--notfound'}`}>
                <span className="brand-check__model-row-icon">{val.recognized ? '✓' : '✗'}</span>
                <span className="brand-check__model-row-name">{MODEL_LABELS[key] || val.model}</span>
                <span className="brand-check__model-row-status">{val.recognized ? 'Tanıyor' : 'Tanımıyor'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── AI RESPONSES ── */}
        {rawSections.length > 0 && (
          <div className="brand-check__section">
            <h2 className="brand-check__section-title">✓ AI Motorlarının Yanıtları</h2>
            <div className="brand-check__responses">
              {rawSections.map((s, i) => (
                <div key={i} className="brand-check__response-card">
                  {s.header && <div className="brand-check__response-model">{s.header}</div>}
                  <p className="brand-check__response-body">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MISSED OPPORTUNITIES ── */}
        {notRecognizedModels.length > 0 && (
          <div className="brand-check__section">
            <h2 className="brand-check__section-title">→ Kaçırdığınız Fırsatlar</h2>
            <p className="brand-check__opp-intro">
              <strong>{notRecognizedModels.join(', ')}</strong> sizi henüz tanımıyor.
              GEO stratejisiyle bu motorlarda da görünür olabilirsiniz:
            </p>
            <div className="brand-check__opp-list">
              {GEO_OPPORTUNITIES.map((opp, i) => (
                <div key={i} className="brand-check__opp-item">
                  <span className="brand-check__opp-icon">→</span>
                  <span>{opp}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CTA ── */}
        <div className="results__cta-compact">
          <span className="results__cta-compact-text">
            {count > 0 ? 'Web sitenizin tam AI görünürlüğünü de ölçelim' : 'GEO ile tüm AI motorlarında görünür olun'}
          </span>
          <a href="https://geoni.ai#paketler" className="results__cta-compact-btn" target="_blank" rel="noopener">
            GEO Paketlerini İncele →
          </a>
        </div>
      </div>

      <div className="results__sticky-bar">
        <span className="results__sticky-text">
          {count > 0 ? `${count}/${total} AI motoru sizi tanıyor` : 'Hiçbir AI motoru sizi tanımıyor'}
        </span>
        <a href="https://geoni.ai#paketler" className="results__sticky-btn" target="_blank" rel="noopener">
          GEO Paketlerini İncele →
        </a>
      </div>
    </>
  )
}
