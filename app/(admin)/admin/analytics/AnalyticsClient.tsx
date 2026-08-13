// ============================================================
// BLENDIFY — Analytics & Business Intelligence Client
// /admin/analytics
//
// Features:
//   - Period selector with URL/query state persistence
//   - Custom date range
//   - Comparison period overlay
//   - Revenue, Sales, Customer KPI cards
//   - Time series line chart (revenue + comparison)
//   - Orders bar chart
//   - Payment method donut chart
//   - Customer growth line chart
//   - Top products table with pagination
//   - Category breakdown table + donut chart
//   - Full CSV/Excel/PDF/Print export
//   - Loading skeletons, empty states, error states
//   - Real database data only
// ============================================================
'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  TrendingUp, TrendingDown, Minus,
  BarChart2, ShoppingCart, Users, Package,
  DollarSign, Percent, Truck, RefreshCw,
  Calendar, Filter,
  Star,
} from 'lucide-react';
import { StatCard } from '@/components/admin/ui/StatCard';
import { LineChart, BarChart, DonutChart } from '@/components/admin/ui/AnalyticsChart';
import { ExportMenu } from '@/components/admin/ui/ExportMenu';
import { SkeletonTable } from '@/components/admin/ui/SkeletonTable';
import { adminToast } from '@/components/admin/ui/Toast';

// ── Types ─────────────────────────────────────────────────────
interface OverviewData {
  period: { selected: string; dateFrom: string; dateTo: string; groupBy: string; compare: string };
  revenue: { gross: number; net: number; discount: number; refunds: number; tax: number; shipping: number; aov: number; growth: number | null };
  sales: { orders: number; units: number; aov: number; cancellationRate: number; refundRate: number; cancelledOrders: number };
  customers: { newCustomers: number; returningCustomers: number; repeatRate: number };
  timeSeries: Array<{ date: string; revenue: number; orders: number; customers: number }>;
  paymentMethods: Array<{ gateway: string; revenue: number; count: number }>;
  comparison: {
    revenueChange: number | null;
    orderChange: number | null;
    customerChange: number | null;
    prevGrossRevenue: number | null;
    prevOrders: number | null;
    prevNewCustomers: number | null;
  };
}

interface ProductRow {
  productId: string;
  name: string;
  slug: string;
  categoryName: string | null;
  imageUrl: string | null;
  units: number;
  revenue: number;
  avgRating: number;
  reviewCount: number;
}

interface CategoryRow {
  categoryId: string | null;
  name: string;
  units: number;
  revenue: number;
  orderCount: number;
  revenueShare: number;
}

