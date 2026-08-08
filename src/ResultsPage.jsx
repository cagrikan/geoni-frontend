import { CircleCheck, TrendingUp, EyeOff, Wrench, ArrowRight } from 'lucide-react'
import GeoniMark from './GeoniMark'
import ProBlur from './ProBlur'
import SovSection from './components/SovSection'
import StabilityNote from './components/StabilityNote'
import { siteHaritasiBulgusu } from './lib/bulgular'
import OkunamayanSiteNotu from './components/OkunamayanSiteNotu'
import LanguageSwitcher from './components/LanguageSwitcher'
import ShareResult from './components/ShareResult'
import EmbedBadge from './components/EmbedBadge'
import WatchlistButton from './components/WatchlistButton'
import { useLanguage } from './lib/LanguageContext'
import { SKOR_IYI, SKOR_ORTA } from './lib/skor'

/* Alintilanabilirlik bulgusunun esikleri. MIN_SAYFA: tek/iki sayfalik siteden
   aksiyon uretmeyelim (orani bir paragraf belirler). ESIK: kabul araligindaki
   (100-220 kelime) pasajlarin orani bunun altindaysa "alintilanabilir blok
   neredeyse yok" demektir. */
const CIT_MIN_SAYFA = 5
const CIT_ESIK = 0.10
const MAX_FIX = 6

function scoreColor(score) {
  if (score >= SKOR_IYI) return 'var(--good)'
  if (score >= SKOR_ORTA) return 'var(--warn)'
  return 'var(--bad)'
}

function ScoreGauge({ score, label, legend }) {
  const radius = 64
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = scoreColor(score)
  return (
    <div className="score-gauge">
      <svg viewBox="0 0 160 160" className="score-gauge__svg">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="var(--border)" strokeWidth="10" />
        <circle cx="80" cy="80" r={radius} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 80 80)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <div className="score-gauge__num" style={{ color }}>{score}</div>
      <div className="score-gauge__label">{label}</div>
      {/* Skorun CIPASI: "61" tek basina iyi mi kotu mu soylemiyordu. Esikler
          yalnizca RENK olarak kodluydu (scoreColor); tek metinsel esik ise
          70+ skorda gorunen rozet ipucuydu — yani esige en cok ihtiyaci olan
          dusuk skorlu kullanici onu HIC gormuyordu. Sayilar scoreColor ile
          birebir ayni tutulmali. */}
      {legend && <div className="score-gauge__legend">{legend}</div>}
    </div>
  )
}

/* Etiketler INSAN dilinde: "Şema Bütünlüğü"/"Otorite"/"Dizin Kapsamı" ne
   olculdugunu teknik olmayan kullaniciya anlatmiyordu. Urun bu jargondan
   FIX ONERILERINDE zaten kacinmisti (fix_schema_title: "Sitenizin AI
   Tarafından Doğru Anlaşılması") — ayni kelimeyi iki satir yukarida jargon
   olarak birakmak tutarsizdi (2026-08-02 kullanici-dostlugu denetimi).
   Bu etiketler mailer.py ve mobil lib/i18n ile AYNI kalmali. */
const BREAKDOWN_LABELS_TR = {
  index_coverage: "AI'ın Görebildiği Sayfalar",
  authority: 'Güvenilirlik Sinyali',
  freshness: 'İçerik Güncelliği',
  schema: "Sitenin AI'a Doğru Anlatılması",
  ai_access: 'AI Botlarının Erişimi',
  engagement: 'Etkileşim',
  brand_recall: 'Marka Bilinirliği',
}

const BREAKDOWN_LABELS_EN = {
  index_coverage: 'Pages AI Can Actually See',
  authority: 'Trust Signal',
  freshness: 'Content Freshness',
  schema: 'Correct Site Understanding by AI',
  ai_access: 'AI Bot Access',
  engagement: 'Engagement',
  brand_recall: 'Brand Recall',
}

