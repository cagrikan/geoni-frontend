import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { useLanguage } from '../lib/LanguageContext'

/* Cift yonlu bilet puanlama kutusu. Rol backend'de biletten cikarilir
   (sahip -> uzmani, atanan uzman -> musteriyi puanlar). Musteri karsi
   tarafin kimligini HIC gormez; yalnizca "teslimati" puanlar. Is bittiginde
   (submitted/verified/disputed) gorunur; bir kez verilince ozet gosterir. */
export default function RateTicket({ ticketId, authedFetch, promptKey }) {
  const { t } = useLanguage()
  const [state, setState] = useState(null)   // { role, can_rate, my_rating }
  const [stars, setStars] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    let alive = true
    authedFetch(`/api/tickets/${ticketId}/rating`)
      .then((r) => { if (alive) setState(r || {}) })
      .catch(() => { if (alive) setState({}) })
    return () => { alive = false }
  }, [ticketId, authedFetch])

  if (!state || !state.can_rate) return null
  const existing = state.my_rating

  if (existing || done) {
    const shown = existing ? existing.stars : stars
    return (
      <div className="rate-box rate-box--done">
        <span className="rate-box__label">{t('rate_thanks') || 'Puanınız kaydedildi'}</span>
        <span className="rate-box__stars">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} size={16} strokeWidth={1.5}
              fill={n <= shown ? '#F5A623' : 'none'} color={n <= shown ? '#F5A623' : 'var(--text-muted)'} />
          ))}
        </span>
      </div>
    )
  }

  const submit = async () => {
    if (!stars) return
    setBusy(true)
    setErr('')
    try {
      await authedFetch(`/api/tickets/${ticketId}/rate`, {
        method: 'POST', body: JSON.stringify({ stars, comment: comment.trim() }),
      })
      setDone(true)
    } catch {
      // Sessizce yutma: kullanici puaninin gitmedigini bilmeli, tekrar deneyebilsin.
      setErr(t('rate_error') || 'Puan gönderilemedi, lütfen tekrar deneyin.')
    }
    setBusy(false)
  }

  const prompt = promptKey || (state.role === 'expert' ? 'rate_prompt_customer' : 'rate_prompt_expert')
  return (
    <div className="rate-box">
      <p className="rate-box__prompt">{t(prompt) || 'Bu teslimatı puanla'}</p>
      <div className="rate-box__stars rate-box__stars--input" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" className="rate-box__star-btn"
            onMouseEnter={() => setHover(n)} onClick={() => setStars(n)}
            aria-label={`${n} / 5`} aria-pressed={n <= stars}>
            <Star size={22} strokeWidth={1.5}
              fill={n <= (hover || stars) ? '#F5A623' : 'none'}
              color={n <= (hover || stars) ? '#F5A623' : 'var(--text-muted)'} />
          </button>
        ))}
      </div>
      <textarea className="rate-box__comment" rows={2} value={comment}
        placeholder={t('rate_comment_ph') || 'Yorum (opsiyonel)'}
        onChange={(e) => setComment(e.target.value)} />
      <button type="button" className="rate-box__submit" disabled={busy || !stars} onClick={submit}>
        {t('rate_submit') || 'Puanı gönder'}
      </button>
      {err && <p className="rate-box__error" role="alert">{err}</p>}
    </div>
  )
}
