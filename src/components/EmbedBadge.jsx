import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { useLanguage } from '../lib/LanguageContext'

/* "Rozeti sitene ekle": kullanici sitesine skor rozeti gomer — ona statu
   gostergesi, bize her gomulumden kalici backlink + marka izi. jobId yoksa
   (ornek/ozel tarama) gorunmez. */
export default function EmbedBadge({ jobId }) {
  const { t } = useLanguage()
  const [copied, setCopied] = useState(false)
  if (!jobId) return null

  const code = `<a href="https://geoni.ai/s/${jobId}" target="_blank" rel="noopener"><img src="https://geoni.ai/badge/${jobId}" alt="AI Visibility Score — geoni.ai" width="232" height="44"></a>`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* pano yok */ }
  }

  return (
    <details className="embed-badge">
      <summary>🏅 {t('badge_title')}</summary>
      <div className="embed-badge__body">
        <p className="embed-badge__hint">{t('badge_hint')}</p>
        <img
          className="embed-badge__preview"
          src={`https://geoni.ai/badge/${jobId}`}
          alt="AI Visibility Score badge"
          width="232"
          height="44"
        />
        <div className="embed-badge__code">
          <code>{code}</code>
          <button type="button" onClick={copy}>
            {copied ? <Check size={13} strokeWidth={2} /> : <Copy size={13} strokeWidth={1.75} />}
            {copied ? t('badge_copied') : t('badge_copy')}
          </button>
        </div>
      </div>
    </details>
  )
}
