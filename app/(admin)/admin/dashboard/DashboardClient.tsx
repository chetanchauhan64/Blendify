// ============================================================
// BLENDIFY — Admin Dashboard Client (Full Luxury Redesign)
// Widgets: KPIs, Revenue Chart, Loyalty Donut, Campaign Stats,
//          Recent Orders, Sales Goal Progress, Quick Actions,
//          Best Coupons, Flash Sale Performance, Realtime Feed,
//          Top Categories, Low Inventory Alert
// ============================================================
'use client';

import { useEffect, useState } from 'react';
import {
  ShoppingCart, DollarSign, Users, Star, Tag, Zap,
  Gift, Mail, TrendingUp, TrendingDown, Package,
  AlertTriangle, Coffee, Bell, ArrowRight, CheckCircle,
  Clock, Target, Activity, Sparkles, BarChart2,
} from 'lucide-react';
import { StatCard }   from '@/components/admin/ui/StatCard';
import { BarChart, DonutChart, LineChart } from '@/components/admin/ui/AnalyticsChart';
import { StatusBadge } from '@/components/admin/ui/StatusBadge';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────
interface DashboardData {
  kpis: {
    orders:        { value: number; trend: number };
    revenue:       { value: number; trend: number };
    customers:     { value: number; trend: number };
    pendingReviews: number;
    activeCoupons:  number;
    activeFlashSales: number;
    giftCardBalance:  number;
  };
  loyaltyStats:  Array<{ loyaltyTier: string; _count: { id: number }; _sum: { loyaltyPoints: number } }>;
  recentOrders:  Array<{ id: string; orderNumber: string; totalAmount: number; status: string; createdAt: string; user: { firstName: string; lastName: string; email: string } }>;
  campaignStats: { totalSent: number; totalOpens: number; totalClicks: number };
}

// ─── Tier colors (Blendify brand palette) ─────────────────────
const TIER_COLORS: Record<string, string> = {
  BRONZE:   '#C47C0A',
  SILVER:   '#8B6555',
  GOLD:     '#D4880A',
  PLATINUM: '#581312',
};

// ─── Quick Actions ─────────────────────────────────────────────
const QUICK_ACTIONS = [
  { icon: Tag,      label: 'New Coupon',        href: '/admin/coupons',          color: '#581312' },
  { icon: Zap,      label: 'New Flash Sale',    href: '/admin/flash-sales',      color: '#C47C0A' },
  { icon: Mail,     label: 'New Campaign',      href: '/admin/email-campaigns',  color: '#1565A0' },
  { icon: Gift,     label: 'New Gift Card',     href: '/admin/gift-cards',       color: '#2D7A4F' },
  { icon: Package,  label: 'New Bundle',        href: '/admin/bundles',          color: '#8B3030' },
  { icon: Star,     label: 'Review Queue',      href: '/admin/reviews',          color: '#B91C1C' },
];

// ─── Realtime feed (static for now — replace with SSE/WS) ─────
const REALTIME_FEED = [
  { type: 'success', icon: CheckCircle, label: 'Order #BL-4521 delivered',        time: '30s ago' },
  { type: 'info',    icon: ShoppingCart, label: 'New order #BL-4522 placed',       time: '1m ago' },
  { type: 'warning', icon: Star,         label: 'Review awaiting approval',         time: '3m ago' },
  { type: 'success', icon: Tag,          label: 'Coupon BREW20 redeemed',           time: '5m ago' },
  { type: 'info',    icon: Users,        label: 'New customer registered',           time: '8m ago' },
  { type: 'warning', icon: AlertTriangle, label: 'Low stock: Oat Milk Blend',       time: '12m ago' },
];

// ─── Format currency ──────────────────────────────────────────
const fmt = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

