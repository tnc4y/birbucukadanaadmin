'use client';

import { useEffect, useState } from 'react';

import { COLLECTION_LABELS } from '@/lib/collections';
import { auth } from '@/lib/firebase';
import {
  listCollection,
  removeCollectionDoc,
  upsertCollectionDoc,
} from '@/lib/firestore-admin';

const SCHEMA = {
  announcements: [
    { key: 'title', label: 'Başlık' },
    { key: 'summary', label: 'Kısa Açıklama' },
    { key: 'content', label: 'Detay Metni', type: 'textarea' },
    { key: 'imageUrl', label: 'Görsel URL' },
    { key: 'order', label: 'Sıralama', type: 'number' },
    { key: 'buttonText', label: 'Buton Yazısı' },
    { key: 'buttonUrl', label: 'Buton Linki' },
    { key: 'popupDismissKey', label: 'Popup Anahtarı' },
    { key: 'visible', label: 'Aktif', type: 'boolean' },
    { key: 'isImportant', label: 'Önemli Duyuru', type: 'boolean' },
    { key: 'showAsPopup', label: 'Açılışta Popup Göster', type: 'boolean' },
  ],
  teams: [
    { key: 'name', label: 'Takım Adı' },
    { key: 'logoUrl', label: 'Logo URL' },
    { key: 'shortDescription', label: 'Kısa Açıklama' },
    { key: 'description', label: 'Detay Açıklama', type: 'textarea' },
    { key: 'bannerUrl', label: 'Banner URL' },
    { key: 'homeOrder', label: 'Anasayfa Sırası', type: 'number' },
    { key: 'socialLinksText', label: 'Sosyal Linkler', type: 'socialLinks' },
    { key: 'visible', label: 'Aktif', type: 'boolean' },
  ],
  events: [
    { key: 'title', label: 'Etkinlik Başlığı' },
    { key: 'description', label: 'Açıklama', type: 'textarea' },
    { key: 'tag', label: 'Etiket (Genel / Takım)' },
    { key: 'date', label: 'Tarih (YYYY-MM-DD)', type: 'date' },
    { key: 'imageUrl', label: 'Görsel URL' },
    { key: 'teamId', label: 'Takım ID (opsiyonel)' },
    { key: 'visible', label: 'Aktif', type: 'boolean' },
  ],
  sponsors: [
    { key: 'name', label: 'Sponsor Adı' },
    { key: 'logoUrl', label: 'Logo URL' },
    { key: 'website', label: 'Website' },
    { key: 'description', label: 'Açıklama' },
    { key: 'teamId', label: 'Takım ID (boş ise genel sponsor)' },
    { key: 'visible', label: 'Aktif', type: 'boolean' },
  ],
  competitions: [
    { key: 'title', label: 'Yarışma Adı' },
    { key: 'performance', label: 'Performans' },
    { key: 'year', label: 'Yıl' },
    { key: 'teamId', label: 'Takım ID (opsiyonel)' },
    { key: 'imageUrl', label: 'Görsel URL' },
    { key: 'visible', label: 'Aktif', type: 'boolean' },
  ],
  awards: [
    { key: 'title', label: 'Ödül Adı' },
    { key: 'description', label: 'Açıklama', type: 'textarea' },
    { key: 'projectName', label: 'Hangi Projeden Alındı' },
    { key: 'teamId', label: 'Takım ID (opsiyonel)' },
    { key: 'mediaUrl', label: 'Görsel/Medya URL' },
    { key: 'year', label: 'Yıl' },
    { key: 'visible', label: 'Aktif', type: 'boolean' },
  ],
  projects: [
    { key: 'title', label: 'Proje Adı' },
    { key: 'description', label: 'Açıklama', type: 'textarea' },
    { key: 'teamId', label: 'Takım ID' },
    { key: 'mediaUrl', label: 'Görsel URL' },
    { key: 'repoUrl', label: 'Repo/Website Linki' },
    { key: 'visible', label: 'Aktif', type: 'boolean' },
  ],
};

function socialLinksToText(links) {
  if (!Array.isArray(links) || links.length === 0) return '';
  return links
    .map((item) => `${item.platform ?? ''}|${item.url ?? ''}|${item.visible ?? true}`)
    .join('\n');
}