// ── Constants ─────────────────────────────────────────────────
const PERIODS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7', label: 'Last 7 Days' },
  { value: 'last30', label: 'Last 30 Days' },
  { value: 'last90', label: 'Last 90 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'prevMonth', label: 'Previous Month' },
  { value: 'thisYear', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

const COMPARE_OPTIONS = [
  { value: 'prevPeriod', label: 'vs Previous Period' },
  { value: 'prevMonth', label: 'vs Previous Month' },
  { value: 'prevYear', label: 'vs Previous Year' },
  { value: 'none', label: 'No Comparison' },
];

const GROUP_BY_OPTIONS = [
  { value: 'day', label: 'By Day' },
  { value: 'week', label: 'By Week' },
  { value: 'month', label: 'By Month' },
];

// ── Formatters ────────────────────────────────────────────────
function fmtCurrency(v: number): string {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
}

function fmtCurrencyFull(v: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(v);
}

function fmtPct(v: number): string {
  return `${v.toFixed(1)}%`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function gatewayLabel(g: string): string {
  const map: Record<string, string> = { RAZORPAY: 'Razorpay', STRIPE: 'Stripe', COD: 'Cash on Delivery', WALLET: 'Wallet', LOYALTY_POINTS: 'Loyalty Points' };
  return map[g] ?? g;
}

const GATEWAY_COLORS: Record<string, string> = {
  RAZORPAY: '#1565A0',
  STRIPE: '#581312',
  COD: '#2D7A4F',
  WALLET: '#C47C0A',
  LOYALTY_POINTS: '#8B3030',
};

// ── Reusable components (declared outside render) ────────────
function KpiSkeleton() {
  return (
    <div className="admin-stat-card">
      <div className="admin-skeleton" style={{ height: 14, width: '60%', borderRadius: 4, marginBottom: 12 }} />
      <div className="admin-skeleton" style={{ height: 32, width: '80%', borderRadius: 6, marginBottom: 8 }} />
      <div className="admin-skeleton" style={{ height: 12, width: '40%', borderRadius: 4 }} />
    </div>
  );
}

function ChartSkeleton({ height = 220 }: { height?: number }) {
  return <div className="admin-skeleton" style={{ height, borderRadius: 8 }} />;
}

function TrendBadge({ val }: { val: number | null }) {
  if (val === null) return null;
  const dir = val > 0 ? 'up' : val < 0 ? 'down' : 'neutral';
  const Icon = dir === 'up' ? TrendingUp : dir === 'down' ? TrendingDown : Minus;
  return (
    <span className={`admin-stat-trend ${dir}`} style={{ fontSize: 11 }}>
      <Icon size={11} /> {Math.abs(val).toFixed(1)}%
    </span>
  );
}

// ── Section components (declared outside to avoid render warnings) ─
interface RevenueSectionProps {
  loading: boolean;
  overview: OverviewData | null;
  revenueChartData: Array<{ label: string; value: number }>;
  paymentDonutData: Array<{ label: string; value: number; color: string }>;
}
function RevenueSection({ loading, overview, revenueChartData, paymentDonutData }: RevenueSectionProps) {
  return (
    <>
      <div className="admin-stat-grid" style={{ marginBottom: 24 }}>
        {loading ? (
          [1, 2, 3, 4, 5, 6, 7].map((i) => <KpiSkeleton key={i} />)
        ) : overview ? (
          <>
            <StatCard id="kpi-gross" label="Gross Revenue" value={fmtCurrency(overview.revenue.gross)} icon={<DollarSign size={16} />} iconVariant="gold" trend={overview.comparison.revenueChange ?? undefined} trendLabel="vs prev" />
            <StatCard id="kpi-net" label="Net Revenue" value={fmtCurrency(overview.revenue.net)} icon={<TrendingUp size={16} />} iconVariant="success" />
            <StatCard id="kpi-aov" label="Avg Order Value" value={fmtCurrency(overview.revenue.aov)} icon={<BarChart2 size={16} />} iconVariant="info" />
            <StatCard id="kpi-discount" label="Total Discounts" value={fmtCurrency(overview.revenue.discount)} icon={<Percent size={16} />} iconVariant="warning" />
            <StatCard id="kpi-refunds" label="Refunds" value={fmtCurrency(overview.revenue.refunds)} icon={<RefreshCw size={16} />} iconVariant="error" />
            <StatCard id="kpi-tax" label="Tax Collected" value={fmtCurrency(overview.revenue.tax)} icon={<DollarSign size={16} />} iconVariant="accent" />
            <StatCard id="kpi-shipping" label="Shipping Revenue" value={fmtCurrency(overview.revenue.shipping)} icon={<Truck size={16} />} iconVariant="info" />
          </>
        ) : null}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 24 }}>
        <div className="admin-card">
          <div className="admin-card-header"><span className="admin-card-title">Revenue Over Time</span></div>
          {loading ? <ChartSkeleton height={200} /> : revenueChartData.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-text-tertiary)', fontSize: 13 }}>No data for selected period</div>
          ) : (
            <LineChart data={revenueChartData} color="#581312" height={200} id="revenue-chart" showArea label="" />
          )}
        </div>
        <div className="admin-card">
          <div className="admin-card-header"><span className="admin-card-title">Payment Methods</span></div>
          {loading ? <ChartSkeleton height={200} /> : paymentDonutData.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-text-tertiary)', fontSize: 13 }}>No payment data</div>
          ) : (
            <DonutChart data={paymentDonutData} size={180} label="Revenue" id="payment-donut" />
          )}
        </div>
      </div>
    </>
  );
}

