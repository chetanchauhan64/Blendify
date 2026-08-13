// ============================================================
// BLENDIFY — Admin Dashboard Page
// /admin/dashboard
// ============================================================
import type { Metadata } from 'next';
import { AdminDashboardClient } from './DashboardClient';

export const metadata: Metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

export default function AdminDashboardPage() {
  return <AdminDashboardClient />;
}