function textToSocialLinks(text) {
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

function toForm(collection, data = {}) {
  const form = { ...data };
  if (collection === 'teams') {
    form.socialLinksText = socialLinksToText(data.socialLinks);
  }
  return form;
}

function fromForm(collection, form) {
  const out = { ...form };
  if (collection === 'teams') {
    out.socialLinks = textToSocialLinks(form.socialLinksText ?? '');
    delete out.socialLinksText;
  }
  if (typeof out.order === 'string' && out.order.trim() !== '') {
    out.order = Number(out.order);
  }
  if (typeof out.homeOrder === 'string' && out.homeOrder.trim() !== '') {
    out.homeOrder = Number(out.homeOrder);
  }
  if (typeof out.date === 'string' && out.date.trim() === '') {
    delete out.date;
  }
  return out;
}

function summarize(item) {
  return item.data.name || item.data.title || item.id;
}

function slugify(value) {
  return value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function CollectionEditor({ collection }) {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState({});
  const [newId, setNewId] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [uploadFiles, setUploadFiles] = useState({});
  const [uploadingField, setUploadingField] = useState('');
  const fields = SCHEMA[collection] ?? [];

  function actorInfo() {
    const user = auth.currentUser;
    return {
      uid: user?.uid ?? '',
      email: user?.email ?? '',
    };
  }

  function isUploadableField(fieldKey) {
    return ['imageUrl', 'logoUrl', 'bannerUrl', 'mediaUrl'].includes(fieldKey);
  }

  async function refresh() {
    const result = await listCollection(collection);
    setItems(result);

    if (!selectedId && result.length > 0) {
      const first = result[0];
      setSelectedId(first.id);
      setForm(toForm(collection, first.data));
    }
  }

  useEffect(() => {
    setSelectedId('');
    setForm({});
    setNewId('');
    setSearch('');
    setStatus('');
    refresh();
  }, [collection]);

  function pick(id) {
    setSelectedId(id);
    const found = items.find((item) => item.id === id);
    setForm(toForm(collection, found?.data ?? {}));
    setStatus('');
  }

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function uploadForField(fieldKey) {
    const file = uploadFiles[fieldKey];
    if (!file) {
      setStatus('Önce bir dosya seçin.');
      return;
    }

    setUploadingField(fieldKey);
    setStatus('Dosya yükleniyor...');

    try {
      const body = new FormData();
      body.append('file', file);
      body.append('folder', `birbucukadana/${collection}`);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || 'Yükleme başarısız.');
      }

      updateField(fieldKey, result.secureUrl);
      setUploadFiles((prev) => ({ ...prev, [fieldKey]: null }));
      setStatus('Dosya yüklendi ve URL otomatik dolduruldu.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Yükleme başarısız.');
    } finally {
      setUploadingField('');
    }
  }

  function createFromTitle() {
    const base = form.name || form.title || '';
    if (!base) return;
    setNewId(slugify(base));
  }

  async function saveSelected() {
    if (!selectedId) return;

    const existing = items.find((item) => item.id === selectedId)?.data ?? null;
    await upsertCollectionDoc(collection, selectedId, fromForm(collection, form), {
      actor: actorInfo(),
      beforeData: existing,
    });
    setStatus('Kaydedildi.');
    await refresh();
  }

  async function createNew() {
    if (!newId.trim()) {
      setStatus('Yeni kayıt ID boş olamaz.');
      return;
    }

    const id = newId.trim();
    await upsertCollectionDoc(collection, id, fromForm(collection, form), {
      actor: actorInfo(),
      beforeData: null,
    });
    setSelectedId(id);
    setStatus('Yeni kayıt oluşturuldu.');
    setNewId('');
    await refresh();
  }

  async function deleteSelected() {
    if (!selectedId) return;
    const existing = items.find((item) => item.id === selectedId)?.data ?? null;
    await removeCollectionDoc(collection, selectedId, {
      actor: actorInfo(),
      beforeData: existing,
    });
    setStatus('Silindi.');
    setSelectedId('');
    setForm({});
    await refresh();
  }

  function startNew() {
    setSelectedId('');
    setForm({ visible: true });
    setStatus('Yeni kayıt için alanları doldurun.');
  }

  const filteredItems = items.filter((item) => {
    const haystack = `${item.id} ${item.data.name ?? ''} ${item.data.title ?? ''}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  return (
    <section className="panel">
      <h2>{COLLECTION_LABELS[collection]}</h2>
      <p className="muted">Sol taraftan kayıt seçin veya yeni kayıt oluşturun. JSON bilmeden düzenleyebilirsiniz.</p>
      <div className="layout-2">
        <aside className="card">
          <h3>Kayıtlar</h3>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Kayıt ara..."
          />
          <button onClick={startNew}>+ Yeni Kayıt</button>
          <div className="list">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                className={item.id === selectedId ? 'selected' : ''}
                onClick={() => pick(item.id)}
              >
                <strong>{summarize(item)}</strong>
                <small>{item.id}</small>
              </button>
            ))}
            {filteredItems.length === 0 ? <p className="muted">Kayıt bulunamadı.</p> : null}
          </div>
        </aside>
        <div className="card">
          <h3>{selectedId ? 'Kayıt Düzenle' : 'Yeni Kayıt'}</h3>
          <div className="actions">
            <input
              value={newId}
              onChange={(e) => setNewId(e.target.value)}
              placeholder="doküman-id"
            />
            <button onClick={createFromTitle}>ID Otomatik Üret</button>
            <button onClick={createNew}>Kaydı Oluştur</button>
          </div>
          <div className="form-grid">
            {fields.map((field) => {
              const value = form[field.key];

              if (field.type === 'boolean') {
                return (
                  <label key={field.key} className="check span-2">
                    <input
                      type="checkbox"
                      checked={Boolean(value)}
                      onChange={(e) => updateField(field.key, e.target.checked)}
                    />
                    <span>{field.label}</span>
                  </label>
                );
              }

              if (field.type === 'textarea') {
                return (
                  <label key={field.key} className="span-2">
                    {field.label}
                    <textarea
                      value={value ?? ''}
                      onChange={(e) => updateField(field.key, e.target.value)}
                      rows={4}
                    />
                  </label>
                );
              }

              if (field.type === 'socialLinks') {
                return (
                  <label key={field.key} className="span-2">
                    Sosyal Linkler (Her satır: Platform|URL|true/false)
                    <textarea
                      value={value ?? ''}
                      onChange={(e) => updateField(field.key, e.target.value)}
                      rows={4}
                      placeholder="Instagram|https://instagram.com/...|true"
                    />
                  </label>
                );
              }

              if (isUploadableField(field.key)) {
                return (
                  <label key={field.key} className="span-2 upload-box">
                    {field.label}
                    <input
                      type="text"
                      value={value ?? ''}
                      onChange={(e) => updateField(field.key, e.target.value)}
                      placeholder="Yükledikten sonra URL otomatik gelir (manuel de yazabilirsiniz)"
                    />
                    <div className="upload-row">
                      <input
                        type="file"
                        accept=".svg,image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          setUploadFiles((prev) => ({ ...prev, [field.key]: file }));
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => uploadForField(field.key)}
                        disabled={!uploadFiles[field.key] || uploadingField === field.key}
                      >
                        {uploadingField === field.key ? 'Yükleniyor...' : 'Dosya Yükle'}
                      </button>
                    </div>
                  </label>
                );
              }

              return (
                <label key={field.key}>
                  {field.label}
                  <input
                    type={field.type === 'number' ? 'number' : 'text'}
                    value={value ?? ''}
                    onChange={(e) => updateField(field.key, e.target.value)}
                  />
                </label>
              );
            })}
          </div>
          <div className="actions">
            <button onClick={saveSelected} disabled={!selectedId}>
              Seçili Kaydı Kaydet
            </button>
            <button onClick={deleteSelected} disabled={!selectedId}>
              Seçiliyi Sil
            </button>
            <button onClick={refresh}>Yenile</button>
          </div>
          {status ? <p className="ok">{status}</p> : null}
        </div>
      </div>
    </section>
  );
}
