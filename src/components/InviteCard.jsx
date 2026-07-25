import { useState, useEffect } from 'react'
import { Gift, Copy, Check, Share2 } from 'lucide-react'
import { useLanguage } from '../lib/LanguageContext'

const API_URL = import.meta.env.VITE_API_URL || 'https://api.geoni.ai'

/* VIRAL DONGU — GORUNUR YUZ.
   Referral cekirdegi 24 Temmuz'da kablolandi ama hicbir yerde kullaniciya
   ANLATILMIYORDU: kod yalnizca paylasim linkine sessizce gomuluyordu, odul
   geldiginde kimse gormuyordu. Sonuc: 12 profilin 0'inda kod uretilmis, dongu
   canlida hic donmemis. Bu kart eksik halka — davet linkini, kac kisi getirdigini
   ve ne kazandigini gosterir.
   Odul KAYITTA degil davetlinin ILK TARAMASINDA odenir (backend
   grant_referral_reward); sahte hesap acmak tek basina para kazandirmaz. */
export default function InviteCard() {
  const { t } = useLanguage()
  const [data, setData] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
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
        if (alive && j?.code) setData(j)
      } catch { /* kod alinamazsa kart hic gorunmez - deneyim bozulmaz */ }
    })()
    return () => { alive = false }
  }, [])

  if (!data) return null

  const url = data.share_url || `https://app.geoni.ai?ref=${data.code}`
  const n = data.reward_credits ?? 10
  const text = t('invite_desc').replace('{n}', n)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* pano erisimi yok */ }
  }

  const share = async () => {
    if (!navigator.share) return copy()
    try { await navigator.share({ text: `${text}\n${url}` }) } catch { /* vazgecti */ }
  }

  return (
    <div className="invite-card">
      <div className="invite-card__head">
        <Gift size={18} strokeWidth={1.75} />
        <h3 className="invite-card__title">{t('invite_title')}</h3>
      </div>
      <p className="invite-card__desc">{text}</p>

      <div className="invite-card__link">
        <span className="invite-card__url">{url}</span>
        <button type="button" className="invite-card__btn" onClick={copy}>
          {copied ? <Check size={14} strokeWidth={2} /> : <Copy size={14} strokeWidth={1.75} />}
          {copied ? t('invite_copied') : t('invite_copy')}
        </button>
        {typeof navigator !== 'undefined' && navigator.share && (
          <button type="button" className="invite-card__btn" onClick={share}>
            <Share2 size={14} strokeWidth={1.75} />{t('invite_share')}
          </button>
        )}
      </div>

      <div className="invite-card__stats">
        <div><b>{data.referred_count ?? 0}</b> {t('invite_stat_people')}</div>
        <div><b>{data.earned_credits ?? 0}</b> {t('invite_stat_earned')}</div>
      </div>
    </div>
  )
}
