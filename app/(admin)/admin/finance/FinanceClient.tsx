// ============================================================
// BLENDIFY — Finance Dashboard Client
// /admin/finance
//
// Features:
//   - 5 tabs: Overview, Gateways, Transactions, Reconciliation, Tax & Discounts
//   - Period selector with URL state persistence
//   - Custom date range
//   - Comparison period overlay
//   - 14 Finance KPI cards
//   - Revenue/Transaction/Refund/Discount/Tax time series charts
//   - Payment gateway breakdown with donut + table
//   - Paginated transaction table with search/filter/sort
//   - Transaction detail drawer (safe info only)
//   - Reconciliation reporting with variance
//   - Refund reporting with gateway/status breakdown
//   - Tax & discount reporting
//   - Full CSV/Excel/PDF/Print export
//   - Loading skeletons, empty states, error states
//   - Real database data only
// ============================================================
'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  DollarSign, TrendingUp, TrendingDown, Minus,
  ShoppingCart, CreditCard, ReceiptText, Percent,
  ArrowLeftRight, RefreshCw, Truck, Tag,
  Calendar, Filter, ChevronDown,
  Search, X, Eye,
} from 'lucide-react';
import { StatCard } from '@/components/admin/ui/StatCard';
import { LineChart, BarChart, DonutChart } from '@/components/admin/ui/AnalyticsChart';
import { ExportMenu } from '@/components/admin/ui/ExportMenu';
import { SkeletonTable } from '@/components/admin/ui/SkeletonTable';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { StatusBadge } from '@/components/admin/ui/StatusBadge';
import { Drawer } from '@/components/admin/ui/Drawer';
import { adminToast } from '@/components/admin/ui/Toast';

// ── Types ─────────────────────────────────────────────────────
interface FinanceKPIs {
  grossRevenue: number; netRevenue: number; totalRevenue: number;
  discounts: number; couponDiscounts: number; loyaltyDiscounts: number;
  taxCollected: number; shippingRevenue: number; refunds: number;
  netReceivable: number; totalOrders: number; totalTransactions: number;
  aov: number; paymentSuccessRate: number; paymentFailureRate: number;
  refundRate: number;
  // Reconciliation
  successfulPayments: number; failedPayments: number; pendingPayments: number;
  refundedPaymentCount: number; successfulAmount: number; failedAmount: number;
  pendingAmount: number; refundedAmount: number;
  totalGatewayAmount: number; totalOrderAmount: number; reconciliationVariance: number;
}

interface TimeSeriesPoint {
  date: string; revenue: number; orders: number; transactions: number;
  refunds: number; tax: number; discount: number; shipping: number; netRevenue: number;
}

interface GatewayRow {
  gateway: string; transactionCount: number;
  successfulAmount: number; failedAmount: number;
  pendingAmount: number; refundedAmount: number;
  successfulCount: number; failedCount: number;
  pendingCount: number; refundedCount: number;
}

interface RefundReport {
  totalRefundCount: number; totalRefundAmount: number;
  refundsByGateway: Array<{ gateway: string; count: number; amount: number }>;
  returnStatusBreakdown: Array<{ status: string; count: number; amount: number }>;
}

interface ComparisonData {
  grossRevenueChange: number | null; netRevenueChange: number | null;
  ordersChange: number | null; transactionsChange: number | null;
  aovChange: number | null; refundsChange: number | null;
  taxChange: number | null; discountsChange: number | null;
  prevGrossRevenue: number | null; prevNetRevenue: number | null;
  prevOrders: number | null; prevTransactions: number | null;
}

interface OverviewResponse {
  period: { selected: string; dateFrom: string; dateTo: string; groupBy: string; compare: string };
  kpis: FinanceKPIs;
  timeSeries: TimeSeriesPoint[];
  gatewayBreakdown: GatewayRow[];
  refundReport: RefundReport;
  comparison: ComparisonData | null;
}

interface Transaction {
  id: string; orderId: string; orderNumber: string;
  customerName: string; customerEmail: string; gateway: string;
  amount: number; currencyCode: string; paymentStatus: string;
  orderStatus: string; orderTotal: number; paidAt: string | null;
  refundAmount: number | null; refundedAt: string | null;
  failureCode: string | null; failureReason: string | null;
  createdAt: string;
}

interface TransactionsResponse {
  transactions: Transaction[];
  pagination: { total: number; page: number; limit: number; totalPages: number; hasNextPage: boolean; hasPrevPage: boolean };
}

// ── Formatting ────────────────────────────────────────────────
const fmtCurrency = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(v);
const fmtPct = (v: number) => `${v.toFixed(1)}%`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtDateTime = (d: string) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// ── Period options ────────────────────────────────────────────
const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last7', label: 'Last 7 Days' },
  { key: 'last30', label: 'Last 30 Days' },
  { key: 'last90', label: 'Last 90 Days' },
  { key: 'thisMonth', label: 'This Month' },
  { key: 'prevMonth', label: 'Previous Month' },
  { key: 'thisYear', label: 'This Year' },
  { key: 'custom', label: 'Custom Range' },
];

