// ============================================================
// BLENDIFY — Status Badge Component (Luxury Coffee Redesign)
// ============================================================

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

// Maps raw status strings → CSS variant class
const STATUS_VARIANTS: Record<string, string> = {
  // Active / Live
  active:     'active',
  live:       'active',
  approved:   'active',
  sent:       'active',
  completed:  'active',
  published:  'active',
  verified:   'active',
  redeemed:   'active',

  // Inactive / Failed / Cancelled
  inactive:   'inactive',
  failed:     'inactive',
  rejected:   'inactive',
  cancelled:  'inactive',
  canceled:   'inactive',
  disabled:   'inactive',
  blocked:    'inactive',
  refunded:   'inactive',

  // Pending / Draft / Scheduled
  pending:    'pending',
  draft:      'draft',
  scheduled:  'scheduled',
  review:     'pending',
  queued:     'scheduled',
  waiting:    'pending',

  // Hidden / Expired / Paused
  hidden:     'hidden',
  expired:    'expired',
  paused:     'paused',
  archived:   'hidden',
  closed:     'hidden',

  // Processing / Sending
  sending:    'sending',
  processing: 'processing',
  loading:    'sending',
  running:    'sending',

  // Order-specific
  placed:        'pending',
  confirmed:     'pending',
  preparing:     'sending',
  shipped:       'sending',
  delivered:     'active',
  returned:      'inactive',
  paid:          'active',
  unpaid:        'pending',
  partial:       'warning',
  failed_payment:'inactive',
};

// Human-readable labels
const STATUS_LABELS: Record<string, string> = {
  live:          'Live',
  paid:          'Paid',
  unpaid:        'Unpaid',
  failed_payment:'Payment Failed',
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const normalized = status.toLowerCase().replace(/\s+/g, '_');
  const variant    = STATUS_VARIANTS[normalized] ?? 'pending';
  const label      = STATUS_LABELS[normalized]
    ?? (status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' '));

  return (
    <span
      className={`admin-badge ${variant}${size === 'sm' ? ' sm' : size === 'lg' ? ' lg' : ''}`}
      aria-label={`Status: ${label}`}
    >
      {label}
    </span>
  );
}
