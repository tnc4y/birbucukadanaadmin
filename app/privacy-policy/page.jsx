'use client';

import { useEffect, useState } from 'react';

import { getSettings } from '@/lib/firestore-admin';

const DEFAULT_CONTENT = {
  title: 'Mobil Uygulama Gizlilik Politikası',
  updatedAt: '24 Mart 2026',
  intro: 'Bu gizlilik politikası 1.5 Adana mobil uygulaması için hazırlanmıştır.',
  body: `1. Toplanan Veriler\nMobil uygulama genel olarak içerik görüntüleme amaçlıdır. Uygulama kullanımı sırasında cihaz bilgileri, uygulama sürümü ve teknik hata kayıtları Firebase servisleri tarafından otomatik olarak işlenebilir.\n\n2. Verilerin Kullanımı\nVeriler uygulamanın güvenli çalışması, içeriklerin sunulması, performansın iyileştirilmesi ve teknik sorunların tespit edilmesi amaçlarıyla kullanılır.\n\n3. Verilerin Saklanması\nVeriler Firebase altyapısında saklanır. Yetkisiz erişimleri engellemek için Firebase güvenlik kuralları uygulanır.\n\n4. Üçüncü Taraf Hizmetler\nMobil uygulama Google Firebase (ör. Firestore, Analytics, Crashlytics) gibi üçüncü taraf hizmetleri kullanabilir. Bu servislerin veri işleme süreçleri kendi gizlilik politikalarına tabidir.\n\n5. İletişim\nGizlilikle ilgili sorularınız için uygulama yöneticisiyle iletişime geçebilirsiniz.`,
  footnote:
    'Bu metin bilgilendirme amaçlıdır. Gerekli durumlarda hukuk danışmanlığı alınması önerilir.',
};

function splitParagraphs(text) {
  return text
    .split('\n\n')
    .map((part) => part.trim())
    .filter(Boolean);
}

export default function PrivacyPolicyPage() {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState(DEFAULT_CONTENT);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const settings = await getSettings();
        if (!mounted) return;

        setContent({
          title: settings?.privacyPolicyTitle || DEFAULT_CONTENT.title,
          updatedAt: settings?.privacyPolicyUpdatedAt || DEFAULT_CONTENT.updatedAt,
          intro: settings?.privacyPolicyIntro || DEFAULT_CONTENT.intro,
          body: settings?.privacyPolicyBody || DEFAULT_CONTENT.body,
          footnote: settings?.privacyPolicyFootnote || DEFAULT_CONTENT.footnote,
        });
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const paragraphs = splitParagraphs(content.body);

  return (
    <main className="policy-wrap">
      <article className="card policy-card">
        <h1>{content.title}</h1>
        <p className="muted">Son güncelleme: {content.updatedAt}</p>

        {loading ? <p className="muted">Yükleniyor...</p> : null}

        <p>{content.intro}</p>

        {paragraphs.map((paragraph) => {
          const [firstLine, ...rest] = paragraph.split('\n');
          const isHeadingLine = /^\d+\./.test(firstLine.trim());

          if (!isHeadingLine) {
            return <p key={paragraph}>{paragraph}</p>;
          }

          return (
            <section key={paragraph}>
              <h2>{firstLine}</h2>
              {rest.length > 0 ? <p>{rest.join(' ')}</p> : null}
            </section>
          );
        })}

        <p className="muted">{content.footnote}</p>
      </article>
    </main>
  );
}
