import GeoniMark from './GeoniMark'

export default function BrandCheckResultsPage({ result, onReset }) {
  const { name, topic, recognized, raw_list, created_at } = result

  const formattedDate = created_at
    ? new Date(created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const listItems = raw_list
    ? raw_list.split('\n').filter(line => line.trim().startsWith('•'))
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
          <div className={`brand-check__status ${recognized ? 'brand-check__status--found' : 'brand-check__status--notfound'}`}>
            <span className="brand-check__status-icon">{recognized ? '✓' : '✗'}</span>
            <div>
              <div className="brand-check__status-title">
                {recognized
                  ? 'AI sizi bu alanda tanıyor'
                  : 'AI sizi bu alanda tanımıyor'}
              </div>
              <div className="brand-check__status-sub">
                <strong>{name}</strong> · {topic}
              </div>
            </div>
          </div>
        </div>

        {listItems.length > 0 && (
          <div className="brand-check__list-section">
            <h3 className="brand-check__list-title">
              AI'nın "{topic}" alanında tanıdığı isimler
            </h3>
            <div className="brand-check__list">
              {listItems.map((item, i) => {
                const cleanItem = item.replace(/^•\s*/, '')
                const [namepart, ...rest] = cleanItem.split('—')
                const isYou = recognized && namepart && namepart.toLowerCase().includes(name.toLowerCase().split(' ')[0])
                return (
                  <div key={i} className={`brand-check__list-item ${isYou ? 'brand-check__list-item--highlight' : ''}`}>
                    <span className="brand-check__list-bullet">•</span>
                    <span>
                      <strong>{namepart?.trim()}</strong>
                      {rest.length > 0 && <span className="brand-check__list-desc"> — {rest.join('—').trim()}</span>}
                    </span>
                    {isYou && <span className="brand-check__list-you">Siz</span>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="results__cta-compact" style={{ marginTop: 32 }}>
          <span className="results__cta-compact-text">
            {recognized
              ? 'Web sitenizin tam AI görünürlüğünü de ölçelim'
              : 'Bu skoru nasıl yükseltirsiniz? GEO ile AI\'da görünür olun'}
          </span>
          <a href="https://geoni.ai#paketler" className="results__cta-compact-btn" target="_blank" rel="noopener">
            GEO Paketlerini İncele →
          </a>
        </div>

        <div className="results__sticky-bar">
          <span className="results__sticky-text">
            {recognized ? 'AI sizi tanıyor — peki web sitenizi buluyor mu?' : 'AI sizi tanımıyor — GEO ile bunu değiştirebilirsiniz'}
          </span>
          <a href="https://geoni.ai#paketler" className="results__sticky-btn" target="_blank" rel="noopener">
            GEO Paketlerini İncele →
          </a>
        </div>
      </div>
    </>
  )
}
