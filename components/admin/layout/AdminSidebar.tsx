// ============================================================
// BLENDIFY — Admin Sidebar (Premium Coffee Brand UX)
// ✓ Collapsible section groups with localStorage memory
// ✓ Smooth expand/collapse animations (200ms)
// ✓ CSS tooltips when collapsed
// ✓ Coffee-themed Lucide icons per item
// ✓ Active glow + left accent bar
// ✓ Ripple on click
// ✓ Full Phase 1 + Phase 2 modules support
// ============================================================
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, ShoppingBag, ShoppingCart, UserCheck, Star,
  Tag, Zap, Flame, Package2, Gift,
  Coins, Users,
  Mail, Bell, Newspaper,
  Megaphone, Image, Layers,
  ExternalLink, Settings, LogOut,
  ChevronDown, Circle,
  Store, Building2, Receipt, Truck, Globe, Languages, CreditCard,
  FileText, Search, FileCode, Network, Share2, Home, Menu, Layout,
  File, FolderTree, HelpCircle, Users2, Palette, FileImage, Plug,
  ShieldAlert, Flag, ShieldCheck, History, Activity, FileTerminal,
  Key, Webhook, Database, Code2, HeartPulse, Sliders, Shield
} from 'lucide-react';
import { signOut } from '@/lib/actions/auth';

