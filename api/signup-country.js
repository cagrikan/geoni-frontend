// Kaydın kaynağını SUNUCU tarafında damgalar: ülke + saat dilimi + dil.
//
// Neden istemci değil: profiles RLS'i "kullanıcı kendi profilini günceller" diyor.
// Ülkeyi tarayıcıdan yazsaydık bot signup_country='TR' gönderip kuralı atlardı.
// Ülke, Vercel'in eklediği x-vercel-ip-country başlığından okunur — istemci bunu
// değiştiremez.
//
// VPN notu: VPN IP ülkesini gizler ama tarayıcının saat dilimini/dilini genelde
// gizlemez. Bu ikisi istemciden gelir (yani teoride sahtelenebilir), ama gerçek
// botlar varsayılan ayarlarla gelir ve tam da burada yakalanır. Üç sinyalden
// herhangi biri kurala takılırsa hesap askıya alınır.
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' })

  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  if (!url || !serviceKey) return res.status(200).json({ ok: false, reason: 'env_missing' })

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ error: 'no_token' })

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

  // Kimlik istemciden DEĞİL, jetondan
  const { data: userData, error: userErr } = await admin.auth.getUser(token)
  if (userErr || !userData?.user) return res.status(401).json({ error: 'invalid_token' })
  const userId = userData.user.id
  const email = userData.user.email || ''

  const ham = String(req.headers['x-vercel-ip-country'] || '').toUpperCase().slice(0, 2)
  const country = /^[A-Z]{2}$/.test(ham) ? ham : null

  let body = {}
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}) } catch {}
  const timezone = typeof body.tz === 'string' ? body.tz.slice(0, 64) : null
  const lang     = typeof body.lang === 'string' ? body.lang.slice(0, 16) : null

  // Kural kontrolü — üç sinyal birden
  const { data: kural } = await admin
    .rpc('is_signup_blocked', {
      p_email: email, p_country: country, p_timezone: timezone, p_lang: lang
    })
    .maybeSingle()

  if (kural?.blocked) {
    // Silmiyoruz, askıya alıyoruz: geri alınabilir ve iz kalır.
    await admin.from('profiles').update({
      is_suspended: true,
      signup_country: country, signup_timezone: timezone, signup_lang: lang,
      admin_notes: `Otomatik askı ${new Date().toISOString().slice(0,16)} — ${kural.kind}=${kural.value}`
    }).eq('id', userId)
    return res.status(403).json({ ok: false, blocked: true, kind: kural.kind })
  }

  // Yalnız boşsa yaz — kayıt anındaki damga sonradan değişmesin
  const { data: mevcut } = await admin
    .from('profiles').select('signup_country').eq('id', userId).single()
  if (mevcut?.signup_country) return res.status(200).json({ ok: true, already: mevcut.signup_country })

  await admin.from('profiles')
    .update({ signup_country: country, signup_timezone: timezone, signup_lang: lang })
    .eq('id', userId)
  return res.status(200).json({ ok: true, country })
}
