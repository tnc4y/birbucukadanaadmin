export const metadata = {
  title: 'Mobil Uygulama Gizlilik Politikası',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="policy-wrap">
      <article className="card policy-card">
        <h1>Mobil Uygulama Gizlilik Politikası</h1>
        <p className="muted">Son güncelleme: 18 Mart 2026</p>
        <p>
          Bu gizlilik politikası 1.5 Adana mobil uygulaması için hazırlanmıştır. Admin paneli bu
          sayfaya sadece yönlendirme amacıyla bağlantı verir.
        </p>

        <h2>1. Toplanan Veriler</h2>
        <p>
          Mobil uygulama genel olarak içerik görüntüleme amaçlıdır. Uygulama kullanımı sırasında
          cihaz bilgileri, uygulama sürümü ve teknik hata kayıtları Firebase servisleri tarafından
          otomatik olarak işlenebilir.
        </p>

        <h2>2. Verilerin Kullanımı</h2>
        <p>
          Veriler uygulamanın güvenli çalışması, içeriklerin sunulması, performansın iyileştirilmesi
          ve teknik sorunların tespit edilmesi amaçlarıyla kullanılır.
        </p>

        <h2>3. Verilerin Saklanması</h2>
        <p>
          Veriler Firebase altyapısında saklanır. Yetkisiz erişimleri engellemek için Firebase
          güvenlik kuralları uygulanır.
        </p>

        <h2>4. Üçüncü Taraf Hizmetler</h2>
        <p>
          Mobil uygulama Google Firebase (ör. Firestore, Analytics, Crashlytics) gibi üçüncü taraf
          hizmetleri kullanabilir. Bu servislerin veri işleme süreçleri kendi gizlilik politikalarına
          tabidir.
        </p>

        <h2>5. İletişim</h2>
        <p>
          Gizlilikle ilgili sorularınız için uygulama yöneticisiyle iletişime geçebilirsiniz.
        </p>

        <p className="muted">
          Bu metin bilgilendirme amaçlıdır. Gerekli durumlarda hukuk danışmanlığı alınması önerilir.
        </p>
      </article>
    </main>
  );
}
