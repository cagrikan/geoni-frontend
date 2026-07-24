import { useState, useEffect } from 'react'
import { Share2, Check } from 'lucide-react'
import { useLanguage } from '../lib/LanguageContext'

const API_URL = import.meta.env.VITE_API_URL || 'https://api.geoni.ai'

/* Sonuc paylasimi: viral skor kartina (geoni.ai/s/<id>) link verir.
   Mobil tarayicida yerel paylasim sayfasi (navigator.share), masaustunde
   panoya kopyalama + "Kopyalandi" geri bildirimi. jobId yoksa (ornek rapor,
   ozel tarama) hic gorunmez — /s sayfasi yalnizca kayitli taramalari bilir.

   VIRAL CEKIRDEK: giris yapmis kullanicinin paylasim linki ?ref=<kod> tasir ->
   linkten gelen biri tarama yapinca ikisine de +1 tarama. Kod backend'de lazim
   uretilir (GET /api/me/referral); alinamazsa link ref'siz gider (sorun degil). */
export default function ShareResult({ jobId, text }) {
  const { t } = useLanguage()
  const [copied, setCopied] = useState(false)
  const [refCode, setRefCode] = useState('')

  useEffect(() => {
    if (!jobId) return
    let alive = true
    ;(async () => {
      try {
        const { supabase } = await import('../lib/supabase')
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!token) return
        const res = await fetch(`${API_URL}/api/me/referral`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const j = await res.json()
        if (alive && j?.code) setRefCode(j.code)
      } catch { /* ref yoksa link ref'siz paylasilir */ }
    })()
    return () => { alive = false }
  }, [jobId])

  if (!jobId) return null

  const url = `https://geoni.ai/s/${jobId}${refCode ? `?ref=${refCode}` : ''}`
  const full = `${text}\n${url}`

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
