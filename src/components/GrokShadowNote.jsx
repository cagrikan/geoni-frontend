import { Sparkles } from 'lucide-react'

/**
 * Grok (xAI) GOLGE MOTORU — BILGI NOTU.
 *
 * NEDEN VAR: xAI'nin X (Twitter) aramasina native erisimi var; diger dort web
 * motorunun (Perplexity/Gemini/ChatGPT/Claude) GORMEDIGI kaynaklari bulabiliyor.
 * Musteri icin degerli olan tam olarak bu: "senden bahseden ama bizim diger
 * motorlarimizin gostermedigi yerler".
 *
 * NEDEN SKORA GIRMIYOR: 2026-07-30 olcumunde grok'un bagimsiz-sinyal iddiasi
 * temiz veride cokmustu (5 motorun 4.'su, claude ile korelasyon .738), kurucu
 * karariyla WEIGHTS['grok']=0 kaldi. Etiket bunu ACIKCA soyler — yoksa kullanici
 * puanini dusuren/yukselten bir olcum sanar.
 *
 * NEDEN COGU RAPORDA GORUNMEZ: gunluk cagri tavanina tabi (GROK_WEB_DAILY_CAP),
 * yani alan cogu taramada HIC olmaz. Yoksa bilesen null doner.
 */
export default function GrokShadowNote({ gw, t }) {
  if (!gw || typeof gw.query_count !== 'number' || gw.query_count === 0) return null
  // Hic yanit alinamadiysa gosterilecek bilgi yok (motor dusmus demektir).
  if (!gw.answered) return null

  const hits = gw.mention_count || 0
  const benzersiz = gw.unique_sources || []

  return (
    <div className="sov sov--not">
      <div className="sov__head">
        <h3 className="sov__title">
          <Sparkles size={15} strokeWidth={1.5} /> {t('grok_title')}
          <span className="fixes__item-tag">{t('cit_tag')}</span>
        </h3>
        <span className="sov__summary" style={{ color: hits > 0 ? 'var(--good)' : 'var(--text-muted)' }}>
          {hits}/{gw.query_count} {t('sov_summary_suffix')}
        </span>
      </div>
      <p className="sov__sub">{t('grok_subtitle')}</p>

      {benzersiz.length > 0 && (
        <div className="sov__competitors">
          <span className="sov__competitors-label">{t('grok_unique_title')}</span>
          <p className="sov__own-cited">{t('grok_unique_desc')}</p>
          <div className="sov__competitors-list">
            {benzersiz.slice(0, 10).map((d, i) => (
              <span className="sov__competitor" key={i}>{d}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
