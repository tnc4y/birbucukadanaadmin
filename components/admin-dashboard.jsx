'use client';

import { useState } from 'react';

import { COLLECTIONS, COLLECTION_LABELS } from '@/lib/collections';
import { AdminHomeOverview } from './admin-home-overview';
import { AuditLogPanel } from './audit-log-panel';
import { CollectionEditor } from './collection-editor';
import { PrivacyPolicyEditor } from './privacy-policy-editor';
import { SettingsEditor } from './settings-editor';

export function AdminDashboard() {
  const [activeView, setActiveView] = useState('home');

  const mainMenu = [
    { key: 'home', label: 'Genel Bakış' },
    { key: 'settings', label: 'Uygulama Ayarları' },
    { key: 'privacy', label: 'Gizlilik Politikası', href: '/privacy-policy' },
    { key: 'logs', label: 'İşlem Kayıtları' },
  ];

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

    if (activeView === 'privacy') {
      return <PrivacyPolicyEditor />;
    }

    if (activeView.startsWith('collection:')) {
      const collection = activeView.replace('collection:', '');
      return <CollectionEditor collection={collection} />;
    }

    return <AdminHomeOverview />;
  }

  return (
    <main className="dashboard dashboard-shell">
      <aside className="card side-menu">
        <h3>Yönetim</h3>
        <div className="menu-list">
          {mainMenu.map((item) => (
            <div key={item.key} className="menu-item-row">
              <button
                className={activeView === item.key ? 'selected' : ''}
                onClick={() => setActiveView(item.key)}
              >
                {item.label}
              </button>
              {item.href ? (
                <a className="menu-inline-link" href={item.href} target="_blank" rel="noreferrer" aria-label="Gizlilik politikasını aç">
                  Ac
                </a>
              ) : null}
            </div>
          ))}
        </div>

        <h3>İçerikler</h3>
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
