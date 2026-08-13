// ============================================================
// BLENDIFY — Admin Header (Luxury Redesign)
// Features: Quick Create, Global Search (⌘K), Theme Toggle,
//           Store Status, Online Indicator, Recent Activity,
//           Keyboard Shortcuts, User Dropdown
// ============================================================
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Menu, Search, ExternalLink, LogOut, Sun, Moon,
  Bell, Plus, Activity, Settings, User, ChevronDown,
  Zap, Tag, Mail, Gift, Star, Package,
  Check, AlertCircle, ShoppingCart, TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { GlobalSearch } from '@/components/admin/ui/GlobalSearch';

// ─── Quick Create items ────────────────────────────────────
const QUICK_CREATE = [
  { icon: Tag,         label: 'New Coupon',        href: '/admin/coupons' },
  { icon: Zap,         label: 'New Flash Sale',    href: '/admin/flash-sales' },
  { icon: Mail,        label: 'New Campaign',      href: '/admin/email-campaigns' },
  { icon: Gift,        label: 'New Gift Card',     href: '/admin/gift-cards' },
  { icon: Package,     label: 'New Bundle',        href: '/admin/bundles' },
  { icon: Star,        label: 'Manage Reviews',    href: '/admin/reviews' },
];

// ─── Recent activities (static demo — replace with real API) ─
const RECENT_ACTIVITIES = [
  { type: 'success', icon: Check,         label: 'Coupon BREW20 activated',      time: '2m ago' },
  { type: 'info',    icon: ShoppingCart,  label: '14 new orders received',        time: '8m ago' },
  { type: 'warning', icon: AlertCircle,   label: '3 reviews pending approval',    time: '15m ago' },
  { type: 'success', icon: TrendingUp,    label: 'Flash sale started: Summer',    time: '1h ago' },
  { type: 'info',    icon: Mail,          label: 'Email campaign sent (1.2k)',    time: '3h ago' },
];

