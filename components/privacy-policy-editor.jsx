'use client';

import { useEffect, useState } from 'react';

import { auth } from '@/lib/firebase';
import { getSettings, upsertSettings } from '@/lib/firestore-admin';

const DEFAULT_POLICY_BODY = `1. Toplanan Veriler\nMobil uygulama genel olarak içerik görüntüleme amaçlıdır. Uygulama kullanımı sırasında cihaz bilgileri, uygulama sürümü ve teknik hata kayıtları Firebase servisleri tarafından otomatik olarak işlenebilir.\n\n2. Verilerin Kullanımı\nVeriler uygulamanın güvenli çalışması, içeriklerin sunulması, performansın iyileştirilmesi ve teknik sorunların tespit edilmesi amaçlarıyla kullanılır.\n\n3. Verilerin Saklanması\nVeriler Firebase altyapısında saklanır. Yetkisiz erişimleri engellemek için Firebase güvenlik kuralları uygulanır.\n\n4. Üçüncü Taraf Hizmetler\nMobil uygulama Google Firebase (ör. Firestore, Analytics, Crashlytics) gibi üçüncü taraf hizmetleri kullanabilir. Bu servislerin veri işleme süreçleri kendi gizlilik politikalarına tabidir.\n\n5. İletişim\nGizlilikle ilgili sorularınız için uygulama yöneticisiyle iletişime geçebilirsiniz.`;

export function PrivacyPolicyEditor() {
  const [form, setForm] = useState({
    privacyPolicyTitle: '',
    privacyPolicyUpdatedAt: '',
    privacyPolicyIntro: '',
    privacyPolicyBody: '',
    privacyPolicyFootnote: '',
  });
  const [originalData, setOriginalData] = useState(null);
  const [status, setStatus] = useState('');

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function refresh() {
    const settings = await getSettings();
    setOriginalData(settings);
    setForm({
      privacyPolicyTitle: settings?.privacyPolicyTitle || 'Mobil Uygulama Gizlilik Politikası',
      privacyPolicyUpdatedAt: settings?.privacyPolicyUpdatedAt || '24 Mart 2026',
      privacyPolicyIntro:
        settings?.privacyPolicyIntro ||
        'Bu gizlilik politikası 1.5 Adana mobil uygulaması için hazırlanmıştır.',
      privacyPolicyBody: settings?.privacyPolicyBody || DEFAULT_POLICY_BODY,
      privacyPolicyFootnote:
        settings?.privacyPolicyFootnote ||
        'Bu metin bilgilendirme amaçlıdır. Gerekli durumlarda hukuk danışmanlığı alınması önerilir.',
    });
    setStatus('');
  }

  useEffect(() => {
    refresh();
  }, []);

  async function save() {
    const payload = {
      ...originalData,
      privacyPolicyTitle: form.privacyPolicyTitle,
      privacyPolicyUpdatedAt: form.privacyPolicyUpdatedAt,
      privacyPolicyIntro: form.privacyPolicyIntro,
      privacyPolicyBody: form.privacyPolicyBody,
      privacyPolicyFootnote: form.privacyPolicyFootnote,
    };

    await upsertSettings(payload, {
      actor: {
        uid: auth.currentUser?.uid ?? '',
        email: auth.currentUser?.email ?? '',
      },
      beforeData: originalData,
    });

    setOriginalData(payload);
    setStatus('Gizlilik politikası kaydedildi.');
  }

  return (
    <section className="panel">
      <h2>Gizlilik Politikası</h2>
      <div className="card">
        <div className="form-grid">
          <label className="span-2">
            Başlık
            <input
              value={form.privacyPolicyTitle}
              onChange={(e) => updateField('privacyPolicyTitle', e.target.value)}
              placeholder="Mobil Uygulama Gizlilik Politikası"
            />
          </label>

          <label>
            Son Güncelleme Tarihi
            <input
              value={form.privacyPolicyUpdatedAt}
              onChange={(e) => updateField('privacyPolicyUpdatedAt', e.target.value)}
              placeholder="24 Mart 2026"
            />
          </label>

          <label className="span-2">
            Giriş Metni
            <textarea
              rows={3}
              value={form.privacyPolicyIntro}
              onChange={(e) => updateField('privacyPolicyIntro', e.target.value)}
            />
          </label>

          <label className="span-2">
            Politika İçeriği
            <textarea
              rows={14}
              value={form.privacyPolicyBody}
              onChange={(e) => updateField('privacyPolicyBody', e.target.value)}
            />
          </label>

          <label className="span-2">
            Alt Not
            <textarea
              rows={3}
              value={form.privacyPolicyFootnote}
              onChange={(e) => updateField('privacyPolicyFootnote', e.target.value)}
            />
          </label>
        </div>

        <div className="actions">
          <button onClick={save}>Kaydet</button>
          <button onClick={refresh}>Yenile</button>
          <a className="text-link" href="/privacy-policy" target="_blank" rel="noreferrer">
            Önizlemeyi Aç
          </a>
        </div>

        {status ? <p className="ok">{status}</p> : null}
      </div>
    </section>
  );
}
