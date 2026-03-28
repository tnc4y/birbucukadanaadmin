'use client';

import { useEffect, useMemo, useState } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { deleteField } from 'firebase/firestore';

import { COLLECTION_LABELS } from '@/lib/collections';
import { auth } from '@/lib/firebase';
import { listCollection, removeCollectionDoc, upsertCollectionDoc } from '@/lib/firestore-admin';

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
    { key: 'showAsPopup', label: 'Açılışta Popup Göster', type: 'boolean' },
  ],
  teams: [
    { key: 'name', label: 'Takım Adı' },
    { key: 'logoUrl', label: 'Logo URL' },
    { key: 'shortDescription', label: 'Kısa Açıklama' },
    { key: 'description', label: 'Detay Yazısı (Markdown)', type: 'textarea' },
    { key: 'bannerUrl', label: 'Banner URL' },
    { key: 'homeOrder', label: 'Anasayfa Sırası', type: 'number' },
    { key: 'actionLinksText', label: 'Özel Buton Linkleri', type: 'actionLinks' },
    { key: 'socialLinksText', label: 'Sosyal Linkler', type: 'socialLinks' },
    { key: 'visible', label: 'Aktif', type: 'boolean' },
  ],
  events: [
    { key: 'title', label: 'Etkinlik Başlığı' },
    { key: 'description', label: 'Açıklama', type: 'textarea' },
    { key: 'tag', label: 'Etiket (Genel / Takım)' },
    { key: 'date', label: 'Tarih (YYYY-MM-DD)', type: 'date' },
    { key: 'location', label: 'Konum' },
    { key: 'imageUrl', label: 'Görsel URL' },
    { key: 'teamId', label: 'Takım (opsiyonel)', type: 'teamSelect' },
    {
      key: 'participationMode',
      label: 'Katılım Seçeneği',
      type: 'select',
      options: [
        { value: 'none', label: 'Kapalı' },
        { value: 'link', label: 'Normal Link' },
        { value: 'form', label: 'Uygulama İçi Form' },
      ],
    },
    { key: 'participationUrl', label: 'Katılım Linki (link modu için)' },
    { key: 'visible', label: 'Aktif', type: 'boolean' },
  ],
  event_participations: [
    { key: 'eventTitle', label: 'Etkinlik' },
    { key: 'fullName', label: 'Ad Soyad' },
    { key: 'email', label: 'E-posta' },
    { key: 'phone', label: 'Telefon' },
    { key: 'note', label: 'Not' },
    { key: 'status', label: 'Durum' },
    { key: 'deviceId', label: 'Cihaz ID' },
  ],
  sponsors: [
    { key: 'name', label: 'Sponsor Adı' },
    { key: 'logoUrl', label: 'Logo URL' },
    { key: 'website', label: 'Website' },
    { key: 'description', label: 'Açıklama' },
    { key: 'teamId', label: 'Takım (boş ise genel sponsor)', type: 'teamSelect' },
    { key: 'visible', label: 'Aktif', type: 'boolean' },
  ],
  competitions: [
    { key: 'title', label: 'Yarışma Adı' },
    { key: 'performance', label: 'Performans' },
    { key: 'year', label: 'Yıl' },
    { key: 'teamId', label: 'Takım (opsiyonel)', type: 'teamSelect' },
    { key: 'imageUrl', label: 'Görsel URL' },
    { key: 'visible', label: 'Aktif', type: 'boolean' },
  ],
  awards: [
    { key: 'title', label: 'Ödül Adı' },
    { key: 'description', label: 'Açıklama', type: 'textarea' },
    { key: 'projectName', label: 'Hangi Projeden Alındı' },
    { key: 'teamId', label: 'Takım (opsiyonel)', type: 'teamSelect' },
    { key: 'mediaUrl', label: 'Görsel/Medya URL' },
    { key: 'year', label: 'Yıl' },
    { key: 'visible', label: 'Aktif', type: 'boolean' },
  ],
  projects: [
    { key: 'title', label: 'Proje Adı' },
    { key: 'description', label: 'Açıklama', type: 'textarea' },
    { key: 'teamId', label: 'Takım', type: 'teamSelect' },
    { key: 'mediaUrl', label: 'Görsel URL' },
    { key: 'repoUrl', label: 'Repo/Website Linki' },
    { key: 'visible', label: 'Aktif', type: 'boolean' },
  ],
};

