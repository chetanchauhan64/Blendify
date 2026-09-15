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

  const isHome   = pathname === '/';

  // Storefront routes: full Navbar + Footer + CartDrawer
  // On homepage: 32px (just AnnouncementBar) so hero starts directly below it with 0 white gap
  // On subpages: 88px (32px AnnouncementBar + 56px Navbar) so content is not obscured
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: isHome ? '0' : '88px', width: '100%', margin: 0 }}>
        {children}
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}
