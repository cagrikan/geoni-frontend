import { useState } from 'react'
import { Share2, Check } from 'lucide-react'
import { useLanguage } from '../lib/LanguageContext'

/* Sonuc paylasimi: viral skor kartina (geoni.ai/s/<id>) link verir.
   Mobil tarayicida yerel paylasim sayfasi (navigator.share), masaustunde
   panoya kopyalama + "Kopyalandi" geri bildirimi. jobId yoksa (ornek rapor,
   ozel tarama) hic gorunmez — /s sayfasi yalnizca kayitli taramalari bilir. */
export default function ShareResult({ jobId, text }) {
  const { t } = useLanguage()
  const [copied, setCopied] = useState(false)
  if (!jobId) return null

  const full = `${text}\nhttps://geoni.ai/s/${jobId}`

  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ text: full }) } catch { /* kullanici vazgecti */ }
      return
    }
    try {
      await navigator.clipboard.writeText(full)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* pano erisimi yok */ }
  }

  return (
    <button type="button" className="share-result-btn" onClick={share}>
      {copied ? <Check size={15} strokeWidth={2} /> : <Share2 size={15} strokeWidth={1.75} />}
      {copied ? t('share_copied') : t('share_cta')}
    </button>
  )
}
