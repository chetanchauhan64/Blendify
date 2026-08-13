// ============================================================
// BLENDIFY — Admin Layout (Route Group: (admin))
// Isolated from storefront — no Navbar, Footer, or CartDrawer.
//
// Public admin pages (/admin/sign-in, /admin/unauthorized):
//   Detected via the x-admin-public header set by proxy.ts.
//   These pages render their children directly — no AdminShell,
//   no requireAdminAccess() call.
//
// Protected admin pages (everything else under /admin/*):
//   requireAdminAccess() is called on every render.
//   Unauthenticated  → redirected to /admin/sign-in
//   Non-admin role   → redirected to /admin/unauthorized
// ============================================================
import type { Metadata } from 'next';
import { headers } from 'next/headers';
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
  const headersList = await headers();

  // The proxy sets x-admin-public: true for /admin/sign-in and
  // /admin/unauthorized so they can render without auth or AdminShell.
  const isPublicAdminPage = headersList.get('x-admin-public') === 'true';

  if (isPublicAdminPage) {
    return <>{children}</>;
  }

  // Protected admin pages: verify the session and ADMIN role.
  // requireAdminAccess() redirects to /admin/sign-in if unauthenticated,
  // or to /admin/unauthorized if the role is not ADMIN/SUPER_ADMIN.
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