const ORDER_FIELD = {
  announcements: 'order',
  teams: 'homeOrder',
};

function socialLinksToText(links) {
  if (!Array.isArray(links) || links.length === 0) return '';
  return links.map((item) => `${item.platform ?? ''}|${item.url ?? ''}|${item.visible ?? true}`).join('\n');
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

function actionLinksToText(links) {
  if (!Array.isArray(links) || links.length === 0) return '';
  return links
    .map(
      (item) =>
        `${item.label ?? ''}|${item.url ?? ''}|${item.variant ?? 'primary'}|${item.visible ?? true}`
    )
    .join('\n');
}

function textToActionLinks(text) {
  if (!text.trim()) return [];
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label = '', url = '', variant = 'primary', visible = 'true'] = line.split('|');
      return {
        label: label.trim(),
        url: url.trim(),
        variant: (variant.trim() || 'primary').toLowerCase(),
        visible: visible.trim().toLowerCase() !== 'false',
      };
    });
}

function toForm(collection, data = {}) {
  const out = { ...data };
  if (collection === 'teams') {
    out.socialLinksText = socialLinksToText(data.socialLinks);
    out.actionLinksText = actionLinksToText(data.actionLinks);
  }
  return out;
}

function fromForm(collection, form) {
  const out = { ...form };

  if (collection === 'teams') {
    out.socialLinks = textToSocialLinks(form.socialLinksText ?? '');
    out.actionLinks = textToActionLinks(form.actionLinksText ?? '');
    delete out.socialLinksText;
    delete out.actionLinksText;
  }

  if (typeof out.order === 'string' && out.order.trim() !== '') out.order = Number(out.order);
  if (typeof out.homeOrder === 'string' && out.homeOrder.trim() !== '') out.homeOrder = Number(out.homeOrder);

  if (typeof out.date === 'string' && out.date.trim() === '') delete out.date;
  if (typeof out.teamId === 'string' && out.teamId.trim() === '') delete out.teamId;

  if (collection === 'announcements') {
    // Keep backward compatibility by removing deprecated field from stored docs.
    out.isImportant = deleteField();
  }

  return out;
}

function summarize(item) {
  return (
    item?.data?.name ||
    item?.data?.title ||
    item?.data?.fullName ||
    item?.data?.eventTitle ||
    item?.id
  );
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

function moveArrayItem(arr, from, to) {
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

const GALLERY_START = '<!-- GALLERY_START -->';
const GALLERY_END = '<!-- GALLERY_END -->';

function extractGalleryUrls(markdown = '') {
  const start = markdown.indexOf(GALLERY_START);
  const end = markdown.indexOf(GALLERY_END);
  if (start < 0 || end < 0 || end <= start) return [];

  const block = markdown.slice(start + GALLERY_START.length, end).trim();
  if (!block) return [];

  return block
    .split('\n')
    .map((line) => line.trim())
    .map((line) => {
      const match = line.match(/^!\[[^\]]*\]\(([^)]+)\)$/);
      return match?.[1]?.trim() ?? '';
    })
    .filter(Boolean);
}

function upsertGalleryBlock(markdown = '', urls = []) {
  const cleanUrls = urls.map((url) => url.trim()).filter(Boolean);

  const lines = cleanUrls.map((url, idx) => `![Galeri ${idx + 1}](${url})`);
  const galleryText =
    cleanUrls.length > 0
      ? `${GALLERY_START}\n\n## Takım Galerisi\n\n${lines.join('\n\n')}\n\n${GALLERY_END}`
      : '';

  const pattern = new RegExp(`${GALLERY_START}[\\s\\S]*?${GALLERY_END}`, 'm');
  if (pattern.test(markdown)) {
    const replaced = markdown.replace(pattern, galleryText).trim();
    return replaced;
  }

  if (!galleryText) return markdown.trim();

  const base = markdown.trim();
  if (!base) return galleryText;
  return `${base}\n\n${galleryText}`;
}

