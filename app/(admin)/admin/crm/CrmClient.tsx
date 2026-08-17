// ============================================================
// BLENDIFY — CRM Dashboard Client
// /admin/crm
//
// Features:
//   - 4 tabs: Overview, Customers, Segments, Value Analytics
//   - Period selector with URL state synchronization
//   - Custom date range & comparison period overlay
//   - 12 CRM KPI StatCards
//   - Customer Growth & Revenue time series charts
//   - Order Frequency & Lifecycle Segment distribution charts
//   - Searchable, filterable, sortable, paginated Customers table
//   - Customer 360° Profile Drawer (Orders, Loyalty, Referrals, Reviews)
//   - Administrative Suspend / Reactivate action with AuditLog
//   - Multi-format Export (CSV, Excel, PDF, Print)
//   - Real database data only — zero mock data
// ============================================================
'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Users, UserCheck, UserX, UserPlus, ShoppingBag,
  TrendingUp, TrendingDown, DollarSign, Percent,
  Coins, Gift, Star, RefreshCw, Calendar,
  Search, X, Eye, ShieldAlert, CheckCircle2, AlertTriangle,
  ChevronDown, ArrowRight, Clock, Award,
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
interface CrmKPIs {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  returningCustomers: number;
  repeatCustomers: number;
  repeatPurchaseRate: number;
  retentionRate: number;
  clv: number;
  aov: number;
  totalCustomerRevenue: number;
  ordersPerCustomer: number;
  periodOrdersCount: number;
}

interface TimeSeriesPoint {
  date: string;
  newCustomers: number;
  revenue: number;
  orders: number;
}

interface SegmentItem {
  key: string;
  label: string;
  count: number;
  color: string;
}

interface ComparisonData {
  customersChange: number | null;
  newCustomersChange: number | null;
  activeCustomersChange: number | null;
  revenueChange: number | null;
  aovChange: number | null;
  clvChange: number | null;
  prevTotalCustomers: number | null;
  prevNewCustomers: number | null;
  prevRevenue: number | null;
}

interface OverviewResponse {
  period: { selected: string; dateFrom: string; dateTo: string; groupBy: string; compare: string };
  kpis: CrmKPIs;
  timeSeries: TimeSeriesPoint[];
  segments: SegmentItem[];
  frequencyDistribution: Array<{ label: string; value: number }>;
  comparison: ComparisonData | null;
}

interface CustomerListItem {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  isActive: boolean;
  loyaltyPoints: number;
  loyaltyTier: string;
  referralCode: string;
  referralsCount: number;
  lastLoginAt: string | null;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
  aov: number;
  lastOrderDate: string | null;
  lifecycle: string;
}

interface CustomersResponse {
  customers: CustomerListItem[];
  pagination: { total: number; page: number; limit: number; totalPages: number; hasNextPage: boolean; hasPrevPage: boolean };
}

interface Customer360Profile {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: string;
  isActive: boolean;
  loyaltyPoints: number;
  loyaltyTier: string;
  referralCode: string;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  referredBy: { id: string; firstName: string; lastName: string; email: string } | null;
  financials: {
    totalOrders: number;
    allOrdersCount: number;
    totalSpent: number;
    aov: number;
    totalRefunded: number;
    cancelledOrders: number;
    firstOrderDate: string | null;
    lastOrderDate: string | null;
  };
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    subtotal: number;
    tax: number;
    discount: number;
    shippingCost: number;
    total: number;
    currencyCode: string;
    createdAt: string;
    items: Array<{
      id: string;
      productName: string;
      variantName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      imageUrl: string | null;
    }>;
  }>;
  loyaltyTransactions: Array<{
    id: string;
    type: string;
    points: number;
    balance: number;
    description: string;
    createdAt: string;
  }>;
  referrals: Array<{
    id: string;
    name: string;
    email: string;
    loyaltyTier: string;
    createdAt: string;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    title: string | null;
    body: string;
    status: string;
    createdAt: string;
    product: { id: string; name: string; slug: string };
  }>;
  couponUsages: Array<{
    id: string;
    usedAt: string;
    coupon: { id: string; code: string; type: string; value: number };
  }>;
  returnRequests: Array<{
    id: string;
    orderId: string;
    status: string;
    reason: string;
    refundAmount: number;
    createdAt: string;
  }>;
}

// ── Formatting Helpers ────────────────────────────────────────
const fmtCurrency = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(v);
const fmtPct = (v: number) => `${v.toFixed(1)}%`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtDateTime = (d: string) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

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
  { key: 'overview', label: 'Overview', icon: Users },
  { key: 'customers', label: 'Customers', icon: UserCheck },
  { key: 'segments', label: 'Segments', icon: Award },
  { key: 'analytics', label: 'Value Analytics', icon: TrendingUp },
];

