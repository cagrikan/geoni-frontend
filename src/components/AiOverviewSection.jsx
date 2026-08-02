import { CheckCircle2, XCircle, MinusCircle } from 'lucide-react'
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

/* Google AI Ozeti'nin kendi gorsel dili: dort uclu "spark". Google'in AI
   Overview / Gemini isaretini kullanicilar bu SEKILDEN taniyor, o yuzden
   lucide'in uc-yildizli <Sparkles> ikonu yerine tek dort-uclu spark cizildi.

   NEDEN GOOGLE'IN LOGOSU DEGIL: Google'in gradyanli marka isaretini urunumuze
   koymak ticari marka riskidir ve "Google ile resmi baglantimiz var" izlenimi
   verir. Dort-uclu spark ise sektorde AI'in genel isareti — taninirligi verir,
   marka taklidi yapmaz.

   currentColor kullanir -> acik/koyu temada baslik rengiyle uyumlu kalir. */
function AiSparkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"
         style={{ flex: '0 0 auto' }}>
      <path d="M12 2.5c.35 3.9 1.7 6.3 3.6 7.6 1.2.8 2.7 1.3 4.4 1.6 .35.06.35.54 0 .6-1.7.3-3.2.8-4.4 1.6-1.9 1.3-3.25 3.7-3.6 7.6-.03.36-.57.36-.6 0-.35-3.9-1.7-6.3-3.6-7.6-1.2-.8-2.7-1.3-4.4-1.6-.35-.06-.35-.54 0-.6 1.7-.3 3.2-.8 4.4-1.6C9.7 8.8 11.05 6.4 11.4 2.5c.03-.36.57-.36.6 0Z"
            fill="currentColor" opacity="0.9" />
      <path d="M19.2 3.2c.14 1.5.66 2.42 1.4 2.92.46.31 1.04.5 1.7.62.13.02.13.2 0 .23-.66.12-1.24.31-1.7.62-.73.5-1.26 1.42-1.4 2.92-.01.14-.22.14-.23 0-.14-1.5-.66-2.42-1.4-2.92-.46-.31-1.04-.5-1.7-.62-.13-.03-.13-.21 0-.23.66-.12 1.24-.31 1.7-.62.74-.5 1.26-1.42 1.4-2.92.01-.14.22-.14.23 0Z"
            fill="currentColor" opacity="0.55" />
    </svg>
  )
}

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
          <AiSparkIcon /> {t('aio_title')}
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
