'use client';

import { useState } from 'react';

import { COLLECTIONS, COLLECTION_LABELS } from '@/lib/collections';
import { AdminHomeOverview } from './admin-home-overview';
import { AuditLogPanel } from './audit-log-panel';
import { CollectionEditor } from './collection-editor';
import { SettingsEditor } from './settings-editor';

export function AdminDashboard() {
  const [activeView, setActiveView] = useState('home');

  function renderContent() {
    if (activeView === 'home') {
      return <AdminHomeOverview />;
    }

    if (activeView === 'settings') {
      return <SettingsEditor />;
    }

    if (activeView === 'logs') {
      return <AuditLogPanel />;
    }

    if (activeView.startsWith('collection:')) {
      const collection = activeView.replace('collection:', '');
      return <CollectionEditor collection={collection} />;
    }

    return <AdminHomeOverview />;
  }

  return (
    <main className="dashboard dashboard-shell">
      <section className="hero card">
        <h2>1.5 Adana Yonetim Paneli</h2>
        <p className="muted">
          Teknik bilgi gerektirmeden kayit ekleyebilir, duzenleyebilir ve silebilirsiniz.
          Sol menuden bolum secerek icerikleri ve ayarlari yonetebilirsiniz.
        </p>
      </section>

      <aside className="card side-menu">
        <h3>Menu</h3>
        <div className="menu-list">
          <button
            className={activeView === 'home' ? 'selected' : ''}
            onClick={() => setActiveView('home')}
          >
            Ana Sayfa / Istatistikler
          </button>
          <button
            className={activeView === 'settings' ? 'selected' : ''}
            onClick={() => setActiveView('settings')}
          >
            Genel Ayarlar
          </button>
          <button
            className={activeView === 'logs' ? 'selected' : ''}
            onClick={() => setActiveView('logs')}
          >
            Islem Loglari
          </button>
        </div>

        <h3>Icerik Yonetimi</h3>
        <div className="menu-list">
          {COLLECTIONS.map((key) => {
            const viewKey = `collection:${key}`;
            return (
              <button
                key={key}
                className={activeView === viewKey ? 'selected' : ''}
                onClick={() => setActiveView(viewKey)}
              >
                {COLLECTION_LABELS[key]}
              </button>
            );
          })}
        </div>
      </aside>

      <section className="content-area">{renderContent()}</section>
    </main>
  );
}
