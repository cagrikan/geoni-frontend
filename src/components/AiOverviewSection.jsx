import { Sparkles, CheckCircle2, XCircle, MinusCircle } from 'lucide-react'
import ProBlur from '../ProBlur'

/* Google AI Overview (2026-08-02).

   NEDEN AYRI BIR BOLUM: SOV "sohbet motoru (ChatGPT/Claude/Perplexity) seni
   aniyor mu" der; bu bolum "Google aramanin EN USTUNDEKI yapay zeka kutusunda
   var misin" der. Farkli yuzeyler — biri otekinin yerine gecmez.

   NEDEN SATIS DEGERI YUKSEK: SOV bulgusunu musteri dogrulamak icin ChatGPT
   acmak zorunda. Bu bulguyu "Google'da su aramayi yap, ustteki kutuya bak"
   diye 10 saniyede KENDI GOZUYLE dogrular. Olcumun kanitlanabilirligi de satar.

   Skora KATILMAZ (WEIGHTS'e dokunulmadi) — bilincli, once veri birikecek.
   Alan yoksa (DATAFORSEO kimligi tanimli degil) bolum hic cizilmez. */

/* Mevcut sov__* siniflari yeniden kullaniliyor: ayni kart dili, sifir yeni CSS
   riski. Yalniz iki yeni sinif var (aio__excerpt, aio__note) — App.css'te. */
export default function AiOverviewSection({ aio, t, isPro = false }) {
  if (!aio || typeof aio.aio_present_count !== 'number') return null

  const measured = aio.queries_measured ?? (aio.queries || []).length
  // Kutu HIC cikmadiysa gosterilecek bir sey yok; bos "0/0" kart kafa karistirir.
  if (!measured || !aio.aio_present_count) return null

  const hits = aio.brand_mention_count || 0
  const shown = aio.aio_present_count
  // Renk esigi SOV ile ayni mantik: kutunun cikti(gi) sorgularin kacinda geciyoruz.
  const rate = shown ? hits / shown : 0
  const color = rate >= 0.5 ? 'var(--good)' : rate > 0 ? 'var(--warn)' : 'var(--bad)'

  const domains = aio.top_cited_domains || []

  return (
    <div className="sov">
      <div className="sov__head">
        <h3 className="sov__title">
          <Sparkles size={15} strokeWidth={1.5} /> {t('aio_title')}
        </h3>
        <span className="sov__summary" style={{ color }}>
          {hits}/{shown} {t('aio_summary_suffix')}
        </span>
      </div>
      <p className="sov__sub">
        {t('aio_subtitle')} {t('aio_present_prefix')} {shown}/{measured} {t('aio_present_suffix')}
      </p>

      <ProBlur isPro={isPro} cta={false} label={t('aio_detail_label')}>
        <div className="sov__queries">
          {(aio.queries || []).map((q, i) => {
            /* Uc ayri durum var ve ucu de FARKLI seyler soyler:
               - kutu cikti + gectin  -> iyi
               - kutu cikti + gecmedin -> kayip (asil aksiyon burada)
               - kutu hic cikmadi      -> Google bu soruda AI ozeti gostermiyor;
                                          bu bir BASARISIZLIK DEGIL, olcumdur. */
            const icon = !q.present
              ? <MinusCircle size={14} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
              : q.brand_mentioned
                ? <CheckCircle2 size={14} strokeWidth={1.75} style={{ color: 'var(--good)' }} />
                : <XCircle size={14} strokeWidth={1.75} style={{ color: 'var(--bad)' }} />
            const tagCls = !q.present
              ? 'sov__query-tag--na'
              : q.brand_mentioned ? 'sov__query-tag--yes' : 'sov__query-tag--no'
            return (
              <div className="sov__query" key={i}>
                {icon}
                <span className="sov__query-text">
                  {q.query}
                  {q.present && q.text && (
                    <span className="aio__excerpt">{q.text.slice(0, 190)}…</span>
                  )}
                </span>
                <span className={`sov__query-tag ${tagCls}`}>
                  {!q.present ? t('aio_no_box')
                    : q.brand_mentioned ? t('sov_mentioned') : t('sov_not_mentioned')}
                </span>
              </div>
            )
          })}
        </div>

        {domains.length > 0 && (
          <div className="sov__competitors">
            <span className="sov__competitors-label">{t('aio_sources_title')}</span>
            {aio.own_domain_cited_count > 0 ? (
              <p className="sov__own-cited sov__own-cited--yes">
                ✓ {t('aio_own_cited_prefix')} {aio.own_domain_cited_count} {t('aio_own_cited_suffix')}
              </p>
            ) : (
              <p className="sov__own-cited">{t('aio_own_not_cited')}</p>
            )}
            <div className="sov__competitors-list">
              {domains.map(([domain, n], i) => (
                <span className="sov__competitor" key={i}>
                  {domain}
                  {n > 1 && <em>×{n}</em>}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Olculemeyen sorgu SAYISI gosterilir: sessizce yutulursa kullanici
            eksik paydayi tam sanir. Saglayici hatasi "kutu yok" DEGILDIR. */}
        {aio.queries_failed > 0 && (
          <p className="aio__note">
            {aio.queries_failed} {t('aio_failed_note')}
          </p>
        )}
      </ProBlur>
    </div>
  )
}