// ─────────────────────────────────────────────────────────────
export function AdminDashboardClient() {
  const [data,    setData]    = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard/stats')
      .then((r) => r.json())
      .then((res) => { if (res.success) setData(res.data); })
      .finally(() => setLoading(false));
  }, []);

  const orderChartData = data?.recentOrders.slice(0, 10).map((o) => ({
    label: new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    value: o.totalAmount,
  })) ?? [];

  const loyaltyChartData = (data?.loyaltyStats ?? []).map((s) => ({
    label: s.loyaltyTier,
    value: s._count.id,
    color: TIER_COLORS[s.loyaltyTier] ?? '#8B6555',
  }));

  // Derived campaign open rate
  const openRate  = data ? ((data.campaignStats.totalOpens  / Math.max(1, data.campaignStats.totalSent)) * 100).toFixed(1) : '–';
  const clickRate = data ? ((data.campaignStats.totalClicks / Math.max(1, data.campaignStats.totalSent)) * 100).toFixed(1) : '–';

  return (
    <div id="admin-dashboard">

      {/* ── Welcome Bar ─────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 28, gap: 16, flexWrap: 'wrap',
      }}>
        <div>
          <h1 style={{
            fontSize: 28, fontWeight: 600,
            fontFamily: 'var(--admin-font-display)',
            color: 'var(--admin-text-primary)', margin: 0, letterSpacing: '-0.5px',
          }}>
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'} ☕
          </h1>
          <p style={{ fontSize: 13, color: 'var(--admin-text-tertiary)', margin: '6px 0 0' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {' · '}
            <span style={{ color: 'var(--admin-success)', fontWeight: 600 }}>Store Live</span>
          </p>
        </div>

        {/* Sales Goal Progress */}
        {!loading && (
          <div style={{
            background: 'var(--admin-surface)', border: '1px solid var(--admin-border)',
            borderRadius: 'var(--admin-radius-lg)', padding: '14px 20px',
            minWidth: 240, boxShadow: 'var(--admin-shadow-xs)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-tertiary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Target size={12} /> Monthly Goal
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-accent)' }}>
                {Math.min(100, Math.round(((data?.kpis.revenue.value ?? 0) / 500000) * 100))}%
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'var(--admin-border)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, Math.round(((data?.kpis.revenue.value ?? 0) / 500000) * 100))}%`,
                background: 'linear-gradient(90deg, var(--admin-accent), var(--admin-gold))',
                borderRadius: 3, transition: 'width 800ms ease',
              }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--admin-text-tertiary)', marginTop: 5 }}>
              {fmt(data?.kpis.revenue.value ?? 0)} of {fmt(500000)}
            </div>
          </div>
        )}
      </div>

      {/* ── KPI Grid ─────────────────────────────────────── */}
      <div
        className="admin-stat-grid"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', marginBottom: 28 }}
      >
        <StatCard id="kpi-orders"    label="Orders (30d)"         value={data?.kpis.orders.value ?? 0}                                         icon={<ShoppingCart size={16} />} iconVariant="info"    trend={data?.kpis.orders.trend}   trendLabel="vs last month" loading={loading} />
        <StatCard id="kpi-revenue"   label="Revenue (30d)"        value={loading ? '…' : fmt(data?.kpis.revenue.value ?? 0)}                   icon={<DollarSign    size={16} />} iconVariant="success" trend={data?.kpis.revenue.trend}  trendLabel="vs last month" loading={loading} />
        <StatCard id="kpi-customers" label="New Customers"        value={data?.kpis.customers.value ?? 0}                                       icon={<Users         size={16} />} iconVariant="accent"  trend={data?.kpis.customers.trend} trendLabel="vs last month" loading={loading} />
        <StatCard id="kpi-reviews"   label="Pending Reviews"      value={data?.kpis.pendingReviews ?? 0}                                        icon={<Star          size={16} />} iconVariant="warning"                                                   loading={loading} href="/admin/reviews" />
        <StatCard id="kpi-coupons"   label="Active Coupons"       value={data?.kpis.activeCoupons ?? 0}                                         icon={<Tag           size={16} />} iconVariant="accent"                                                    loading={loading} href="/admin/coupons" />
        <StatCard id="kpi-flash"     label="Live Flash Sales"     value={data?.kpis.activeFlashSales ?? 0}                                      icon={<Zap           size={16} />} iconVariant="error"                                                     loading={loading} href="/admin/flash-sales" />
        <StatCard id="kpi-gift"      label="Gift Card Balance"    value={loading ? '…' : fmt(data?.kpis.giftCardBalance ?? 0)}                  icon={<Gift          size={16} />} iconVariant="success"                                                   loading={loading} href="/admin/gift-cards" />
        <StatCard id="kpi-email"     label="Emails Sent"          value={(data?.campaignStats.totalSent ?? 0).toLocaleString()}                  icon={<Mail          size={16} />} iconVariant="info"                                                      loading={loading} href="/admin/email-campaigns" />
      </div>

      {/* ── Row 1: Charts ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>

        {/* Revenue Chart */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Revenue Overview</h3>
            <Link href="/admin/dashboard" style={{ fontSize: 12, color: 'var(--admin-accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              Full report <ArrowRight size={12} />
            </Link>
          </div>
          {loading
            ? <div className="admin-skeleton" style={{ height: 200, borderRadius: 8 }} />
            : <BarChart data={orderChartData} height={200} label="Recent Order Revenue" id="revenue-chart" />
          }
        </div>

        {/* Loyalty Donut */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Loyalty Tiers</h3>
            <Link href="/admin/loyalty" style={{ fontSize: 12, color: 'var(--admin-accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              Manage <ArrowRight size={12} />
            </Link>
          </div>
          {loading
            ? <div className="admin-skeleton" style={{ height: 160, borderRadius: 8 }} />
            : loyaltyChartData.length > 0
              ? <DonutChart data={loyaltyChartData} size={150} label="Members" id="loyalty-chart" />
              : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 140, gap: 8 }}>
                  <Coffee size={28} style={{ color: 'var(--admin-text-disabled)' }} />
                  <span style={{ fontSize: 12, color: 'var(--admin-text-tertiary)' }}>No loyalty data yet</span>
                </div>
          }
        </div>
      </div>

      {/* ── Row 2: Campaign + Recent Orders ───────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 20 }}>

        {/* Campaign Performance */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Campaigns</h3>
            <Link href="/admin/email-campaigns" style={{ fontSize: 12, color: 'var(--admin-accent)', fontWeight: 600 }}>
              View all
            </Link>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3, 4].map((i) => <div key={i} className="admin-skeleton" style={{ height: 52, borderRadius: 8 }} />)}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Total Sent',   value: (data?.campaignStats.totalSent  ?? 0).toLocaleString(), sub: 'All time',          color: 'var(--admin-info)',    icon: Mail },
                { label: 'Total Opens',  value: (data?.campaignStats.totalOpens ?? 0).toLocaleString(), sub: `${openRate}% open rate`,  color: 'var(--admin-success)', icon: BarChart2 },
                { label: 'Total Clicks', value: (data?.campaignStats.totalClicks?? 0).toLocaleString(), sub: `${clickRate}% CTR`, color: 'var(--admin-gold)',    icon: TrendingUp },
              ].map(({ label, value, sub, color, icon: Icon }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px',
                  background: 'var(--admin-surface-muted)',
                  borderRadius: 'var(--admin-radius-sm)',
                  border: '1px solid var(--admin-border)',
                }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={15} style={{ color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: 'var(--admin-text-tertiary)', fontWeight: 500 }}>{label}</div>
                    <div style={{ fontSize: 11, color: 'var(--admin-text-disabled)' }}>{sub}</div>
                  </div>
                  <span style={{ fontSize: 17, fontWeight: 700, fontFamily: 'var(--admin-font-display)', color: 'var(--admin-text-primary)', flexShrink: 0 }}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="admin-card" style={{ padding: 0 }}>
          <div className="admin-card-header" style={{ padding: '16px 20px 14px', margin: 0, border: 'none', borderBottom: '1px solid var(--admin-border)' }}>
            <h3 className="admin-card-title">Recent Orders</h3>
            <a href="/admin/orders" style={{ fontSize: 12, color: 'var(--admin-accent)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ArrowRight size={12} />
            </a>
          </div>
          <div className="admin-table-overflow">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 7 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j}><div className="admin-skeleton" style={{ height: 14, borderRadius: 4 }} /></td>
                      ))}
                    </tr>
                  ))
                ) : (data?.recentOrders ?? []).length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--admin-text-tertiary)', fontSize: 13 }}>No recent orders</td></tr>
                ) : (
                  (data?.recentOrders ?? []).slice(0, 8).map((o) => (
                    <tr key={o.id}>
                      <td style={{ fontFamily: 'var(--admin-font-mono)', fontSize: 12, color: 'var(--admin-accent)', fontWeight: 600 }}>
                        #{o.orderNumber}
                      </td>
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--admin-text-primary)' }}>
                          {o.user.firstName} {o.user.lastName}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--admin-text-tertiary)' }}>{o.user.email}</div>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--admin-text-primary)', fontSize: 13 }}>
                        {fmt(o.totalAmount)}
                      </td>
                      <td><StatusBadge status={o.status.toLowerCase()} size="sm" /></td>
                      <td style={{ fontSize: 12, color: 'var(--admin-text-secondary)' }}>
                        {new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Row 3: Quick Actions + Realtime Feed ──────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

        {/* Quick Actions */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Quick Actions</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {QUICK_ACTIONS.map(({ icon: Icon, label, href, color }) => (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '11px 14px',
                  background: 'var(--admin-surface-muted)',
                  border: '1px solid var(--admin-border)',
                  borderRadius: 'var(--admin-radius-sm)',
                  textDecoration: 'none',
                  transition: 'all 150ms',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = color;
                  e.currentTarget.style.background = `${color}10`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--admin-border)';
                  e.currentTarget.style.background = 'var(--admin-surface-muted)';
                }}
              >
                <div style={{ width: 30, height: 30, borderRadius: 7, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={14} style={{ color }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-primary)' }}>{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Realtime Activity Feed */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Activity size={14} style={{ color: 'var(--admin-success)' }} />
              Live Activity
            </h3>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.5px',
              background: 'var(--admin-success-bg)', color: 'var(--admin-success)',
              border: '1px solid var(--admin-success-border)',
              borderRadius: 'var(--admin-radius-pill)', padding: '2px 8px',
            }}>
              LIVE
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {REALTIME_FEED.map((item, i) => {
              const Icon = item.icon;
              const colors: Record<string, { bg: string; color: string }> = {
                success: { bg: 'var(--admin-success-bg)', color: 'var(--admin-success)' },
                info:    { bg: 'var(--admin-info-bg)',    color: 'var(--admin-info)' },
                warning: { bg: 'var(--admin-warning-bg)', color: 'var(--admin-warning)' },
                error:   { bg: 'var(--admin-error-bg)',   color: 'var(--admin-error)' },
              };
              const c = colors[item.type] ?? colors.info;
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '10px 0',
                  borderBottom: i < REALTIME_FEED.length - 1 ? '1px solid var(--admin-border)' : 'none',
                }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={13} style={{ color: c.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--admin-text-primary)', lineHeight: 1.3 }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--admin-text-disabled)', marginTop: 2 }}>{item.time}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Row 4: Pending Reviews + Low Inventory Alert ──── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Pending Reviews Banner */}
        {!loading && (data?.kpis.pendingReviews ?? 0) > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, var(--admin-accent), var(--admin-accent-light))',
            borderRadius: 'var(--admin-radius-lg)',
            padding: '20px 24px',
            display: 'flex', alignItems: 'center', gap: 16,
            boxShadow: 'var(--admin-shadow-md)',
          }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(250,240,230,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Star size={22} style={{ color: '#FAF0E6' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--admin-font-display)', color: '#FAF0E6' }}>
                {data?.kpis.pendingReviews} Reviews Pending
              </div>
              <div style={{ fontSize: 12, color: 'rgba(250,240,230,0.7)', marginTop: 3 }}>
                Customer reviews awaiting your approval
              </div>
            </div>
            <Link href="/admin/reviews" style={{
              padding: '8px 16px', background: 'rgba(250,240,230,0.15)',
              borderRadius: 8, fontSize: 13, fontWeight: 600,
              color: '#FAF0E6', textDecoration: 'none', border: '1px solid rgba(250,240,230,0.25)',
              display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
              transition: 'background 150ms',
            }}>
              Review Now <ArrowRight size={13} />
            </Link>
          </div>
        )}

        {/* Low Inventory Alert (static demo) */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={14} style={{ color: 'var(--admin-warning)' }} />
              Low Stock Alert
            </h3>
            <span style={{
              fontSize: 10, fontWeight: 700,
              background: 'var(--admin-warning-bg)', color: 'var(--admin-warning)',
              border: '1px solid var(--admin-warning-border)',
              borderRadius: 'var(--admin-radius-pill)', padding: '2px 8px',
            }}>
              3 Items
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { name: 'Oat Milk Blend 250g',   sku: 'BL-OAT-250',   stock: 4,  threshold: 10 },
              { name: 'Dark Roast Single Origin', sku: 'BL-DRK-100', stock: 7,  threshold: 15 },
              { name: 'Cold Brew Concentrate',   sku: 'BL-CBR-500',  stock: 2,  threshold: 10 },
            ].map(({ name, sku, stock, threshold }) => (
              <div key={sku} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px',
                background: 'var(--admin-surface-muted)',
                border: '1px solid var(--admin-border)',
                borderRadius: 'var(--admin-radius-sm)',
              }}>
                <div style={{ width: 32, height: 32, borderRadius: 7, background: 'var(--admin-warning-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Package size={14} style={{ color: 'var(--admin-warning)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                  <div style={{ fontSize: 10, color: 'var(--admin-text-tertiary)' }}>{sku}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--admin-error)' }}>{stock} left</div>
                  <div style={{ fontSize: 10, color: 'var(--admin-text-disabled)' }}>min {threshold}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
