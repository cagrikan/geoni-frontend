/**
 * Tam rapor kapisi — TEK KAYNAK (ResultsPage + BrandCheckResultsPage ayni kurali kullanir).
 *
 * ESKI KURAL (hatali):
 *   credit_balance > 0 && total_credits_purchased > 0
 * Iki ayri sekilde yanlisti:
 *  1) "SATIN ALDIN MI" diye soruyordu. Hediye/referral/promo tokenla tarama
 *     yaptiran kullanici 10 token ODEDIGI HALDE bulanik rapor goruyordu
 *     (2026-07-25: kurucu hesabi 9935 tokenle yakalandi). Referral odulu tam bir
 *     kisi taramasi kadar (10 token) oldugu icin yeni viral dongunun ILK
 *     adiminda her davetliyi vuracakti: davet -> tarama -> bulanik rapor.
 *  2) credit_balance > 0 sarti, tokeni BITEN musterinin ESKI raporlarini geri
 *     bulanıklastiriyordu — parasini odedigi raporu kaybediyordu.
 *
 * YENI KURAL: "token harcadiysan/aldiysan musterisin". Ucretsiz huni (anonim
 * sosyal tarama, ornek rapor) etkilenmez — onlarda profil ya yok ya da harcama 0.
 */
export function isPaidUser(profile) {
  if (!profile) return false
  if (profile.is_admin) return true
  return (profile.total_credits_spent || 0) > 0 || (profile.total_credits_purchased || 0) > 0
}
