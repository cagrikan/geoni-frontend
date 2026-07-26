import { AlertTriangle } from 'lucide-react'
import { useLanguage } from '../lib/LanguageContext'

/**
 * Bir AI motoru olculemediginde raporun basinda cikan uyari.
 *
 * NEDEN VAR: 2026-07-24'te bir saglayicinin kotasi doldu; en agirlikli motor
 * (ChatGPT, .28) iki gun boyunca sessizce olcumden dustu. Skor yine uretildi,
 * musteri onu TAM bir olcum sanarak gordu — aslinda dort motorun ucuyle
 * hesaplanmisti. Skorun kendisi dogru kaliyor (dusan motorun payi olculenler
 * arasinda yeniden dagitiliyor, sebepsiz duşmuyor), ama musteri EKSIK
 * olculdugunu BILMELI.
 *
 * ⚠️ SEBEP YAZILMAZ. Kredi/kota/fatura ic bilgidir; musteriye "erisim sorunu"
 * denir. Gercek sebep yalnizca admin mailine ve loga gider
 * (brand_recall._provider_health_alert).
 */
export default function EngineNotice({ engines = [] }) {
  const { t } = useLanguage()
  if (!engines || engines.length === 0) return null
  return (
    <div className="engine-notice" role="status">
      <AlertTriangle size={15} strokeWidth={1.5} className="engine-notice__icon" aria-hidden="true" />
      <span className="engine-notice__text">
        {t('engine_notice', { engines: engines.join(', ') })}
      </span>
    </div>
  )
}
