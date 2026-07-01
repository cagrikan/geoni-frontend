import GeoniMark from './GeoniMark'

export default function IdentityMismatchPage({ result, onReset }) {
  const { name, match_score } = result

  return (
    <>
      <header className="landing__nav">
        <button className="landing__brand landing__brand--clickable" onClick={onReset}>
          <GeoniMark />
          <span className="landing__logo">GEONI</span>
        </button>
      </header>

      <div className="results">
        <div className="identity-mismatch">
          <div className="identity-mismatch__icon">⚠</div>
          <h1 className="identity-mismatch__title">Kimlik Doğrulanamadı</h1>
          <p className="identity-mismatch__desc">
            <strong>{name}</strong> için internette bulunan sonuçlar, girdiğiniz bilgilerle yeterince örtüşmüyor.
            Adaşlarınızla karışıyor olabilir.
          </p>
          {match_score !== undefined && (
            <div className="identity-mismatch__score">
              Eşleşme Skoru: <strong>{match_score}/100</strong>
            </div>
          )}
          <p className="identity-mismatch__hint">
            Daha doğru sonuç için unvan, şirket veya şehir bilgilerinizi ekleyip tekrar deneyin.
          </p>
          <button className="identity-mismatch__btn" onClick={onReset}>
            Tekrar Dene →
          </button>
        </div>
      </div>
    </>
  )
}
