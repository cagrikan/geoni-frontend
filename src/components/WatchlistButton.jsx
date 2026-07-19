import { useState, useEffect } from 'react'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { useLanguage } from '../lib/LanguageContext'

// Supabase'i static import etmek, bu buton ResultsPage (eager) icinden
// geldigi icin ~52KB gz supabase'i anonim ziyaretcinin ilk bundle'ina
// tasiyordu. Buton zaten yalnizca oturum acmis kullaniciya render oluyor;
// supabase'i tembel yukle, anonim landing'e hic inmesin.
let _sbPromise = null
const getSupabase = () => (_sbPromise ||= import('../lib/supabase').then((m) => m.supabase))

export default function WatchlistButton({ user, type, label, target }) {
  const { t } = useLanguage()
  const [added, setAdded] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!user || !label) { setChecking(false); return }
    let cancelled = false
    getSupabase().then((supabase) => supabase
      .from('watchlist')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', type)
      .eq('label', label)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error('Watchlist check failed:', error)
        if (!cancelled) { setAdded(!!data); setChecking(false) }
      }))
    return () => { cancelled = true }
  }, [user, type, label])

  if (!user || !label) return null

  const handleClick = async () => {
    if (added || checking) return
    setAdded(true)
    const supabase = await getSupabase()
    const { error } = await supabase.from('watchlist').insert({ user_id: user.id, type, label, target })
    if (error) {
      if (error.code !== '23505') { setAdded(false); console.error('Watchlist insert failed:', error) }
    }
  }

  return (
    <button type="button" className={`watchlist-btn ${added ? 'watchlist-btn--added' : ''}`} onClick={handleClick} disabled={checking || added}>
      {added ? <BookmarkCheck size={15} strokeWidth={1.5} /> : <Bookmark size={15} strokeWidth={1.5} />}
      {added ? t('watchlist_added') : t('watchlist_add')}
    </button>
  )
}