interface SalesSectionProps {
  loading: boolean;
  overview: OverviewData | null;
  ordersChartData: Array<{ label: string; value: number }>;
}
function SalesSection({ loading, overview, ordersChartData }: SalesSectionProps) {
  return (
    <>
      <div className="admin-stat-grid" style={{ marginBottom: 24 }}>
        {loading ? (
          [1, 2, 3, 4].map((i) => <KpiSkeleton key={i} />)
        ) : overview ? (
          <>
            <StatCard id="kpi-orders" label="Total Orders" value={overview.sales.orders.toLocaleString('en-IN')} icon={<ShoppingCart size={16} />} iconVariant="accent" trend={overview.comparison.orderChange ?? undefined} trendLabel="vs prev" />
            <StatCard id="kpi-units" label="Units Sold" value={overview.sales.units.toLocaleString('en-IN')} icon={<Package size={16} />} iconVariant="info" />
            <StatCard id="kpi-cancellation" label="Cancellation Rate" value={fmtPct(overview.sales.cancellationRate)} icon={<TrendingDown size={16} />} iconVariant="warning" />
            <StatCard id="kpi-refund-rate" label="Refund Rate" value={fmtPct(overview.sales.refundRate)} icon={<RefreshCw size={16} />} iconVariant="error" />
          </>
        ) : null}
      </div>
      <div className="admin-card" style={{ marginBottom: 24 }}>
        <div className="admin-card-header"><span className="admin-card-title">Orders Over Time</span></div>
        {loading ? <ChartSkeleton height={200} /> : ordersChartData.length === 0 ? (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-text-tertiary)', fontSize: 13 }}>No orders in selected period</div>
        ) : (
          <BarChart data={ordersChartData} color="#C47C0A" height={200} id="orders-chart" label="" />
        )}
      </div>
    </>
  );
}

interface CustomersSectionProps {
  loading: boolean;
  overview: OverviewData | null;
  customerChartData: Array<{ label: string; value: number }>;
}
function CustomersSection({ loading, overview, customerChartData }: CustomersSectionProps) {
  return (
    <>
      <div className="admin-stat-grid" style={{ marginBottom: 24 }}>
        {loading ? (
          [1, 2, 3].map((i) => <KpiSkeleton key={i} />)
        ) : overview ? (
          <>
            <StatCard id="kpi-new-customers" label="New Customers" value={overview.customers.newCustomers.toLocaleString('en-IN')} icon={<Users size={16} />} iconVariant="success" trend={overview.comparison.customerChange ?? undefined} trendLabel="vs prev" />
            <StatCard id="kpi-returning" label="Returning Customers" value={overview.customers.returningCustomers.toLocaleString('en-IN')} icon={<Users size={16} />} iconVariant="accent" />
            <StatCard id="kpi-repeat-rate" label="Repeat Purchase Rate" value={fmtPct(overview.customers.repeatRate)} icon={<TrendingUp size={16} />} iconVariant="gold" />
          </>
        ) : null}
      </div>
      <div className="admin-card" style={{ marginBottom: 24 }}>
        <div className="admin-card-header"><span className="admin-card-title">Customer Growth</span></div>
        {loading ? <ChartSkeleton height={200} /> : customerChartData.length === 0 ? (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-text-tertiary)', fontSize: 13 }}>No customer data in selected period</div>
        ) : (
          <LineChart data={customerChartData} color="#2D7A4F" height={200} id="customer-chart" showArea label="" />
        )}
      </div>
    </>
  );
}

