import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from 'firebase/firestore';

import { db } from './firebase';

export async function listCollection(name) {
  const snap = await getDocs(collection(db, name));
  return snap.docs.map((item) => ({ id: item.id, data: item.data() }));
}

export async function upsertCollectionDoc(name, id, data) {
  await setDoc(doc(db, name, id), data, { merge: true });
}

export async function removeCollectionDoc(name, id) {
  await deleteDoc(doc(db, name, id));
}

export async function getSettings() {
  const snap = await getDoc(doc(db, 'settings', 'app'));
  return snap.data() ?? {};
}

export async function upsertSettings(data) {
  await setDoc(doc(db, 'settings', 'app'), data, { merge: true });
}
