import { Radar, CheckCircle2, XCircle } from 'lucide-react'
import ProBlur from '../ProBlur'

const ENGINE_LABELS = { perplexity: 'Perplexity', google: 'Google AI' }

/* Share of Voice (v3): markayi bilmeyen kullanicinin kategori sorgularinda
   marka oneriliyor mu? Ozet satiri herkese acik (satisin kancasi), sorgu
   detaylari ve rakip listesi Pro'ya. */
export default function SovSection({ sov, t, isPro = false }) {
  if (!sov || !sov.checked || sov.score === null || sov.score === undefined) return null

  const color = sov.score >= 65 ? 'var(--good)' : sov.score >= 40 ? 'var(--warn)' : 'var(--bad)'

  return (
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
      </ProBlur>
    </div>
  )
}
