import { Radar, CheckCircle2, XCircle } from 'lucide-react'
import ProBlur from '../ProBlur'
import AiOverviewSection from './AiOverviewSection'
import GrokShadowNote from './GrokShadowNote'

/* Motor anahtari -> gosterim adi. claude/chatgpt eksikti: uretimde bu iki motor
   da SOV sorgusu yanitliyor (dogrulandi 2026-07-30, son 10 gun) ve etiketsiz
   kalinca raporda ham anahtar olarak "chatgpt ✓" diye cikiyordu. */
const ENGINE_LABELS = {
  perplexity: 'Perplexity', google: 'Google AI', claude: 'Claude', chatgpt: 'ChatGPT',
}

/* Share of Voice (v3): markayi bilmeyen kullanicinin kategori sorgularinda
   marka oneriliyor mu? Ozet satiri herkese acik (satisin kancasi), sorgu
   detaylari ve rakip listesi Pro'ya. */
export default function SovSection({ sov, t, isPro = false, pending = false }) {
  /* SOV hala arka planda olculuyor (status=partial): bolumu gizlemek yerine
     yerinde tut ve ozet sayinin yerine donen animasyon koy. Bos/0 bir sayi
     "hic anilmadin" diye okunur, oysa olcum daha bitmedi.
     (Cagri, 2026-07-30 — "islem yapiyorsa sifir yerine animasyon".) */
  if (pending) {
    return (
      <div className="sov">
        <div className="sov__head">
          <h3 className="sov__title"><Radar size={15} strokeWidth={1.5} /> {t('sov_title')}</h3>
          <span className="sov__summary sov__summary--pending" role="status" aria-label={t('sov_measuring')}>
            <span className="results__sov-pending-spinner" aria-hidden="true" />
            {t('sov_measuring')}
          </span>
        </div>
        <p className="sov__sub">{t('sov_subtitle')}</p>
      </div>
    )
  }

  /* SOV olculemediyse SOV karti cizilmez — ama AI OZETI ayri bir olcumdur ve
     ayri para yakar (DataForSEO). Ikisini ayni kapiya baglamak, SOV motorlari
     cevap vermediginde musterinin ODEDIGI AI Ozeti olcumunu de sessizce
     gizliyordu (sov.py: answered_cells==0 -> checked=False ama queries DOLU
     kalir ve brand_recall o queries'ten AI Ozeti uretebilir). Olculmus veri
     saklanmaz. */
  if (!sov || !sov.checked || sov.score === null || sov.score === undefined) {
    return <AiOverviewSection aio={sov?.ai_overview} t={t} isPro={isPro} />
  }

  const color = sov.score >= 65 ? 'var(--good)' : sov.score >= 40 ? 'var(--warn)' : 'var(--bad)'

  return (
    <>
      <div className="sov">
      <div className="sov__head">
        <h3 className="sov__title"><Radar size={15} strokeWidth={1.5} /> {t('sov_title')}</h3>
        <span className="sov__summary" style={{ color }}>
          {sov.mention_count}/{sov.query_count} {t('sov_summary_suffix')}
        </span>
      </div>
      <p className="sov__sub">{t('sov_subtitle')}</p>

      <ProBlur isPro={isPro} cta={false} label={t('sov_detail_label')}>
        <div className="sov__queries">
          {(sov.queries || []).map((q, i) => (
            <div className="sov__query" key={i}>
              {q.mentioned
                ? <CheckCircle2 size={14} strokeWidth={1.75} style={{ color: 'var(--good)' }} />
                : <XCircle size={14} strokeWidth={1.75} style={{ color: 'var(--bad)' }} />}
              <span className="sov__query-text">
                {q.query}
                {q.adjacent && (
                  <span className="sov__adjacent-tag" title={q.adjacent_topic || ''}>
                    {t('sov_adjacent_tag')}{q.adjacent_topic ? `: ${q.adjacent_topic}` : ''}
                  </span>
                )}
                {/* ONERI SIRASI (2026-08-02): backend `_extract_position` ile
                    ZATEN cikariyordu (sov.py:201) ama arayuz hic gostermiyordu.
                    "Anildin" ile "1. siradasin" bambaska bilgi: donusumde
                    1. sira ile 8. sira arasinda ucurum var. Yalniz marka
                    ANILDIYSA ve pozisyon GERCEKTEN cikarildiysa gosterilir —
                    backend bulamazsa None birakiyor, uydurmuyoruz. */}
                {q.mentioned && typeof q.position === 'number' && (
                  <span className={`sov__pos ${q.position <= 2 ? 'sov__pos--top'
                                    : q.position <= 5 ? 'sov__pos--mid' : 'sov__pos--low'}`}>
                    {t('sov_position_prefix')}{q.position}{t('sov_position_suffix')}
                  </span>
                )}
              </span>
              {q.engines ? (
                /* Motor bazinda sonuc: Perplexity + Google AI (Overviews esdegeri) */
                Object.entries(q.engines).map(([eng, st]) => (
                  <span
                    key={eng}
                    className={`sov__query-tag ${!st.answered ? 'sov__query-tag--na' : st.mentioned ? 'sov__query-tag--yes' : 'sov__query-tag--no'}`}
                    title={ENGINE_LABELS[eng] || eng}
                  >
                    {ENGINE_LABELS[eng] || eng} {!st.answered ? '—' : st.mentioned ? '✓' : '✗'}
                  </span>
                ))
              ) : (
                <span className={`sov__query-tag ${q.mentioned ? 'sov__query-tag--yes' : 'sov__query-tag--no'}`}>
                  {q.mentioned ? t('sov_mentioned') : t('sov_not_mentioned')}
                </span>
              )}
            </div>
          ))}
        </div>
        {sov.custom_queries_used && <p className="sov__custom-note">{t('sov_custom_note')}</p>}

        {(sov.competitors || []).length > 0 && (
          <div className="sov__competitors">
            <span className="sov__competitors-label">{t('sov_competitors_title')}</span>
            <div className="sov__competitors-list">
              {sov.competitors.map((c, i) => (
                <span className="sov__competitor" key={i}>
                  {c.name}
                  {c.mentions > 1 && <em>×{c.mentions}</em>}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Atif/kaynak istihbarati: AI bu kategoride hangi siteleri kaynak gosteriyor? */}
        {(sov.sources || []).length > 0 && (
          <div className="sov__competitors">
            <span className="sov__competitors-label">{t('sov_sources_title')}</span>
            {sov.own_cited_count > 0 ? (
              <p className="sov__own-cited sov__own-cited--yes">
                ✓ {t('sov_own_cited_prefix')} {sov.own_cited_count} {t('sov_own_cited_suffix')}
              </p>
            ) : (
              <p className="sov__own-cited">{t('sov_own_not_cited')}</p>
            )}
            <div className="sov__competitors-list">
              {sov.sources.map((s, i) => (
                <span className={`sov__competitor ${s.own ? 'sov__competitor--own' : ''}`} key={i}>
                  {s.domain}
                  {s.mentions > 1 && <em>×{s.mentions}</em>}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Atif firsati (citation_gap): rakipleri AI'ya anlatan ama seni anmayan
            kaynaklar — "su siteler rakiplerini soyluyor, sen yoksun" aksiyon listesi.
            Backend uretiyordu ama hicbir client gostermiyordu (QA 2026-07-19). */}
        {(sov.citation_gap || []).length > 0 && (
          <div className="sov__competitors sov__gap">
            <span className="sov__competitors-label">{t('sov_gap_title')}</span>
            <p className="sov__own-cited">{t('sov_gap_sub')}</p>
            <div className="sov__competitors-list">
              {sov.citation_gap.map((g, i) => (
                <span className="sov__competitor" key={i}>
                  {g.domain}
                  {g.mentions > 1 && <em>×{g.mentions}</em>}
                </span>
              ))}
            </div>
          </div>
        )}
      </ProBlur>
      </div>
      {/* Google AI Overview: ayri kart, ayni kart dili. sov.ai_overview yoksa
          (DATAFORSEO kimligi tanimsiz) bilesen null doner — bolum cizilmez. */}
      <AiOverviewSection aio={sov.ai_overview} t={t} isPro={isPro} />
      {/* Grok golge notu: skora girmez, etiketle isaretli. Alan cogu
          taramada yok (gunluk tavan) -> bilesen null doner. */}
      <GrokShadowNote gw={sov.grok_web_shadow} t={t} />
    </>
  )
}
