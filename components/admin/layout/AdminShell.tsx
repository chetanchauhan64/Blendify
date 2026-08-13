// ============================================================
// BLENDIFY — Admin Shell (Client Layout Wrapper)
// Manages sidebar collapsed state, mobile open, theme toggle.
// ============================================================
'use client';

import { useState, useEffect } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { ToastProvider } from '@/components/admin/ui/Toast';

interface AdminShellProps {
  children: React.ReactNode;
  breadcrumb?: { label: string; href?: string }[];
  userInitials?: string;
  userName?: string;
  pendingReviews?: number;
}

export function AdminShell({
  children,
  breadcrumb,
  userInitials = 'AD',
  userName = 'Admin',
  pendingReviews,
}: AdminShellProps) {
  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDark,     setIsDark]     = useState(false);

  // ── Restore persisted preferences on mount ──────────────
  useEffect(() => {
    try {
      const storedCollapsed = localStorage.getItem('admin-sidebar-collapsed');
      const storedDark      = localStorage.getItem('admin-theme-dark');
      if (storedCollapsed === 'true') setCollapsed(true);
      if (storedDark      === 'true') setIsDark(true);
    } catch { /* ignore */ }
  }, []);

  // ── Toggle sidebar ────────────────────────────────────────
  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem('admin-sidebar-collapsed', String(next)); } catch { /* ignore */ }
  };

  // ── Toggle theme ──────────────────────────────────────────
  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    try { localStorage.setItem('admin-theme-dark', String(next)); } catch { /* ignore */ }
  };

  // ── Close mobile sidebar on route change ─────────────────
  useEffect(() => { setMobileOpen(false); }, [breadcrumb]);

  return (
    // suppressHydrationWarning prevents React mismatch from localStorage reads
    <div
      className={`admin-shell${isDark ? ' admin-dark' : ''}`}
      suppressHydrationWarning
    >
      <div className={`admin-layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <AdminSidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
          pendingReviews={pendingReviews}
          userInitials={userInitials}
          userName={userName}
        />
        <AdminHeader
          onToggleSidebar={toggleCollapsed}
          onMobileMenuOpen={() => setMobileOpen(true)}
          breadcrumb={breadcrumb}
          userInitials={userInitials}
          userName={userName}
          isDark={isDark}
          onToggleTheme={toggleTheme}
        />
        <main className="admin-main" id="admin-main-content" role="main">
          {children}
        </main>
      </div>
      <ToastProvider />
    </div>
  );
}
