// ============================================================
// BLENDIFY — Skeleton Table
// ============================================================
export function SkeletonTable({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="admin-skeleton-row"
          style={{ display: 'flex', gap: '16px', padding: '12px 16px', alignItems: 'center' }}
        >
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className="admin-skeleton"
              style={{
                height: '14px',
                flex: j === 0 ? '0 0 20px' : j === 1 ? '0 0 120px' : 1,
                borderRadius: '4px',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