const SEGMENT_OPTIONS = [
  { key: 'all', label: 'All Customers' },
  { key: 'high_value', label: 'High Value VIP (₹10k+)' },
  { key: 'repeat', label: 'Repeat Customers (2+ orders)' },
  { key: 'new', label: 'New (Last 30d)' },
  { key: 'active', label: 'Active (Ordered last 60d)' },
  { key: 'one_time', label: 'One-Time Buyers' },
  { key: 'inactive', label: 'Inactive / At-Risk' },
  { key: 'no_purchase', label: 'Registered (No Purchase)' },
  { key: 'loyalty', label: 'Loyalty Members' },
  { key: 'referral', label: 'Referral Champions' },
];

const TIER_COLORS: Record<string, string> = {
  BRONZE: '#8B3030',
  SILVER: '#718096',
  GOLD: '#C47C0A',
  PLATINUM: '#4A5568',
};

// ── Main Content Component ────────────────────────────────────
function CrmContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState(searchParams.get('tab') ?? 'overview');
  const [period, setPeriod] = useState(searchParams.get('period') ?? 'last30');
  const [compare, setCompare] = useState(searchParams.get('compare') ?? 'prevPeriod');
  const [groupBy, setGroupBy] = useState(searchParams.get('groupBy') ?? 'day');
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') ?? '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') ?? '');

  // Overview state
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  // Customers table state
  const [custData, setCustData] = useState<CustomersResponse | null>(null);
  const [custLoading, setCustLoading] = useState(false);
  const [custError, setCustError] = useState<string | null>(null);
  const [custPage, setCustPage] = useState(1);
  const [custSearch, setCustSearch] = useState('');
  const [custSegment, setCustSegment] = useState(searchParams.get('segment') ?? 'all');
  const [custStatus, setCustStatus] = useState('all');
  const [custSortBy, setCustSortBy] = useState('createdAt');
  const [custSortOrder, setCustSortOrder] = useState<'asc' | 'desc'>('desc');

  // Customer 360 Drawer state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Customer360Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileTab, setProfileTab] = useState<'orders' | 'loyalty' | 'referrals' | 'reviews' | 'activity'>('orders');

  // Status modification state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [actionPending, setActionPending] = useState(false);

  // ── Sync URL parameters ───────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams();
    if (tab !== 'overview') params.set('tab', tab);
    if (period !== 'last30') params.set('period', period);
    if (compare !== 'prevPeriod') params.set('compare', compare);
    if (groupBy !== 'day') params.set('groupBy', groupBy);
    if (custSegment !== 'all') params.set('segment', custSegment);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [tab, period, compare, groupBy, custSegment, dateFrom, dateTo, pathname, router]);

  // ── Fetch Overview ────────────────────────────────────────
  const fetchOverview = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const params = new URLSearchParams({ period, compare, groupBy });
      if (period === 'custom' && dateFrom && dateTo) {
        params.set('dateFrom', dateFrom);
        params.set('dateTo', dateTo);
      }
      const res = await fetch(`/api/admin/crm/overview?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Unknown error');
      setOverview(json.data);
    } catch (e) {
      setOverviewError((e as Error).message);
      adminToast.error('Failed to load CRM overview');
    } finally {
      setOverviewLoading(false);
    }
  }, [period, compare, groupBy, dateFrom, dateTo]);

  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  // ── Fetch Customers List ──────────────────────────────────
  const fetchCustomers = useCallback(async () => {
    setCustLoading(true);
    setCustError(null);
    try {
      const params = new URLSearchParams({
        page: String(custPage),
        limit: '25',
        sortBy: custSortBy,
        order: custSortOrder,
        segment: custSegment,
        status: custStatus,
      });
      if (custSearch) params.set('search', custSearch);
      const res = await fetch(`/api/admin/crm/customers?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Unknown error');
      setCustData(json.data);
    } catch (e) {
      setCustError((e as Error).message);
    } finally {
      setCustLoading(false);
    }
  }, [custPage, custSearch, custSegment, custStatus, custSortBy, custSortOrder]);

  useEffect(() => {
    if (tab === 'customers' || tab === 'analytics') fetchCustomers();
  }, [tab, fetchCustomers]);

  // ── Fetch Customer 360 Detail ─────────────────────────────
  const fetchCustomerProfile = useCallback(async (id: string) => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      const res = await fetch(`/api/admin/crm/customers/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Customer not found');
      setProfile(json.data.customer);
    } catch (e) {
      setProfileError((e as Error).message);
      adminToast.error('Failed to load customer profile');
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const openCustomerProfile = (id: string) => {
    setSelectedCustomerId(id);
    setProfileTab('orders');
    fetchCustomerProfile(id);
  };

  // ── Suspend / Reactivate Action ───────────────────────────
  const handleToggleCustomerStatus = async () => {
    if (!profile) return;
    setActionPending(true);
    try {
      const nextStatus = !profile.isActive;
      const res = await fetch(`/api/admin/crm/customers/${profile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? 'Status update failed');

      setProfile(prev => prev ? { ...prev, isActive: nextStatus } : null);
      setCustData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          customers: prev.customers.map(c => c.id === profile.id ? { ...c, isActive: nextStatus } : c),
        };
      });
      adminToast.success(`Customer ${nextStatus ? 'reactivated' : 'suspended'} successfully`);
      setConfirmModalOpen(false);
      fetchOverview();
    } catch (e) {
      adminToast.error('Failed to update status', (e as Error).message);
    } finally {
      setActionPending(false);
    }
  };

  // ── Export Handler ────────────────────────────────────────
  const handleExport = useCallback(async (format: 'csv' | 'excel' | 'pdf' | 'print') => {
    const section = tab === 'segments' ? 'segments' : 'customers';
    const params = new URLSearchParams({ format, section, segment: custSegment, status: custStatus });
    if (custSearch) params.set('search', custSearch);
    const res = await fetch(`/api/admin/crm/export?${params}`);
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
    a.download = `crm-${section}-${new Date().toISOString().slice(0, 10)}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [tab, custSegment, custStatus, custSearch]);

  const handleCustSort = (col: string) => {
    if (custSortBy === col) {
      setCustSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setCustSortBy(col);
      setCustSortOrder('desc');
    }
    setCustPage(1);
  };

  const clearCustFilters = () => {
    setCustSearch('');
    setCustSegment('all');
    setCustStatus('all');
    setCustPage(1);
  };

  const hasActiveCustFilters = !!(custSearch || custSegment !== 'all' || custStatus !== 'all');

  const k = overview?.kpis;
  const c = overview?.comparison;
  const ts = overview?.timeSeries ?? [];
  const segs = overview?.segments ?? [];
  const freq = overview?.frequencyDistribution ?? [];

  return (
    <div id="crm-dashboard">
      {/* ── Page Header ───────────────────────────────────── */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title" id="crm-title">Customer Relationship Management</h1>
          <p className="admin-page-subtitle">360° Customer Profiles, Lifecycle Segments &amp; Value Intelligence</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <ExportMenu onExport={handleExport} id="crm-export" />
          <button className="admin-btn admin-btn-ghost" onClick={() => { fetchOverview(); if (tab === 'customers') fetchCustomers(); }} title="Refresh" aria-label="Refresh data" id="crm-refresh">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* ── Filters Bar ───────────────────────────────────── */}
      <div className="admin-filters-bar" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Calendar size={14} style={{ color: 'var(--admin-text-tertiary)' }} />
          <select className="admin-select" value={period} onChange={e => { setPeriod(e.target.value); setCustPage(1); }} id="crm-period-select" aria-label="Date period">
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
        <select className="admin-select" value={compare} onChange={e => setCompare(e.target.value)} id="crm-compare-select" aria-label="Comparison period">
          {COMPARE_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
        <select className="admin-select" value={groupBy} onChange={e => setGroupBy(e.target.value)} id="crm-groupby-select" aria-label="Group by">
          {GROUP_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
      </div>

      {/* ── Tabs Navigation ───────────────────────────────── */}
      <div className="admin-tabs" role="tablist" aria-label="CRM sections" style={{ marginBottom: 24 }}>
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              className={`admin-tab ${tab === t.key ? 'active' : ''}`}
              onClick={() => setTab(t.key)}
              id={`crm-tab-${t.key}`}
            >
              <Icon size={14} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Error State ───────────────────────────────────── */}
      {overviewError && (
        <div className="admin-alert admin-alert-error" role="alert" id="crm-error">
          <span>Failed to load CRM data: {overviewError}</span>
          <button className="admin-btn admin-btn-ghost" onClick={fetchOverview} style={{ marginLeft: 8 }}>Retry</button>
        </div>
      )}

      {/* ── TAB 1: OVERVIEW ───────────────────────────────── */}
      {tab === 'overview' && (
        <div id="crm-overview-tab">
          {/* KPI Grid */}
          <div className="admin-stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
            <StatCard label="Total Customers" value={overviewLoading ? '—' : k!.totalCustomers.toLocaleString()} icon={<Users size={18} />} iconVariant="gold" trend={c?.customersChange ?? undefined} trendLabel="vs prev" loading={overviewLoading} id="kpi-total-customers" />
            <StatCard label="New Customers" value={overviewLoading ? '—' : k!.newCustomers.toLocaleString()} icon={<UserPlus size={18} />} iconVariant="info" trend={c?.newCustomersChange ?? undefined} trendLabel="vs prev" loading={overviewLoading} id="kpi-new-customers" />
            <StatCard label="Active Customers" value={overviewLoading ? '—' : k!.activeCustomers.toLocaleString()} icon={<UserCheck size={18} />} iconVariant="success" trend={c?.activeCustomersChange ?? undefined} trendLabel="vs prev" loading={overviewLoading} id="kpi-active-customers" />
            <StatCard label="Inactive / At Risk" value={overviewLoading ? '—' : k!.inactiveCustomers.toLocaleString()} icon={<UserX size={18} />} iconVariant="warning" loading={overviewLoading} id="kpi-inactive-customers" />
            <StatCard label="Repeat Customers" value={overviewLoading ? '—' : k!.repeatCustomers.toLocaleString()} icon={<RefreshCw size={18} />} iconVariant="accent" loading={overviewLoading} id="kpi-repeat-customers" />
            <StatCard label="Repeat Purchase Rate" value={overviewLoading ? '—' : fmtPct(k!.repeatPurchaseRate)} icon={<Percent size={18} />} iconVariant="gold" loading={overviewLoading} id="kpi-repeat-rate" />
            <StatCard label="Customer Retention Rate" value={overviewLoading ? '—' : fmtPct(k!.retentionRate)} icon={<Percent size={18} />} iconVariant="success" loading={overviewLoading} id="kpi-retention-rate" />
            <StatCard label="Avg Customer Lifetime Value" value={overviewLoading ? '—' : fmtCurrency(k!.clv)} icon={<DollarSign size={18} />} iconVariant="gold" trend={c?.clvChange ?? undefined} trendLabel="vs prev" loading={overviewLoading} id="kpi-clv" />
            <StatCard label="Average Order Value" value={overviewLoading ? '—' : fmtCurrency(k!.aov)} icon={<ShoppingBag size={18} />} iconVariant="accent" trend={c?.aovChange ?? undefined} trendLabel="vs prev" loading={overviewLoading} id="kpi-aov" />
            <StatCard label="Total Customer Revenue" value={overviewLoading ? '—' : fmtCurrency(k!.totalCustomerRevenue)} icon={<DollarSign size={18} />} iconVariant="success" trend={c?.revenueChange ?? undefined} trendLabel="vs prev" loading={overviewLoading} id="kpi-revenue" />
            <StatCard label="Orders / Active Customer" value={overviewLoading ? '—' : k!.ordersPerCustomer.toFixed(1)} icon={<ShoppingBag size={18} />} iconVariant="info" loading={overviewLoading} id="kpi-orders-per-customer" />
            <StatCard label="Returning Customers" value={overviewLoading ? '—' : k!.returningCustomers.toLocaleString()} icon={<UserCheck size={18} />} iconVariant="accent" loading={overviewLoading} id="kpi-returning-customers" />
          </div>

          {/* Charts Grid */}
          {overviewLoading ? (
            <SkeletonTable rows={4} cols={2} />
          ) : ts.length === 0 ? (
            <EmptyState title="No customer metrics" description="No customer registrations or orders recorded in this period." icon={<Users size={40} />} />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))', gap: 20 }}>
              <div className="admin-card" style={{ padding: 20 }}>
                <LineChart data={ts.map(p => ({ label: p.date, value: p.newCustomers }))} label="Customer Registrations Over Time" color="#581312" id="chart-growth" />
              </div>
              <div className="admin-card" style={{ padding: 20 }}>
                <LineChart data={ts.map(p => ({ label: p.date, value: p.revenue }))} label="Customer Revenue Over Time (₹)" color="#2D7A4F" id="chart-revenue" />
              </div>
              <div className="admin-card" style={{ padding: 20 }}>
                <BarChart data={freq} label="Customer Order Frequency" color="#C47C0A" id="chart-freq" />
              </div>
              <div className="admin-card" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: 12 }}>Customer Segments Breakdown</h3>
                <DonutChart data={segs.map(s => ({ label: s.label, value: s.count, color: s.color }))} label="Customers" id="donut-segments" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: CUSTOMERS LIST ─────────────────────────── */}
      {tab === 'customers' && (
        <div id="crm-customers-tab">
          {/* Filter Toolbar */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 340 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-tertiary)' }} />
              <input
                className="admin-input"
                placeholder="Search name, email, phone, ID..."
                value={custSearch}
                onChange={e => { setCustSearch(e.target.value); setCustPage(1); }}
                style={{ paddingLeft: 32, width: '100%' }}
                aria-label="Search customers"
                id="cust-search-input"
              />
            </div>
            <select className="admin-select" value={custSegment} onChange={e => { setCustSegment(e.target.value); setCustPage(1); }} aria-label="Filter segment" id="cust-segment-filter">
              {SEGMENT_OPTIONS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <select className="admin-select" value={custStatus} onChange={e => { setCustStatus(e.target.value); setCustPage(1); }} aria-label="Filter account status" id="cust-status-filter">
              <option value="all">All Statuses</option>
              <option value="active">Active Accounts</option>
              <option value="suspended">Suspended Accounts</option>
            </select>
            {hasActiveCustFilters && (
              <button className="admin-btn admin-btn-ghost" onClick={clearCustFilters} id="cust-clear-filters" aria-label="Clear customer filters">
                <X size={14} /> Clear
              </button>
            )}
          </div>

          {/* Customers Table */}
          {custLoading ? (
            <SkeletonTable rows={8} cols={7} />
          ) : custError ? (
            <div className="admin-alert admin-alert-error" role="alert">
              <span>Failed to load customers: {custError}</span>
              <button className="admin-btn admin-btn-ghost" onClick={fetchCustomers} style={{ marginLeft: 8 }}>Retry</button>
            </div>
          ) : !custData || custData.customers.length === 0 ? (
            <EmptyState
              title={hasActiveCustFilters ? 'No matching customers' : 'No customers found'}
              description={hasActiveCustFilters ? 'Try adjusting your search terms or segment filters.' : 'No registered customers found in the database.'}
              icon={<Users size={40} />}
              action={hasActiveCustFilters ? <button className="admin-btn admin-btn-secondary" onClick={clearCustFilters}>Clear Filters</button> : undefined}
            />
          ) : (
            <>
              <div className="admin-card" style={{ overflow: 'auto' }}>
                <table className="admin-table" id="crm-customers-table">
                  <thead>
                    <tr>
                      <SortTh col="name" label="Customer" sortBy={custSortBy} sortOrder={custSortOrder} onSort={handleCustSort} />
                      <th>Contact</th>
                      <SortTh col="orderCount" label="Orders" sortBy={custSortBy} sortOrder={custSortOrder} onSort={handleCustSort} />
                      <SortTh col="totalSpent" label="Total Spent" sortBy={custSortBy} sortOrder={custSortOrder} onSort={handleCustSort} />
                      <th>AOV</th>
                      <th>Loyalty</th>
                      <th>Lifecycle</th>
                      <th>Status</th>
                      <SortTh col="createdAt" label="Joined" sortBy={custSortBy} sortOrder={custSortOrder} onSort={handleCustSort} />
                      <th style={{ width: 50 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {custData.customers.map(c => (
                      <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => openCustomerProfile(c.id)}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%', background: 'var(--admin-surface-muted)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12,
                              color: 'var(--admin-text-primary)', flexShrink: 0,
                            }}>
                              {c.firstName.charAt(0)}{c.lastName.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--admin-text-tertiary)' }}>ID: {c.id.slice(0, 8)}…</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: 12 }}>{c.email}</div>
                          <div style={{ fontSize: 11, color: 'var(--admin-text-tertiary)' }}>{c.phone ?? '—'}</div>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 600, fontSize: 12 }}>{c.orderCount}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, fontSize: 12, fontFamily: 'monospace', color: c.totalSpent > 0 ? 'var(--admin-text-primary)' : 'var(--admin-text-tertiary)' }}>
                          {fmtCurrency(c.totalSpent)}
                        </td>
                        <td style={{ textAlign: 'right', fontSize: 12, color: 'var(--admin-text-secondary)' }}>
                          {c.aov > 0 ? fmtCurrency(c.aov) : '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                              background: `${TIER_COLORS[c.loyaltyTier] ?? '#8B3030'}20`,
                              color: TIER_COLORS[c.loyaltyTier] ?? '#8B3030',
                            }}>
                              {c.loyaltyTier}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--admin-text-secondary)' }}>{c.loyaltyPoints} pts</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: 'var(--admin-surface-muted)', color: 'var(--admin-text-secondary)', fontWeight: 500 }}>
                            {c.lifecycle}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600,
                            color: c.isActive ? 'var(--admin-success)' : 'var(--admin-error)',
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                            {c.isActive ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap', fontSize: 11, color: 'var(--admin-text-tertiary)' }}>
                          {fmtDate(c.createdAt)}
                        </td>
                        <td>
                          <button className="admin-icon-btn" onClick={e => { e.stopPropagation(); openCustomerProfile(c.id); }} aria-label="View 360 profile" title="View 360 profile">
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {custData.pagination.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '0 4px' }}>
                  <span style={{ fontSize: 12, color: 'var(--admin-text-tertiary)' }}>
                    Showing {((custData.pagination.page - 1) * custData.pagination.limit) + 1}–{Math.min(custData.pagination.page * custData.pagination.limit, custData.pagination.total)} of {custData.pagination.total}
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="admin-btn admin-btn-ghost" disabled={!custData.pagination.hasPrevPage} onClick={() => setCustPage(p => p - 1)} id="cust-prev-page">&larr; Prev</button>
                    <button className="admin-btn admin-btn-ghost" disabled={!custData.pagination.hasNextPage} onClick={() => setCustPage(p => p + 1)} id="cust-next-page">Next &rarr;</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── TAB 3: SEGMENTS ───────────────────────────────── */}
      {tab === 'segments' && (
        <div id="crm-segments-tab">
          <p style={{ fontSize: 13, color: 'var(--admin-text-secondary)', marginBottom: 20 }}>
            Dynamically computed customer segments based on historical purchases, engagement, loyalty tiers, and account activity.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {segs.map(s => (
              <div key={s.key} className="admin-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: `4px solid ${s.color}` }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--admin-text-primary)' }}>{s.label}</h3>
                    <span style={{
                      fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                      background: `${s.color}15`, color: s.color,
                    }}>
                      {s.count.toLocaleString()}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--admin-text-tertiary)', marginBottom: 16 }}>
                    {getSegmentDescription(s.key)}
                  </p>
                </div>
                <button
                  className="admin-btn admin-btn-secondary"
                  style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}
                  onClick={() => {
                    setCustSegment(s.key);
                    setTab('customers');
                    setCustPage(1);
                  }}
                  id={`view-segment-${s.key}`}
                >
                  View Customers <ArrowRight size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: VALUE ANALYTICS ────────────────────────── */}
      {tab === 'analytics' && (
        <div id="crm-analytics-tab">
          {overviewLoading ? (
            <SkeletonTable rows={4} cols={3} />
          ) : !k ? (
            <EmptyState title="No customer value data" description="No customer revenue recorded for this period." icon={<TrendingUp size={40} />} />
          ) : (
            <>
              {/* Value KPIs */}
              <div className="admin-stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
                <StatCard label="Avg Customer Lifetime Value" value={fmtCurrency(k.clv)} icon={<DollarSign size={18} />} iconVariant="gold" trend={c?.clvChange ?? undefined} id="val-clv" />
                <StatCard label="Average Order Value" value={fmtCurrency(k.aov)} icon={<ShoppingBag size={18} />} iconVariant="accent" trend={c?.aovChange ?? undefined} id="val-aov" />
                <StatCard label="Total Customer Revenue" value={fmtCurrency(k.totalCustomerRevenue)} icon={<DollarSign size={18} />} iconVariant="success" trend={c?.revenueChange ?? undefined} id="val-revenue" />
                <StatCard label="Repeat Purchase Rate" value={fmtPct(k.repeatPurchaseRate)} icon={<Percent size={18} />} iconVariant="gold" id="val-repeat-rate" />
                <StatCard label="Customer Retention Rate" value={fmtPct(k.retentionRate)} icon={<Percent size={18} />} iconVariant="success" id="val-retention" />
                <StatCard label="Orders / Active Customer" value={k.ordersPerCustomer.toFixed(1)} icon={<ShoppingBag size={18} />} iconVariant="info" id="val-orders-per-cust" />
              </div>

              {/* Value Charts */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))', gap: 20, marginBottom: 28 }}>
                <div className="admin-card" style={{ padding: 20 }}>
                  <LineChart data={ts.map(p => ({ label: p.date, value: p.revenue }))} label="Customer Revenue Over Time (₹)" color="#2D7A4F" id="val-chart-rev" />
                </div>
                <div className="admin-card" style={{ padding: 20 }}>
                  <BarChart data={freq} label="Order Frequency Distribution" color="#581312" id="val-chart-freq" />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── CUSTOMER 360° PROFILE DRAWER ──────────────────── */}
      <Drawer
        open={!!selectedCustomerId}
        title={profile?.name ?? 'Customer 360° View'}
        subtitle={profile ? `${profile.email} · Registered ${fmtDate(profile.createdAt)}` : ''}
        width={680}
        onClose={() => { setSelectedCustomerId(null); setProfile(null); }}
      >
        {profileLoading ? (
          <SkeletonTable rows={8} cols={3} />
        ) : profileError ? (
          <div className="admin-alert admin-alert-error" role="alert">
            <span>{profileError}</span>
          </div>
        ) : !profile ? null : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header / Financial Snapshot */}
            <div className="admin-stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
              <div className="admin-card" style={{ padding: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--admin-text-tertiary)' }}>Total Spent</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--admin-text-primary)', fontFamily: 'monospace' }}>{fmtCurrency(profile.financials.totalSpent)}</div>
              </div>
              <div className="admin-card" style={{ padding: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--admin-text-tertiary)' }}>Orders</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--admin-text-primary)' }}>{profile.financials.totalOrders}</div>
              </div>
              <div className="admin-card" style={{ padding: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--admin-text-tertiary)' }}>AOV</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--admin-text-primary)' }}>{fmtCurrency(profile.financials.aov)}</div>
              </div>
              <div className="admin-card" style={{ padding: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--admin-text-tertiary)' }}>Loyalty Tier</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: TIER_COLORS[profile.loyaltyTier] ?? '#8B3030' }}>{profile.loyaltyTier} ({profile.loyaltyPoints} pts)</div>
              </div>
            </div>

            {/* Profile Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--admin-surface-muted)', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 12,
                  background: profile.isActive ? 'rgba(45, 122, 79, 0.15)' : 'rgba(185, 28, 28, 0.15)',
                  color: profile.isActive ? 'var(--admin-success)' : 'var(--admin-error)',
                }}>
                  Account {profile.isActive ? 'Active' : 'Suspended'}
                </span>
                {profile.phone && <span style={{ fontSize: 12, color: 'var(--admin-text-secondary)' }}>📞 {profile.phone}</span>}
              </div>
              <button
                className={`admin-btn ${profile.isActive ? 'admin-btn-danger' : 'admin-btn-secondary'}`}
                style={{ fontSize: 12, padding: '4px 10px' }}
                onClick={() => setConfirmModalOpen(true)}
                id="toggle-cust-status-btn"
              >
                {profile.isActive ? <UserX size={13} /> : <CheckCircle2 size={13} />}
                {profile.isActive ? 'Suspend Customer' : 'Reactivate Customer'}
              </button>
            </div>

            {/* Drawer Sub-tabs */}
            <div className="admin-tabs" style={{ fontSize: 12, borderBottom: '1px solid var(--admin-border)' }}>
              {[
                { key: 'orders', label: `Orders (${profile.orders.length})` },
                { key: 'loyalty', label: `Loyalty & Referrals` },
                { key: 'reviews', label: `Reviews (${profile.reviews.length})` },
                { key: 'activity', label: 'Timeline & Activity' },
              ].map(t => (
                <button
                  key={t.key}
                  className={`admin-tab ${profileTab === t.key ? 'active' : ''}`}
                  onClick={() => setProfileTab(t.key as typeof profileTab)}
                  style={{ padding: '6px 12px', fontSize: 12 }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── Sub-tab: Orders ── */}
            {profileTab === 'orders' && (
              <div>
                {profile.orders.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--admin-text-tertiary)', textAlign: 'center', padding: 24 }}>No orders placed by this customer.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {profile.orders.map(o => (
                      <div key={o.id} className="admin-card" style={{ padding: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 13 }}>Order #{o.orderNumber}</span>
                          <span style={{ fontSize: 11, color: 'var(--admin-text-tertiary)' }}>{fmtDateTime(o.createdAt)}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                          <StatusBadge status={o.status} />
                          <StatusBadge status={o.paymentStatus} />
                          <span style={{ marginLeft: 'auto', fontWeight: 700, fontSize: 13, fontFamily: 'monospace' }}>{fmtCurrency(o.total)}</span>
                        </div>
                        <div style={{ borderTop: '1px dashed var(--admin-border)', paddingTop: 8, marginTop: 4 }}>
                          {o.items.map(item => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--admin-text-secondary)', marginBottom: 2 }}>
                              <span>{item.quantity}x {item.productName} {item.variantName ? `(${item.variantName})` : ''}</span>
                              <span style={{ fontFamily: 'monospace' }}>{fmtCurrency(item.totalPrice)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Sub-tab: Loyalty & Referrals ── */}
            {profileTab === 'loyalty' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="admin-card" style={{ padding: 16 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--admin-text-primary)' }}>Referral Program</h4>
                  <p style={{ fontSize: 12, color: 'var(--admin-text-secondary)', marginBottom: 6 }}>
                    Referral Code: <strong style={{ fontFamily: 'monospace', color: 'var(--admin-text-primary)' }}>{profile.referralCode}</strong>
                  </p>
                  {profile.referredBy && (
                    <p style={{ fontSize: 12, color: 'var(--admin-text-tertiary)', marginBottom: 6 }}>
                      Referred by: {profile.referredBy.firstName} {profile.referredBy.lastName} ({profile.referredBy.email})
                    </p>
                  )}
                  <p style={{ fontSize: 12, color: 'var(--admin-text-secondary)' }}>
                    Total Successful Referrals: <strong>{profile.referrals.length}</strong>
                  </p>
                  {profile.referrals.length > 0 && (
                    <div style={{ marginTop: 10, borderTop: '1px solid var(--admin-border)', paddingTop: 8 }}>
                      {profile.referrals.map(r => (
                        <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0' }}>
                          <span>{r.name} ({r.email})</span>
                          <span style={{ color: 'var(--admin-text-tertiary)' }}>{fmtDate(r.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="admin-card" style={{ padding: 16 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--admin-text-primary)' }}>Loyalty Points Ledger</h4>
                  {profile.loyaltyTransactions.length === 0 ? (
                    <p style={{ fontSize: 12, color: 'var(--admin-text-tertiary)' }}>No loyalty points transactions recorded.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {profile.loyaltyTransactions.map(lt => (
                        <div key={lt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, padding: '4px 0', borderBottom: '1px solid var(--admin-surface-muted)' }}>
                          <div>
                            <div style={{ fontWeight: 600 }}>{lt.description}</div>
                            <div style={{ fontSize: 10, color: 'var(--admin-text-tertiary)' }}>{fmtDateTime(lt.createdAt)}</div>
                          </div>
                          <span style={{
                            fontWeight: 700, fontFamily: 'monospace',
                            color: lt.points >= 0 ? 'var(--admin-success)' : 'var(--admin-error)',
                          }}>
                            {lt.points >= 0 ? `+${lt.points}` : lt.points} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Sub-tab: Reviews ── */}
            {profileTab === 'reviews' && (
              <div>
                {profile.reviews.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--admin-text-tertiary)', textAlign: 'center', padding: 24 }}>No reviews submitted by this customer.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {profile.reviews.map(rev => (
                      <div key={rev.id} className="admin-card" style={{ padding: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 13 }}>{rev.product.name}</span>
                          <span style={{ fontSize: 11, color: 'var(--admin-text-tertiary)' }}>{fmtDate(rev.createdAt)}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 2, color: '#C47C0A', marginBottom: 6 }}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={12} fill={i < rev.rating ? '#C47C0A' : 'none'} />
                          ))}
                        </div>
                        {rev.title && <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 2 }}>{rev.title}</div>}
                        <p style={{ fontSize: 12, color: 'var(--admin-text-secondary)', lineHeight: 1.4 }}>{rev.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Sub-tab: Activity ── */}
            {profileTab === 'activity' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 12 }}>
                  <Clock size={16} style={{ color: 'var(--admin-text-tertiary)', marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>Account Registered</div>
                    <div style={{ color: 'var(--admin-text-tertiary)' }}>{fmtDateTime(profile.createdAt)}</div>
                  </div>
                </div>
                {profile.lastLoginAt && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 12 }}>
                    <Clock size={16} style={{ color: 'var(--admin-text-tertiary)', marginTop: 2 }} />
                    <div>
                      <div style={{ fontWeight: 600 }}>Last Login</div>
                      <div style={{ color: 'var(--admin-text-tertiary)' }}>{fmtDateTime(profile.lastLoginAt)}</div>
                    </div>
                  </div>
                )}
                {profile.couponUsages.map(cu => (
                  <div key={cu.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 12 }}>
                    <Gift size={16} style={{ color: 'var(--admin-accent)', marginTop: 2 }} />
                    <div>
                      <div style={{ fontWeight: 600 }}>Used Coupon {cu.coupon.code}</div>
                      <div style={{ color: 'var(--admin-text-tertiary)' }}>{fmtDateTime(cu.usedAt)}</div>
                    </div>
                  </div>
                ))}
                {profile.returnRequests.map(rr => (
                  <div key={rr.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 12 }}>
                    <AlertTriangle size={16} style={{ color: 'var(--admin-warning)', marginTop: 2 }} />
                    <div>
                      <div style={{ fontWeight: 600 }}>Return Request: {rr.reason} ({rr.status})</div>
                      <div style={{ color: 'var(--admin-text-tertiary)' }}>{fmtDateTime(rr.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* ── STATUS CHANGE CONFIRMATION MODAL ──────────────── */}
      {confirmModalOpen && profile && (
        <div className="admin-modal-overlay" style={{ zIndex: 90 }} role="dialog" aria-modal="true">
          <div className="admin-modal" style={{ maxWidth: 420 }}>
            <div className="admin-modal-header">
              <div className={`admin-modal-icon ${profile.isActive ? 'warning' : 'success'}`}>
                {profile.isActive ? <ShieldAlert size={22} /> : <CheckCircle2 size={22} />}
              </div>
              <h3 className="admin-modal-title">
                {profile.isActive ? 'Suspend Customer Account?' : 'Reactivate Customer Account?'}
              </h3>
              <p className="admin-modal-desc">
                {profile.isActive
                  ? `Are you sure you want to suspend ${profile.name}? They will be unable to sign in or place orders until reactivated. This action will be logged.`
                  : `Are you sure you want to reactivate ${profile.name}? Their login and ordering access will be restored. This action will be logged.`}
              </p>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-ghost" onClick={() => setConfirmModalOpen(false)} disabled={actionPending}>
                Cancel
              </button>
              <button
                className={`admin-btn ${profile.isActive ? 'admin-btn-danger' : 'admin-btn-secondary'}`}
                onClick={handleToggleCustomerStatus}
                disabled={actionPending}
                id="confirm-toggle-status-btn"
              >
                {actionPending ? 'Processing...' : profile.isActive ? 'Suspend Customer' : 'Reactivate Customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helper Subcomponents ──────────────────────────────────────

function SortTh({ col, label, sortBy, sortOrder, onSort }: {
  col: string; label: string; sortBy: string; sortOrder: string;
  onSort: (col: string) => void;
}) {
  const active = sortBy === col;
  return (
    <th
      onClick={() => onSort(col)}
      style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', textAlign: col === 'totalSpent' ? 'right' : col === 'orderCount' ? 'center' : undefined }}
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

function getSegmentDescription(key: string): string {
  switch (key) {
    case 'all': return 'Total customer base registered in the store.';
    case 'high_value': return 'Customers with lifetime order spend of ₹10,000 or greater.';
    case 'repeat': return 'Loyal customers who have completed 2 or more orders.';
    case 'new': return 'Customers who created their account within the last 30 days.';
    case 'active': return 'Engaged customers who placed an order within the last 60 days.';
    case 'one_time': return 'Customers who placed exactly one order.';
    case 'inactive': return 'Customers with no order activity in 90+ days.';
    case 'no_purchase': return 'Registered accounts that have never completed an order.';
    case 'loyalty': return 'Customers with accumulated reward points or tiered status.';
    case 'referral': return 'Brand advocates who have referred at least 1 customer.';
    default: return '';
  }
}

export function CrmClient() {
  return (
    <Suspense fallback={<SkeletonTable rows={8} cols={4} />}>
      <CrmContent />
    </Suspense>
  );
}
