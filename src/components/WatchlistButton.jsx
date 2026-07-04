import { useState, useEffect } from 'react'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../lib/LanguageContext'

export default function WatchlistButton({ user, type, label, target }) {
  const { t } = useLanguage()
  const [added, setAdded] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!user || !label) { setChecking(false); return }
    let cancelled = false
    supabase
      .from('watchlist')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', type)
      .eq('label', label)
      .maybeSingle()
      .then(({ data }) => { if (!cancelled) { setAdded(!!data); setChecking(false) } })
    return () => { cancelled = true }
  }, [user, type, label])

  if (!user || !label) return null

  const handleClick = async () => {
    if (added || checking) return
    setAdded(true)
    const { error } = await supabase.from('watchlist').insert({ user_id: user.id, type, label, target })
    if (error && error.code !== '23505') setAdded(false)
  }

  return (
    <button type="button" className={`watchlist-btn ${added ? 'watchlist-btn--added' : ''}`} onClick={handleClick} disabled={checking || added}>
      {added ? <BookmarkCheck size={15} strokeWidth={1.5} /> : <Bookmark size={15} strokeWidth={1.5} />}
      {added ? t('watchlist_added') : t('watchlist_add')}
    </button>
  )
}
