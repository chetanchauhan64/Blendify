// ============================================================
// BLENDIFY — Stat Card Component (Luxury Coffee Redesign)
// ============================================================
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  iconVariant?: 'success' | 'warning' | 'error' | 'info' | 'accent' | 'gold';
  trend?: number;
  trendLabel?: string;
  loading?: boolean;
  href?: string;
  id?: string;
}

export function StatCard({
  label,
  value,
  icon,
  iconVariant = 'accent',
  trend,
  trendLabel,
  loading = false,
  href,
  id,
}: StatCardProps) {
  const trendDir   = trend === undefined ? null : trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral';
  const TrendIcon  = trendDir === 'up' ? TrendingUp : trendDir === 'down' ? TrendingDown : Minus;
  const absValue   = typeof value === 'number' ? value.toLocaleString() : value;

  const content = (
    <div
      className="admin-stat-card"
      id={id}
      role="article"
      aria-label={`${label}: ${absValue}`}
    >
      {/* Header: label + icon */}
      <div className="admin-stat-header">
        <span className="admin-stat-label">{label}</span>
        {icon && (
          <div className={`admin-stat-icon ${iconVariant}`} aria-hidden="true">
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      {loading ? (
        <div className="admin-skeleton" style={{ height: '36px', borderRadius: '6px', width: '60%' }} />
      ) : (
        <div className="admin-stat-value">
          {absValue}
        </div>
      )}

      {/* Trend */}
      {trend !== undefined && !loading ? (
        <div className={`admin-stat-trend ${trendDir ?? 'neutral'}`} aria-label={`Trend: ${trendDir === 'up' ? 'up' : trendDir === 'down' ? 'down' : 'flat'} ${Math.abs(trend).toFixed(1)}%`}>
          <TrendIcon size={13} aria-hidden="true" />
          <span>{Math.abs(trend).toFixed(1)}%</span>
          {trendLabel && (
            <span className="admin-stat-trend-label">{trendLabel}</span>
          )}
        </div>
      ) : loading ? (
        <div className="admin-skeleton" style={{ height: '14px', borderRadius: '4px', width: '40%' }} />
      ) : null}
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        style={{ textDecoration: 'none', display: 'block' }}
        aria-label={`Navigate to ${label}`}
      >
        {content}
      </a>
    );
  }

  return content;
}
