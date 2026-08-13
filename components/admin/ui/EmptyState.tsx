// ============================================================
// BLENDIFY — Empty State Component (Luxury Redesign)
// ============================================================
import { Coffee } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({
  title = 'Nothing here yet',
  description = 'Try adjusting your filters or create a new record to get started.',
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="admin-empty" role="status" aria-label={title}>
      <div className="admin-empty-icon" aria-hidden="true">
        {icon ?? <Coffee size={26} strokeWidth={1.5} />}
      </div>
      <h3 className="admin-empty-title">{title}</h3>
      <p className="admin-empty-desc">{description}</p>
      {action && (
        <div style={{ marginTop: '8px' }}>
          {action}
        </div>
      )}
    </div>
  );
}
