'use client';

import { useEffect, useMemo, useState } from 'react';

import { COLLECTIONS, COLLECTION_LABELS } from '@/lib/collections';
import { auth } from '@/lib/firebase';
import { getAnalyticsSummary } from '@/lib/analytics-api';
import { getSettings, listAuditLogs, listCollection, upsertCollectionDoc } from '@/lib/firestore-admin';

function formatDate(value) {
  if (!value?.seconds) return '-';
  return new Date(value.seconds * 1000).toLocaleString('tr-TR');
}

export function AdminHomeOverview() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [seeding, setSeeding] = useState(false);
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

  function actorInfo() {
    return {
      uid: auth.currentUser?.uid ?? '',
      email: auth.currentUser?.email ?? '',
    };
  }

  async function seedDemoData() {
    setSeeding(true);
    setError('');

    try {
      const actor = actorInfo();

      const settings = {
        appName: '1.5 Adana Teknoloji Takımları',
        aboutTitle: 'Hakkımızda',
        aboutContent:
          '1.5 Adana, öğrencilerin teknoloji üretmesini destekleyen takım ekosistemidir. Takımlarımız yıl boyunca proje geliştirir, yarışmalara hazırlanır ve mentorluk programlarına katılır.',
        contactEmail: 'iletisim@15adana.org',
        contactPhone: '+90 322 000 00 00',
        contactAddress: 'Adana Teknoloji Kampüsü, Çukurova / Adana',
        socialLinks: [
          { platform: 'Instagram', url: 'https://instagram.com/15adana', visible: true },
          { platform: 'YouTube', url: 'https://youtube.com/@15adana', visible: true },
          { platform: 'LinkedIn', url: 'https://linkedin.com/company/15adana', visible: true },
        ],
      };

      const teams = [
        {
          id: 'iha-takimi',
          data: {
            name: 'İHA Takımı',
            logoUrl: '',
            shortDescription: 'İnsansız hava aracı geliştiren takım.',
            description:
              'İHA Takımı, görüntü işleme ve otonom uçuş algoritmaları üzerine çalışır. TEKNOFEST hazırlık süreçlerinde aktif rol alır.',
            bannerUrl: '',
            homeOrder: 1,
            visible: true,
            socialLinks: [
              { platform: 'Instagram', url: 'https://instagram.com/iha15adana', visible: true },
            ],
          },
        },
        {
          id: 'roket-takimi',
          data: {
            name: 'Roket Takımı',
            logoUrl: '',
            shortDescription: 'Yüksek irtifa roket sistemleri geliştiren takım.',
            description:
              'Roket Takımı, yapısal tasarım, aviyonik ve telemetri alanlarında çalışır. Simülasyon tabanlı test altyapısı kurar.',
            bannerUrl: '',
            homeOrder: 2,
            visible: true,
            socialLinks: [
              { platform: 'YouTube', url: 'https://youtube.com/@roket15adana', visible: true },
            ],
          },
        },
        {
          id: 'yapay-zeka-takimi',
          data: {
            name: 'Yapay Zeka Takımı',
            logoUrl: '',
            shortDescription: 'Veri bilimi ve yapay zeka çözümleri üreten takım.',
            description:
              'Yapay Zeka Takımı, görüntü sınıflandırma, doğal dil işleme ve tahminleme modelleri geliştirir.',
            bannerUrl: '',
            homeOrder: 3,
            visible: true,
            socialLinks: [
              { platform: 'LinkedIn', url: 'https://linkedin.com/company/yz15adana', visible: true },
            ],
          },
        },
      ];

      const announcements = [
        {
          id: 'teknofest-hazirlik-2026',
          data: {
            title: 'TEKNOFEST 2026 Hazırlık Süreci Başladı',
            summary: 'Takım kayıtları ve çalışma takvimi yayınlandı.',
            content:
              'Bu dönem tüm takımlarımız için ortak çalışma planı açıldı. Mentor görüşmeleri ve atölye programları haftalık olarak yapılacaktır.',
            imageUrl: '',
            order: 1,
            visible: true,
            buttonText: 'Takvimi İncele',
            buttonUrl: 'https://15adana.org/takvim',
            isImportant: true,
            showAsPopup: true,
            popupDismissKey: 'teknofest-hazirlik-2026',
          },
        },
        {
          id: 'atolye-kayitlari-acildi',
          data: {
            title: 'Bahar Dönemi Atölye Kayıtları Açıldı',
            summary: 'Elektronik, yazılım ve proje yönetimi atölyeleri aktif.',
            content:
              'Atölyeler başlangıç, orta ve ileri seviye olarak planlandı. Katılım kontenjanları sınırlıdır.',
            imageUrl: '',
            order: 2,
            visible: true,
            buttonText: 'Kayıt Ol',
            buttonUrl: 'https://15adana.org/atolye',
            isImportant: false,
            showAsPopup: false,
            popupDismissKey: '',
          },
        },
        {
          id: 'demo-day-duyurusu',
          data: {
            title: 'Demo Day Etkinliği Duyurusu',
            summary: 'Takımlar projelerini jüriye sunacak.',
            content:
              'Dönem sonunda takımlarımız teknik sunumlar yapacak. Etkinlik herkese açıktır ve canlı yayınlanacaktır.',
            imageUrl: '',
            order: 3,
            visible: true,
            buttonText: 'Detaylar',
            buttonUrl: 'https://15adana.org/demo-day',
            isImportant: false,
            showAsPopup: false,
            popupDismissKey: '',
          },
        },
      ];

      const events = [
        {
          id: 'algoritma-atolyesi',
          data: {
            title: 'Algoritma ve Problem Çözme Atölyesi',
            description: 'Takımlar arası ortak algoritma çalışma günü.',
            tag: 'Genel',
            date: '2026-04-05',
            imageUrl: '',
            teamId: '',
            participationMode: 'link',
            participationUrl: 'https://15adana.org/etkinlik/algoritma-atolyesi',
            visible: true,
          },
        },
        {
          id: 'iha-ucus-test-gunu',
          data: {
            title: 'İHA Uçuş Test Günü',
            description: 'Saha ortamında test uçuşları ve telemetri doğrulaması.',
            tag: 'Takım',
            date: '2026-04-12',
            imageUrl: '',
            teamId: 'iha-takimi',
            participationMode: 'form',
            participationUrl: '',
            visible: true,
          },
        },
      ];

      const sponsors = [
        {
          id: 'adana-teknopark',
          data: {
            name: 'Adana Teknopark',
            logoUrl: '',
            website: 'https://adanateknopark.com',
            description: 'Genel destek sponsoru.',
            teamId: '',
            visible: true,
          },
        },
        {
          id: 'ucus-elektronik',
          data: {
            name: 'Uçuş Elektronik',
            logoUrl: '',
            website: 'https://ornek-sponsor.com',
            description: 'İHA Takımı bileşen desteği.',
            teamId: 'iha-takimi',
            visible: true,
          },
        },
      ];

      const competitions = [
        {
          id: 'teknofest-iha-2025',
          data: {
            title: 'TEKNOFEST İHA Yarışması',
            performance: 'Finalist',
            year: '2025',
            teamId: 'iha-takimi',
            imageUrl: '',
            visible: true,
          },
        },
        {
          id: 'model-roket-2025',
          data: {
            title: 'Model Roket Yarışması',
            performance: 'Türkiye 7.si',
            year: '2025',
            teamId: 'roket-takimi',
            imageUrl: '',
            visible: true,
          },
        },
      ];

      const projects = [
        {
          id: 'otonom-ucus-asistani',
          data: {
            title: 'Otonom Uçuş Asistanı',
            description: 'Uçuş sırasında rota takibi ve güvenli iniş desteği.',
            teamId: 'iha-takimi',
            mediaUrl: '',
            repoUrl: 'https://github.com/15adana/otonom-ucus-asistani',
            visible: true,
          },
        },
        {
          id: 'gorus-tabani-hedef-tespit',
          data: {
            title: 'Görüş Tabanlı Hedef Tespit',
            description: 'Gerçek zamanlı nesne algılama ve sınıflandırma sistemi.',
            teamId: 'yapay-zeka-takimi',
            mediaUrl: '',
            repoUrl: 'https://github.com/15adana/hedef-tespit',
            visible: true,
          },
        },
      ];

      const awards = [
        {
          id: 'yenilikci-proje-odulu',
          data: {
            title: 'Yenilikçi Proje Ödülü',
            description: 'Otonom uçuş güvenliği alanındaki katkılar nedeniyle verildi.',
            projectName: 'Otonom Uçuş Asistanı',
            teamId: 'iha-takimi',
            mediaUrl: '',
            year: '2025',
            visible: true,
          },
        },
        {
          id: 'juri-ozel-odulu',
          data: {
            title: 'Jüri Özel Ödülü',
            description: 'Yapay zeka destekli tespit projesiyle alındı.',
            projectName: 'Görüş Tabanlı Hedef Tespit',
            teamId: 'yapay-zeka-takimi',
            mediaUrl: '',
            year: '2025',
            visible: true,
          },
        },
      ];

      await upsertCollectionDoc('settings', 'app', settings, {
        actor,
        beforeData: null,
      });

      const tasks = [
        ...teams.map((row) => upsertCollectionDoc('teams', row.id, row.data, { actor, beforeData: null })),
        ...announcements.map((row) =>
          upsertCollectionDoc('announcements', row.id, row.data, { actor, beforeData: null })
        ),
        ...events.map((row) => upsertCollectionDoc('events', row.id, row.data, { actor, beforeData: null })),
        ...sponsors.map((row) => upsertCollectionDoc('sponsors', row.id, row.data, { actor, beforeData: null })),
        ...competitions.map((row) =>
          upsertCollectionDoc('competitions', row.id, row.data, { actor, beforeData: null })
        ),
        ...projects.map((row) => upsertCollectionDoc('projects', row.id, row.data, { actor, beforeData: null })),
        ...awards.map((row) => upsertCollectionDoc('awards', row.id, row.data, { actor, beforeData: null })),
      ];

      await Promise.all(tasks);
      await refresh();
    } catch (seedError) {
      setError(seedError instanceof Error ? seedError.message : 'Demo veriler yüklenemedi.');
    } finally {
      setSeeding(false);
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
        <button type="button" onClick={seedDemoData} disabled={seeding}>
          {seeding ? 'Demo Veriler Yükleniyor...' : 'Demo Veri Yükle'}
        </button>
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
        <h3>İçerik Dağılımı</h3>
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
