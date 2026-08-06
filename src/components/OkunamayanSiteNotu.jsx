import { notTuru } from '../lib/okunamayanSite'

/* Sitesi taranamayan kullaniciya DURUSTCE soyler.

   Karar `lib/okunamayanSite.js`te (saf, test edilebilir); burada yalniz cizim.

   NEDEN VAR (2026-08-06'da canli veriyle olculdu): son 30 gunde tamamlanan
   105 web taramasinin 42'si SIFIR sayfa cekebilmis; bu taramalar yine de puan
   uretiyor (ortalama 43,9; en yuksek 82). Backend bunu zaten durustce
   kaydediyordu — `diagnostics.bot_protection_suspected`, `low_confidence`,
   `unmeasured_dimensions` — ama ISTEMCILERIN HICBIRI `diagnostics` alanini
   okumuyordu. Kullanici eksik olcume dayanan bir puani cekincesiz goruyordu.

   Bu not kotu haber degil: kullanicinin SITESI botlari engelliyor, ayni duvara
   AI tarayicilari da carpiyor — yani duzeltilebilir bir gorunurluk bulgusu. */
export default function OkunamayanSiteNotu({ diagnostics, totalPages, t }) {
  const not = notTuru(diagnostics, totalPages)
  if (!not) return null

  return (
    <div className="okunamayan" role="note">
      <p className="okunamayan__baslik">{t(not.baslik)}</p>
      <p className="okunamayan__metin">{t(not.govde)}</p>
      {not.olculemeyen.length > 0 && (
        <p className="okunamayan__eksik">
          {t('unread_unmeasured')}: <b>{not.olculemeyen.join(', ')}</b>
        </p>
      )}
    </div>
  )
}
