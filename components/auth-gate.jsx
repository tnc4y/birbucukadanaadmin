'use client';

import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';

import { auth } from '@/lib/firebase';

const allowedUids = (process.env.NEXT_PUBLIC_ALLOWED_ADMIN_UIDS ?? '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

function isAllowed(user) {
  if (!user) return false;
  if (allowedUids.length === 0) return true;
  return allowedUids.includes(user.uid);
}

export function AuthGate({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
  }, []);

  const authorized = useMemo(() => isAllowed(user), [user]);

  async function onSubmit(event) {
    event.preventDefault();
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş başarısız.');
    }
  }

  if (loading) {
    return <div className="center">Yükleniyor...</div>;
  }

  if (!authorized) {
    return (
      <div className="auth-wrap">
        <form onSubmit={onSubmit} className="card">
          <h1>Admin Giriş</h1>
          <label>
            E-posta
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </label>
          <label>
            Şifre
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button type="submit">Giriş Yap</button>
        </form>
      </div>
    );
  }

  return (
    <>
      <div className="topbar">
        <div />
        <div className="topbar-right">
          <span className="topbar-title">1.5Adana Mobil Uygulama Yönetim Paneli</span>
          <span className="topbar-profile">{user?.email}</span>
          <button onClick={() => signOut(auth)}>Çıkış</button>
        </div>
      </div>
      {children}
    </>
  );
}
