import { Sprout } from 'lucide-react'
import { useLanguage } from '../lib/LanguageContext'

/**
 * Creator programi daveti — SOSYAL/KISI taramasinin sonucunda.
 *
 * NEDEN BURADA: huninin en yuksek niyet ani bu ekran — kisi tam da "AI beni
 * taniyor mu?" sorusunun cevabina bakiyor. 2026-07-25 denetimine kadar
 * uygulamada creator programina TEK BIR REFERANS YOKTU (grep 0 sonuc), yani
 * bu an tamamen bosa gidiyordu.
 *
 * SKOR ESIGI YOK — ShareResult'tan farki bu. Paylasmak herkese acik bir ovunme,
 * dusuk skorda utandirir; programa davet ise OZEL bir teklif ve dusuk skor
 * burada daha guclu kanca: anlatacak hikayesi zaten o.
 */
export default function CreatorInvite({ type }) {
  const { t } = useLanguage()
  // Marka taramasi degil: bir sirket adi tarayan kisi creator degil.
  if (type !== 'social' && type !== 'person') return null
  return (
    <aside className="creator-invite">
      <Sprout size={17} strokeWidth={1.5} className="creator-invite__icon" aria-hidden="true" />
      <div className="creator-invite__body">
        <p className="creator-invite__title">{t('creator_invite_title')}</p>
        <p className="creator-invite__sub">{t('creator_invite_sub')}</p>
      </div>
      <a
        className="creator-invite__btn"
        href="https://geoni.ai/isbirligi?utm_source=app&utm_medium=result"
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('creator_invite_cta')}
      </a>
    </aside>
  )
}
