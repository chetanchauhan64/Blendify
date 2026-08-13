// ============================================================
// BLENDIFY — Referral Program Page  /admin/referrals
// ============================================================
'use client';

import { useState, useEffect } from 'react';
import { Save, Users, TrendingUp, Gift } from 'lucide-react';
import { StatCard } from '@/components/admin/ui/StatCard';
import { DataTable, Column } from '@/components/admin/ui/DataTable';
import { adminToast } from '@/components/admin/ui/Toast';

interface ReferralConfig {
  id: string; isEnabled: boolean; referrerRewardType: string; referrerRewardValue: number;
  refereeRewardType: string; refereeRewardValue: number; cookieDurationDays: number;
  minimumOrderAmount: number | null; maxRewardsPerUser: number | null;
}

interface LeaderEntry {
  id: string; referralCode: string; totalReferrals: number; convertedReferrals: number;
  totalEarned: number; user: { firstName: string; lastName: string; email: string } | null;
}

export default function ReferralsPage() {
  const [config, setConfig] = useState<Partial<ReferralConfig>>({ isEnabled: true, referrerRewardType: 'POINTS', referrerRewardValue: 200, refereeRewardType: 'DISCOUNT_PERCENT', refereeRewardValue: 10, cookieDurationDays: 30, minimumOrderAmount: null, maxRewardsPerUser: null });
  const [configLoading, setConfigLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const [leaderLoading, setLeaderLoading] = useState(true);
  const [stats, setStats] = useState<{ totalReferrals?: number; converted?: number; conversions?: number; conversionRate?: number; totalRewards?: number; totalReferrers?: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'leaderboard'>('config');

  useEffect(() => {
    fetch('/api/admin/referrals/config').then((r) => r.json()).then((d) => {
      if (d.success) { if (d.data.config) setConfig(d.data.config); if (d.data.stats) setStats(d.data.stats); }
      setConfigLoading(false);
    });
    fetch('/api/admin/referrals/leaderboard').then((r) => r.json()).then((d) => {
      if (d.success) setLeaderboard(d.data);
      setLeaderLoading(false);
    });
  }, []);

  const saveConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/referrals/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) });
      const data = await res.json();
      if (data.success) adminToast.success('Referral configuration saved');
      else adminToast.error(data.error);
    } catch { adminToast.error('Save failed'); }
    setSaving(false);
  };

  const numInput = (key: keyof ReferralConfig, label: string, step = '1', placeholder = '') => (
    <div className="admin-form-group">
      <label className="admin-label" htmlFor={`ref-${key}`}>{label}</label>
      <input id={`ref-${key}`} className="admin-input" type="number" step={step}
        value={(config[key] as number | null | undefined) ?? ''}
        onChange={(e) => setConfig((c) => ({ ...c, [key]: e.target.value ? parseFloat(e.target.value) : null }))}
        placeholder={placeholder} />
    </div>
  );

  const leaderColumns: Column<LeaderEntry>[] = [
    { key: 'rank', header: '#', cell: (r) => { const idx = leaderboard.findIndex((l) => l.id === r.id); return <span style={{ fontSize: '13px', fontWeight: 700, color: idx < 3 ? ['#ffd700', '#c0c0c0', '#cd7f32'][idx] : 'var(--admin-text-secondary)' }}>{idx + 1}</span>; } },
    { key: 'user', header: 'Referrer', cell: (r) => r.user ? <div><div style={{ fontWeight: 500, fontSize: '13px' }}>{r.user.firstName} {r.user.lastName}</div><div style={{ fontSize: '11px', color: 'var(--admin-text-tertiary)' }}>{r.user.email}</div></div> : <span style={{ color: 'var(--admin-text-tertiary)', fontSize: '12px' }}>Unknown</span> },
    { key: 'referralCode', header: 'Code', cell: (r) => <code style={{ fontFamily: 'var(--admin-font-mono)', fontSize: '12px', background: 'var(--admin-surface-overlay)', padding: '2px 6px', borderRadius: '4px' }}>{r.referralCode}</code> },
    { key: 'totalReferrals', header: 'Total Refs', cell: (r) => <span style={{ fontWeight: 600 }}>{r.totalReferrals}</span> },
    { key: 'convertedReferrals', header: 'Converted', cell: (r) => <span style={{ fontWeight: 600, color: 'var(--admin-success)' }}>{r.convertedReferrals}</span> },
    { key: 'rate', header: 'Conv. Rate', cell: (r) => <span>{r.totalReferrals > 0 ? ((r.convertedReferrals / r.totalReferrals) * 100).toFixed(1) : '0'}%</span> },
    { key: 'totalEarned', header: 'Rewards Earned', cell: (r) => <span style={{ fontWeight: 600 }}>{r.totalEarned.toLocaleString()} pts</span> },
  ];

  return (
    <div>
      <div className="admin-page-header">
        <div><h1 className="admin-page-title">Referral Program</h1><p className="admin-page-subtitle">Configure rewards for referrers and new customers they bring in</p></div>
        {activeTab === 'config' && <button className="admin-btn admin-btn-primary" onClick={saveConfig} disabled={saving} id="ref-save">{saving ? <span className="admin-spinner" style={{ width: 14, height: 14 }} /> : <Save size={14} />}Save Config</button>}
      </div>

      {stats && (
        <div className="admin-stat-grid" style={{ marginBottom: '24px' }}>
          <StatCard id="ref-total" label="Total Referrals" value={stats.totalReferrals ?? 0} icon={<Users size={16} />} iconVariant="accent" />
          <StatCard id="ref-converted" label="Converted" value={stats.converted ?? stats.conversions ?? 0} icon={<TrendingUp size={16} />} iconVariant="success" />
          <StatCard id="ref-rate" label="Conversion Rate" value={`${(stats.conversionRate ?? 0).toFixed(1)}%`} icon={<TrendingUp size={16} />} iconVariant="info" />
          <StatCard id="ref-rewards" label="Total Referrers" value={(stats.totalReferrers ?? stats.totalRewards ?? 0).toLocaleString()} icon={<Gift size={16} />} iconVariant="warning" />
        </div>
      )}

      <div className="admin-tabs" style={{ marginBottom: '24px' }}>
        <button className={`admin-tab ${activeTab === 'config' ? 'active' : ''}`} onClick={() => setActiveTab('config')} id="ref-tab-config">Configuration</button>
        <button className={`admin-tab ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')} id="ref-tab-leader">Leaderboard</button>
      </div>

      {activeTab === 'config' && (
        configLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>{Array.from({ length: 5 }).map((_, i) => <div key={i} className="admin-skeleton" style={{ height: '52px' }} />)}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="admin-card">
              <div className="admin-card-header"><h3 className="admin-card-title">Referrer Rewards (existing customer)</h3></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="admin-form-group"><label className="admin-label" htmlFor="ref-ref-type">Reward Type</label><select id="ref-ref-type" className="admin-select" value={config.referrerRewardType ?? 'POINTS'} onChange={(e) => setConfig((c) => ({ ...c, referrerRewardType: e.target.value }))}><option value="POINTS">Loyalty Points</option><option value="DISCOUNT_PERCENT">Discount %</option><option value="DISCOUNT_FIXED">Fixed Discount (₹)</option><option value="GIFT_CARD">Gift Card</option></select></div>
                {numInput('referrerRewardValue', 'Reward Value', '1', '200')}
              </div>
            </div>
            <div className="admin-card">
              <div className="admin-card-header"><h3 className="admin-card-title">Referee Rewards (new customer)</h3></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="admin-form-group"><label className="admin-label" htmlFor="ref-ee-type">Reward Type</label><select id="ref-ee-type" className="admin-select" value={config.refereeRewardType ?? 'DISCOUNT_PERCENT'} onChange={(e) => setConfig((c) => ({ ...c, refereeRewardType: e.target.value }))}><option value="POINTS">Loyalty Points</option><option value="DISCOUNT_PERCENT">Discount %</option><option value="DISCOUNT_FIXED">Fixed Discount (₹)</option><option value="GIFT_CARD">Gift Card</option></select></div>
                {numInput('refereeRewardValue', 'Reward Value', '1', '10')}
              </div>
            </div>
            <div className="admin-card">
              <div className="admin-card-header"><h3 className="admin-card-title">General Settings</h3></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {numInput('cookieDurationDays', 'Cookie Duration (days)', '1', '30')}
                {numInput('minimumOrderAmount', 'Minimum Order Amount (₹, optional)', '1', '')}
                {numInput('maxRewardsPerUser', 'Max Rewards per User (optional)', '1', '')}
                <div className="admin-field-row"><label className="admin-toggle" htmlFor="ref-enabled"><input id="ref-enabled" type="checkbox" checked={config.isEnabled ?? true} onChange={(e) => setConfig((c) => ({ ...c, isEnabled: e.target.checked }))} /><span className="admin-toggle-slider" /></label><span style={{ fontSize: '13px', color: 'var(--admin-text-secondary)' }}>Program Active</span></div>
              </div>
            </div>
          </div>
        )
      )}

      {activeTab === 'leaderboard' && (
        <DataTable id="ref-leaderboard" data={leaderboard} columns={leaderColumns} loading={leaderLoading} totalCount={leaderboard.length} emptyTitle="No referrals yet" emptyDescription="Referral activity will appear here once customers start sharing their codes." />
      )}
    </div>
  );
}
