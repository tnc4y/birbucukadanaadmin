'use client';

import { AdminDashboard } from '@/components/admin-dashboard';
import { AuthGate } from '@/components/auth-gate';

export default function Page() {
  return (
    <AuthGate>
      <AdminDashboard />
    </AuthGate>
  );
}
