// ============================================================
// BLENDIFY — Admin Layout (Route Group: (admin))
// Isolated from storefront — no Navbar, Footer, or CartDrawer.
// Auth guard applied on every server render.
// ============================================================
import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/layout/AdminShell';
import { requireAdminAccess } from '@/lib/admin-guard';
import '@/app/admin.css';

export const metadata: Metadata = {
  title: {
    default: 'Admin | BLENDIFY',
    template: '%s — BLENDIFY Admin',
  },
  description: 'BLENDIFY Admin Console',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // requireAdminAccess redirects to /sign-in if unauthenticated, throws ForbiddenError if not admin
  const user = await requireAdminAccess();

  const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email;
  const initials = fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <AdminShell
      userInitials={initials}
      userName={fullName}
    >
      {children}
    </AdminShell>
  );
}
