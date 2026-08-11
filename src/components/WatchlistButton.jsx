import { useState, useEffect } from 'react'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { useLanguage } from '../lib/LanguageContext'
import { OTOMATIK_IZLEME_ACIK } from '../lib/otomatikIzleme'

// Supabase'i static import etmek, bu buton ResultsPage (eager) icinden
// geldigi icin ~52KB gz supabase'i anonim ziyaretcinin ilk bundle'ina
// tasiyordu. Buton zaten yalnizca oturum acmis kullaniciya render oluyor;
// supabase'i tembel yukle, anonim landing'e hic inmesin.
let _sbPromise = null
const getSupabase = () => (_sbPromise ||= import('../lib/supabase').then((m) => m.supabase))

const API_URL = import.meta.env.VITE_API_URL || 'https://api.geoni.ai'

// Izleme bedeli SUNUCUDAN gelir (/api/scan-costs) — metne gomulu sayi hem
// surukleniyor hem yanlislaniyordu (bkz. DashboardPage'deki ayni ders).
// Modul seviyesinde tek istek: buton birden cok sayfada render olabilir.
let _costsPromise = null
const getScanCosts = () =>
  (_costsPromise ||= fetch(`${API_URL}/api/scan-costs`)
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null))

export default function WatchlistButton({ user, type, label, target }) {
  const { t } = useLanguage()
  const [added, setAdded] = useState(false)
  const [checking, setChecking] = useState(true)
  const [costs, setCosts] = useState(null)

  // Izleme UCRETLI (2026-08-12): kullanici "Izlemeye Al"a basmadan once
  // bedeli, sikligi ve bakiye bitince ne olacagini gormeli — sonradan
  // ogrenilen kesinti tutulmamis soz sayilir.
  useEffect(() => {
    if (!OTOMATIK_IZLEME_ACIK || !user) return
    let cancelled = false
    getScanCosts().then((c) => { if (!cancelled) setCosts(c) })
    return () => { cancelled = true }
  }, [user])

  // Varlik kontrolu HARF DUYARSIZ + bosluk kirpilmis olmali. Eskiden `.eq('label')`
  // birebir esliyordu: kullanici ayni hedefi bir kez "cagricakir.com.tr", bir kez
  // "Cagricakir.com.tr" yazinca kontrol iskaliyor ve AYNI SITE ikinci kez izleme
  // listesine giriyordu. Sonuc: iki ayri otomatik tarama ve kullaniciya celiskili
  // iki skor (olculdu 2026-08-06: 74 ve 70).
  const temizLabel = (label ?? '').trim()

  useEffect(() => {
    if (!user || !temizLabel) { setChecking(false); return }
    let cancelled = false
    getSupabase().then((supabase) => supabase
      .from('watchlist')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', type)
      .ilike('label', temizLabel)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error('Watchlist check failed:', error)
        if (!cancelled) { setAdded(!!data); setChecking(false) }
      }))
    return () => { cancelled = true }
  }, [user, type, temizLabel])

  if (!user || !label) return null

  const handleClick = async () => {
    if (added || checking) return
    setAdded(true)
    const supabase = await getSupabase()
    const { error } = await supabase.from('watchlist').insert({ user_id: user.id, type, label: temizLabel, target })
    if (error) {
      if (error.code !== '23505') { setAdded(false); console.error('Watchlist insert failed:', error) }
    }
  }

  // Bedel tarama tipine gore: web 20 · kisi/marka 20 · sosyal 10 (sunucudan).
  const bedel = costs
    ? (type === 'social' ? costs.social : type === 'web' ? costs.web : costs.brand)
    : null

  return (
    <div className="watchlist-btn-wrap">
      <button type="button" className={`watchlist-btn ${added ? 'watchlist-btn--added' : ''}`} onClick={handleClick} disabled={checking || added}>
        {added ? <BookmarkCheck size={15} strokeWidth={1.5} /> : <Bookmark size={15} strokeWidth={1.5} />}
        {added ? t('watchlist_added') : t('watchlist_add')}
      </button>
      {OTOMATIK_IZLEME_ACIK && (
        <p className="watchlist-hint">
          {bedel != null ? t('watchlist_add_hint', { n: bedel }) : t('watchlist_add_hint_nocost')}
        </p>
      )}
    </div>
  )
}
