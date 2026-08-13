// ============================================================
// BLENDIFY — Gift Cards Page  /admin/gift-cards
// ============================================================
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Gift, Copy, Check } from 'lucide-react';
import { DataTable, Column } from '@/components/admin/ui/DataTable';
import { StatusBadge } from '@/components/admin/ui/StatusBadge';
import { StatCard } from '@/components/admin/ui/StatCard';
import { Drawer } from '@/components/admin/ui/Drawer';
import { ExportMenu } from '@/components/admin/ui/ExportMenu';
import { adminToast } from '@/components/admin/ui/Toast';
import { handleExportDownload } from '@/lib/hooks/useAdminTable';

interface GiftCard {
  id: string; code: string; value: number; balance: number; currencyCode: string;
  isActive: boolean; expiresAt: string | null; issuedToEmail: string | null;
  note: string | null; createdAt: string;
  transactions: Array<{ id: string; type: string; amount: number; createdAt: string }>;
}

interface FormState {
  value: string; currencyCode: string; quantity: string; issuedToEmail: string;
  expiresAt: string; note: string;
}

const DEFAULT_FORM: FormState = { value: '', currencyCode: 'INR', quantity: '1', issuedToEmail: '', expiresAt: '', note: '' };

export default function GiftCardsPage() {
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [stats, setStats] = useState<{ total: number; active: number; totalValue: number; totalBalance: number; totalRedeemed: number } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [detailCard, setDetailCard] = useState<GiftCard | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetch_ = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '25', ...(search ? { search } : {}), ...(isActive ? { isActive } : {}) });
    const res = await fetch(`/api/admin/gift-cards?${params}`);
    const data = await res.json();
    if (data.success) { setCards(data.data); setPagination(data.pagination); }
    setLoading(false);
  }, [search, isActive]);

  useEffect(() => { fetch_(1); }, [search, isActive]);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    adminToast.info('Code copied to clipboard');
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { value: parseFloat(form.value), currencyCode: form.currencyCode, quantity: parseInt(form.quantity) || 1, issuedToEmail: form.issuedToEmail || null, expiresAt: form.expiresAt ? new Date(form.expiresAt) : null, note: form.note || null };
      const res = await fetch('/api/admin/gift-cards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) { adminToast.success(parseInt(form.quantity) > 1 ? `${form.quantity} gift cards created` : 'Gift card created'); setDrawerOpen(false); fetch_(1); }
      else adminToast.error(data.error);
    } catch { adminToast.error('Creation failed'); }
    setSaving(false);
  };

  const fmtCurrency = (v: number, cur = 'INR') => new Intl.NumberFormat('en-IN', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(v);

  const columns: Column<GiftCard>[] = [
    {
      key: 'code', header: 'Code', cell: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontFamily: 'var(--admin-font-mono)', fontSize: '13px', fontWeight: 600, letterSpacing: '1px' }}>{r.code}</span>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-text-tertiary)', display: 'flex' }} onClick={() => copyCode(r.code, r.id)} title="Copy code" id={`gc-copy-${r.id}`}>
            {copiedId === r.id ? <Check size={13} style={{ color: 'var(--admin-success)' }} /> : <Copy size={13} />}
          </button>
        </div>
      ),
    },
    { key: 'issuedToEmail', header: 'Issued To', cell: (r) => r.issuedToEmail ? <span style={{ fontSize: '12px' }}>{r.issuedToEmail}</span> : <span style={{ color: 'var(--admin-text-tertiary)', fontSize: '12px' }}>—</span> },
    { key: 'value', header: 'Original Value', cell: (r) => <span style={{ fontWeight: 600 }}>{fmtCurrency(r.value, r.currencyCode)}</span> },
    {
      key: 'balance', header: 'Remaining', cell: (r) => {
        const pct = r.value > 0 ? (r.balance / r.value) * 100 : 0;
        return (
          <div>
            <div style={{ fontWeight: 600 }}>{fmtCurrency(r.balance, r.currencyCode)}</div>
            <div style={{ width: '80px', height: '3px', background: 'var(--admin-surface-overlay)', borderRadius: '2px', marginTop: '4px' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: pct > 50 ? 'var(--admin-success)' : pct > 20 ? 'var(--admin-warning)' : 'var(--admin-error)', borderRadius: '2px', transition: 'width 0.3s' }} />
            </div>
          </div>
        );
      },
    },
    { key: 'isActive', header: 'Status', cell: (r) => <StatusBadge status={r.isActive ? (r.balance > 0 ? 'active' : 'expired') : 'inactive'} /> },
    { key: 'expiresAt', header: 'Expires', cell: (r) => r.expiresAt ? <span style={{ fontSize: '12px' }}>{new Date(r.expiresAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span> : <span style={{ color: 'var(--admin-text-tertiary)', fontSize: '12px' }}>Never</span> },
    { key: 'createdAt', header: 'Created', sortable: true, cell: (r) => <span style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>{new Date(r.createdAt).toLocaleDateString('en-IN')}</span> },
    { key: 'actions', header: '', cell: (r) => <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setDetailCard(r)} id={`gc-detail-${r.id}`}>View</button> },
  ];

  return (
    <div>
      <div className="admin-page-header">
        <div><h1 className="admin-page-title">Gift Cards</h1><p className="admin-page-subtitle">Issue and manage gift cards for customers</p></div>
        <div className="admin-page-actions">
          <ExportMenu onExport={(f) => handleExportDownload(f, 'gift-cards')} id="gc-export" />
          <button className="admin-btn admin-btn-primary" onClick={() => { setForm(DEFAULT_FORM); setDrawerOpen(true); }} id="gc-create"><Plus size={14} />Issue Gift Card</button>
        </div>
      </div>

      {stats && (
        <div className="admin-stat-grid" style={{ marginBottom: '24px' }}>
          <StatCard id="gc-stat-total" label="Total Issued" value={stats.total ?? 0} icon={<Gift size={16} />} iconVariant="accent" />
          <StatCard id="gc-stat-active" label="Active Cards" value={stats.active ?? 0} icon={<Gift size={16} />} iconVariant="success" />
          <StatCard id="gc-stat-balance" label="Outstanding Balance" value={fmtCurrency(stats.totalBalance ?? 0)} icon={<Gift size={16} />} iconVariant="warning" />
          <StatCard id="gc-stat-redeemed" label="Total Redeemed" value={fmtCurrency(stats.totalRedeemed ?? 0)} icon={<Gift size={16} />} iconVariant="info" />
        </div>
      )}

      <DataTable id="gc-table" data={cards} columns={columns} loading={loading} totalCount={pagination?.total ?? 0} page={pagination?.page ?? 1} limit={pagination?.limit ?? 25} onPageChange={fetch_} selectable selectedIds={selectedIds} onSelectionChange={setSelectedIds}
        toolbar={
          <>
            <div className="admin-search-input-wrap"><Search size={14} /><input id="gc-search" className="admin-search-input" placeholder="Search by code or email..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            <select className="admin-select" style={{ height: '32px', width: 'auto', fontSize: '12px', padding: '0 28px 0 10px' }} value={isActive} onChange={(e) => setIsActive(e.target.value)} id="gc-status-filter">
              <option value="">All</option><option value="true">Active</option><option value="false">Inactive</option>
            </select>
          </>
        }
        emptyTitle="No gift cards yet" emptyDescription="Issue gift cards to customers as rewards or promotions."
        emptyAction={<button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => setDrawerOpen(true)} id="gc-empty-create"><Plus size={13} />Issue Gift Card</button>}
      />

      {/* Create Drawer */}
      <Drawer open={drawerOpen} title="Issue Gift Card(s)" onClose={() => setDrawerOpen(false)}
        footer={<><button className="admin-btn admin-btn-ghost" onClick={() => setDrawerOpen(false)}>Cancel</button><button className="admin-btn admin-btn-primary" onClick={save} disabled={saving} id="gc-save">{saving && <span className="admin-spinner" style={{ width: 14, height: 14 }} />}Issue</button></>}>
        <div className="admin-form-row">
          <div className="admin-form-group"><label className="admin-label required" htmlFor="gc-value">Value</label><input id="gc-value" className="admin-input" type="number" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} placeholder="500" /></div>
          <div className="admin-form-group"><label className="admin-label required" htmlFor="gc-currency">Currency</label><select id="gc-currency" className="admin-select" value={form.currencyCode} onChange={(e) => setForm((f) => ({ ...f, currencyCode: e.target.value }))}><option value="INR">INR (₹)</option><option value="USD">USD ($)</option></select></div>
        </div>
        <div className="admin-form-group"><label className="admin-label required" htmlFor="gc-qty">Quantity</label><input id="gc-qty" className="admin-input" type="number" min="1" max="500" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} /><p style={{ fontSize: '11px', color: 'var(--admin-text-tertiary)', marginTop: '4px' }}>Generate up to 500 cards at once. Each gets a unique code.</p></div>
        <div className="admin-form-group"><label className="admin-label" htmlFor="gc-email">Issue To (email)</label><input id="gc-email" className="admin-input" type="email" value={form.issuedToEmail} onChange={(e) => setForm((f) => ({ ...f, issuedToEmail: e.target.value }))} placeholder="customer@example.com (optional)" /></div>
        <div className="admin-form-group"><label className="admin-label" htmlFor="gc-expires">Expiry Date</label><input id="gc-expires" className="admin-input" type="date" value={form.expiresAt} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))} /></div>
        <div className="admin-form-group"><label className="admin-label" htmlFor="gc-note">Internal Note</label><input id="gc-note" className="admin-input" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="Birthday gift for VIP customer" /></div>
      </Drawer>

      {/* Detail Drawer */}
      <Drawer open={!!detailCard} title={`Gift Card: ${detailCard?.code ?? ''}`} onClose={() => setDetailCard(null)}>
        {detailCard && (
          <div>
            <div className="admin-stat-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '16px' }}>
              <StatCard id="gc-d-value" label="Original Value" value={fmtCurrency(detailCard.value, detailCard.currencyCode)} />
              <StatCard id="gc-d-balance" label="Remaining" value={fmtCurrency(detailCard.balance, detailCard.currencyCode)} iconVariant={detailCard.balance > 0 ? 'success' : 'error'} />
            </div>
            <div className="admin-section">
              <div className="admin-section-title">Transaction History</div>
              {detailCard.transactions.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--admin-text-tertiary)' }}>No transactions yet</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {detailCard.transactions.map((t) => (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'var(--admin-surface-raised)', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 500 }}>{t.type}</div>
                        <div style={{ fontSize: '11px', color: 'var(--admin-text-tertiary)' }}>{new Date(t.createdAt).toLocaleString('en-IN')}</div>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: t.amount < 0 ? 'var(--admin-error)' : 'var(--admin-success)' }}>
                        {t.amount < 0 ? '' : '+'}{fmtCurrency(t.amount, detailCard.currencyCode)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
