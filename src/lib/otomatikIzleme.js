/* Kendiliginden (otomatik) yeniden tarama ACIK MI — arayuz tarafi.
 *
 * KURUCU KARARI (2026-08-08): "artik otomatik tarama istemiyorum".
 * Sunucu tarafinda kapatildi: `geoni-scanner/monitor.py` ->
 * `OTOMATIK_TARAMA_ACIK = os.environ.get("MONITOR_AUTO_SCAN", "0") == "1"`,
 * varsayilan KAPALI.
 *
 * 🪤 BURASI NEDEN VAR: sunucu tarama yapmayi biraktiginda arayuz hala
 * "Duzenli izleme acik (15 gunde bir)" yaziyordu. Bu, kullaniciya YAPMADIGIMIZ
 * bir isi yaptigimizi soylemek olur — sessiz basarisizligin ders kitabi hali:
 * kimse hata gormez, sadece soz tutulmaz. Takip listesi ARTIK "kayitli hedefler
 * + elle Yeniden Tara" listesidir ve metinler bunu soyler.
 *
 * 🔴 GERI ACARKEN IKISI BIRLIKTE DEGISIR: sunucuda MONITOR_AUTO_SCAN=1
 * verilecekse buradaki sabit de true yapilmali. Biri unutulursa arayuz yine
 * yalan soyler (bu sefer ters yonde: is yapiliyor ama gorunmuyor).
 */
/* 2026-08-12 — KURUCU KARARI DEGISTI: izleme geri aciliyor, ama bu sefer
 * UCRETLI. Her otomatik tarama elle taramayla ayni kontoru duser
 * (web/marka 20, sosyal 10); 15 gunde bir; ucretsiz deneme donemi yok;
 * bakiye yetmezse tarama atlanir, hedef listede kalir ve kullaniciya
 * "izleme duraklatildi" bildirimi gider.
 *
 * 2026-08-08'deki kapatma gerekcesi "bedava is, sifir gelir" idi; bedel
 * eklenince o gerekce ortadan kalkti.
 *
 * 🔴 Bu sabit true iken sunucuda MONITOR_AUTO_SCAN=1 OLMAK ZORUNDA.
 * Ikisi ayrisirsa arayuz yine yalan soyler — bu dosya tam da bunun icin var.
 */
export const OTOMATIK_IZLEME_ACIK = true
