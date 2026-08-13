// ============================================================
// BLENDIFY — Storefront Shell
// Client wrapper that hides the storefront Navbar, Footer,
// and CartDrawer when on admin/* routes.
// This is the correct fix to prevent the storefront layout
// from bleeding into the admin panel.
// ============================================================
'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/layout/CartDrawer';

interface StorefrontShellProps {
  children: React.ReactNode;
}

export function StorefrontShell({ children }: StorefrontShellProps) {
  const pathname = usePathname();
  const isAdmin  = pathname.startsWith('/admin');

  if (isAdmin) {
    // Admin routes: render children directly — no Navbar, Footer, or paddingTop
    return <>{children}</>;
  }

  // Storefront routes: full Navbar + Footer + CartDrawer + paddingTop
  return (
    <>
      <Navbar />
      {/* 32px AnnouncementBar + 56px Navbar = 88px total offset */}
      <main style={{ paddingTop: '88px' }}>{children}</main>
      <Footer />
      <CartDrawer />
    </>
  );
}
