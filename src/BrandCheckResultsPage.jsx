import GeoniMark from './GeoniMark'

const MODEL_LABELS = {
  claude: 'Claude',
  openai: 'ChatGPT',
  gemini: 'Gemini',
}

export default function BrandCheckResultsPage({ result, onReset }) {
  const { name, topic, recognized, recognition_count, model_results = {}, raw_list, created_at } = result

  const formattedDate = created_at
    ? new Date(created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const total = Object.keys(model_results).length || 3
  const count = recognition_count ?? (recognized ? 1 : 0)

  const statusLabel = count === 3 ? 'Yüksek AI Bilinirliği'
    : count === 2 ? 'Orta AI Bilinirliği'
    : count === 1 ? 'Düşük AI Bilinirliği'
    : 'AI Bilinirliği Yok'

  const statusClass = count >= 2 ? 'found' : count === 1 ? 'partial' : 'notfound'

  return (
    <>
      <header className="landing__nav">
        <button className="landing__brand landing__brand--clickable" onClick={onReset}>
          <GeoniMark />
          <span className="landing__logo">GEONI</span>
        </button>
      </header>

      <div className="results">
        <div className="results__header">
          <div>
            <h1 className="results__title">AI Bilinirlik Sorgusu</h1>
            {formattedDate && <div className="results__date">{formattedDate} tarihinde oluşturuldu</div>}
          </div>
          <div className="results__scanned">
            <span className="results__scanned-label">Sorgulanan</span>
            <span className="results__scanned-value">{name}</span>
          </div>
        </div>

        <div className="brand-check__hero">
          <div className={`brand-check__status brand-check__status--${statusClass}`}>
            <div className="brand-check__status-icon">
              {count}/{total}
            </div>
            <div>
              <div className="brand-check__status-title">{statusLabel}</div>
              <div className="brand-check__status-sub">
                <strong>{name}</strong>{topic ? ` · ${topic}` : ''}
              </div>
            </div>
          </div>
        </div>

        <div className="brand-check__models">
          {Object.entries(model_results).map(([key, val]) => (
            <div key={key} className={`brand-check__model-card ${val.recognized ? 'brand-check__model-card--found' : 'brand-check__model-card--notfound'}`}>
              <span className="brand-check__model-icon">{val.recognized ? '✓' : '✗'}</span>
              <span className="brand-check__model-name">{MODEL_LABELS[key] || val.model}</span>
              <span className="brand-check__model-status">{val.recognized ? 'Tanıyor' : 'Tanımıyor'}</span>
            </div>
          ))}
        </div>

        <div className="results__cta-compact" style={{ marginTop: 32 }}>
          <span className="results__cta-compact-text">
            {count > 0
              ? 'Web sitenizin tam AI görünürlüğünü de ölçelim'
              : 'GEO ile AI motorlarında görünür olun'}
          </span>
          <a href="https://geoni.ai#paketler" className="results__cta-compact-btn" target="_blank" rel="noopener">
            GEO Paketlerini İncele →
          </a>
        </div>

        <div className="results__sticky-bar">
          <span className="results__sticky-text">
            {count > 0 ? `${count}/${total} AI motoru sizi tanıyor` : 'Hiçbir AI motoru sizi tanımıyor — GEO ile değiştirin'}
          </span>
          <a href="https://geoni.ai#paketler" className="results__sticky-btn" target="_blank" rel="noopener">
            GEO Paketlerini İncele →
          </a>
        </div>
      </div>
    </>
  )
}
