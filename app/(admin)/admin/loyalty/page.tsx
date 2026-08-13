// ============================================================
// BLENDIFY — Loyalty Program Page  /admin/loyalty
// ============================================================
'use client';

import { useState, useEffect } from 'react';
import { Save, Users, Coins, Award } from 'lucide-react';
import { StatCard } from '@/components/admin/ui/StatCard';
import { DataTable, Column } from '@/components/admin/ui/DataTable';
import { adminToast } from '@/components/admin/ui/Toast';

interface LoyaltyConfig {
  id: string; pointsPerRupee: number; rupeesPerPoint: number; minimumRedeemPoints: number;
  maximumRedeemPercent: number; expiryDays: number | null; isEnabled: boolean;
  bronzeThreshold: number; silverThreshold: number; goldThreshold: number; platinumThreshold: number;
  bronzeMultiplier: number; silverMultiplier: number; goldMultiplier: number; platinumMultiplier: number;
}

interface Transaction {
  id: string; type: string; points: number; description: string | null; createdAt: string;
  user: { email: string; firstName: string; lastName: string; loyaltyTier: string; loyaltyPoints: number } | null;
}

export default function LoyaltyPage() {
  const [config, setConfig] = useState<Partial<LoyaltyConfig>>({ isEnabled: true, pointsPerRupee: 1, rupeesPerPoint: 0.25, minimumRedeemPoints: 100, maximumRedeemPercent: 10, bronzeThreshold: 0, silverThreshold: 1000, goldThreshold: 5000, platinumThreshold: 15000, bronzeMultiplier: 1, silverMultiplier: 1.5, goldMultiplier: 2, platinumMultiplier: 3 });
  const [configLoading, setConfigLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txPagination, setTxPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [txLoading, setTxLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'config' | 'transactions'>('config');
  const [tierStats, setTierStats] = useState<Array<{ loyaltyTier: string; _count: { id: number }; _sum: { loyaltyPoints: number } }>>([]);

  useEffect(() => {
    fetch('/api/admin/loyalty/config').then((r) => r.json()).then((d) => {
      if (d.success && d.data) setConfig(d.data.config ?? d.data);
      setConfigLoading(false);
    });
  }, []);

  useEffect(() => {
    if (activeTab === 'transactions') {
      setTxLoading(true);
      fetch('/api/admin/loyalty/transactions?limit=20').then((r) => r.json()).then((d) => {
        if (d.success) { setTransactions(d.data); setTxPagination(d.pagination); }
        setTxLoading(false);
      });
    }
  }, [activeTab]);

  const saveConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/loyalty/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) });
      const data = await res.json();
      if (data.success) adminToast.success('Loyalty configuration saved');
      else adminToast.error(data.error);
    } catch { adminToast.error('Save failed'); }
    setSaving(false);
  };

  const numInput = (key: keyof LoyaltyConfig, label: string, step = '1', min = '0', placeholder = '0') => (
    <div className="admin-form-group">
      <label className="admin-label" htmlFor={`loyalty-${key}`}>{label}</label>
      <input id={`loyalty-${key}`} className="admin-input" type="number" step={step} min={min}
        value={(config[key] as number | undefined) ?? ''}
        onChange={(e) => setConfig((c) => ({ ...c, [key]: parseFloat(e.target.value) || 0 }))}
        placeholder={placeholder} />
    </div>
  );

  const TIER_COLORS: Record<string, string> = { BRONZE: '#cd7f32', SILVER: '#c0c0c0', GOLD: '#ffd700', PLATINUM: '#e5e4e2' };

  const txColumns: Column<Transaction>[] = [
    { key: 'user', header: 'Customer', cell: (r) => r.user ? <div><div style={{ fontSize: '13px', fontWeight: 500 }}>{r.user.firstName} {r.user.lastName}</div><div style={{ fontSize: '11px', color: 'var(--admin-text-tertiary)' }}>{r.user.email}</div></div> : <span style={{ color: 'var(--admin-text-tertiary)', fontSize: '12px' }}>—</span> },
    { key: 'tier', header: 'Tier', cell: (r) => r.user ? <span style={{ fontSize: '12px', fontWeight: 600, color: TIER_COLORS[r.user.loyaltyTier] ?? 'inherit' }}>{r.user.loyaltyTier}</span> : null },
    { key: 'type', header: 'Type', cell: (r) => <span style={{ fontSize: '12px', background: 'var(--admin-surface-overlay)', padding: '2px 8px', borderRadius: '100px' }}>{r.type}</span> },
    { key: 'points', header: 'Points', cell: (r) => <span style={{ fontWeight: 700, color: r.points > 0 ? 'var(--admin-success)' : 'var(--admin-error)' }}>{r.points > 0 ? '+' : ''}{r.points.toLocaleString()}</span> },
    { key: 'description', header: 'Description', cell: (r) => <span style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>{r.description ?? '—'}</span> },
    { key: 'createdAt', header: 'Date', sortable: true, cell: (r) => <span style={{ fontSize: '12px' }}>{new Date(r.createdAt).toLocaleDateString('en-IN')}</span> },
  ];

  return (
    <div>
      <div className="admin-page-header">
        <div><h1 className="admin-page-title">Loyalty Program</h1><p className="admin-page-subtitle">Configure points earning, redemption rules, and tier thresholds</p></div>
        {activeTab === 'config' && (
          <button className="admin-btn admin-btn-primary" onClick={saveConfig} disabled={saving} id="loyalty-save">
            {saving ? <span className="admin-spinner" style={{ width: 14, height: 14 }} /> : <Save size={14} />}Save Config
          </button>
        )}
      </div>

      {/* Tier Stats */}
      {tierStats.length > 0 && (
        <div className="admin-stat-grid" style={{ marginBottom: '24px' }}>
          {tierStats.map((s) => (
            <StatCard key={s.loyaltyTier} id={`loyalty-tier-${s.loyaltyTier}`} label={s.loyaltyTier} value={`${s._count.id} members`} iconVariant="accent" />
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="admin-tabs" style={{ marginBottom: '24px' }}>
        <button className={`admin-tab ${activeTab === 'config' ? 'active' : ''}`} onClick={() => setActiveTab('config')} id="loyalty-tab-config">Configuration</button>
        <button className={`admin-tab ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => setActiveTab('transactions')} id="loyalty-tab-tx">Transaction History</button>
      </div>

      {activeTab === 'config' && (
        configLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>{Array.from({ length: 6 }).map((_, i) => <div key={i} className="admin-skeleton" style={{ height: '52px' }} />)}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Points config */}
            <div className="admin-card">
              <div className="admin-card-header"><h3 className="admin-card-title"><Coins size={15} style={{ display: 'inline', marginRight: '6px' }} />Points Rules</h3></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {numInput('pointsPerRupee', 'Points earned per ₹1 spent', '0.01', '0', '1')}
                {numInput('rupeesPerPoint', '₹ value per point (redemption)', '0.01', '0', '0.25')}
                {numInput('minimumRedeemPoints', 'Minimum points to redeem', '1', '0', '100')}
                {numInput('maximumRedeemPercent', 'Max discount from points (%)', '1', '0', '10')}
                {numInput('expiryDays', 'Points expiry (days, 0 = never)', '1', '0', '365')}
                <div className="admin-field-row">
                  <label className="admin-toggle" htmlFor="loyalty-enabled"><input id="loyalty-enabled" type="checkbox" checked={config.isEnabled ?? true} onChange={(e) => setConfig((c) => ({ ...c, isEnabled: e.target.checked }))} /><span className="admin-toggle-slider" /></label>
                  <span style={{ fontSize: '13px', color: 'var(--admin-text-secondary)' }}>Program Active</span>
                </div>
              </div>
            </div>

            {/* Tier Thresholds */}
            <div className="admin-card">
              <div className="admin-card-header"><h3 className="admin-card-title"><Award size={15} style={{ display: 'inline', marginRight: '6px' }} />Tier Thresholds</h3></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {(['bronze', 'silver', 'gold', 'platinum'] as const).map((tier) => (
                  <div key={tier} style={{ padding: '12px', background: 'var(--admin-surface-raised)', borderRadius: '8px', border: `1px solid ${TIER_COLORS[tier.toUpperCase()]}30` }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: TIER_COLORS[tier.toUpperCase()], marginBottom: '8px', textTransform: 'uppercase' }}>{tier}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {numInput(`${tier}Threshold` as keyof LoyaltyConfig, 'Min Points', '1', '0')}
                      {numInput(`${tier}Multiplier` as keyof LoyaltyConfig, 'Points Multiplier', '0.1', '1')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      )}

      {activeTab === 'transactions' && (
        <DataTable id="loyalty-tx-table" data={transactions} columns={txColumns} loading={txLoading} totalCount={txPagination.total} page={txPagination.page} limit={txPagination.limit}
          onPageChange={(p) => { setTxLoading(true); fetch(`/api/admin/loyalty/transactions?page=${p}&limit=20`).then((r) => r.json()).then((d) => { if (d.success) { setTransactions(d.data); setTxPagination(d.pagination); } setTxLoading(false); }); }}
          emptyTitle="No transactions yet" emptyDescription="Loyalty point activity will appear here." />
      )}
    </div>
  );
}
