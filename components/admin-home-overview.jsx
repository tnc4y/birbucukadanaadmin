'use client';

import { useEffect, useMemo, useState } from 'react';

import { COLLECTIONS, COLLECTION_LABELS } from '@/lib/collections';
import { getAnalyticsSummary } from '@/lib/analytics-api';
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
    onlineUsers: 0,
    topTeams: [],
    topAnnouncements: [],
    topAwards: [],
    topProjects: [],
    totalViews: {},
  });

  async function refresh() {
    setLoading(true);
    setError('');

    try {
      const [settings, logs, analytics, ...collectionResults] = await Promise.all([
        getSettings(),
        listAuditLogs(100),
        getAnalyticsSummary(),
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
        onlineUsers: analytics?.onlineUsers || 0,
        topTeams: analytics?.topTeams || [],
        topAnnouncements: analytics?.topAnnouncements || [],
        topAwards: analytics?.topAwards || [],
        topProjects: analytics?.topProjects || [],
        totalViews: analytics?.totalViews || {},
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İstatistikler alınamadı.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const cards = useMemo(
    () => [
      { label: 'Toplam İçerik Kaydı', value: stats.totalDocs },
      { label: 'Aktif Kayıt Sayısı', value: stats.visibleDocs },
      { label: 'Toplam İşlem Logu', value: stats.auditCount },
      { label: 'Online Kullanıcılar', value: stats.onlineUsers },
    ],
    [stats]
  );

  return (
    <section className="panel">
      <div className="actions">
        <h2>Ana Sayfa</h2>
        <button type="button" onClick={refresh}>
          İstatistikleri Yenile
        </button>
      </div>
      <p className="muted">Panelin genel durumunu buradan takip edebilirsiniz.</p>

      {loading ? <p className="muted">İstatistikler yükleniyor...</p> : null}
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
        <h3>Koleksiyon Dağılımı</h3>
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
        <h3>Görüntüleme İstatistikleri</h3>
        <div className="stats-grid compact">
          <div className="stat-mini">
            <span>Toplam Takım Görüntülemeleri</span>
            <strong>{stats.totalViews?.teams || 0}</strong>
          </div>
          <div className="stat-mini">
            <span>Toplam Duyuru Görüntülemeleri</span>
            <strong>{stats.totalViews?.announcements || 0}</strong>
          </div>
          <div className="stat-mini">
            <span>Toplam Ödül Görüntülemeleri</span>
            <strong>{stats.totalViews?.awards || 0}</strong>
          </div>
          <div className="stat-mini">
            <span>Toplam Proje Görüntülemeleri</span>
            <strong>{stats.totalViews?.projects || 0}</strong>
          </div>
        </div>
      </section>

      {stats.topTeams.length > 0 && (
        <section className="card">
          <h3>En Çok Görüntülenen Takımlar</h3>
          <div className="list">
            {stats.topTeams.map((team) => (
              <div key={team.teamId} className="list-item">
                <strong>{team.teamId}</strong>
                <span>{team.viewCount} görüntüleme</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {stats.topAnnouncements.length > 0 && (
        <section className="card">
          <h3>En Çok Görüntülenen Duyurular</h3>
          <div className="list">
            {stats.topAnnouncements.map((announcement) => (
              <div key={announcement.announcementId} className="list-item">
                <strong>{announcement.announcementId}</strong>
                <span>{announcement.viewCount} görüntüleme</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {stats.topAwards.length > 0 && (
        <section className="card">
          <h3>En Çok Görüntülenen Ödüller</h3>
          <div className="list">
            {stats.topAwards.map((award) => (
              <div key={award.awardId} className="list-item">
                <strong>{award.awardId}</strong>
                <span>{award.viewCount} görüntüleme</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {stats.topProjects.length > 0 && (
        <section className="card">
          <h3>En Çok Görüntülenen Projeler</h3>
          <div className="list">
            {stats.topProjects.map((project) => (
              <div key={project.projectId} className="list-item">
                <strong>{project.projectId}</strong>
                <span>{project.viewCount} görüntüleme</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <h3>Son İşlem</h3>
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
          <p className="muted">Henüz kayıtlı bir işlem yok.</p>
        )}
      </section>
    </section>
  );
}