// ─── Nav structure ─────────────────────────────────────────────
const NAV_GROUPS = [
  {
    id: 'overview',
    label: 'Overview',
    defaultOpen: true,
    items: [
      { icon: LayoutDashboard, label: 'Dashboard',   href: '/admin/dashboard', tooltip: 'Dashboard' },
      { icon: ShoppingBag,     label: 'Products',    href: '/admin/products',  tooltip: 'Products' },
      { icon: ShoppingCart,    label: 'Orders',      href: '/admin/orders',    tooltip: 'Orders' },
      { icon: Users,           label: 'Customers',   href: '/admin/customers', tooltip: 'Customers' },
    ],
  },
  {
    id: 'store_config',
    label: 'Store Management',
    defaultOpen: false,
    items: [
      { icon: Store,       label: 'Store Settings',     href: '/admin/settings',          tooltip: 'Store Settings' },
      { icon: Building2,   label: 'Business Info',      href: '/admin/business-info',     tooltip: 'Business Info' },
      { icon: Receipt,     label: 'Tax Rules',          href: '/admin/tax-config',        tooltip: 'Tax Rules' },
      { icon: Truck,       label: 'Shipping',           href: '/admin/shipping',          tooltip: 'Shipping' },
      { icon: Globe,       label: 'Countries & Regions',href: '/admin/countries',         tooltip: 'Countries' },
      { icon: Coins,       label: 'Currencies',         href: '/admin/currencies',        tooltip: 'Currencies' },
      { icon: Languages,   label: 'Languages',          href: '/admin/languages',         tooltip: 'Languages' },
      { icon: CreditCard,  label: 'Payment Gateways',   href: '/admin/payment-gateways',  tooltip: 'Payments' },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing & Sales',
    defaultOpen: false,
    items: [
      { icon: Tag,      label: 'Coupons',        href: '/admin/coupons',        tooltip: 'Coupons' },
      { icon: Zap,      label: 'Discounts',       href: '/admin/discounts',      tooltip: 'Discounts' },
      { icon: Flame,    label: 'Flash Sales',     href: '/admin/flash-sales',    tooltip: 'Flash Sales' },
      { icon: Package2, label: 'Bundles',         href: '/admin/bundles',        tooltip: 'Bundles' },
      { icon: Gift,     label: 'Gift Cards',      href: '/admin/gift-cards',     tooltip: 'Gift Cards' },
      { icon: Coins,    label: 'Loyalty Program', href: '/admin/loyalty',        tooltip: 'Loyalty' },
      { icon: Users,    label: 'Referrals',       href: '/admin/referrals',      tooltip: 'Referrals' },
    ],
  },
  {
    id: 'campaigns',
    label: 'Communication',
    defaultOpen: false,
    items: [
      { icon: Mail,      label: 'Email Campaigns',    href: '/admin/email-campaigns',    tooltip: 'Email' },
      { icon: Bell,      label: 'Push Notifications', href: '/admin/push-notifications', tooltip: 'Push' },
      { icon: Newspaper, label: 'Newsletter',         href: '/admin/newsletter',         tooltip: 'Newsletter' },
      { icon: FileText,  label: 'Email Templates',    href: '/admin/email-templates',    tooltip: 'Templates' },
      { icon: Receipt,   label: 'Invoice Templates',  href: '/admin/invoice-templates',  tooltip: 'Invoices' },
    ],
  },
  {
    id: 'cms',
    label: 'Content & CMS',
    defaultOpen: false,
    items: [
      { icon: Home,       label: 'Homepage CMS',      href: '/admin/homepage-cms',     tooltip: 'Homepage CMS' },
      { icon: Menu,       label: 'Navigation Manager',href: '/admin/navigation',       tooltip: 'Navigation' },
      { icon: Layout,     label: 'Footer Manager',    href: '/admin/footer-builder',   tooltip: 'Footer' },
      { icon: File,       label: 'Pages CMS',         href: '/admin/pages',            tooltip: 'Pages' },
      { icon: FolderTree, label: 'Blog Categories',   href: '/admin/blog-categories',  tooltip: 'Blog' },
      { icon: HelpCircle, label: 'FAQ Manager',       href: '/admin/faq',              tooltip: 'FAQ' },
      { icon: Users2,     label: 'Team Members',      href: '/admin/team',             tooltip: 'Team' },
      { icon: Palette,    label: 'Brand Assets',      href: '/admin/brand-assets',     tooltip: 'Brand' },
      { icon: Star,       label: 'Reviews',           href: '/admin/reviews',          tooltip: 'Reviews' },
      { icon: Megaphone,  label: 'Announcements',     href: '/admin/announcement-bars',tooltip: 'Announcements' },
      { icon: Image,      label: 'Banners',           href: '/admin/banners',          tooltip: 'Banners' },
      { icon: Layers,     label: 'Popup Campaigns',   href: '/admin/popups',           tooltip: 'Popups' },
    ],
  },
  {
    id: 'seo_media',
    label: 'SEO & Media',
    defaultOpen: false,
    items: [
      { icon: FileImage,   label: 'Media Library',   href: '/admin/media',            tooltip: 'Media' },
      { icon: Search,      label: 'SEO Settings',    href: '/admin/seo',              tooltip: 'SEO' },
      { icon: FileCode,    label: 'robots.txt Editor',href: '/admin/robots-txt',      tooltip: 'robots.txt' },
      { icon: Network,     label: 'Sitemap Manager', href: '/admin/sitemap',         tooltip: 'Sitemap' },
      { icon: Share2,      label: 'Social Media',    href: '/admin/social-media',     tooltip: 'Social' },
      { icon: Plug,        label: 'Integrations',    href: '/admin/integrations',     tooltip: 'Integrations' },
    ],
  },
  {
    id: 'system',
    label: 'System & Admin',
    defaultOpen: false,
    items: [
      { icon: ShieldAlert,  label: 'Maintenance Mode', href: '/admin/maintenance',     tooltip: 'Maintenance' },
      { icon: Flag,         label: 'Feature Flags',    href: '/admin/feature-flags',    tooltip: 'Flags' },
      { icon: Sliders,      label: 'Admin Profile',    href: '/admin/profile',          tooltip: 'Profile' },
      { icon: UserCheck,    label: 'Staff Accounts',   href: '/admin/staff',            tooltip: 'Staff' },
      { icon: ShieldCheck,  label: 'Roles & Matrix',   href: '/admin/roles',            tooltip: 'Roles' },
      { icon: History,      label: 'Audit Logs',       href: '/admin/audit-logs',       tooltip: 'Audit' },
      { icon: Activity,     label: 'Activity Timeline',href: '/admin/activity',         tooltip: 'Activity' },
      { icon: FileTerminal, label: 'System Logs',      href: '/admin/system-logs',      tooltip: 'Logs' },
    ],
  },
  {
    id: 'dev_ops',
    label: 'Developer Tools',
    defaultOpen: false,
    items: [
      { icon: Key,        label: 'API Keys',          href: '/admin/api-keys',         tooltip: 'API Keys' },
      { icon: Webhook,    label: 'Webhook Manager',   href: '/admin/webhooks',         tooltip: 'Webhooks' },
      { icon: Database,   label: 'Backup & Restore',  href: '/admin/backup',           tooltip: 'Backup' },
      { icon: Code2,      label: 'Developer Settings',href: '/admin/developer',        tooltip: 'Developer' },
      { icon: HeartPulse, label: 'Health Dashboard',  href: '/admin/health',           tooltip: 'Health' },
    ],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

// ─── Types ─────────────────────────────────────────────────────
interface AdminSidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
  pendingReviews?: number;
  userInitials?: string;
  userName?: string;
}

// ─── Component ─────────────────────────────────────────────────
export function AdminSidebar({
  collapsed,
  mobileOpen,
  onMobileClose,
  pendingReviews = 0,
  userInitials = 'AD',
  userName = 'Admin',
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();

  // ── Group open/close state (persisted) ──────────────────────
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const defaults: Record<string, boolean> = {};
    NAV_GROUPS.forEach((g) => { defaults[g.id] = g.defaultOpen; });
    return defaults;
  });

  const STORAGE_KEY = 'admin-sidebar-groups-v2';

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, boolean>;
        setOpenGroups((prev) => ({ ...prev, ...parsed }));
      }
    } catch { /* ignore */ }
  }, []);

  const toggleGroup = useCallback((id: string) => {
    setOpenGroups((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  // ── Active state helper ──────────────────────────────────────
  const isActive = (href: string) => {
    if (href === '/admin/dashboard') return pathname === '/admin/dashboard' || pathname === '/admin';
    return pathname.startsWith(href);
  };

  // ── Auto-expand group of active item ────────────────────────
  useEffect(() => {
    NAV_GROUPS.forEach((g) => {
      if (g.items.some((i) => isActive(i.href))) {
        setOpenGroups((prev) => {
          if (!prev[g.id]) {
            const next = { ...prev, [g.id]: true };
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
            return next;
          }
          return prev;
        });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // ── Logout ───────────────────────────────────────────────────
  const handleLogout = async () => {
    try { await signOut(); } catch { router.push('/'); }
  };

  // ── Ripple handler ───────────────────────────────────────────
  const handleRipple = (e: React.MouseEvent<HTMLElement>) => {
    const el   = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x    = e.clientX - rect.left;
    const y    = e.clientY - rect.top;
    const span = document.createElement('span');
    span.className      = 'admin-ripple';
    span.style.left     = `${x}px`;
    span.style.top      = `${y}px`;
    el.appendChild(span);
    setTimeout(() => span.remove(), 600);
  };

  // ── NavItem render ───────────────────────────────────────────
  const renderNavItem = (item: typeof ALL_ITEMS[number]) => {
    const Icon   = item.icon;
    const active = isActive(item.href);
    const badge  = item.href === '/admin/reviews' && pendingReviews > 0 ? pendingReviews : null;

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`admin-nav-item${active ? ' active' : ''}`}
        onClick={(e) => { handleRipple(e); onMobileClose(); }}
        aria-current={active ? 'page' : undefined}
        data-tooltip={item.tooltip}
      >
        <span className="admin-nav-icon-wrap">
          <Icon size={16} strokeWidth={active ? 2.2 : 1.75} />
        </span>
        <span className="admin-nav-label">{item.label}</span>
        {badge ? (
          <span className="admin-nav-badge">{badge > 99 ? '99+' : badge}</span>
        ) : null}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`admin-sidebar${mobileOpen ? ' mobile-open' : ''}`}
        aria-label="Admin navigation"
      >

        {/* ── Logo ──────────────────────────────────────────── */}
        <Link
          href="/admin/dashboard"
          className="admin-sidebar-logo"
          onClick={onMobileClose}
          aria-label="Blendify Admin Home"
          data-tooltip="Dashboard"
        >
          <div className="admin-sidebar-logo-icon" aria-hidden="true">B</div>
          <div className="admin-sidebar-logo-text">
            <span className="admin-sidebar-logo-title">BLENDIFY</span>
            <span className="admin-sidebar-logo-sub">Admin Console</span>
          </div>
        </Link>

        {/* ── Navigation ────────────────────────────────────── */}
        <nav className="admin-sidebar-nav" aria-label="Admin navigation">

          {NAV_GROUPS.map((group) => {
            const isOpen   = openGroups[group.id] ?? group.defaultOpen;
            const hasActive = group.items.some((i) => isActive(i.href));

            return (
              <div
                key={group.id}
                className={`admin-nav-group${hasActive ? ' has-active' : ''}`}
              >
                {/* Group header — clickable to collapse */}
                <button
                  className="admin-nav-group-header"
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={isOpen}
                  aria-controls={`group-${group.id}`}
                  title={collapsed ? group.label : undefined}
                  data-tooltip={group.label}
                >
                  <span className="admin-nav-group-label">{group.label}</span>
                  <span className={`admin-nav-group-chevron${isOpen ? ' open' : ''}`}>
                    <ChevronDown size={11} strokeWidth={2.5} />
                  </span>
                </button>

                {/* Group items — animated collapse */}
                <div
                  id={`group-${group.id}`}
                  className={`admin-nav-group-items${isOpen ? ' open' : ''}`}
                >
                  {group.items.map((item) => renderNavItem(item))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* ── Sidebar Footer ────────────────────────────────── */}
        <div className="admin-sidebar-footer">

          {/* Divider */}
          <div className="admin-sidebar-divider" />

          {/* View Store */}
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-nav-item admin-footer-action"
            data-tooltip="View Store"
            onClick={handleRipple}
          >
            <span className="admin-nav-icon-wrap">
              <ExternalLink size={15} strokeWidth={1.75} />
            </span>
            <span className="admin-nav-label">View Store</span>
          </Link>

          {/* Settings */}
          <Link
            href="/admin/settings"
            className="admin-nav-item admin-footer-action"
            data-tooltip="Settings"
            onClick={handleRipple}
          >
            <span className="admin-nav-icon-wrap">
              <Settings size={15} strokeWidth={1.75} />
            </span>
            <span className="admin-nav-label">Settings</span>
          </Link>

          {/* Logout */}
          <button
            className="admin-nav-item admin-footer-action admin-logout-btn"
            onClick={async (e) => { handleRipple(e); await handleLogout(); }}
            data-tooltip="Sign Out"
            aria-label="Sign out of admin"
          >
            <span className="admin-nav-icon-wrap">
              <LogOut size={15} strokeWidth={1.75} />
            </span>
            <span className="admin-nav-label">Sign Out</span>
          </button>

          {/* Store Status + User card */}
          <div className="admin-sidebar-user-card">
            <div className="admin-sidebar-user-avatar" aria-hidden="true">
              {userInitials}
            </div>
            <div className="admin-sidebar-user-info">
              <div className="admin-sidebar-user-name">{userName}</div>
              <div className="admin-sidebar-user-meta">
                <Circle size={6} fill="#22c55e" color="#22c55e" />
                <span>Administrator · Live</span>
              </div>
            </div>
          </div>

        </div>
      </aside>
    </>
  );
}
