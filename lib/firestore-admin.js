import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { db } from './firebase';

export async function listCollection(name) {
  const snap = await getDocs(collection(db, name));
  return snap.docs.map((item) => ({ id: item.id, data: item.data() }));
}

function cleanForLog(value) {
  if (value === undefined) return null;
  return value;
}

export async function createAuditLog({
  action,
  collectionName,
  docId,
  actor,
  beforeData = null,
  afterData = null,
  source = 'admin-panel',
}) {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      action,
      collectionName,
      docId,
      source,
      actor: {
        uid: actor?.uid ?? '',
        email: actor?.email ?? '',
      },
      beforeData: cleanForLog(beforeData),
      afterData: cleanForLog(afterData),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    // Icerik kaydi basariliysa log hatasi islemi bloklamasin.
    console.error('Audit log yazilamadi:', error);
  }
}

export async function upsertCollectionDoc(name, id, data, options = {}) {
  const beforeData = options.beforeData ?? null;
  const action = beforeData ? 'update' : 'create';

  await setDoc(doc(db, name, id), data, { merge: true });

  await createAuditLog({
    action,
    collectionName: name,
    docId: id,
    actor: options.actor,
    beforeData,
    afterData: data,
  });
}

export async function removeCollectionDoc(name, id, options = {}) {
  await deleteDoc(doc(db, name, id));

  await createAuditLog({
    action: 'delete',
    collectionName: name,
    docId: id,
    actor: options.actor,
    beforeData: options.beforeData ?? null,
    afterData: null,
  });
}

export async function getSettings() {
  const snap = await getDoc(doc(db, 'settings', 'app'));
  return snap.data() ?? {};
}

export async function upsertSettings(data, options = {}) {
  const beforeData = options.beforeData ?? null;
  const action = beforeData ? 'update' : 'create';

  await setDoc(doc(db, 'settings', 'app'), data, { merge: true });

  await createAuditLog({
    action,
    collectionName: 'settings',
    docId: 'app',
    actor: options.actor,
    beforeData,
    afterData: data,
  });
}

export async function listAuditLogs(maxItems = 100) {
  const q = query(collection(db, 'audit_logs'), orderBy('createdAt', 'desc'), limit(maxItems));
  const snap = await getDocs(q);
  return snap.docs.map((item) => ({ id: item.id, data: item.data() }));
}