function Breakdown({ breakdown, language }) {
  const labels = language === 'en' ? BREAKDOWN_LABELS_EN : BREAKDOWN_LABELS_TR
  return (
    <div className="breakdown">
      {Object.entries(breakdown || {}).map(([key, value]) => (
        <div className="breakdown__row" key={key}>
          <div className="breakdown__row-top">
            <span className="breakdown__row-label">{labels[key] || key}</span>
            <span className="breakdown__row-value">{value}</span>
          </div>
          <div className="breakdown__bar-track">
            <div className="breakdown__bar-fill" style={{ width: `${Math.min(value, 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function TopicCard({ topic, isOpportunity }) {
  return (
    <div className="topic-card">
      <div className="topic-card__title">{topic.topic}</div>
      <div className="topic-card__meta">
        {(topic.platforms || []).map((p) => (
          <span className="topic-badge topic-badge--platform" key={p}>{p}</span>
        ))}
        {isOpportunity && (topic.competitors || []).slice(0, 3).map((c) => (
          <span className="topic-badge topic-badge--competitor" key={c}>{c}</span>
        ))}
      </div>
    </div>
  )
}

/* Tarama -> hizmet koprusu: raporun kendi verisinden somut eksikleri
   cikarir ve her birini app'teki ilgili hizmete baglar (hedef on-dolu).
   Urunun ana hunisi bu: "tara, eksigi gor, duzelttir". */
function FixSuggestions({ result, t, onUpgrade }) {
  const { domain, platforms = {}, llms_txt, sitemap_found, score_breakdown = {} } = result
  const fixes = []
  const blockedEngines = [
    !platforms.chatgpt && 'ChatGPT',
    !platforms.anthropic && 'Claude',
    !platforms.perplexity && 'Perplexity',
    !platforms.google && 'Gemini',
  ].filter(Boolean)
  if (blockedEngines.length > 0 || llms_txt === false) {
    fixes.push({
      key: 'bots',
      title: t('fix_bots_title'),
      why: blockedEngines.length > 0
        ? `${blockedEngines.join(', ')} ${t('fix_bots_why_blocked')}`
        : t('fix_bots_why_llms'),
    })
  }
  if ((score_breakdown.schema ?? 100) < 60) {
    fixes.push({ key: 'schema', title: t('fix_schema_title'), why: `${t('fix_schema_why')} ${score_breakdown.schema}/100` })
  }
  if ((score_breakdown.brand_recall ?? 100) < 40) {
    fixes.push({ key: 'entity', title: t('fix_entity_title'), why: `${t('fix_entity_why')} ${score_breakdown.brand_recall}/100` })
  }
  /* SSR korlugu: skoru ZATEN dusuruyor (ai_access kesintisi) ama musteri
     SEBEBINI goremiyordu — "puanim neden dustu" sorusu cevapsiz kaliyordu.
     Oneri listesinin EN USTUNE degil, teknik sirasina konur. */
  if (result.ssr?.js_dependent) {
    fixes.push({
      key: 'ssr',
      title: t('ssr_title'),
      // ?? 0: backend bugun bu alani HER ZAMAN dolduruyor (ssr_check.py:117),
      // ama komsu dallar da (schema/entity) ayni sigortayi tasiyor — alan
      // ileride opsiyonel olursa kullaniciya "%undefined" gostermeyelim.
      why: `${t('ssr_hidden_prefix')} %${result.ssr.hidden_pct ?? 0} ${t('ssr_hidden_suffix')}`,
    })
  }
  /* Eksik SAYFA TIPI (golge mod olcumu): "sema ekle" gibi genel oneri yerine
     "AI %53 karsilastirma listesi aliniyor, sende 1 sayfa var" der. */
  const tipEksik = (result.page_type_gap?.eksik_tipler || [])[0]
  if (tipEksik) {
    fixes.push({
      key: 'pagetype',
      title: t('pagetype_title'),
      why: `${t('pagetype_why_prefix')} %${Math.round((tipEksik.ai_orani || 0) * 100)} ${t('pagetype_why_mid')} ${tipEksik.bizdeki_sayfa ?? 0} ${t('pagetype_why_suffix')}`,
    })
  }
  /* Alintilanabilirlik (GOLGE MOD — skora GIRMEZ, `shadow: true`).
     NEDEN GOSTERILIYOR: urunun vaadi "AI seni ALINTILASIN"; bu, o vaadin tam
     kalbindeki tek olcum. NEDEN SKORA GIRMIYOR: dayandigi arastirma degerleri
     (ideal pasaj 134-167 kelime) claude-seo'nun kaynak gosterdigi rakamlar,
     BIZ bagimsiz dogrulamadik. Bulgu olarak gostermek risksiz: yanlissa
     kullaniciyi yaniltmaz, sadece bir oneri fazla cikar. Etiket bunu soyler. */
  const cit = result.citability
  if (cit && cit.sayfa >= CIT_MIN_SAYFA && (cit.alintilanabilir_oran ?? 1) < CIT_ESIK) {
    fixes.push({
      key: 'citability',
      title: t('cit_title'),
      why: `${t('cit_why_prefix')} ${cit.sayfa} ${t('cit_why_mid')} ${cit.ortanca_pasaj_kelime ?? 0} ${t('cit_why_suffix')}`,
      tag: cit.shadow ? t('cit_tag') : null,
    })
  }
  if (result.sov?.checked && (result.sov.score ?? 100) < 50) {
    fixes.push({ key: 'sov', title: t('fix_sov_title'), why: `${t('fix_sov_why')} ${result.sov.mention_count}/${result.sov.query_count}` })
  }

  /* Kirilimin kalan DORT boyutu (2026-08-03). Bunlar cikPlak sayi olarak
     duruyordu: kullanici "Güvenilirlik Sinyali 22/100" goruyor, kirmizi bar
     var, ama NE YAPACAGI raporda yazmiyordu — teshis var, tedavi yok. Urunun
     hunisi "tara -> eksigi gor -> duzelttir"; aksiyonu olmayan boyut bu huniden
     dusuyor. Her metin boyutun GERCEKTE olctugu seyi anlatir (scoring.py
     docstring'leri okunarak yazildi), genel tavsiye degil. */
  /* SITE HARITASI YOK — olculuyordu, HICBIR ISTEMCI SOYLEMIYORDU.
     Olculdu 2026-08-06: son 30 gunde 106 web taramasinin 30'unda (%28)
     `sitemap_found` false. Site haritasi, tarayicinin hangi sayfalarin var
     oldugunu KESFETME yolu; yoksa derindeki sayfalar hic gorulmeyebilir ve bu
     dogrudan urunun tezine dokunuyor. `false` DEGILSE (undefined = olculemedi)
     bulgu basilmaz — olculmemis seyi kusur gibi gostermeyiz. */
  if (siteHaritasiBulgusu(sitemap_found)) {
    fixes.push({ key: 'sitemap', title: t('fix_sitemap_title'), why: t('fix_sitemap_why') })
  }
  if ((score_breakdown.index_coverage ?? 100) < 50) {
    fixes.push({
      key: 'index',
      title: t('fix_index_title'),
      why: `${t('fix_index_why_prefix')} ${result.indexed_pages ?? 0}/${result.total_pages ?? 0} ${t('fix_index_why_suffix')}`,
    })
  }
  if ((score_breakdown.authority ?? 100) < 40) {
    fixes.push({ key: 'authority', title: t('fix_authority_title'),
                 why: `${t('fix_authority_why')} ${score_breakdown.authority}/100` })
  }
  if ((score_breakdown.freshness ?? 100) < 50) {
    fixes.push({ key: 'freshness', title: t('fix_freshness_title'),
                 why: `${t('fix_freshness_why')} ${score_breakdown.freshness}/100` })
  }
  if ((score_breakdown.engagement ?? 100) < 40) {
    fixes.push({ key: 'engagement', title: t('fix_engagement_title'),
                 why: `${t('fix_engagement_why')} ${score_breakdown.engagement}/100` })
  }

  if (fixes.length === 0) return null
  return (
    <div className="fixes">
      <h3 className="fixes__title"><Wrench size={15} strokeWidth={1.5} /> {t('fix_section_title')}</h3>
      {/* Tavan: dort yeni boyutla birlikte liste 9 maddeye cikabiliyor. Dokuz
          maddelik duvar karar felci yapar ve satis gibi durur — ilk MAX_FIX
          gosterilir, sira zaten teknik onceliktedir (bot erisimi -> sema ->
          kimlik -> SSR -> sayfa tipi -> alintilanabilirlik -> SOV -> kirilim). */}
      <div className="fixes__list">
        {fixes.slice(0, MAX_FIX).map((f) => (
          <button key={f.key} type="button" className="fixes__item" onClick={() => onUpgrade?.(domain || '')}>
            <div className="fixes__item-body">
              <div className="fixes__item-title">
                {f.title}
                {f.tag && <span className="fixes__item-tag">{f.tag}</span>}
              </div>
              <div className="fixes__item-why">{f.why}</div>
            </div>
            <span className="fixes__item-cta">{t('fix_cta')} <ArrowRight size={13} strokeWidth={1.75} /></span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ResultsPage({ result, jobId = null, onReset, user, onLogin, onDashboard, onUpgrade, isPro = false, isSample = false, isPrivate = false }) {
  const { t, language } = useLanguage()
  const {
    domain, score, score_breakdown,
    total_pages, platforms,
    top_topics = [], opportunities = [],
    created_at,
  } = result

  const locale = language === 'en' ? 'en-US' : 'tr-TR'
  const formattedDate = created_at
    ? new Date(created_at).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
    : null
  const formattedTime = created_at
    ? new Date(created_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
    : null

  const freeTopics = top_topics.slice(0, 2)
  const paidTopics = top_topics.slice(2)
  const freeOpps = opportunities.slice(0, 2)
  const paidOpps = opportunities.slice(2)

  return (
    <>
      <header className="landing__nav">
        <button className="landing__brand landing__brand--clickable" onClick={onReset}>
          <GeoniMark />
          <span className="landing__logo">geoni</span>
        </button>
        <div className="nav-auth">
          <LanguageSwitcher />
          {onDashboard && <button className="nav-dashboard-btn" onClick={onDashboard}>{t('nav_dashboard_back')}</button>}
          {!user && onLogin && <button className="nav-login-btn" onClick={onLogin}>{t('nav_login')}</button>}
        </div>
      </header>

      <div className="results">
        {isSample && (
          <div className="results__sample-banner">
            <span>{t('sample_banner_text')} <strong>{t('sample_banner_bold')}</strong> {t('sample_banner_rest')}</span>
            <button type="button" className="results__sample-banner-btn" onClick={onReset}>
              {t('sample_banner_btn')}
            </button>
          </div>
        )}
        {isPrivate && (
          <div className="results__private-banner">
            <EyeOff size={14} strokeWidth={1.5} /> {t('private_scan_banner')}
          </div>
        )}
        <div className="results__header">
          <div>
            <h1 className="results__title">{t('results_site_title')}</h1>
            {formattedDate && (
              <div className="results__date">
                {formattedDate}{formattedTime && <span style={{ marginLeft: 8, opacity: .7 }}>{formattedTime}</span>} {t('results_created_at_suffix')}
              </div>
            )}
          </div>
          <div className="results__scanned">
            <span className="results__scanned-label">{t('results_site_scanned_label')}</span>
            <span className="results__scanned-value">{domain}</span>
            {!isSample && !isPrivate && <WatchlistButton user={user} type="web" label={domain} target={{ domain }} />}
          </div>
        </div>

        {/* Progressive result (2026-07-24): SOV hala arka planda hesaplaniyor —
            skor gecerli ama tam degil, kisa surede guncellenebilir. */}
        {result.sov_pending && (
          <div className="results__sov-pending" role="status">
            <span className="results__sov-pending-spinner" aria-hidden="true" />
            {t('results_sov_pending')}
          </div>
        )}

        {/* Skor + Breakdown (breakdown blur) */}
        <div className="results__top">
          <div className="results__gauge-col">
            <ScoreGauge score={score} label={t('results_score_label')} legend={t('results_score_legend')} />
            <OkunamayanSiteNotu
              diagnostics={result.diagnostics}
              totalPages={result.total_pages}
              t={t}
            />
            <StabilityNote
              stability={result.stability}
              driverLabel={(language === 'en' ? BREAKDOWN_LABELS_EN : BREAKDOWN_LABELS_TR)[result.stability?.driver]}
              t={t}
            />
            {/* Paylas skor kutusunun ICINDE: paylasilan sey skor. Dusuk skorda
                HIC cikmaz (canShare) — kimse kotu skorunu paylasmaz, gostermek
                urunu "kotu haber dagitan sey" yapar. */}
            <ShareResult jobId={jobId} score={score} text={t('share_site_text', { domain, score })} />
          </div>
          <ProBlur isPro={isPro} onUpgrade={onUpgrade} label={t('results_site_breakdown_label')}>
            <Breakdown breakdown={score_breakdown} language={language} />
          </ProBlur>
        </div>

        <EmbedBadge jobId={jobId} score={score} pages={total_pages} />

        {/* Stats */}
        <div className="results__stats results__stats--six">
          <div className="results__stat">
            <span className="results__stat-n">{total_pages}</span>
            <span className="results__stat-l">{t('results_site_pages_scanned')}</span>
          </div>
          <div className="results__stat">
            <span className="results__stat-n" style={{ color: platforms?.chatgpt ? 'var(--good)' : 'var(--bad)' }}>
              {platforms?.chatgpt ? t('results_yes') : t('results_no')}
            </span>
            <span className="results__stat-l">{t('results_site_chatgpt_access')}</span>
          </div>
          <div className="results__stat">
            <span className="results__stat-n" style={{ color: platforms?.anthropic ? 'var(--good)' : 'var(--bad)' }}>
              {platforms?.anthropic ? t('results_yes') : t('results_no')}
            </span>
            <span className="results__stat-l">{t('results_site_claude_access')}</span>
          </div>
          <div className="results__stat">
            <span className="results__stat-n" style={{ color: platforms?.google ? 'var(--good)' : 'var(--bad)' }}>
              {platforms?.google ? t('results_yes') : t('results_no')}
            </span>
            <span className="results__stat-l">{t('results_site_gemini_access')}</span>
          </div>
          {/* Perplexity: backend bunu ZATEN olcuyor (audit_payload.py:80) ve
              tarama ekrani kullaniciya "Perplexity erisimi kontrol ediliyor"
              DIYOR — ama sonuc ekraninda hic gosterilmiyordu. Mobil gosteriyor:
              ayni parayi odeyen web kullanicisi eksik urun aliyordu.
              (Kor denetim 2026-08-04.) */}
          <div className="results__stat">
            <span className="results__stat-n" style={{ color: platforms?.perplexity ? 'var(--good)' : 'var(--bad)' }}>
              {platforms?.perplexity ? t('results_yes') : t('results_no')}
            </span>
            <span className="results__stat-l">{t('results_site_perplexity_access')}</span>
          </div>
          <div className="results__stat">
            <span className="results__stat-n" style={{ color: result.llms_txt == null ? 'var(--text-muted)' : result.llms_txt ? 'var(--good)' : 'var(--bad)' }}>
              {result.llms_txt == null ? '—' : result.llms_txt ? t('results_yes') : t('results_no')}
            </span>
            {/* Eskiden ham dosya adi ("llms.txt") yaziyordu: komsu uc kart
                "... Bot Izni" diye anlasilir bir cerceve kurarken bu kart teknik
                bir dosya adiydi. Terim urunun HICBIR yerinde tanimli degil
                (2026-08-02 kullanici-dostlugu denetimi). Ne oldugu yaziliyor,
                dosya adi parantezde teknik ipucu olarak kaliyor. */}
            <span className="results__stat-l">{t('results_site_llms_access')}</span>
          </div>
        </div>

        {/* Share of Voice: kategori sorgularinda gorunurluk (v3) */}
        <SovSection sov={result.sov} t={t} isPro={isPro} pending={!!result.sov_pending} />

        {/* Eksik -> hizmet koprusu (ornek raporda gosterilmez) */}
        {!isSample && <FixSuggestions result={result} t={t} onUpgrade={onUpgrade} />}

        {/* Topics */}
        <div className="topics">
          <div className="topics__col">
            <h3><CircleCheck size={16} strokeWidth={1.5} className="topics__col-icon" /> {t('results_strong_topics')}</h3>
            {freeTopics.length > 0 ? (
              freeTopics.map((tp, i) => <TopicCard topic={tp} key={i} />)
            ) : (
              <div className="topics__empty">{t('results_strong_topics_empty')}</div>
            )}
            {paidTopics.length > 0 && (
              <ProBlur isPro={isPro} onUpgrade={onUpgrade} cta={false} label={`+${paidTopics.length} ${t('results_more_topics')}`}>
                {paidTopics.map((tp, i) => <TopicCard topic={tp} key={i} />)}
              </ProBlur>
            )}
          </div>
          <div className="topics__col">
            <h3><TrendingUp size={16} strokeWidth={1.5} className="topics__col-icon" /> {t('results_missed_opportunities')}</h3>
            {freeOpps.length > 0 ? (
              freeOpps.map((tp, i) => <TopicCard topic={tp} isOpportunity key={i} />)
            ) : (
              <div className="topics__empty">{t('results_opportunities_empty')}</div>
            )}
            {paidOpps.length > 0 && (
              <ProBlur isPro={isPro} onUpgrade={onUpgrade} cta={false} label={`+${paidOpps.length} ${t('results_more_opportunities')}`}>
                {paidOpps.map((tp, i) => <TopicCard topic={tp} isOpportunity key={i} />)}
              </ProBlur>
            )}
          </div>
        </div>

        <div className="results__cta">
          <div className="results__cta-inner">
            <p className="results__cta-eyebrow">{t('results_next_step')}</p>
            <h2 className="results__cta-title">{t('results_upgrade_question')}</h2>
            <p className="results__cta-sub">{t('results_cta_sub_site')}</p>
            <button type="button" onClick={() => onUpgrade(domain || '')} className="results__cta-btn">
              {t('results_view_packages')}
            </button>
          </div>
        </div>
      </div>

      {!isPro && (
        <div className="results__sticky-bar">
          <span className="results__sticky-text">{t('results_sticky_upgrade')}</span>
          <button type="button" onClick={() => onUpgrade(domain || '')} className="results__sticky-btn">
            {t('results_view_packages')}
          </button>
        </div>
      )}
    </>
  )
}