const COMPARE_OPTIONS = [
  { key: 'prevPeriod', label: 'Previous Period' },
  { key: 'prevMonth', label: 'Previous Month' },
  { key: 'prevYear', label: 'Previous Year' },
  { key: 'none', label: 'No Comparison' },
];

const GROUP_OPTIONS = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
];

const TABS = [
  { key: 'overview', label: 'Overview', icon: DollarSign },
  { key: 'gateways', label: 'Gateways', icon: CreditCard },
  { key: 'transactions', label: 'Transactions', icon: ReceiptText },
  { key: 'reconciliation', label: 'Reconciliation', icon: ArrowLeftRight },
  { key: 'tax', label: 'Tax & Discounts', icon: Tag },
];

const GATEWAY_COLORS: Record<string, string> = {
  RAZORPAY: '#3395FF', STRIPE: '#635BFF', COD: '#2D7A4F',
  WALLET: '#C47C0A', LOYALTY_POINTS: '#8B3030',
};

const PAYMENT_STATUSES = ['PENDING', 'AUTHORIZED', 'PAID', 'PARTIALLY_REFUNDED', 'REFUNDED', 'FAILED', 'CANCELLED'];
const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED', 'REFUND_INITIATED', 'REFUNDED'];
const GATEWAYS = ['RAZORPAY', 'STRIPE', 'COD', 'WALLET', 'LOYALTY_POINTS'];

