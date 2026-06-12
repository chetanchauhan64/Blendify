export default function OrdersLoading() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: 'var(--space-6) var(--space-4)' }}>
      {/* Header skeleton */}
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <div className="skeleton" style={{ width: '70px', height: '12px', marginBottom: '0.5rem', borderRadius: 'var(--radius-full)' }} />
        <div className="skeleton" style={{ width: '220px', height: '36px', marginBottom: '0.5rem' }} />
        <div className="skeleton" style={{ width: '340px', height: '18px' }} />
      </div>

      {/* Order card skeletons */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-3)',
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 'var(--space-2)',
            marginBottom: 'var(--space-2)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div className="skeleton" style={{ width: '120px', height: '16px' }} />
            <div className="skeleton" style={{ width: '200px', height: '14px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
            <div className="skeleton" style={{ width: '80px', height: '22px' }} />
            <div className="skeleton" style={{ width: '90px', height: '22px', borderRadius: 'var(--radius-full)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}
