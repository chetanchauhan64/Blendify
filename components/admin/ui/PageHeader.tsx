// ============================================================
// BLENDIFY — Page Header Component (Luxury Redesign)
// Playfair Display title, warm brand breadcrumbs, stats row
// ============================================================
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  tabs?: React.ReactNode;
  /** Optional inline stats shown below the title */
  stats?: { label: string; value: string | number }[];
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  actionLabel,
  onAction,
  tabs,
  stats,
}: PageHeaderProps) {
  const renderedActions = actions || (actionLabel && onAction ? (
    <button className="admin-btn-primary" onClick={onAction}>
      {actionLabel}
    </button>
  ) : undefined);
  return (
    <div style={{ marginBottom: tabs ? '0' : '28px' }}>

      {/* ── Breadcrumbs ─────────────────────────────────── */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '10px' }}
          aria-label="Breadcrumb"
        >
          {breadcrumbs.map((crumb, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {i > 0 && (
                <ChevronRight
                  size={11}
                  style={{ color: 'var(--admin-text-disabled)' }}
                  aria-hidden="true"
                />
              )}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  style={{
                    fontSize: '12px',
                    color: 'var(--admin-text-tertiary)',
                    textDecoration: 'none',
                    transition: 'color 150ms',
                    fontWeight: 500,
                  }}
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  style={{ fontSize: '12px', color: 'var(--admin-accent)', fontWeight: 600 }}
                  aria-current="page"
                >
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* ── Title Row ────────────────────────────────────── */}
      <div className="admin-page-header">
        <div className="admin-page-header-left">
          <h1 className="admin-page-title">{title}</h1>
          {subtitle && (
            <p className="admin-page-subtitle">{subtitle}</p>
          )}

          {/* Inline stats */}
          {stats && stats.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '10px', flexWrap: 'wrap' }}>
              {stats.map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    fontSize: '16px', fontWeight: 700,
                    fontFamily: 'var(--admin-font-display)',
                    color: 'var(--admin-accent)',
                  }}>
                    {typeof value === 'number' ? value.toLocaleString() : value}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--admin-text-tertiary)', fontWeight: 500 }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {renderedActions && (
          <div className="admin-page-actions" role="toolbar" aria-label="Page actions">
            {renderedActions}
          </div>
        )}
      </div>

      {/* ── Tabs ─────────────────────────────────────────── */}
      {tabs && (
        <div style={{ marginTop: '16px' }} role="tablist">
          {tabs}
        </div>
      )}
    </div>
  );
}
