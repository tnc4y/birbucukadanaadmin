'use client';

import { useState } from 'react';

import { COLLECTIONS, COLLECTION_LABELS } from '@/lib/collections';
import { CollectionEditor } from './collection-editor';
import { SettingsEditor } from './settings-editor';

export function AdminDashboard() {
  const [active, setActive] = useState('announcements');

  return (
    <main className="dashboard">
      <section className="hero card">
        <h2>1.5 Adana Yonetim Paneli</h2>
        <p className="muted">
          Teknik bilgi gerektirmeden kayit ekleyebilir, duzenleyebilir ve silebilirsiniz.
          Once "Genel Ayarlar" bolumunu doldurun, sonra sekmelerden icerik girin.
        </p>
      </section>

      <SettingsEditor />

      <section className="tabs">
        {COLLECTIONS.map((key) => (
          <button
            key={key}
            className={key === active ? 'selected' : ''}
            onClick={() => setActive(key)}
          >
            {COLLECTION_LABELS[key]}
          </button>
        ))}
      </section>

      <CollectionEditor collection={active} />
    </main>
  );
}