// ── Main Client ───────────────────────────────────────────────
function FinanceContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State from URL
  const [tab, setTab] = useState(searchParams.get('tab') ?? 'overview');
  const [period, setPeriod] = useState(searchParams.get('period') ?? 'last30');
  const [compare, setCompare] = useState(searchParams.get('compare') ?? 'prevPeriod');
  const [groupBy, setGroupBy] = useState(searchParams.get('groupBy') ?? 'day');
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') ?? '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') ?? '');

  // Overview data
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  // Transactions data
  const [txData, setTxData] = useState<TransactionsResponse | null>(null);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [txPage, setTxPage] = useState(1);
  const [txSearch, setTxSearch] = useState('');
  const [txGateway, setTxGateway] = useState('');
  const [txPayStatus, setTxPayStatus] = useState('');
  const [txOrdStatus, setTxOrdStatus] = useState('');
  const [txSortBy, setTxSortBy] = useState('createdAt');
  const [txSortOrder, setTxSortOrder] = useState<'asc' | 'desc'>('desc');

  // Drawer
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // ── Sync URL ──────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams();
    if (tab !== 'overview') params.set('tab', tab);
    if (period !== 'last30') params.set('period', period);
    if (compare !== 'prevPeriod') params.set('compare', compare);
    if (groupBy !== 'day') params.set('groupBy', groupBy);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [tab, period, compare, groupBy, dateFrom, dateTo, pathname, router]);

  // ── Fetch overview ────────────────────────────────────────
  const fetchOverview = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const params = new URLSearchParams({ period, compare, groupBy });
      if (period === 'custom' && dateFrom && dateTo) {
        params.set('dateFrom', dateFrom);
        params.set('dateTo', dateTo);
      }
      const res = await fetch(`/api/admin/finance/overview?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Unknown error');
      setOverview(json.data);
    } catch (e) {
      setOverviewError((e as Error).message);
      adminToast.error('Failed to load finance data');
    } finally {
      setOverviewLoading(false);
    }
  }, [period, compare, groupBy, dateFrom, dateTo]);

  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  // ── Fetch transactions ────────────────────────────────────
  const fetchTransactions = useCallback(async () => {
    setTxLoading(true);
    setTxError(null);
    try {
      const params = new URLSearchParams({ period, page: String(txPage), limit: '25', sortBy: txSortBy, order: txSortOrder });
      if (period === 'custom' && dateFrom && dateTo) { params.set('dateFrom', dateFrom); params.set('dateTo', dateTo); }
      if (txSearch) params.set('search', txSearch);
      if (txGateway) params.set('gateway', txGateway);
      if (txPayStatus) params.set('paymentStatus', txPayStatus);
      if (txOrdStatus) params.set('orderStatus', txOrdStatus);
      const res = await fetch(`/api/admin/finance/transactions?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Unknown error');
      setTxData(json.data);
    } catch (e) {
      setTxError((e as Error).message);
    } finally {
      setTxLoading(false);
    }
  }, [period, dateFrom, dateTo, txPage, txSearch, txGateway, txPayStatus, txOrdStatus, txSortBy, txSortOrder]);

  useEffect(() => { if (tab === 'transactions') fetchTransactions(); }, [tab, fetchTransactions]);

  // ── Export handler ────────────────────────────────────────
  const handleExport = useCallback(async (format: 'csv' | 'excel' | 'pdf' | 'print') => {
    const section = tab === 'overview' ? 'overview' : tab === 'reconciliation' ? 'reconciliation' : tab === 'tax' ? 'overview' : 'transactions';
    const params = new URLSearchParams({ format, section, period });
    if (period === 'custom' && dateFrom && dateTo) { params.set('dateFrom', dateFrom); params.set('dateTo', dateTo); }
    if (txGateway) params.set('gateway', txGateway);
    const res = await fetch(`/api/admin/finance/export?${params}`);
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    if (format === 'print') {
      const html = await blob.text();
      const w = window.open('', '_blank');
      if (w) { w.document.write(html); w.document.close(); w.print(); }
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ext = format === 'excel' ? 'xls' : format === 'pdf' ? 'html' : 'csv';
    a.download = `finance-${section}-${new Date().toISOString().slice(0, 10)}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [tab, period, dateFrom, dateTo, txGateway]);

  // ── Transaction sort ──────────────────────────────────────
  const handleTxSort = (col: string) => {
    if (txSortBy === col) {
      setTxSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setTxSortBy(col);
      setTxSortOrder('desc');
    }
    setTxPage(1);
  };

  const clearTxFilters = () => {
    setTxSearch(''); setTxGateway(''); setTxPayStatus(''); setTxOrdStatus('');
    setTxPage(1);
  };

  const hasActiveFilters = !!(txSearch || txGateway || txPayStatus || txOrdStatus);

  // ── Shorthand helpers ─────────────────────────────────────
  const k = overview?.kpis;
  const c = overview?.comparison;
  const ts = overview?.timeSeries ?? [];
  const gw = overview?.gatewayBreakdown ?? [];
  const ref = overview?.refundReport;

  // ── Render ────────────────────────────────────────────────
  return (
    <div id="finance-dashboard">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title" id="finance-title">Finance Dashboard</h1>
          <p className="admin-page-subtitle">Financial reporting, reconciliation &amp; transaction analytics</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <ExportMenu onExport={handleExport} id="finance-export" />
          <button className="admin-btn admin-btn-ghost" onClick={fetchOverview} title="Refresh" aria-label="Refresh data" id="finance-refresh">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* ── Filters bar ────────────────────────────────────── */}
      <div className="admin-filters-bar" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Calendar size={14} style={{ color: 'var(--admin-text-tertiary)' }} />
          <select className="admin-select" value={period} onChange={e => { setPeriod(e.target.value); setTxPage(1); }} id="finance-period-select" aria-label="Date period">
            {PERIODS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </div>
        {period === 'custom' && (
          <>
            <input type="date" className="admin-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: 140 }} aria-label="Start date" />
            <span style={{ color: 'var(--admin-text-tertiary)', fontSize: 12 }}>to</span>
            <input type="date" className="admin-input" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: 140 }} aria-label="End date" />
          </>
        )}
        <select className="admin-select" value={compare} onChange={e => setCompare(e.target.value)} id="finance-compare-select" aria-label="Comparison period">
          {COMPARE_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
        <select className="admin-select" value={groupBy} onChange={e => setGroupBy(e.target.value)} id="finance-groupby-select" aria-label="Group by">
          {GROUP_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
      </div>

      {/* ── Tabs ───────────────────────────────────────────── */}
      <div className="admin-tabs" role="tablist" aria-label="Finance sections" style={{ marginBottom: 24 }}>
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              className={`admin-tab ${tab === t.key ? 'active' : ''}`}
              onClick={() => setTab(t.key)}
              id={`finance-tab-${t.key}`}
            >
              <Icon size={14} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Error state ────────────────────────────────────── */}
      {overviewError && (
        <div className="admin-alert admin-alert-error" role="alert" id="finance-error">
          <span>Failed to load finance data: {overviewError}</span>
          <button className="admin-btn admin-btn-ghost" onClick={fetchOverview} style={{ marginLeft: 8 }}>Retry</button>
        </div>
      )}

      {/* ── TAB: Overview ──────────────────────────────────── */}
      {tab === 'overview' && (
        <div id="finance-overview">
          {/* KPI Grid */}
          <div className="admin-stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
            <StatCard label="Gross Revenue" value={overviewLoading ? '—' : fmtCurrency(k!.grossRevenue)} icon={<DollarSign size={18} />} iconVariant="gold" trend={c?.grossRevenueChange ?? undefined} trendLabel="vs prev" loading={overviewLoading} id="kpi-gross-revenue" />
            <StatCard label="Net Revenue" value={overviewLoading ? '—' : fmtCurrency(k!.netRevenue)} icon={<TrendingUp size={18} />} iconVariant="success" trend={c?.netRevenueChange ?? undefined} trendLabel="vs prev" loading={overviewLoading} id="kpi-net-revenue" />
            <StatCard label="Net Receivable" value={overviewLoading ? '—' : fmtCurrency(k!.netReceivable)} icon={<DollarSign size={18} />} iconVariant="accent" loading={overviewLoading} id="kpi-net-receivable" />
            <StatCard label="Total Orders" value={overviewLoading ? '—' : k!.totalOrders.toLocaleString()} icon={<ShoppingCart size={18} />} iconVariant="info" trend={c?.ordersChange ?? undefined} trendLabel="vs prev" loading={overviewLoading} id="kpi-total-orders" />
            <StatCard label="Total Transactions" value={overviewLoading ? '—' : k!.totalTransactions.toLocaleString()} icon={<CreditCard size={18} />} iconVariant="accent" trend={c?.transactionsChange ?? undefined} trendLabel="vs prev" loading={overviewLoading} id="kpi-total-transactions" />
            <StatCard label="Avg Order Value" value={overviewLoading ? '—' : fmtCurrency(k!.aov)} icon={<ReceiptText size={18} />} iconVariant="gold" trend={c?.aovChange ?? undefined} trendLabel="vs prev" loading={overviewLoading} id="kpi-aov" />
            <StatCard label="Payment Success Rate" value={overviewLoading ? '—' : fmtPct(k!.paymentSuccessRate)} icon={<Percent size={18} />} iconVariant="success" loading={overviewLoading} id="kpi-success-rate" />
            <StatCard label="Payment Failure Rate" value={overviewLoading ? '—' : fmtPct(k!.paymentFailureRate)} icon={<Percent size={18} />} iconVariant="error" loading={overviewLoading} id="kpi-failure-rate" />
            <StatCard label="Refund Rate" value={overviewLoading ? '—' : fmtPct(k!.refundRate)} icon={<RefreshCw size={18} />} iconVariant="warning" trend={c?.refundsChange ?? undefined} trendLabel="vs prev" loading={overviewLoading} id="kpi-refund-rate" />
            <StatCard label="Discounts" value={overviewLoading ? '—' : fmtCurrency(k!.discounts)} icon={<Tag size={18} />} iconVariant="warning" trend={c?.discountsChange ?? undefined} trendLabel="vs prev" loading={overviewLoading} id="kpi-discounts" />
            <StatCard label="Tax Collected" value={overviewLoading ? '—' : fmtCurrency(k!.taxCollected)} icon={<ReceiptText size={18} />} iconVariant="info" trend={c?.taxChange ?? undefined} trendLabel="vs prev" loading={overviewLoading} id="kpi-tax" />
            <StatCard label="Shipping Revenue" value={overviewLoading ? '—' : fmtCurrency(k!.shippingRevenue)} icon={<Truck size={18} />} iconVariant="accent" loading={overviewLoading} id="kpi-shipping" />
            <StatCard label="Refunds" value={overviewLoading ? '—' : fmtCurrency(k!.refunds)} icon={<RefreshCw size={18} />} iconVariant="error" loading={overviewLoading} id="kpi-refunds" />
            <StatCard label="Total Revenue (Subtotal)" value={overviewLoading ? '—' : fmtCurrency(k!.totalRevenue)} icon={<DollarSign size={18} />} iconVariant="gold" loading={overviewLoading} id="kpi-total-revenue" />
          </div>

          {/* Charts */}
          {overviewLoading ? (
            <SkeletonTable rows={4} cols={1} />
          ) : ts.length === 0 ? (
            <EmptyState title="No financial data" description="No orders or payments found for the selected period." icon={<DollarSign size={40} />} />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: 20 }}>
              <div className="admin-card" style={{ padding: 20 }}>
                <LineChart data={ts.map(p => ({ label: p.date, value: p.revenue }))} label="Revenue Over Time" color="#581312" id="chart-revenue" />
              </div>
              <div className="admin-card" style={{ padding: 20 }}>
                <BarChart data={ts.map(p => ({ label: p.date, value: p.transactions }))} label="Transaction Volume" color="#1565A0" id="chart-transactions" />
              </div>
              <div className="admin-card" style={{ padding: 20 }}>
                <LineChart data={ts.map(p => ({ label: p.date, value: p.netRevenue }))} label="Net Revenue Over Time" color="#2D7A4F" id="chart-net-revenue" />
              </div>
              <div className="admin-card" style={{ padding: 20 }}>
                <LineChart data={ts.map(p => ({ label: p.date, value: p.refunds }))} label="Refunds Over Time" color="#B91C1C" id="chart-refunds" />
              </div>
              <div className="admin-card" style={{ padding: 20 }}>
                <BarChart data={ts.map(p => ({ label: p.date, value: p.discount }))} label="Discounts Over Time" color="#C47C0A" id="chart-discounts" />
              </div>
              <div className="admin-card" style={{ padding: 20 }}>
                <LineChart data={ts.map(p => ({ label: p.date, value: p.tax }))} label="Tax Collected Over Time" color="#6B1A1A" id="chart-tax" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Gateways ──────────────────────────────────── */}
      {tab === 'gateways' && (
        <div id="finance-gateways">
          {overviewLoading ? (
            <SkeletonTable rows={5} cols={6} />
          ) : gw.length === 0 ? (
            <EmptyState title="No gateway data" description="No payment transactions found for the selected period." icon={<CreditCard size={40} />} />
          ) : (
            <>
              {/* Donut */}
              <div className="admin-card" style={{ padding: 24, marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: 16 }}>Payment Gateway Distribution</h3>
                <DonutChart
                  data={gw.map(g => ({
                    label: g.gateway.replace('_', ' '),
                    value: g.transactionCount,
                    color: GATEWAY_COLORS[g.gateway] ?? '#581312',
                  }))}
                  label="Transactions"
                  id="donut-gateways"
                />
              </div>

              {/* Table */}
              <div className="admin-card" style={{ overflow: 'auto' }}>
                <table className="admin-table" id="gateway-table">
                  <thead>
                    <tr>
                      <th>Gateway</th>
                      <th style={{ textAlign: 'right' }}>Transactions</th>
                      <th style={{ textAlign: 'right' }}>Successful</th>
                      <th style={{ textAlign: 'right' }}>Failed</th>
                      <th style={{ textAlign: 'right' }}>Pending</th>
                      <th style={{ textAlign: 'right' }}>Refunded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gw.map(g => (
                      <tr key={g.gateway}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: GATEWAY_COLORS[g.gateway] ?? '#581312' }} />
                            <span style={{ fontWeight: 600 }}>{g.gateway.replace('_', ' ')}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>{g.transactionCount}</td>
                        <td style={{ textAlign: 'right', color: 'var(--admin-success)' }}>{fmtCurrency(g.successfulAmount)} <span style={{ fontSize: 11, color: 'var(--admin-text-tertiary)' }}>({g.successfulCount})</span></td>
                        <td style={{ textAlign: 'right', color: 'var(--admin-error)' }}>{fmtCurrency(g.failedAmount)} <span style={{ fontSize: 11, color: 'var(--admin-text-tertiary)' }}>({g.failedCount})</span></td>
                        <td style={{ textAlign: 'right', color: 'var(--admin-warning)' }}>{fmtCurrency(g.pendingAmount)} <span style={{ fontSize: 11, color: 'var(--admin-text-tertiary)' }}>({g.pendingCount})</span></td>
                        <td style={{ textAlign: 'right' }}>{fmtCurrency(g.refundedAmount)} <span style={{ fontSize: 11, color: 'var(--admin-text-tertiary)' }}>({g.refundedCount})</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TAB: Transactions ──────────────────────────────── */}
      {tab === 'transactions' && (
        <div id="finance-transactions">
          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 320 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-tertiary)' }} />
              <input
                className="admin-input"
                placeholder="Search order # or email..."
                value={txSearch}
                onChange={e => { setTxSearch(e.target.value); setTxPage(1); }}
                style={{ paddingLeft: 32, width: '100%' }}
                aria-label="Search transactions"
                id="tx-search"
              />
            </div>
            <select className="admin-select" value={txGateway} onChange={e => { setTxGateway(e.target.value); setTxPage(1); }} aria-label="Filter by gateway" id="tx-gateway-filter">
              <option value="">All Gateways</option>
              {GATEWAYS.map(g => <option key={g} value={g}>{g.replace('_', ' ')}</option>)}
            </select>
            <select className="admin-select" value={txPayStatus} onChange={e => { setTxPayStatus(e.target.value); setTxPage(1); }} aria-label="Filter by payment status" id="tx-pay-filter">
              <option value="">All Payment Status</option>
              {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
            <select className="admin-select" value={txOrdStatus} onChange={e => { setTxOrdStatus(e.target.value); setTxPage(1); }} aria-label="Filter by order status" id="tx-ord-filter">
              <option value="">All Order Status</option>
              {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
            {hasActiveFilters && (
              <button className="admin-btn admin-btn-ghost" onClick={clearTxFilters} id="tx-clear-filters" aria-label="Clear all filters">
                <X size={14} /> Clear
              </button>
            )}
          </div>

          {/* Table */}
          {txLoading ? (
            <SkeletonTable rows={8} cols={8} />
          ) : txError ? (
            <div className="admin-alert admin-alert-error" role="alert">
              <span>Failed to load transactions: {txError}</span>
              <button className="admin-btn admin-btn-ghost" onClick={fetchTransactions} style={{ marginLeft: 8 }}>Retry</button>
            </div>
          ) : !txData || txData.transactions.length === 0 ? (
            <EmptyState
              title={hasActiveFilters ? 'No matching transactions' : 'No transactions'}
              description={hasActiveFilters ? 'Try adjusting your filters or date range.' : 'No payment transactions found for the selected period.'}
              icon={<ReceiptText size={40} />}
              action={hasActiveFilters ? <button className="admin-btn admin-btn-secondary" onClick={clearTxFilters}>Clear Filters</button> : undefined}
            />
          ) : (
            <>
              <div className="admin-card" style={{ overflow: 'auto' }}>
                <table className="admin-table" id="transactions-table">
                  <thead>
                    <tr>
                      <SortTh col="createdAt" label="Date" sortBy={txSortBy} sortOrder={txSortOrder} onSort={handleTxSort} />
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Gateway</th>
                      <SortTh col="amount" label="Amount" sortBy={txSortBy} sortOrder={txSortOrder} onSort={handleTxSort} />
                      <SortTh col="status" label="Payment" sortBy={txSortBy} sortOrder={txSortOrder} onSort={handleTxSort} />
                      <th>Order Status</th>
                      <th>Refund</th>
                      <th style={{ width: 44 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {txData.transactions.map(tx => (
                      <tr key={tx.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedTx(tx)}>
                        <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{fmtDate(tx.createdAt)}</td>
                        <td style={{ fontWeight: 600, fontSize: 12 }}>{tx.orderNumber}</td>
                        <td>
                          <div style={{ fontSize: 12 }}>{tx.customerName}</div>
                          <div style={{ fontSize: 11, color: 'var(--admin-text-tertiary)' }}>{tx.customerEmail}</div>
                        </td>
                        <td>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: `${GATEWAY_COLORS[tx.gateway] ?? '#581312'}18`, color: GATEWAY_COLORS[tx.gateway] ?? '#581312' }}>
                            {tx.gateway.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, fontSize: 12, fontFamily: 'monospace' }}>{fmtCurrency(tx.amount)}</td>
                        <td><StatusBadge status={tx.paymentStatus} /></td>
                        <td><StatusBadge status={tx.orderStatus} /></td>
                        <td style={{ textAlign: 'right', fontSize: 12, color: tx.refundAmount ? 'var(--admin-error)' : 'var(--admin-text-tertiary)' }}>
                          {tx.refundAmount ? fmtCurrency(tx.refundAmount) : '—'}
                        </td>
                        <td>
                          <button className="admin-icon-btn" onClick={e => { e.stopPropagation(); setSelectedTx(tx); }} aria-label="View details" title="View details">
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {txData.pagination.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '0 4px' }}>
                  <span style={{ fontSize: 12, color: 'var(--admin-text-tertiary)' }}>
                    Showing {((txData.pagination.page - 1) * txData.pagination.limit) + 1}–{Math.min(txData.pagination.page * txData.pagination.limit, txData.pagination.total)} of {txData.pagination.total}
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="admin-btn admin-btn-ghost" disabled={!txData.pagination.hasPrevPage} onClick={() => setTxPage(p => p - 1)} id="tx-prev-page">&larr; Prev</button>
                    <button className="admin-btn admin-btn-ghost" disabled={!txData.pagination.hasNextPage} onClick={() => setTxPage(p => p + 1)} id="tx-next-page">Next &rarr;</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── TAB: Reconciliation ────────────────────────────── */}
      {tab === 'reconciliation' && (
        <div id="finance-reconciliation">
          {overviewLoading ? (
            <SkeletonTable rows={4} cols={4} />
          ) : !k ? (
            <EmptyState title="No reconciliation data" description="No payment data available for the selected period." icon={<ArrowLeftRight size={40} />} />
          ) : (
            <>
              {/* Reconciliation KPIs */}
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--admin-text-primary)', marginBottom: 12 }}>Payment Reconciliation</h3>
              <div className="admin-stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 16, marginBottom: 28 }}>
                <StatCard label="Successful Payments" value={k.successfulPayments.toLocaleString()} icon={<CreditCard size={18} />} iconVariant="success" id="rec-successful" />
                <StatCard label="Successful Amount" value={fmtCurrency(k.successfulAmount)} icon={<DollarSign size={18} />} iconVariant="success" id="rec-successful-amt" />
                <StatCard label="Failed Payments" value={k.failedPayments.toLocaleString()} icon={<CreditCard size={18} />} iconVariant="error" id="rec-failed" />
                <StatCard label="Failed Amount" value={fmtCurrency(k.failedAmount)} icon={<DollarSign size={18} />} iconVariant="error" id="rec-failed-amt" />
                <StatCard label="Pending Payments" value={k.pendingPayments.toLocaleString()} icon={<CreditCard size={18} />} iconVariant="warning" id="rec-pending" />
                <StatCard label="Pending Amount" value={fmtCurrency(k.pendingAmount)} icon={<DollarSign size={18} />} iconVariant="warning" id="rec-pending-amt" />
                <StatCard label="Refunded Payments" value={k.refundedPaymentCount.toLocaleString()} icon={<RefreshCw size={18} />} iconVariant="info" id="rec-refunded" />
                <StatCard label="Refunded Amount" value={fmtCurrency(k.refundedAmount)} icon={<DollarSign size={18} />} iconVariant="info" id="rec-refunded-amt" />
              </div>

              {/* Variance Card */}
              <div className="admin-card" style={{ padding: 24, marginBottom: 28 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--admin-text-primary)', marginBottom: 16 }}>Gateway vs Order Reconciliation</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--admin-text-tertiary)', marginBottom: 4 }}>Total Gateway Amount</div>
                    <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Playfair Display, serif', color: 'var(--admin-text-primary)' }}>{fmtCurrency(k.totalGatewayAmount)}</div>
                    <div style={{ fontSize: 11, color: 'var(--admin-text-tertiary)' }}>Successful + Failed + Pending payments</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--admin-text-tertiary)', marginBottom: 4 }}>Total Order Amount</div>
                    <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Playfair Display, serif', color: 'var(--admin-text-primary)' }}>{fmtCurrency(k.totalOrderAmount)}</div>
                    <div style={{ fontSize: 11, color: 'var(--admin-text-tertiary)' }}>Revenue-eligible orders total</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--admin-text-tertiary)', marginBottom: 4 }}>Reconciliation Variance</div>
                    <div style={{
                      fontSize: 20, fontWeight: 700, fontFamily: 'Playfair Display, serif',
                      color: k.reconciliationVariance === 0 ? 'var(--admin-success)' : 'var(--admin-warning)',
                    }}>
                      {k.reconciliationVariance === 0 ? 'Balanced' : fmtCurrency(k.reconciliationVariance)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--admin-text-tertiary)' }}>
                      {k.reconciliationVariance === 0 ? 'No discrepancy' : 'Difference between gateway and order totals'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Refund Reporting */}
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--admin-text-primary)', marginBottom: 12 }}>Refund Reporting</h3>
              {ref && (ref.totalRefundCount > 0 || ref.returnStatusBreakdown.length > 0) ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: 20, marginBottom: 28 }}>
                  <div className="admin-stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12 }}>
                    <StatCard label="Total Refunds" value={ref.totalRefundCount.toLocaleString()} icon={<RefreshCw size={18} />} iconVariant="error" id="ref-count" />
                    <StatCard label="Total Refund Amount" value={fmtCurrency(ref.totalRefundAmount)} icon={<DollarSign size={18} />} iconVariant="error" id="ref-amount" />
                    <StatCard label="Refund Rate" value={fmtPct(k.refundRate)} icon={<Percent size={18} />} iconVariant="warning" id="ref-rate" />
                  </div>

                  {ref.refundsByGateway.length > 0 && (
                    <div className="admin-card" style={{ padding: 20 }}>
                      <DonutChart
                        data={ref.refundsByGateway.map(r => ({
                          label: r.gateway.replace('_', ' '),
                          value: r.amount,
                          color: GATEWAY_COLORS[r.gateway] ?? '#581312',
                        }))}
                        label="Refund Amount"
                        id="donut-refunds-gateway"
                      />
                    </div>
                  )}

                  {ref.returnStatusBreakdown.length > 0 && (
                    <div className="admin-card" style={{ padding: 20 }}>
                      <BarChart
                        data={ref.returnStatusBreakdown.map(r => ({
                          label: r.status.replace('_', ' '),
                          value: r.count,
                        }))}
                        label="Return Request Status"
                        color="#8B3030"
                        id="chart-return-status"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState title="No refunds" description="No refunds or return requests found for the selected period." icon={<RefreshCw size={40} />} />
              )}
            </>
          )}
        </div>
      )}

      {/* ── TAB: Tax & Discounts ───────────────────────────── */}
      {tab === 'tax' && (
        <div id="finance-tax-discounts">
          {overviewLoading ? (
            <SkeletonTable rows={4} cols={3} />
          ) : !k ? (
            <EmptyState title="No tax/discount data" description="No financial data available for the selected period." icon={<Tag size={40} />} />
          ) : (
            <>
              <div className="admin-stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 16, marginBottom: 28 }}>
                <StatCard label="Tax Collected" value={fmtCurrency(k.taxCollected)} icon={<ReceiptText size={18} />} iconVariant="info" trend={c?.taxChange ?? undefined} trendLabel="vs prev" id="tax-collected" />
                <StatCard label="Coupon Discounts" value={fmtCurrency(k.couponDiscounts)} icon={<Tag size={18} />} iconVariant="warning" id="tax-coupon-discounts" />
                <StatCard label="Loyalty Discounts" value={fmtCurrency(k.loyaltyDiscounts)} icon={<Tag size={18} />} iconVariant="gold" id="tax-loyalty-discounts" />
                <StatCard label="Total Discounts" value={fmtCurrency(k.discounts)} icon={<Tag size={18} />} iconVariant="error" trend={c?.discountsChange ?? undefined} trendLabel="vs prev" id="tax-total-discounts" />
                <StatCard label="Shipping Revenue" value={fmtCurrency(k.shippingRevenue)} icon={<Truck size={18} />} iconVariant="accent" id="tax-shipping" />
                <StatCard label="Gross Revenue" value={fmtCurrency(k.grossRevenue)} icon={<DollarSign size={18} />} iconVariant="gold" id="tax-gross" />
                <StatCard label="Net Revenue" value={fmtCurrency(k.netRevenue)} icon={<TrendingUp size={18} />} iconVariant="success" id="tax-net" />
              </div>

              {/* Gross vs Net chart */}
              {ts.length > 0 && (
                <div className="admin-card" style={{ padding: 20 }}>
                  <LineChart
                    data={ts.map(p => ({ label: p.date, value: p.revenue }))}
                    compareData={ts.map(p => ({ label: p.date, value: p.netRevenue }))}
                    label="Gross vs Net Revenue"
                    color="#581312"
                    id="chart-gross-net"
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Transaction Detail Drawer ──────────────────────── */}
      <Drawer
        open={!!selectedTx}
        title="Transaction Details"
        subtitle={selectedTx?.id ? `ID: ${selectedTx.id.slice(0, 12)}…` : ''}
        width={480}
        onClose={() => setSelectedTx(null)}
      >
        {selectedTx && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '4px 0' }}>
            <DetailRow label="Transaction ID" value={selectedTx.id} />
            <DetailRow label="Order #" value={selectedTx.orderNumber} />
            <DetailRow label="Customer" value={selectedTx.customerName} />
            <DetailRow label="Email" value={selectedTx.customerEmail} />
            <DetailRow label="Gateway" value={selectedTx.gateway.replace('_', ' ')} />
            <DetailRow label="Amount" value={fmtCurrency(selectedTx.amount)} />
            <DetailRow label="Currency" value={selectedTx.currencyCode} />
            <DetailRow label="Payment Status">
              <StatusBadge status={selectedTx.paymentStatus} />
            </DetailRow>
            <DetailRow label="Order Status">
              <StatusBadge status={selectedTx.orderStatus} />
            </DetailRow>
            <DetailRow label="Order Total" value={fmtCurrency(selectedTx.orderTotal)} />
            <DetailRow label="Paid At" value={selectedTx.paidAt ? fmtDateTime(selectedTx.paidAt) : '—'} />
            <DetailRow label="Created At" value={fmtDateTime(selectedTx.createdAt)} />
            {selectedTx.refundAmount !== null && (
              <>
                <div style={{ borderTop: '1px solid var(--admin-border)', marginTop: 4, paddingTop: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Refund Info</span>
                </div>
                <DetailRow label="Refund Amount" value={fmtCurrency(selectedTx.refundAmount)} />
                <DetailRow label="Refunded At" value={selectedTx.refundedAt ? fmtDateTime(selectedTx.refundedAt) : '—'} />
              </>
            )}
            {selectedTx.failureCode && (
              <>
                <div style={{ borderTop: '1px solid var(--admin-border)', marginTop: 4, paddingTop: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-error)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Failure Info</span>
                </div>
                <DetailRow label="Failure Code" value={selectedTx.failureCode} />
                <DetailRow label="Failure Reason" value={selectedTx.failureReason ?? '—'} />
              </>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}

// ── Helper Components ─────────────────────────────────────────

function SortTh({ col, label, sortBy, sortOrder, onSort }: {
  col: string; label: string; sortBy: string; sortOrder: string;
  onSort: (col: string) => void;
}) {
  const active = sortBy === col;
  return (
    <th
      onClick={() => onSort(col)}
      style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', textAlign: col === 'amount' ? 'right' : undefined }}
      aria-sort={active ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {label}
        {active ? (
          sortOrder === 'asc' ? <TrendingUp size={12} /> : <TrendingDown size={12} />
        ) : (
          <ChevronDown size={10} style={{ opacity: 0.3 }} />
        )}
      </span>
    </th>
  );
}

function DetailRow({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, fontSize: 13 }}>
      <span style={{ color: 'var(--admin-text-tertiary)', fontWeight: 500, flexShrink: 0 }}>{label}</span>
      {children ?? <span style={{ color: 'var(--admin-text-primary)', fontWeight: 600, textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>}
    </div>
  );
}

// ── Export with Suspense boundary ─────────────────────────────
export function FinanceClient() {
  return (
    <Suspense fallback={<SkeletonTable rows={6} cols={4} />}>
      <FinanceContent />
    </Suspense>
  );
}
