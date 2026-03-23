'use client';

import { useEffect, useMemo, useState } from 'react';

import { COLLECTIONS, COLLECTION_LABELS } from '@/lib/collections';
import { getSettings, listAuditLogs, listCollection } from '@/lib/firestore-admin';

function formatDate(value) {
  if (!value?.seconds) return '-';
  return new Date(value.seconds * 1000).toLocaleString('tr-TR');
}

export function AdminHomeOverview() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    collectionCounts: {},
    totalDocs: 0,
    visibleDocs: 0,
    appName: '-',
    auditCount: 0,
    lastAudit: null,
  });

  async function refresh() {
    setLoading(true);
    setError('');

    try {
      const [settings, logs, ...collectionResults] = await Promise.all([
        getSettings(),
        listAuditLogs(100),
        ...COLLECTIONS.map((name) => listCollection(name)),
      ]);

      const collectionCounts = {};
      let totalDocs = 0;
      let visibleDocs = 0;

      COLLECTIONS.forEach((name, index) => {
        const rows = collectionResults[index] ?? [];
        collectionCounts[name] = rows.length;
        totalDocs += rows.length;
        visibleDocs += rows.filter((item) => item?.data?.visible !== false).length;
      });

      setStats({
        collectionCounts,
        totalDocs,
        visibleDocs,
        appName: settings?.appName || '1.5 Adana',
        auditCount: logs.length,
        lastAudit: logs[0]?.data ?? null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Istatistikler alinamadi.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const cards = useMemo(
    () => [
      { label: 'Toplam Icerik Kaydi', value: stats.totalDocs },
      { label: 'Aktif Kayit Sayisi', value: stats.visibleDocs },
      { label: 'Toplam Islem Logu', value: stats.auditCount },
      { label: 'Uygulama Adi', value: stats.appName },
    ],
    [stats]
  );

  return (
    <section className="panel">
      <div className="actions">
        <h2>Ana Sayfa</h2>
        <button type="button" onClick={refresh}>
          Istatistikleri Yenile
        </button>
      </div>
      <p className="muted">Panelin genel durumunu buradan takip edebilirsiniz.</p>

      {loading ? <p className="muted">Istatistikler yukleniyor...</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="stats-grid">
        {cards.map((card) => (
          <article key={card.label} className="card stat-card">
            <p className="muted">{card.label}</p>
            <strong className="stat-value">{card.value}</strong>
          </article>
        ))}
      </div>

      <section className="card">
        <h3>Koleksiyon Dagilimi</h3>
        <div className="stats-grid compact">
          {COLLECTIONS.map((name) => (
            <div key={name} className="stat-mini">
              <span>{COLLECTION_LABELS[name]}</span>
              <strong>{stats.collectionCounts[name] ?? 0}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>Son Islem</h3>
        {stats.lastAudit ? (
          <>
            <p>
              <strong>{stats.lastAudit?.actor?.email || '-'}</strong> | {stats.lastAudit?.action || '-'}
            </p>
            <p className="muted">
              {stats.lastAudit?.collectionName || '-'} / {stats.lastAudit?.docId || '-'} |{' '}
              {formatDate(stats.lastAudit?.createdAt)}
            </p>
          </>
        ) : (
          <p className="muted">Henuz kayitli bir islem yok.</p>
        )}
      </section>
    </section>
  );
}
