import { Lock } from 'lucide-react'
import { useLanguage } from './lib/LanguageContext'

/**
 * Ucretli icerik kapisi — AŞAMALI SOLUKLAŞMA (kurucu karari 2026-07-25).
 *
 * ESKI HAL: kutunun TAMAMI blur(7px) idi. Iki sorunu vardi:
 *  1) "ekran bozuk" hissi — bulaniklik ariza gibi okunuyor, tasarim gibi degil.
 *  2) kullanici NE satin alacagini goremiyordu; alti boyut oldugunu bile bilmiyordu.
 *
 * YENI HAL: ilk `reveal` kadar satir/kart TAM GORUNUR (gercek isim, gercek puan,
 * gercek bar). Sonrakiler kademeli soluklasir; puanlar okunmaz ama BAR UZUNLUKLARI
 * durur — "zayif tarafim var, goreyim" duygusu satin almayi tetikleyen sey.
 * Hicbir yerde blur YOK. Kademeler CSS'te (.pro-reveal__list nth-child).
 *
 * cta=true  → altta "Tam raporu ac" seridi (sayfada BIR kez, birincil kapi).
 * cta=false → yalniz kilit etiketi (her yerde buton = spam gorunumu).
 */
export default function ProBlur({ children, label, isPro = false, onUpgrade, cta = true, reveal = 2 }) {
  const { t } = useLanguage()
  if (isPro) return <>{children}</>
  return (
    <div className="pro-reveal">
      {/* aria-hidden DEGIL: kilitli satirlar ekran okuyucuya da duyurulmali —
          gorsel bir oyun degil, gercek bir erisim durumu. */}
      <div className="pro-reveal__list" data-reveal={reveal}>{children}</div>
      <div className="pro-reveal__gate">
        <Lock size={14} strokeWidth={1.5} className="pro-reveal__lock" aria-hidden="true" />
        <span className="pro-reveal__label">{label || t('problur_default_label')}</span>
        {cta && (
          <a
            href="https://app.geoni.ai/dashboard?tab=credits"
            className="pro-reveal__btn"
            onClick={(e) => { if (onUpgrade) { e.preventDefault(); onUpgrade() } }}
          >
            {t('problur_upgrade')}
          </a>
        )}
      </div>
    </div>
  )
}
