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
export const OTOMATIK_IZLEME_ACIK = false
