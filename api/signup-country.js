// Kaydın ülkesini SUNUCU tarafında yazar.
// Neden istemci değil: profiles RLS'i "kullanıcı kendi profilini günceller" diyor;
// ülkeyi tarayıcıdan yazsaydık bir bot signup_country='TR' gönderip ülke kuralını atlardı.
// x-vercel-ip-country başlığını Vercel ekler, istemci değiştiremez.
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' })

  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  if (!url || !serviceKey) return res.status(200).json({ ok: false, reason: 'env_missing' })

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ error: 'no_token' })

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

  // Jetonu doğrula — kullanıcı kimliği istemciden DEĞİL, jetondan gelir
  const { data: userData, error: userErr } = await admin.auth.getUser(token)
  if (userErr || !userData?.user) return res.status(401).json({ error: 'invalid_token' })
  const userId = userData.user.id

  const country = String(req.headers['x-vercel-ip-country'] || '').toUpperCase().slice(0, 2)
  if (!/^[A-Z]{2}$/.test(country)) return res.status(200).json({ ok: false, reason: 'no_country_header' })

  // Yalnız BOŞSA yaz — kayıt anındaki ülke sonradan değiştirilemesin
  const { data: mevcut } = await admin
    .from('profiles').select('signup_country').eq('id', userId).single()
  if (mevcut?.signup_country) return res.status(200).json({ ok: true, already: mevcut.signup_country })

  await admin.from('profiles').update({ signup_country: country }).eq('id', userId)
  return res.status(200).json({ ok: true, country })
}
