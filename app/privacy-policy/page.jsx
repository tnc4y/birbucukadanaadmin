export const metadata = {
  title: 'Mobil Uygulama Gizlilik Politikasi',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="policy-wrap">
      <article className="card policy-card">
        <h1>Mobil Uygulama Gizlilik Politikasi</h1>
        <p className="muted">Son guncelleme: 18 Mart 2026</p>
        <p>
          Bu gizlilik politikasi 1.5 Adana mobil uygulamasi icin hazirlanmistir. Admin paneli bu
          sayfaya sadece yonlendirme amaciyla baglanti verir.
        </p>

        <h2>1. Toplanan Veriler</h2>
        <p>
          Mobil uygulama genel olarak icerik goruntuleme amaclidir. Uygulama kullanimi sirasinda
          cihaz bilgileri, uygulama surumu ve teknik hata kayitlari Firebase servisleri tarafindan
          otomatik olarak islenebilir.
        </p>

        <h2>2. Verilerin Kullanimi</h2>
        <p>
          Veriler uygulamanin guvenli calismasi, iceriklerin sunulmasi, performansin iyilestirilmesi
          ve teknik sorunlarin tespit edilmesi amaclariyla kullanilir.
        </p>

        <h2>3. Verilerin Saklanmasi</h2>
        <p>
          Veriler Firebase altyapisinda saklanir. Yetkisiz erisimleri engellemek icin Firebase
          guvenlik kurallari uygulanir.
        </p>

        <h2>4. Ucuncu Taraf Hizmetler</h2>
        <p>
          Mobil uygulama Google Firebase (or. Firestore, Analytics, Crashlytics) gibi ucuncu taraf
          hizmetleri kullanabilir. Bu servislerin veri isleme surecleri kendi gizlilik politikalarina
          tabidir.
        </p>

        <h2>5. Iletisim</h2>
        <p>
          Gizlilikle ilgili sorulariniz icin uygulama yoneticisiyle iletisime gecebilirsiniz.
        </p>

        <p className="muted">
          Bu metin bilgilendirme amaclidir. Gerekli durumlarda hukuk danismanligi alinmasi onerilir.
        </p>
      </article>
    </main>
  );
}
