'use client';

import { useEffect, useState } from 'react';

import { listAuditLogs } from '@/lib/firestore-admin';

function formatTime(value) {
  if (!value?.seconds) return '-';
  return new Date(value.seconds * 1000).toLocaleString('tr-TR');
}

function describe(item) {
  const actionMap = {
    create: 'EKLEDI',
    update: 'DUZENLEDI',
    delete: 'SILDI',
  };
  const action = actionMap[item?.action] ?? item?.action ?? 'ISLEM';
  return `${action} / ${item?.collectionName ?? '-'} / ${item?.docId ?? '-'}`;
}

export function AuditLogPanel() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function refresh() {
    setLoading(true);
    setError('');

    try {
      const result = await listAuditLogs(100);
      setLogs(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Loglar alinamadi.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <section className="panel">
      <div className="actions">
        <h2>Son Islem Kayitlari</h2>
        <button type="button" onClick={refresh}>
          Yenile
        </button>
      </div>
      <div className="card">
        {loading ? <p className="muted">Yukleniyor...</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {!loading && !error && logs.length === 0 ? <p className="muted">Henuz log kaydi yok.</p> : null}
        {logs.length > 0 ? (
          <div className="log-list">
            {logs.map((log) => (
              <div key={log.id} className="log-item">
                <strong>{describe(log.data)}</strong>
                <small>
                  {log.data?.actor?.email || '-'} | {formatTime(log.data?.createdAt)}
                </small>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
