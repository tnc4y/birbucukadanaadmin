'use client';

import { useEffect, useState } from 'react';

import { COLLECTION_LABELS } from '@/lib/collections';
import {
  listCollection,
  removeCollectionDoc,
  upsertCollectionDoc,
} from '@/lib/firestore-admin';

const SCHEMA = {
  announcements: [
    { key: 'title', label: 'Baslik' },
    { key: 'summary', label: 'Kisa Aciklama' },
    { key: 'content', label: 'Detay Metni', type: 'textarea' },
    { key: 'imageUrl', label: 'Gorsel URL' },
    { key: 'order', label: 'Siralama', type: 'number' },
    { key: 'buttonText', label: 'Buton Yazisi' },
    { key: 'buttonUrl', label: 'Buton Linki' },
    { key: 'popupDismissKey', label: 'Popup Anahtari' },
    { key: 'visible', label: 'Aktif', type: 'boolean' },
    { key: 'isImportant', label: 'Onemli Duyuru', type: 'boolean' },
    { key: 'showAsPopup', label: 'Acilista Popup Goster', type: 'boolean' },
  ],
  teams: [
    { key: 'name', label: 'Takim Adi' },
    { key: 'logoUrl', label: 'Logo URL' },
    { key: 'shortDescription', label: 'Kisa Aciklama' },
    { key: 'description', label: 'Detay Aciklama', type: 'textarea' },
    { key: 'bannerUrl', label: 'Banner URL' },
    { key: 'homeOrder', label: 'Anasayfa Sirasi', type: 'number' },
    { key: 'socialLinksText', label: 'Sosyal Linkler', type: 'socialLinks' },
    { key: 'visible', label: 'Aktif', type: 'boolean' },
  ],
  events: [
    { key: 'title', label: 'Etkinlik Basligi' },
    { key: 'description', label: 'Aciklama', type: 'textarea' },
    { key: 'tag', label: 'Etiket (Genel / Takim)' },
    { key: 'date', label: 'Tarih (YYYY-MM-DD)', type: 'date' },
    { key: 'imageUrl', label: 'Gorsel URL' },
    { key: 'teamId', label: 'Takim ID (opsiyonel)' },
    { key: 'visible', label: 'Aktif', type: 'boolean' },
  ],
  sponsors: [
    { key: 'name', label: 'Sponsor Adi' },
    { key: 'logoUrl', label: 'Logo URL' },
    { key: 'website', label: 'Website' },
    { key: 'description', label: 'Aciklama' },
    { key: 'teamId', label: 'Takim ID (bos ise genel sponsor)' },
    { key: 'visible', label: 'Aktif', type: 'boolean' },
  ],
  competitions: [
    { key: 'title', label: 'Yarisma Adi' },
    { key: 'performance', label: 'Performans' },
    { key: 'year', label: 'Yil' },
    { key: 'teamId', label: 'Takim ID (opsiyonel)' },
    { key: 'imageUrl', label: 'Gorsel URL' },
    { key: 'visible', label: 'Aktif', type: 'boolean' },
  ],
  awards: [
    { key: 'title', label: 'Odul Adi' },
    { key: 'description', label: 'Aciklama', type: 'textarea' },
    { key: 'projectName', label: 'Hangi Projeden Alindi' },
    { key: 'teamId', label: 'Takim ID (opsiyonel)' },
    { key: 'mediaUrl', label: 'Gorsel/Medya URL' },
    { key: 'year', label: 'Yil' },
    { key: 'visible', label: 'Aktif', type: 'boolean' },
  ],
  projects: [
    { key: 'title', label: 'Proje Adi' },
    { key: 'description', label: 'Aciklama', type: 'textarea' },
    { key: 'teamId', label: 'Takim ID' },
    { key: 'mediaUrl', label: 'Gorsel URL' },
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
  const fields = SCHEMA[collection] ?? [];

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

  function createFromTitle() {
    const base = form.name || form.title || '';
    if (!base) return;
    setNewId(slugify(base));
  }

  async function saveSelected() {
    if (!selectedId) return;

    await upsertCollectionDoc(collection, selectedId, fromForm(collection, form));
    setStatus('Kaydedildi.');
    await refresh();
  }

  async function createNew() {
    if (!newId.trim()) {
      setStatus('Yeni kayit ID bos olamaz.');
      return;
    }

    const id = newId.trim();
    await upsertCollectionDoc(collection, id, fromForm(collection, form));
    setSelectedId(id);
    setStatus('Yeni kayit olusturuldu.');
    setNewId('');
    await refresh();
  }

  async function deleteSelected() {
    if (!selectedId) return;
    await removeCollectionDoc(collection, selectedId);
    setStatus('Silindi.');
    setSelectedId('');
    setForm({});
    await refresh();
  }

  function startNew() {
    setSelectedId('');
    setForm({ visible: true });
    setStatus('Yeni kayit icin alanlari doldurun.');
  }

  const filteredItems = items.filter((item) => {
    const haystack = `${item.id} ${item.data.name ?? ''} ${item.data.title ?? ''}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  return (
    <section className="panel">
      <h2>{COLLECTION_LABELS[collection]}</h2>
      <p className="muted">Sol taraftan kayit secin veya yeni kayit olusturun. JSON bilmeden duzenleyebilirsiniz.</p>
      <div className="layout-2">
        <aside className="card">
          <h3>Kayitlar</h3>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Kayit ara..."
          />
          <button onClick={startNew}>+ Yeni Kayit</button>
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
            {filteredItems.length === 0 ? <p className="muted">Kayit bulunamadi.</p> : null}
          </div>
        </aside>
        <div className="card">
          <h3>{selectedId ? 'Kayit Duzenle' : 'Yeni Kayit'}</h3>
          <div className="actions">
            <input
              value={newId}
              onChange={(e) => setNewId(e.target.value)}
              placeholder="dokuman-id"
            />
            <button onClick={createFromTitle}>ID Otomatik Uret</button>
            <button onClick={createNew}>Kaydi Olustur</button>
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
                    Sosyal Linkler (Her satir: Platform|URL|true/false)
                    <textarea
                      value={value ?? ''}
                      onChange={(e) => updateField(field.key, e.target.value)}
                      rows={4}
                      placeholder="Instagram|https://instagram.com/...|true"
                    />
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
              Secili Kaydi Kaydet
            </button>
            <button onClick={deleteSelected} disabled={!selectedId}>
              Seciliyi Sil
            </button>
            <button onClick={refresh}>Yenile</button>
          </div>
          {status ? <p className="ok">{status}</p> : null}
        </div>
      </div>
    </section>
  );
}