interface AdminHeaderProps {
  onToggleSidebar: () => void;
  onMobileMenuOpen: () => void;
  breadcrumb?: { label: string; href?: string }[];
  userInitials?: string;
  userName?: string;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export function AdminHeader({
  onToggleSidebar,
  onMobileMenuOpen,
  breadcrumb = [],
  userInitials = 'AD',
  userName = 'Admin',
  isDark = false,
  onToggleTheme,
}: AdminHeaderProps) {
  const [searchOpen,       setSearchOpen]       = useState(false);
  const [quickCreateOpen,  setQuickCreateOpen]  = useState(false);
  const [activityOpen,     setActivityOpen]     = useState(false);
  const [userMenuOpen,     setUserMenuOpen]      = useState(false);
  const [isOnline,         setIsOnline]          = useState(true);

  const quickCreateRef = useRef<HTMLDivElement>(null);
  const activityRef    = useRef<HTMLDivElement>(null);
  const userMenuRef    = useRef<HTMLDivElement>(null);

  // ── Keyboard shortcuts ─────────────────────────────────────
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setSearchOpen(true);
    }
    if (e.key === 'Escape') {
      setSearchOpen(false);
      setQuickCreateOpen(false);
      setActivityOpen(false);
      setUserMenuOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ── Click-outside to close dropdowns ──────────────────────
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (quickCreateRef.current && !quickCreateRef.current.contains(e.target as Node)) {
        setQuickCreateOpen(false);
      }
      if (activityRef.current && !activityRef.current.contains(e.target as Node)) {
        setActivityOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Online status tracking ────────────────────────────────
  useEffect(() => {
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });

  return (
    <>
      <header className="admin-header" role="banner">

        {/* ── Mobile menu toggle ─────────────────────────── */}
        <button
          className="admin-header-toggle"
          onClick={onMobileMenuOpen}
          aria-label="Open navigation"
          style={{ display: 'flex' }}
          id="admin-mobile-menu-btn"
        >
          <Menu size={18} />
        </button>

        {/* ── Desktop sidebar toggle ─────────────────────── */}
        <button
          className="admin-header-toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          id="admin-sidebar-toggle-btn"
          style={{ marginRight: 4 }}
        >
          <Menu size={18} />
        </button>

        {/* ── Breadcrumb ────────────────────────────────── */}
        <nav className="admin-breadcrumb" aria-label="Breadcrumb">
          <Link
            href="/admin/dashboard"
            style={{ color: 'var(--admin-text-tertiary)', fontSize: '13px', transition: 'color 150ms' }}
            aria-label="Admin Home"
          >
            BLENDIFY
          </Link>
          {breadcrumb.map((crumb, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="admin-breadcrumb-sep" aria-hidden="true">/</span>
              {crumb.href && i < breadcrumb.length - 1 ? (
                <Link
                  href={crumb.href}
                  style={{ color: 'var(--admin-text-tertiary)', fontSize: '13px' }}
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="admin-breadcrumb-current" aria-current="page">
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>

        {/* ── Date display ─────────────────────────────────── */}
        <span
          style={{
            fontSize: '12px', color: 'var(--admin-text-disabled)',
            whiteSpace: 'nowrap', flexShrink: 0,
            display: 'flex', alignItems: 'center',
          }}
          className="admin-date-display"
          aria-label={`Today is ${today}`}
        >
          {today}
        </span>

        {/* ── Right actions ─────────────────────────────────── */}
        <div className="admin-header-actions" role="toolbar" aria-label="Header actions">

          {/* Store status */}
          <div
            className="admin-store-status"
            title={isOnline ? 'Store is live' : 'Store is offline'}
            role="status"
            aria-live="polite"
          >
            <span className="admin-store-status-dot" aria-hidden="true" />
            <span style={{ fontSize: '11px', fontWeight: 600 }}>
              {isOnline ? 'Live' : 'Offline'}
            </span>
          </div>

          {/* Global search */}
          <button
            className="admin-header-search-btn"
            onClick={() => setSearchOpen(true)}
            aria-label="Open global search (Ctrl+K)"
            id="admin-global-search-btn"
          >
            <Search size={13} aria-hidden="true" />
            <span className="search-label-desktop" style={{ fontSize: '12px', color: 'var(--admin-text-tertiary)' }}>
              Search…
            </span>
            <kbd aria-label="Keyboard shortcut Control K">⌘K</kbd>
          </button>

          {/* Quick Create */}
          <div style={{ position: 'relative' }} ref={quickCreateRef}>
            <button
              className="admin-quick-create-btn"
              onClick={() => { setQuickCreateOpen((v) => !v); setActivityOpen(false); setUserMenuOpen(false); }}
              aria-label="Quick create"
              aria-expanded={quickCreateOpen}
              aria-haspopup="menu"
              id="admin-quick-create-btn"
            >
              <Plus size={15} aria-hidden="true" />
              <span>Create</span>
            </button>

            {quickCreateOpen && (
              <div className="admin-header-dropdown" role="menu" aria-label="Quick create options">
                <div className="admin-header-dropdown-label">Quick Create</div>
                {QUICK_CREATE.map(({ icon: Icon, label, href }) => (
                  <Link
                    key={href}
                    href={href}
                    className="admin-header-dropdown-item"
                    role="menuitem"
                    onClick={() => setQuickCreateOpen(false)}
                  >
                    <Icon size={14} style={{ color: 'var(--admin-accent)', flexShrink: 0 }} aria-hidden="true" />
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button
            className="admin-theme-btn"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Light mode' : 'Dark mode'}
            id="admin-theme-toggle-btn"
          >
            {isDark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
          </button>

          {/* Activity / Notifications */}
          <div style={{ position: 'relative' }} ref={activityRef}>
            <button
              className="admin-icon-btn"
              onClick={() => { setActivityOpen((v) => !v); setQuickCreateOpen(false); setUserMenuOpen(false); }}
              aria-label={`Recent activity (${RECENT_ACTIVITIES.length} items)`}
              aria-expanded={activityOpen}
              aria-haspopup="dialog"
              id="admin-activity-btn"
            >
              <Bell size={16} aria-hidden="true" />
              {RECENT_ACTIVITIES.length > 0 && (
                <span className="admin-notif-dot" aria-hidden="true" />
              )}
            </button>

            {activityOpen && (
              <div
                className="admin-header-dropdown"
                style={{ minWidth: 320 }}
                role="dialog"
                aria-label="Recent activity"
              >
                <div className="admin-header-dropdown-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 16 }}>
                  Recent Activity
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--admin-accent)', cursor: 'pointer' }}>
                    Mark all read
                  </span>
                </div>

                {RECENT_ACTIVITIES.map((act, i) => {
                  const Icon = act.icon;
                  return (
                    <div key={i} className="admin-activity-item" role="listitem">
                      <div className={`admin-activity-icon ${act.type}`} aria-hidden="true">
                        <Icon size={13} />
                      </div>
                      <div className="admin-activity-content">
                        <div className="admin-activity-title">{act.label}</div>
                        <div className="admin-activity-time">{act.time}</div>
                      </div>
                    </div>
                  );
                })}

                <div className="admin-header-dropdown-divider" />
                <Link
                  href="/admin/dashboard"
                  className="admin-header-dropdown-item"
                  onClick={() => setActivityOpen(false)}
                  style={{ justifyContent: 'center', color: 'var(--admin-accent)', fontWeight: 600, fontSize: '12px' }}
                >
                  <Activity size={13} />
                  View all activity
                </Link>
              </div>
            )}
          </div>

          {/* Store external link */}
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-icon-btn"
            title="View storefront"
            aria-label="View storefront (opens in new tab)"
            id="admin-store-link-btn"
          >
            <ExternalLink size={16} aria-hidden="true" />
          </Link>

          {/* User menu */}
          <div style={{ position: 'relative' }} ref={userMenuRef}>
            <button
              className="admin-avatar"
              onClick={() => { setUserMenuOpen((v) => !v); setQuickCreateOpen(false); setActivityOpen(false); }}
              aria-label={`User menu for ${userName}`}
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
              id="admin-user-menu-btn"
            >
              {userInitials}
            </button>

            {userMenuOpen && (
              <div
                className="admin-header-dropdown"
                style={{ minWidth: 220 }}
                role="menu"
                aria-label={`Menu for ${userName}`}
              >
                {/* User info */}
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--admin-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #C47C0A, #581312)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700, color: '#FAF0E6',
                    }}>
                      {userInitials}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                        {userName}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--admin-text-tertiary)' }}>
                        Administrator
                      </div>
                    </div>
                    {/* Online indicator */}
                    <div
                      style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--admin-success)', marginLeft: 'auto', flexShrink: 0 }}
                      title="Online"
                      aria-label="Status: Online"
                    />
                  </div>
                </div>

                <div className="admin-header-dropdown-label">Account</div>
                <button
                  className="admin-header-dropdown-item"
                  role="menuitem"
                  onClick={() => { setUserMenuOpen(false); onToggleTheme?.(); }}
                >
                  {isDark ? <Sun size={14} aria-hidden="true" /> : <Moon size={14} aria-hidden="true" />}
                  {isDark ? 'Light Mode' : 'Dark Mode'}
                </button>

                <div className="admin-header-dropdown-divider" />

                {/* Keyboard shortcuts hint */}
                <div style={{ padding: '8px 16px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--admin-text-disabled)', marginBottom: 6 }}>
                    Shortcuts
                  </div>
                  {[
                    { keys: '⌘K', label: 'Global Search' },
                    { keys: '↑↓', label: 'Navigate Sidebar' },
                  ].map(({ keys, label }) => (
                    <div
                      key={label}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}
                    >
                      <span style={{ fontSize: '12px', color: 'var(--admin-text-tertiary)' }}>{label}</span>
                      <kbd style={{
                        fontFamily: 'var(--admin-font-mono)', fontSize: '10px',
                        background: 'var(--admin-surface-raised)', border: '1px solid var(--admin-border-strong)',
                        borderRadius: 4, padding: '1px 6px', color: 'var(--admin-text-secondary)',
                      }}>
                        {keys}
                      </kbd>
                    </div>
                  ))}
                </div>

                <div className="admin-header-dropdown-divider" />

                <Link
                  href="/api/auth/logout"
                  className="admin-header-dropdown-item danger"
                  role="menuitem"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <LogOut size={14} aria-hidden="true" />
                  Sign Out
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Global Search Modal ──────────────────────────── */}
      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
    </>
  );
}