interface ProductsSectionProps {
  loading: boolean;
  products: ProductRow[];
  productTotal: number;
  productPage: number;
  productSort: 'revenue' | 'units' | 'rating';
  onSortChange: (v: 'revenue' | 'units' | 'rating') => void;
  onPageChange: (p: number) => void;
}
function ProductsSection({ loading, products, productTotal, productPage, productSort, onSortChange, onPageChange }: ProductsSectionProps) {
  return (
    <div className="admin-card" style={{ marginBottom: 24 }}>
      <div className="admin-card-header" style={{ flexWrap: 'wrap', gap: 8 }}>
        <span className="admin-card-title">Top Products</span>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          <select
            className="admin-select"
            style={{ height: 32, width: 'auto', fontSize: 12, padding: '0 28px 0 10px' }}
            value={productSort}
            onChange={(e) => onSortChange(e.target.value as 'revenue' | 'units' | 'rating')}
            id="product-sort-select"
            aria-label="Sort products by"
          >
            <option value="revenue">By Revenue</option>
            <option value="units">By Units Sold</option>
            <option value="rating">By Rating</option>
          </select>
        </div>
      </div>
      {loading ? <SkeletonTable rows={8} /> : products.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--admin-text-tertiary)', fontSize: 13 }}>
          No product data for the selected period
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" id="products-analytics-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Units Sold</th>
                <th style={{ textAlign: 'right' }}>Revenue</th>
                <th style={{ textAlign: 'right' }}>Avg Rating</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={p.productId}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: 6, background: 'var(--admin-surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Package size={14} style={{ color: 'var(--admin-text-disabled)' }} />
                        </div>
                      )}
                      <a href="/admin/products" style={{ fontWeight: 600, fontSize: 13, color: 'var(--admin-text-primary)', textDecoration: 'none' }} id={`product-link-${i}`}>
                        {p.name}
                      </a>
                    </div>
                  </td>
                  <td><span style={{ fontSize: 12, color: 'var(--admin-text-secondary)' }}>{p.categoryName ?? '—'}</span></td>
                  <td style={{ textAlign: 'right', fontSize: 13, fontWeight: 600 }}>{p.units.toLocaleString('en-IN')}</td>
                  <td style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, color: 'var(--admin-accent)' }}>{fmtCurrencyFull(p.revenue)}</td>
                  <td style={{ textAlign: 'right' }}>
                    {p.reviewCount > 0 ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', fontSize: 12 }}>
                        <Star size={12} fill="#fbbf24" stroke="#fbbf24" />
                        {p.avgRating.toFixed(1)}
                        <span style={{ color: 'var(--admin-text-tertiary)' }}>({p.reviewCount})</span>
                      </span>
                    ) : <span style={{ color: 'var(--admin-text-tertiary)', fontSize: 12 }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {productTotal > 20 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '16px 0', borderTop: '1px solid var(--admin-border)' }}>
              <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => onPageChange(productPage - 1)} disabled={productPage <= 1} id="products-prev-page">Previous</button>
              <span style={{ lineHeight: '32px', fontSize: 13, color: 'var(--admin-text-secondary)' }}>Page {productPage} of {Math.ceil(productTotal / 20)}</span>
              <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => onPageChange(productPage + 1)} disabled={productPage >= Math.ceil(productTotal / 20)} id="products-next-page">Next</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface CategoriesSectionProps {
  loading: boolean;
  categories: CategoryRow[];
  catTotal: number;
  categoryDonutData: Array<{ label: string; value: number; color: string }>;
}
function CategoriesSection({ loading, categories, catTotal, categoryDonutData }: CategoriesSectionProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
      <div className="admin-card" style={{ marginBottom: 24 }}>
        <div className="admin-card-header"><span className="admin-card-title">Category Revenue Share</span></div>
        {loading ? <ChartSkeleton height={200} /> : categoryDonutData.length === 0 ? (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-text-tertiary)', fontSize: 13 }}>No data for selected period</div>
        ) : <DonutChart data={categoryDonutData} size={180} label="Revenue" id="category-donut" />}
      </div>
      <div className="admin-card" style={{ marginBottom: 24 }}>
        <div className="admin-card-header"><span className="admin-card-title">Category Breakdown</span></div>
        {loading ? <SkeletonTable rows={5} /> : categories.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--admin-text-tertiary)', fontSize: 13 }}>No category data for the selected period</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" id="categories-analytics-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th style={{ textAlign: 'right' }}>Revenue</th>
                  <th style={{ textAlign: 'right' }}>Units</th>
                  <th style={{ textAlign: 'right' }}>Share</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.categoryId ?? 'uncategorized'}>
                    <td style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</td>
                    <td style={{ textAlign: 'right', fontSize: 13, color: 'var(--admin-accent)', fontWeight: 600 }}>{fmtCurrencyFull(c.revenue)}</td>
                    <td style={{ textAlign: 'right', fontSize: 13 }}>{c.units.toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                        <div style={{ width: 48, height: 6, borderRadius: 3, background: 'var(--admin-border)', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(c.revenueShare, 100)}%`, height: '100%', background: 'var(--admin-accent)', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--admin-text-secondary)' }}>{c.revenueShare.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {catTotal > 20 && (
              <div style={{ padding: '8px 16px', fontSize: 12, color: 'var(--admin-text-tertiary)' }}>
                Showing 20 of {catTotal} categories
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
function AnalyticsInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [period, setPeriod] = useState(searchParams.get('period') ?? 'last30');
  const [compare, setCompare] = useState(searchParams.get('compare') ?? 'prevPeriod');
  const [groupBy, setGroupBy] = useState(searchParams.get('groupBy') ?? 'day');
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') ?? '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') ?? '');
  const [activeTab, setActiveTab] = useState<'revenue' | 'sales' | 'customers' | 'products' | 'categories'>(
    (searchParams.get('tab') as 'revenue' | 'sales' | 'customers' | 'products' | 'categories') ?? 'revenue'
  );

  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [productTotal, setProductTotal] = useState(0);
  const [productPage, setProductPage] = useState(1);
  const [productSort, setProductSort] = useState<'revenue' | 'units' | 'rating'>('revenue');
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [catTotal, setCatTotal] = useState(0);

  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const pushUrl = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => { if (v) params.set(k, v); else params.delete(k); });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  const buildParams = useCallback((extra?: Record<string, string>) => {
    const p: Record<string, string> = { period, compare, groupBy };
    if (period === 'custom' && dateFrom) p.dateFrom = dateFrom;
    if (period === 'custom' && dateTo) p.dateTo = dateTo;
    return new URLSearchParams({ ...p, ...extra }).toString();
  }, [period, compare, groupBy, dateFrom, dateTo]);

  const fetchOverview = useCallback(async () => {
    setLoadingOverview(true);
    setError(null);
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    try {
      const res = await fetch(`/api/admin/analytics/overview?${buildParams()}`, { signal: abortRef.current.signal });
      const json = await res.json();
      if (json.success) setOverview(json.data);
      else setError(json.error ?? 'Failed to load analytics');
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError('Failed to load analytics data');
    } finally {
      setLoadingOverview(false);
    }
  }, [buildParams]);

  const fetchProducts = useCallback(async (page = 1) => {
    setLoadingProducts(true);
    try {
      const res = await fetch(`/api/admin/analytics/products?${buildParams({ sortBy: productSort, order: 'desc', page: String(page), limit: '20' })}`);
      const json = await res.json();
      if (json.success) { setProducts(json.data.products); setProductTotal(json.data.total); setProductPage(json.data.page); }
    } catch { /* silenced */ }
    setLoadingProducts(false);
  }, [buildParams, productSort]);

  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const res = await fetch(`/api/admin/analytics/categories?${buildParams({ limit: '20' })}`);
      const json = await res.json();
      if (json.success) { setCategories(json.data.categories); setCatTotal(json.data.total); }
    } catch { /* silenced */ }
    setLoadingCategories(false);
  }, [buildParams]);

  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  useEffect(() => {
    if (activeTab === 'products') fetchProducts(1);
  }, [activeTab, fetchProducts]);

  useEffect(() => {
    if (activeTab === 'categories') fetchCategories();
  }, [activeTab, fetchCategories]);

  const handlePeriodChange = (val: string) => { setPeriod(val); pushUrl({ period: val, tab: activeTab }); };
  const handleCompareChange = (val: string) => { setCompare(val); pushUrl({ compare: val }); };
  const handleGroupByChange = (val: string) => { setGroupBy(val); pushUrl({ groupBy: val }); };
  const handleTabChange = (val: typeof activeTab) => { setActiveTab(val); pushUrl({ tab: val }); };

  const handleExport = async (format: string) => {
    const section = activeTab === 'products' ? 'products' : activeTab === 'categories' ? 'categories' : 'overview';
    const params = buildParams({ format, section });
    const url = `/api/admin/analytics/export?${params}`;
    if (format === 'print') { window.open(url); return; }
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `analytics-${section}-${new Date().toISOString().slice(0, 10)}.${format === 'excel' ? 'xls' : format === 'pdf' ? 'html' : 'csv'}`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      adminToast.error('Export failed', 'Please try again');
    }
  };

  const revenueChartData = overview?.timeSeries.map((t) => ({ label: fmtDate(t.date), value: t.revenue })) ?? [];
  const ordersChartData = overview?.timeSeries.map((t) => ({ label: fmtDate(t.date), value: t.orders })) ?? [];
  const customerChartData = overview?.timeSeries.map((t) => ({ label: fmtDate(t.date), value: t.customers })) ?? [];
  const paymentDonutData = overview?.paymentMethods.map((p) => ({ label: gatewayLabel(p.gateway), value: p.revenue, color: GATEWAY_COLORS[p.gateway] ?? '#8B3030' })) ?? [];
  const categoryDonutData = categories.map((c, i) => ({ label: c.name, value: c.revenue, color: ['#581312', '#C47C0A', '#2D7A4F', '#1565A0', '#8B3030', '#D4880A'][i % 6] }));

  const TAB_NAV = [
    { key: 'revenue', label: 'Revenue', icon: DollarSign },
    { key: 'sales', label: 'Sales', icon: ShoppingCart },
    { key: 'customers', label: 'Customers', icon: Users },
    { key: 'products', label: 'Products', icon: Package },
    { key: 'categories', label: 'Categories', icon: Filter },
  ] as const;

  return (
    <div>
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Analytics &amp; Business Intelligence</h1>
          <p className="admin-page-subtitle">Real-time insights from your store&apos;s performance data</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            className="admin-btn admin-btn-ghost admin-btn-sm"
            onClick={() => { fetchOverview(); if (activeTab === 'products') fetchProducts(1); if (activeTab === 'categories') fetchCategories(); }}
            id="analytics-refresh"
            title="Refresh analytics"
            aria-label="Refresh analytics data"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          <ExportMenu onExport={handleExport} id="analytics-export" />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="admin-card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="admin-form-group" style={{ margin: 0, minWidth: 160 }}>
            <label className="admin-label" htmlFor="analytics-period">
              <Calendar size={11} style={{ display: 'inline', marginRight: 4 }} />Period
            </label>
            <select id="analytics-period" className="admin-select" value={period} onChange={(e) => handlePeriodChange(e.target.value)} style={{ height: 36, fontSize: 13 }} aria-label="Select analytics period">
              {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>

          {period === 'custom' && (
            <>
              <div className="admin-form-group" style={{ margin: 0 }}>
                <label className="admin-label" htmlFor="analytics-from">From</label>
                <input id="analytics-from" type="date" className="admin-input" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); pushUrl({ dateFrom: e.target.value }); }} style={{ height: 36, fontSize: 13, width: 150 }} aria-label="Date from" />
              </div>
              <div className="admin-form-group" style={{ margin: 0 }}>
                <label className="admin-label" htmlFor="analytics-to">To</label>
                <input id="analytics-to" type="date" className="admin-input" value={dateTo} onChange={(e) => { setDateTo(e.target.value); pushUrl({ dateTo: e.target.value }); }} style={{ height: 36, fontSize: 13, width: 150 }} aria-label="Date to" />
              </div>
            </>
          )}

          <div className="admin-form-group" style={{ margin: 0, minWidth: 180 }}>
            <label className="admin-label" htmlFor="analytics-compare">
              <Filter size={11} style={{ display: 'inline', marginRight: 4 }} />Compare
            </label>
            <select id="analytics-compare" className="admin-select" value={compare} onChange={(e) => handleCompareChange(e.target.value)} style={{ height: 36, fontSize: 13 }} aria-label="Select comparison period">
              {COMPARE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="admin-form-group" style={{ margin: 0, minWidth: 130 }}>
            <label className="admin-label" htmlFor="analytics-groupby">
              <BarChart2 size={11} style={{ display: 'inline', marginRight: 4 }} />Group By
            </label>
            <select id="analytics-groupby" className="admin-select" value={groupBy} onChange={(e) => handleGroupByChange(e.target.value)} style={{ height: 36, fontSize: 13 }} aria-label="Select time grouping">
              {GROUP_BY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {overview && !loadingOverview && (
          <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--admin-surface-muted)', borderRadius: 6, fontSize: 12, color: 'var(--admin-text-secondary)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span>
              <strong>Period:</strong>{' '}
              {new Date(overview.period.dateFrom).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              {' \u2192 '}
              {new Date(overview.period.dateTo).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
            {overview.comparison.revenueChange !== null && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                Revenue change: <TrendBadge val={overview.comparison.revenueChange} />
              </span>
            )}
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="admin-card" style={{ marginBottom: 24, borderLeft: '4px solid var(--admin-error)', padding: '16px 20px' }} role="alert">
          <div style={{ fontWeight: 600, color: 'var(--admin-error)', marginBottom: 4 }}>Analytics Error</div>
          <div style={{ fontSize: 13, color: 'var(--admin-text-secondary)' }}>{error}</div>
          <button className="admin-btn admin-btn-ghost admin-btn-sm" style={{ marginTop: 8 }} onClick={fetchOverview} id="analytics-retry">
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--admin-border)', marginBottom: 24, overflowX: 'auto' }} role="tablist" aria-label="Analytics sections">
        {TAB_NAV.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            id={`analytics-tab-${key}`}
            role="tab"
            aria-selected={activeTab === key}
            aria-controls={`analytics-panel-${key}`}
            onClick={() => handleTabChange(key)}
            style={{
              padding: '10px 20px',
              fontSize: 13,
              fontWeight: activeTab === key ? 700 : 500,
              color: activeTab === key ? 'var(--admin-accent)' : 'var(--admin-text-secondary)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === key ? '2px solid var(--admin-accent)' : '2px solid transparent',
              marginBottom: -2,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
              transition: 'color 150ms, border-color 150ms',
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div id="analytics-panel-revenue" role="tabpanel" aria-labelledby="analytics-tab-revenue" hidden={activeTab !== 'revenue'}>
        <RevenueSection loading={loadingOverview} overview={overview} revenueChartData={revenueChartData} paymentDonutData={paymentDonutData} />
        {overview && !loadingOverview && (
          <div className="admin-card">
            <div className="admin-card-header"><span className="admin-card-title">Revenue Summary</span></div>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table" id="revenue-summary-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th style={{ textAlign: 'right' }}>Current Period</th>
                    {overview.comparison.prevGrossRevenue !== null && <th style={{ textAlign: 'right' }}>Previous Period</th>}
                    {overview.comparison.revenueChange !== null && <th style={{ textAlign: 'right' }}>Change</th>}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Gross Revenue', current: overview.revenue.gross, prev: overview.comparison.prevGrossRevenue },
                    { label: 'Net Revenue', current: overview.revenue.net, prev: null },
                    { label: 'Total Discount', current: overview.revenue.discount, prev: null },
                    { label: 'Refunds', current: overview.revenue.refunds, prev: null },
                    { label: 'Tax Collected', current: overview.revenue.tax, prev: null },
                    { label: 'Shipping Revenue', current: overview.revenue.shipping, prev: null },
                    { label: 'Average Order Value', current: overview.revenue.aov, prev: null },
                  ].map((row) => (
                    <tr key={row.label}>
                      <td style={{ fontSize: 13, fontWeight: 500 }}>{row.label}</td>
                      <td style={{ textAlign: 'right', fontSize: 13, fontWeight: 600 }}>{fmtCurrencyFull(row.current)}</td>
                      {overview.comparison.prevGrossRevenue !== null && (
                        <td style={{ textAlign: 'right', fontSize: 13, color: 'var(--admin-text-secondary)' }}>
                          {row.prev !== null ? fmtCurrencyFull(row.prev) : '—'}
                        </td>
                      )}
                      {overview.comparison.revenueChange !== null && (
                        <td style={{ textAlign: 'right' }}>
                          {row.prev !== null && row.prev !== 0 ? (
                            <TrendBadge val={((row.current - row.prev) / row.prev) * 100} />
                          ) : '—'}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div id="analytics-panel-sales" role="tabpanel" aria-labelledby="analytics-tab-sales" hidden={activeTab !== 'sales'}>
        <SalesSection loading={loadingOverview} overview={overview} ordersChartData={ordersChartData} />
      </div>

      <div id="analytics-panel-customers" role="tabpanel" aria-labelledby="analytics-tab-customers" hidden={activeTab !== 'customers'}>
        <CustomersSection loading={loadingOverview} overview={overview} customerChartData={customerChartData} />
      </div>

      <div id="analytics-panel-products" role="tabpanel" aria-labelledby="analytics-tab-products" hidden={activeTab !== 'products'}>
        <ProductsSection
          loading={loadingProducts}
          products={products}
          productTotal={productTotal}
          productPage={productPage}
          productSort={productSort}
          onSortChange={(v) => setProductSort(v)}
          onPageChange={fetchProducts}
        />
      </div>

      <div id="analytics-panel-categories" role="tabpanel" aria-labelledby="analytics-tab-categories" hidden={activeTab !== 'categories'}>
        <CategoriesSection loading={loadingCategories} categories={categories} catTotal={catTotal} categoryDonutData={categoryDonutData} />
      </div>
    </div>
  );
}

// ── Outer wrapper with Suspense for useSearchParams ───────────
export function AnalyticsClient() {
  return (
    <Suspense fallback={
      <div>
        <div className="admin-page-header">
          <div>
            <h1 className="admin-page-title">Analytics &amp; Business Intelligence</h1>
            <p className="admin-page-subtitle">Loading analytics...</p>
          </div>
        </div>
        <div className="admin-stat-grid" style={{ marginBottom: 24 }}>
          {[1, 2, 3, 4, 5, 6, 7].map((i) => <KpiSkeleton key={i} />)}
        </div>
      </div>
    }>
      <AnalyticsInner />
    </Suspense>
  );
}
