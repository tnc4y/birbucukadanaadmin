'use client';

import { useEffect, useState } from 'react';

import { auth } from '@/lib/firebase';
import { getSettings, upsertSettings } from '@/lib/firestore-admin';

export function SettingsEditor() {
  const [form, setForm] = useState({
    appName: '',
    aboutTitle: '',
    aboutContent: '',
    contactEmail: '',
    contactPhone: '',
    contactAddress: '',
    socialLinksText: '',
  });
  const [status, setStatus] = useState('');
  const [originalData, setOriginalData] = useState(null);

  function toText(links) {
    if (!Array.isArray(links) || links.length === 0) return '';
    return links
      .map((item) => `${item.platform ?? ''}|${item.url ?? ''}|${item.visible ?? true}`)
      .join('\n');
  }

  function fromText(text) {
    if (!text.trim()) return [];
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [platform = '', url = '', visible = 'true'] = line.split('|');
        return {
          platform: platform.trim(),
          url: url.trim(),
          visible: visible.trim().toLowerCase() !== 'false',
        };
      });
  }

  async function refresh() {
    const data = await getSettings();
    setOriginalData(data);
    setForm({
      appName: data.appName ?? '',
      aboutTitle: data.aboutTitle ?? '',
      aboutContent: data.aboutContent ?? '',
      contactEmail: data.contactEmail ?? '',
      contactPhone: data.contactPhone ?? '',
      contactAddress: data.contactAddress ?? '',
      socialLinksText: toText(data.socialLinks),
    });
    setStatus('');
  }

  useEffect(() => {
    refresh();
  }, []);

  async function save() {
    await upsertSettings({
      appName: form.appName,
      aboutTitle: form.aboutTitle,
      aboutContent: form.aboutContent,
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone,
      contactAddress: form.contactAddress,
      socialLinks: fromText(form.socialLinksText),
    }, {
      actor: {
        uid: auth.currentUser?.uid ?? '',
        email: auth.currentUser?.email ?? '',
      },
      beforeData: originalData,
    });
    setOriginalData({
      appName: form.appName,
      aboutTitle: form.aboutTitle,
      aboutContent: form.aboutContent,
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone,
      contactAddress: form.contactAddress,
      socialLinks: fromText(form.socialLinksText),
    });
    setStatus('Ayarlar kaydedildi.');
  }

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <section className="panel">
      <h2>Genel Ayarlar</h2>
      <div className="card">
        <p className="muted">Bu alanlar mobil uygulamanin hakkimizda, iletisim ve drawer bolumlerini besler.</p>
        <div className="form-grid">
          <label>
            Uygulama Adi
            <input
              value={form.appName}
              onChange={(e) => updateField('appName', e.target.value)}
              placeholder="1.5 Adana Teknoloji Takimlari"
            />
          </label>
          <label>
            Hakkimizda Basligi
            <input
              value={form.aboutTitle}
              onChange={(e) => updateField('aboutTitle', e.target.value)}
              placeholder="Hakkimizda"
            />
          </label>
          <label className="span-2">
            Hakkimizda Metni
            <textarea
              value={form.aboutContent}
              onChange={(e) => updateField('aboutContent', e.target.value)}
              rows={5}
            />
          </label>
          <label>
            Iletisim E-posta
            <input
              value={form.contactEmail}
              onChange={(e) => updateField('contactEmail', e.target.value)}
              placeholder="info@..."
            />
          </label>
          <label>
            Iletisim Telefon
            <input
              value={form.contactPhone}
              onChange={(e) => updateField('contactPhone', e.target.value)}
              placeholder="+90 ..."
            />
          </label>
          <label className="span-2">
            Iletisim Adres
            <input
              value={form.contactAddress}
              onChange={(e) => updateField('contactAddress', e.target.value)}
              placeholder="Adana"
            />
          </label>
          <label className="span-2">
            Sosyal Linkler (Her satir: Platform|URL|true/false)
            <textarea
              value={form.socialLinksText}
              onChange={(e) => updateField('socialLinksText', e.target.value)}
              rows={4}
              placeholder={'Instagram|https://instagram.com/15adana|true'}
            />
          </label>
        </div>
        <div className="actions">
          <button onClick={save}>Kaydet</button>
          <button onClick={refresh}>Yenile</button>
        </div>
        {status ? <p className="ok">{status}</p> : null}
      </div>
    </section>
  );
}
