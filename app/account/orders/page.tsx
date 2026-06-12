import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAuth } from '@/lib/auth';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Order History — BLENDIFY',
  description: 'View and track your BLENDIFY orders.',
};

const STATUS_CLASS: Record<string, string> = {
  DELIVERED: styles.statusDelivered,
  SHIPPED: styles.statusShipped,
  PROCESSING: styles.statusProcessing,
  CANCELLED: styles.statusCancelled,
  PENDING: styles.statusPending,
  CONFIRMED: styles.statusProcessing,
  PACKED: styles.statusShipped,
};

export default async function OrdersPage() {
  const user = await requireAuth();

  // TODO: replace with real DB query when database is connected:
  // const orders = await prisma.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
  const orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    currency: string;
    itemCount: number;
    createdAt: Date;
  }> = [];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className="section-label">Account</span>
        <h1 className={styles.title}>Order History</h1>
        <p className={styles.subtitle}>Track and review all your past orders, {user.firstName}.</p>
      </div>

      {orders.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <ShoppingBag size={28} />
          </div>
          <h2>No orders yet</h2>
          <p>
            You haven&apos;t placed any orders yet. Explore our coffee collection and find
            your next favourite.
          </p>
          <Link href="/shop" className="btn btn--primary" style={{ marginTop: 'var(--space-2)' }}>
            Browse Coffee
            <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className={styles.orderList}>
          {orders.map((order) => (
            <div key={order.id} className={styles.orderCard}>
              <div>
                <p className={styles.orderNumber}>#{order.orderNumber}</p>
                <p className={styles.orderDate}>
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                  {' · '}
                  {order.itemCount} item{order.itemCount !== 1 ? 's' : ''}
                </p>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                <span className={styles.orderTotal}>
                  {order.currency} {order.total.toFixed(2)}
                </span>
                <span className={`${styles.statusBadge} ${STATUS_CLASS[order.status] ?? styles.statusPending}`}>
                  {order.status.toLowerCase().replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
