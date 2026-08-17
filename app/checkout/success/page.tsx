// ============================================================
// BLENDIFY — Order Confirmation Page
// /checkout/success?order=<orderNumber>
//
// Shows order confirmation after verified successful payment.
// Requires authentication.
// Never exposes internal database IDs.
// ============================================================
import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { CheckCircle, Package, ArrowRight, ShoppingBag } from 'lucide-react';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Order Confirmed — BLENDIFY',
  description: 'Your BLENDIFY order has been confirmed.',
  robots: { index: false, follow: false },
};

interface SuccessPageProps {
  searchParams: Promise<{ order?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const user = await requireAuth();
  const { order: orderNumber } = await searchParams;

  // Load order by order number — only if it belongs to this user
  const order = orderNumber
    ? await prisma.order.findFirst({
        where: {
          orderNumber,
          userId: user.id,
        },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          total: true,
          currencyCode: true,
          createdAt: true,
          items: {
            select: {
              productName: true,
              variantName: true,
              quantity: true,
              unitPrice: true,
            },
          },
          payments: {
            select: {
              status: true,
              gateway: true,
              amount: true,
              paidAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          shippingAddress: {
            select: {
              firstName: true,
              lastName: true,
              phone: true,
              line1: true,
              line2: true,
              city: true,
              state: true,
              postalCode: true,
              country: { select: { name: true } },
            },
          },
        },
      })
    : null;

  const payment = order?.payments[0];
  const shippingAddr = order?.shippingAddress;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {order && payment?.status === 'PAID' ? (
          <>
            {/* Success State */}
            <div className={styles.successIcon}>
              <CheckCircle size={64} strokeWidth={1.5} />
            </div>

            <div className={styles.header}>
              <span className="section-label">Order Confirmed</span>
              <h1 className={styles.title}>Thank you, {user.firstName}!</h1>
              <p className={styles.subtitle}>
                Your payment has been verified and your order is being prepared.
              </p>
            </div>

            <div className={styles.card}>
              <div className={styles.orderMeta}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Order Number</span>
                  <span className={styles.metaValue}>#{order.orderNumber}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Payment Status</span>
                  <span className={`${styles.metaValue} ${styles.paid}`}>
                    ✓ Paid
                  </span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Order Status</span>
                  <span className={styles.metaValue}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Order Total</span>
                  <span className={styles.metaValue}>
                    ₹{Number(order.total).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Shipping Address */}
              {shippingAddr && (
                <>
                  <div className={styles.itemsDivider} />
                  <div className={styles.shippingSection}>
                    <p className={styles.shippingSectionTitle}>Shipping Address</p>
                    <p className={styles.shippingText}>
                      {shippingAddr.firstName} {shippingAddr.lastName}
                      <br />
                      {shippingAddr.line1}
                      {shippingAddr.line2 && (<><br />{shippingAddr.line2}</>)}
                      <br />
                      {shippingAddr.city}, {shippingAddr.state} {shippingAddr.postalCode}
                      <br />
                      {shippingAddr.country.name}
                      <br />
                      {shippingAddr.phone}
                    </p>
                  </div>
                </>
              )}

              {/* Items */}
              <div className={styles.itemsDivider} />
              <div className={styles.items}>
                {order.items.map((item, i) => (
                  <div key={i} className={styles.item}>
                    <div>
                      <p className={styles.itemName}>{item.productName}</p>
                      <p className={styles.itemVariant}>{item.variantName} · Qty {item.quantity}</p>
                    </div>
                    <span className={styles.itemPrice}>
                      ₹{(Number(item.unitPrice) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.nextSteps}>
              <div className={styles.step}>
                <Package size={24} />
                <p>We&apos;ll send you a tracking update when your order ships.</p>
              </div>
              <div className={styles.step}>
                <CheckCircle size={24} />
                <p>A confirmation has been sent to <strong>{user.email}</strong></p>
              </div>
            </div>

            <div className={styles.actions}>
              <Link href="/account/orders" className={`btn btn--primary ${styles.actionBtn}`}>
                View Order Details
                <ArrowRight size={16} />
              </Link>
              <Link href="/shop" className={`btn btn--outline ${styles.actionBtn}`}>
                Continue Shopping
              </Link>
            </div>
          </>
        ) : (
          <>
            {/* Fallback / Invalid State */}
            <div className={styles.successIcon} style={{ color: 'var(--brand-amber)' }}>
              <ShoppingBag size={64} strokeWidth={1.5} />
            </div>
            <div className={styles.header}>
              <h1 className={styles.title}>Order Not Found</h1>
              <p className={styles.subtitle}>
                We couldn&apos;t find your order. If you completed payment, please check your order history or contact support.
              </p>
            </div>
            <div className={styles.actions}>
              <Link href="/account/orders" className={`btn btn--primary ${styles.actionBtn}`}>
                View Order History
                <ArrowRight size={16} />
              </Link>
              <Link href="/shop" className={`btn btn--outline ${styles.actionBtn}`}>
                Continue Shopping
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