export function CollectionEditor({ collection }) {
  const [view, setView] = useState('records');
  const [items, setItems] = useState([]);
  const [teamOptions, setTeamOptions] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [editForm, setEditForm] = useState({});
  const [newForm, setNewForm] = useState({ visible: true });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [uploadFiles, setUploadFiles] = useState({});
  const [uploadingField, setUploadingField] = useState('');
  const [orderDraft, setOrderDraft] = useState([]);
  const [draggingId, setDraggingId] = useState('');
  const [galleryInput, setGalleryInput] = useState({ edit: '', new: '' });

  const fields = SCHEMA[collection] ?? [];
  const orderKey = ORDER_FIELD[collection] ?? null;
  const readOnlyCollection = collection === 'event_participations';
  const supportsCreate = !readOnlyCollection;

  function actorInfo() {
    const user = auth.currentUser;
    return {
      uid: user?.uid ?? '',
      email: user?.email ?? '',
    };
  }

  function sortForCollection(rows) {
    if (!orderKey) return rows;
    return [...rows].sort((a, b) => {
      const aOrder = Number(a?.data?.[orderKey] ?? Number.MAX_SAFE_INTEGER);
      const bOrder = Number(b?.data?.[orderKey] ?? Number.MAX_SAFE_INTEGER);
      return aOrder - bOrder;
    });
  }

  function nextOrderValue(rows) {
    if (!orderKey) return undefined;
    const existing = rows
      .map((item) => Number(item?.data?.[orderKey]))
      .filter((value) => Number.isFinite(value));
    if (existing.length === 0) return 1;
    return Math.max(...existing) + 1;
  }

  function isUploadableField(fieldKey) {
    return ['imageUrl', 'logoUrl', 'bannerUrl', 'mediaUrl'].includes(fieldKey);
  }

  function updateEditField(key, value) {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateNewField(key, value) {
    setNewForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateGalleryInput(mode, value) {
    setGalleryInput((prev) => ({ ...prev, [mode]: value }));
  }

  function applyMarkdownSnippet(mode, snippet) {
    if (mode === 'edit') {
      const prev = editForm.description ?? '';
      const spacer = prev.trim().isEmpty ? '' : '\n\n';
      updateEditField('description', `${prev}${spacer}${snippet}`);
      return;
    }

    const prev = newForm.description ?? '';
    const spacer = prev.trim().isEmpty ? '' : '\n\n';
    updateNewField('description', `${prev}${spacer}${snippet}`);
  }

  function setMarkdownValue(mode, value) {
    if (mode === 'edit') {
      updateEditField('description', value);
    } else {
      updateNewField('description', value);
    }
  }

  function getMarkdownValue(mode) {
    return mode === 'edit' ? (editForm.description ?? '') : (newForm.description ?? '');
  }

  function addGalleryImage(mode) {
    const url = (galleryInput[mode] ?? '').trim();
    if (!url) {
      setStatus('Görsel URL girin.');
      return;
    }

    const markdown = getMarkdownValue(mode);
    const current = extractGalleryUrls(markdown);
    const next = [...current, url];
    setMarkdownValue(mode, upsertGalleryBlock(markdown, next));
    updateGalleryInput(mode, '');
    setStatus('Galeri görseli eklendi.');
  }

  function moveGalleryImage(mode, index, direction) {
    const markdown = getMarkdownValue(mode);
    const current = extractGalleryUrls(markdown);
    const target = index + direction;
    if (target < 0 || target >= current.length) return;

    const reordered = moveArrayItem(current, index, target);
    setMarkdownValue(mode, upsertGalleryBlock(markdown, reordered));
  }

  function removeGalleryImage(mode, index) {
    const markdown = getMarkdownValue(mode);
    const current = extractGalleryUrls(markdown);
    const next = current.filter((_, i) => i != index);
    setMarkdownValue(mode, upsertGalleryBlock(markdown, next));
  }

  function prepareNewForm(rows) {
    const defaultForm = { visible: true };
    const next = nextOrderValue(rows);
    if (orderKey && next !== undefined) {
      defaultForm[orderKey] = next;
    }
    return defaultForm;
  }

  async function refresh() {
    const [result, teams] = await Promise.all([listCollection(collection), listCollection('teams')]);
    const sorted = sortForCollection(result);

    const visibleTeams = teams
      .filter((item) => item?.data?.visible !== false)
      .sort((a, b) => (a?.data?.name ?? '').localeCompare(b?.data?.name ?? ''));

    setItems(sorted);
    setTeamOptions(visibleTeams);
    setOrderDraft(sorted.map((item) => item.id));

    if (!selectedId && sorted.length > 0) {
      setSelectedId(sorted[0].id);
      setEditForm(toForm(collection, sorted[0].data));
    }

    if (sorted.length === 0) {
      setSelectedId('');
      setEditForm({});
    }

    setNewForm(prepareNewForm(sorted));
  }

  useEffect(() => {
    setView('records');
    setSelectedId('');
    setEditForm({});
    setNewForm({ visible: true });
    setSearch('');
    setStatus('');
    setUploadFiles({});
    setUploadingField('');
    refresh();
  }, [collection]);

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const haystack = `${item.id} ${item.data?.name ?? ''} ${item.data?.title ?? ''} ${item.data?.fullName ?? ''} ${item.data?.eventTitle ?? ''} ${item.data?.email ?? ''} ${item.data?.phone ?? ''}`.toLowerCase();
        return haystack.includes(search.toLowerCase());
      }),
    [items, search]
  );

  const orderedDraftItems = useMemo(() => {
    const map = new Map(items.map((item) => [item.id, item]));
    return orderDraft.map((id) => map.get(id)).filter(Boolean);
  }, [items, orderDraft]);

  const orderIssueCount = useMemo(() => {
    if (!orderKey) return 0;
    return orderedDraftItems.reduce((acc, item, index) => {
      const expected = index + 1;
      const current = Number(item?.data?.[orderKey]);
      return acc + (current === expected ? 0 : 1);
    }, 0);
  }, [orderedDraftItems, orderKey]);

  function pick(id) {
    setSelectedId(id);
    const found = items.find((item) => item.id === id);
    setEditForm(toForm(collection, found?.data ?? {}));
    setStatus('');
    setView('records');
  }

  async function uploadForField(fieldKey, mode) {
    const file = uploadFiles[`${mode}:${fieldKey}`];
    if (!file) {
      setStatus('Önce bir dosya seçin.');
      return;
    }

    const uploadKey = `${mode}:${fieldKey}`;
    setUploadingField(uploadKey);
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

      if (mode === 'edit') {
        updateEditField(fieldKey, result.secureUrl);
      } else {
        updateNewField(fieldKey, result.secureUrl);
      }

      setUploadFiles((prev) => ({ ...prev, [uploadKey]: null }));
      setStatus('Dosya yüklendi ve URL otomatik dolduruldu.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Yükleme başarısız.');
    } finally {
      setUploadingField('');
    }
  }

  async function saveSelected() {
    if (!selectedId || readOnlyCollection) return;

    const existing = items.find((item) => item.id === selectedId)?.data ?? null;
    const payload = fromForm(collection, editForm);

    await upsertCollectionDoc(collection, selectedId, payload, {
      actor: actorInfo(),
      beforeData: existing,
    });

    let updatedPopupCount = 0;
    if (collection === 'announcements' && payload.showAsPopup === true) {
      const popupDocsToDisable = items.filter(
        (item) => item.id !== selectedId && item?.data?.showAsPopup === true
      );

      for (const item of popupDocsToDisable) {
        await upsertCollectionDoc(
          collection,
          item.id,
          { ...item.data, showAsPopup: false, isImportant: deleteField() },
          {
            actor: actorInfo(),
            beforeData: item.data,
          }
        );
      }

      updatedPopupCount = popupDocsToDisable.length;
    }

    setStatus(
      updatedPopupCount > 0
        ? `Kayıt güncellendi. ${updatedPopupCount} duyuruda popup kapatıldı.`
        : 'Kayıt güncellendi.'
    );
    await refresh();
  }

  function createDocIdFromForm() {
    const base = newForm.name || newForm.title || 'kayit';
    return `${slugify(base)}-${Date.now()}`;
  }

  async function createNew() {
    if (!supportsCreate) return;

    const id = createDocIdFromForm();
    const payload = fromForm(collection, newForm);

    await upsertCollectionDoc(collection, id, payload, {
      actor: actorInfo(),
      beforeData: null,
    });

    let updatedPopupCount = 0;
    if (collection === 'announcements' && payload.showAsPopup === true) {
      const popupDocsToDisable = items.filter((item) => item?.data?.showAsPopup === true);

      for (const item of popupDocsToDisable) {
        await upsertCollectionDoc(
          collection,
          item.id,
          { ...item.data, showAsPopup: false, isImportant: deleteField() },
          {
            actor: actorInfo(),
            beforeData: item.data,
          }
        );
      }

      updatedPopupCount = popupDocsToDisable.length;
    }

    setStatus(
      updatedPopupCount > 0
        ? `Yeni kayıt oluşturuldu. ${updatedPopupCount} duyuruda popup kapatıldı.`
        : 'Yeni kayıt oluşturuldu.'
    );
    setView('records');
    await refresh();
    pick(id);
  }

  async function deleteSelected() {
    if (!selectedId || readOnlyCollection) return;
    const existing = items.find((item) => item.id === selectedId)?.data ?? null;

    await removeCollectionDoc(collection, selectedId, {
      actor: actorInfo(),
      beforeData: existing,
    });

    setStatus('Kayıt silindi.');
    setSelectedId('');
    setEditForm({});
    await refresh();
  }

  function onDragStart(id) {
    setDraggingId(id);
  }

  function onDropTo(targetId) {
    if (!draggingId || draggingId === targetId) return;

    const fromIndex = orderDraft.indexOf(draggingId);
    const toIndex = orderDraft.indexOf(targetId);
    if (fromIndex < 0 || toIndex < 0) return;

    setOrderDraft((prev) => moveArrayItem(prev, fromIndex, toIndex));
    setDraggingId('');
  }

  function moveUp(id) {
    const index = orderDraft.indexOf(id);
    if (index <= 0) return;
    setOrderDraft((prev) => moveArrayItem(prev, index, index - 1));
  }

  function moveDown(id) {
    const index = orderDraft.indexOf(id);
    if (index < 0 || index >= orderDraft.length - 1) return;
    setOrderDraft((prev) => moveArrayItem(prev, index, index + 1));
  }

  async function saveOrder() {
    if (!orderKey) return;
    let changed = 0;

    for (let i = 0; i < orderDraft.length; i += 1) {
      const id = orderDraft[i];
      const item = items.find((row) => row.id === id);
      if (!item) continue;

      const expected = i + 1;
      const current = Number(item?.data?.[orderKey]);
      if (current === expected) continue;

      await upsertCollectionDoc(
        collection,
        id,
        { ...item.data, [orderKey]: expected },
        {
          actor: actorInfo(),
          beforeData: item.data,
        }
      );
      changed += 1;
    }

    setStatus(changed > 0 ? `Sıralama kaydedildi. ${changed} kayıt güncellendi.` : 'Sıralama zaten güncel.');
    await refresh();
  }

  function renderFields(mode, formState, updateFn) {
    return (
      <div className="form-grid">
        {fields.map((field) => {
          const value = formState[field.key];

          if (field.type === 'boolean') {
            return (
              <label key={`${mode}-${field.key}`} className="check span-2">
                <input
                  type="checkbox"
                  checked={Boolean(value)}
                  onChange={(e) => updateFn(field.key, e.target.checked)}
                />
                <span>{field.label}</span>
              </label>
            );
          }

          if (field.type === 'textarea') {
            const isTeamMarkdown = collection === 'teams' && field.key === 'description';
            const markdownText = getMarkdownValue(mode);
            const galleryUrls = isTeamMarkdown ? extractGalleryUrls(markdownText) : [];

            return (
              <label key={`${mode}-${field.key}`} className="span-2">
                {field.label}
                {isTeamMarkdown ? (
                  <div className="markdown-tools">
                    <div className="md-editor-wrap" data-color-mode="light">
                      <MDEditor
                        value={value ?? ''}
                        onChange={(next) => updateFn(field.key, next ?? '')}
                        height={340}
                        preview="live"
                        visibleDragbar={false}
                      />
                    </div>

                    <div className="gallery-manager">
                      <strong>Galeri Görselleri</strong>
                      <p className="muted">URL ekleyin, sırayı yukarı/aşağı değiştirin. Mobilde bu sırayla gösterilir.</p>
                      <div className="actions">
                        <input
                          value={galleryInput[mode] ?? ''}
                          onChange={(e) => updateGalleryInput(mode, e.target.value)}
                          placeholder="https://.../gorsel.jpg"
                        />
                        <button type="button" onClick={() => addGalleryImage(mode)}>
                          Görsel Ekle
                        </button>
                      </div>

                      {galleryUrls.length > 0 ? (
                        <div className="gallery-list">
                          {galleryUrls.map((url, idx) => (
                            <div key={`${mode}-gallery-${url}-${idx}`} className="gallery-item">
                              <span className="order-badge">#{idx + 1}</span>
                              <small>{url}</small>
                              <div className="mini-actions">
                                <button type="button" onClick={() => moveGalleryImage(mode, idx, -1)}>
                                  Yukarı
                                </button>
                                <button type="button" onClick={() => moveGalleryImage(mode, idx, 1)}>
                                  Aşağı
                                </button>
                                <button type="button" onClick={() => removeGalleryImage(mode, idx)}>
                                  Sil
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="muted">Henüz galeri görseli eklenmedi.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <textarea
                    rows={4}
                    value={value ?? ''}
                    onChange={(e) => updateFn(field.key, e.target.value)}
                  />
                )}
              </label>
            );
          }

          if (field.type === 'socialLinks') {
            return (
              <label key={`${mode}-${field.key}`} className="span-2">
                Sosyal Linkler (Her satır: Platform|URL|true/false)
                <textarea
                  rows={4}
                  value={value ?? ''}
                  onChange={(e) => updateFn(field.key, e.target.value)}
                  placeholder="Instagram|https://instagram.com/...|true"
                />
              </label>
            );
          }

          if (field.type === 'actionLinks') {
            return (
              <label key={`${mode}-${field.key}`} className="span-2">
                Özel Buton Linkleri (Her satır: ButonYazısı|URL|primary/secondary/tonal|true/false)
                <textarea
                  rows={4}
                  value={value ?? ''}
                  onChange={(e) => updateFn(field.key, e.target.value)}
                  placeholder="Takıma Katıl|https://...|primary|true"
                />
              </label>
            );
          }

          if (field.type === 'teamSelect') {
            return (
              <label key={`${mode}-${field.key}`}>
                {field.label}
                <select value={value ?? ''} onChange={(e) => updateFn(field.key, e.target.value)}>
                  <option value="">Genel / Takımsız</option>
                  {teamOptions.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.data?.name || team.id}
                    </option>
                  ))}
                </select>
              </label>
            );
          }

          if (field.type === 'select') {
            const options = field.options ?? [];
            return (
              <label key={`${mode}-${field.key}`}>
                {field.label}
                <select value={value ?? ''} onChange={(e) => updateFn(field.key, e.target.value)}>
                  {options.map((option) => (
                    <option key={`${field.key}-${option.value}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            );
          }

          if (isUploadableField(field.key)) {
            const uploadKey = `${mode}:${field.key}`;
            return (
              <label key={`${mode}-${field.key}`} className="span-2 upload-box">
                {field.label}
                <input
                  type="text"
                  value={value ?? ''}
                  onChange={(e) => updateFn(field.key, e.target.value)}
                  placeholder="Yükledikten sonra URL otomatik gelir (manuel de yazabilirsiniz)"
                />
                <div className="upload-row">
                  <input
                    type="file"
                    accept=".svg,image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      setUploadFiles((prev) => ({ ...prev, [uploadKey]: file }));
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => uploadForField(field.key, mode)}
                    disabled={!uploadFiles[uploadKey] || uploadingField === uploadKey}
                  >
                    {uploadingField === uploadKey ? 'Yükleniyor...' : 'Dosya Yükle'}
                  </button>
                </div>
              </label>
            );
          }

          return (
            <label key={`${mode}-${field.key}`}>
              {field.label}
              <input
                type={field.type === 'number' ? 'number' : 'text'}
                value={value ?? ''}
                onChange={(e) => updateFn(field.key, e.target.value)}
              />
            </label>
          );
        })}
      </div>
    );
  }

  return (
    <section className="panel">
      <h2>{COLLECTION_LABELS[collection]}</h2>
      <p className="muted">Kayıtları yönetmek, yeni kayıt eklemek ve sıralama yapmak için aşağıdaki sekmeleri kullanın.</p>

      <div className="segmented">
        <button className={view === 'records' ? 'selected' : ''} onClick={() => setView('records')}>
          Kayıtlar
        </button>
        {supportsCreate ? (
          <button className={view === 'new' ? 'selected' : ''} onClick={() => setView('new')}>
            Yeni Kayıt
          </button>
        ) : null}
        {orderKey ? (
          <button className={view === 'order' ? 'selected' : ''} onClick={() => setView('order')}>
            Sıralama
          </button>
        ) : null}
      </div>

      {view === 'records' ? (
        <div className="layout-2">
          <aside className="card">
            <h3>Mevcut Kayıtlar</h3>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Kayıt ara..." />
            <div className="list">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  className={item.id === selectedId ? 'selected' : ''}
                  onClick={() => pick(item.id)}
                >
                  <strong>{summarize(item)}</strong>
                  {orderKey ? (
                    <small>
                      Sıra: {Number.isFinite(Number(item?.data?.[orderKey])) ? Number(item?.data?.[orderKey]) : '-'}
                    </small>
                  ) : null}
                </button>
              ))}
              {filteredItems.length === 0 ? <p className="muted">Kayıt bulunamadı.</p> : null}
            </div>
          </aside>

          <div className="card">
            <h3>{selectedId ? 'Kayıt Güncelle' : 'Düzenlemek İçin Kayıt Seçin'}</h3>
            {selectedId ? (
              <>
                {renderFields('edit', editForm, updateEditField)}
                <div className="actions">
                  {!readOnlyCollection ? <button onClick={saveSelected}>Seçili Kaydı Güncelle</button> : null}
                  {!readOnlyCollection ? <button onClick={deleteSelected}>Seçiliyi Sil</button> : null}
                  <button onClick={refresh}>Yenile</button>
                </div>
              </>
            ) : (
              <p className="muted">Soldan bir kayıt seçtiğinizde düzenleme formu açılır.</p>
            )}
          </div>
        </div>
      ) : null}

      {view === 'new' && supportsCreate ? (
        <div className="card">
          <h3>Yeni Kayıt Oluştur</h3>
          <p className="muted">Tek işlemle kayıt oluşturulur. Oluşturduktan sonra kayıtlar sekmesinden güncelleyebilirsiniz.</p>

          <p className="muted">Kayıt kimliği sistem tarafından otomatik oluşturulur.</p>

          {renderFields('new', newForm, updateNewField)}

          <div className="actions">
            <button onClick={createNew}>Kaydı Oluştur</button>
            <button
              onClick={() => {
                setNewForm(prepareNewForm(items));
              }}
            >
              Formu Temizle
            </button>
          </div>
        </div>
      ) : null}

      {view === 'order' && orderKey ? (
        <div className="card">
          <h3>Sıralama Ayarları</h3>
          <p className="muted">
            Kayıtları sürükleyip bırakarak sıralayın. Mobilde ok butonlarını kullanabilirsiniz.
          </p>
          {orderIssueCount > 0 ? (
            <p className="error">Mevcut sırada {orderIssueCount} kayıt beklenen sırada değil.</p>
          ) : (
            <p className="ok">Sıralama düzenli görünüyor.</p>
          )}

          <div className="dnd-list">
            {orderedDraftItems.map((item, index) => (
              <div
                key={item.id}
                className={`dnd-item ${draggingId === item.id ? 'dragging' : ''}`}
                draggable
                onDragStart={() => onDragStart(item.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDropTo(item.id)}
                onDragEnd={() => setDraggingId('')}
              >
                <span className="drag-handle">⋮⋮</span>
                <div className="dnd-main">
                  <strong>{summarize(item)}</strong>
                </div>
                <span className="order-badge">#{index + 1}</span>
                <div className="mini-actions">
                  <button type="button" onClick={() => moveUp(item.id)}>
                    Yukarı
                  </button>
                  <button type="button" onClick={() => moveDown(item.id)}>
                    Aşağı
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="actions">
            <button onClick={saveOrder}>Sıralamayı Kaydet</button>
            <button onClick={() => setOrderDraft(sortForCollection(items).map((item) => item.id))}>Sıfırla</button>
          </div>
        </div>
      ) : null}

      {status ? <p className="ok">{status}</p> : null}
    </section>
  );
}
