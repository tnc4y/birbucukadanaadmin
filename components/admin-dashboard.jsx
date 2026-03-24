'use client';

import { useEffect, useState } from 'react';

import { COLLECTIONS, COLLECTION_LABELS } from '@/lib/collections';
import { AdminHomeOverview } from './admin-home-overview';
import { AuditLogPanel } from './audit-log-panel';
import { CollectionEditor } from './collection-editor';
import { PrivacyPolicyEditor } from './privacy-policy-editor';
import { SettingsEditor } from './settings-editor';
import { getSettings } from '@/lib/firestore-admin';

export function AdminDashboard() {
  const [activeView, setActiveView] = useState('home');
  const [brand, setBrand] = useState({
    appName: '1.5 Adana',
    adminLogoUrl: '',
  });

  const mainMenu = [
    { key: 'home', label: 'Genel Bakış' },
    { key: 'settings', label: 'Uygulama Ayarları' },
    { key: 'privacy', label: 'Gizlilik Politikası' },
    { key: 'logs', label: 'İşlem Kayıtları' },
  ];

  useEffect(() => {
    getSettings()
      .then((settings) => {
        setBrand({
          appName: settings?.appName || '1.5 Adana',
          adminLogoUrl: settings?.adminLogoUrl || '',
        });
      })
      .catch(() => {});
  }, []);

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
      <section className="hero card">
        <div className="hero-brand">
          {brand.adminLogoUrl ? (
            <img src={brand.adminLogoUrl} alt="Panel logosu" className="hero-logo" />
          ) : null}
          <div>
            <h2>{brand.appName} Yönetim Paneli</h2>
            <p className="muted">
              İçerikleri, uygulama ayarlarını ve gizlilik politikasını tek yerden kolayca yönetin.
            </p>
          </div>
        </div>
      </section>

      <aside className="card side-menu">
        <h3>Yönetim</h3>
        <div className="menu-list">
          {mainMenu.map((item) => (
            <button
              key={item.key}
              className={activeView === item.key ? 'selected' : ''}
              onClick={() => setActiveView(item.key)}
            >
              {item.label}
            </button>
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
