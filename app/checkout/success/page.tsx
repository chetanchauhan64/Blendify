// ============================================================
// BLENDIFY — Order Confirmation Page (Premium)
// /checkout/success?order=<orderNumber>
//
// Shows order confirmation after verified successful payment.
// Requires authentication. Never exposes internal DB IDs.
// All data loaded from real order record.
// ============================================================
import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import {
  CheckCircle2, Package, ArrowRight, ShoppingBag, MapPin,
  CreditCard, Truck, Mail, Phone, Calendar, Star,
} from 'lucide-react';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Order Confirmed — BLENDIFY',
  description: 'Your BLENDIFY order has been confirmed.',
  robots: { index: false, follow: false },
};

interface SuccessPageProps {
  searchParams: Promise<{ order?: string }>;
}

// Friendly payment gateway labels
const GATEWAY_LABELS: Record<string, string> = {
  RAZORPAY: 'Razorpay',
  STRIPE: 'Stripe',
  COD: 'Cash on Delivery',
  WALLET: 'Wallet',
  LOYALTY_POINTS: 'Loyalty Points',
};

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const user = await requireAuth();
  const { order: orderNumber } = await searchParams;

  // Load order — only if it belongs to this user
  const order = orderNumber
    ? await prisma.order.findFirst({
        where: { orderNumber, userId: user.id },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          subtotal: true,
          discount: true,
          shippingCost: true,
          tax: true,
          total: true,
          currencyCode: true,
          createdAt: true,
          notes: true,
          items: {
            select: {
              productName: true,
              variantName: true,
              quantity: true,
              unitPrice: true,
              discount: true,
              imageUrl: true,
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
  const isPaid = payment?.status === 'PAID';

  // Compute savings from real order data
  // discount field on OrderItem = per-item discount captured at order time
  const itemDiscounts = order?.items.reduce((sum, item) => {
    return sum + Number(item.discount ?? 0);
  }, 0) ?? 0;
  const couponSavings = Number(order?.discount ?? 0);
  const shippingFree = Number(order?.shippingCost ?? 0) === 0;
  const mrpSavings = itemDiscounts;
  const totalSaved = mrpSavings + couponSavings + (shippingFree ? 99 : 0);

  // Estimate delivery date (same logic as shipping API)
  const deliveryDate = order
    ? (() => {
        const d = new Date(order.createdAt);
        d.setDate(d.getDate() + 4); // 1 processing + 3 transit minimum
        while (d.getDay() === 0) d.setDate(d.getDate() + 1);
        return d.toLocaleDateString('en-IN', {
          weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata',
        });
      })()
    : '';

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {order && isPaid ? (
          <>
            {/* ── Animated Success Checkmark ────────────────── */}
            <div className={styles.successHeader}>
              <div className={styles.successRing} aria-hidden="true">
                <div className={styles.successIconWrapper}>
                  <CheckCircle2 size={52} strokeWidth={1.5} />
                </div>
              </div>
              <span className={styles.successLabel}>Order Confirmed</span>
              <h1 className={styles.successTitle}>
                Thank you, {user.firstName}! 🎉
              </h1>
              <p className={styles.successSubtitle}>
                Your payment has been verified and your coffee is on its way to you.
              </p>
              {totalSaved > 0 && (
                <div className={styles.savingsBadge}>
                  🥰 You saved <strong>₹{totalSaved.toFixed(0)}</strong> on this order!
                </div>
              )}
            </div>

            {/* ── Order Meta Grid ────────────────────────────── */}
            <div className={styles.metaGrid}>
              <div className={styles.metaItem}>
                <div className={styles.metaIcon}><Package size={18} /></div>
                <div>
                  <span className={styles.metaLabel}>Order Number</span>
                  <span className={styles.metaValue}>#{order.orderNumber}</span>
                </div>
              </div>
              <div className={styles.metaItem}>
                <div className={styles.metaIcon}><CheckCircle2 size={18} /></div>
                <div>
                  <span className={styles.metaLabel}>Payment Status</span>
                  <span className={`${styles.metaValue} ${styles.paidStatus}`}>✓ Paid via {GATEWAY_LABELS[payment?.gateway ?? ''] ?? 'Online'}</span>
                </div>
              </div>
              <div className={styles.metaItem}>
                <div className={styles.metaIcon}><Calendar size={18} /></div>
                <div>
                  <span className={styles.metaLabel}>Estimated Delivery</span>
                  <span className={styles.metaValue}>{deliveryDate}</span>
                </div>
              </div>
              <div className={styles.metaItem}>
                <div className={styles.metaIcon}><CreditCard size={18} /></div>
                <div>
                  <span className={styles.metaLabel}>Amount Paid</span>
                  <span className={styles.metaValue}>₹{Number(order.total).toFixed(0)}</span>
                </div>
              </div>
            </div>

            {/* ── Products ─────────────────────────────────── */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>
                  <ShoppingBag size={18} /> Your Order ({order.items.length} {order.items.length === 1 ? 'item' : 'items'})
                </h2>
              </div>
              <div className={styles.itemsList}>
                {order.items.map((item, i) => (
                  <div key={i} className={styles.orderItem}>
                    <div className={styles.orderItemImgWrap}>
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt={item.productName} />
                      ) : (
                        <div className={styles.orderItemImgFallback}>☕</div>
                      )}
                      <span className={styles.orderItemQtyBadge}>{item.quantity}</span>
                    </div>
                    <div className={styles.orderItemInfo}>
                      <p className={styles.orderItemName}>{item.productName}</p>
                      <p className={styles.orderItemVariant}>{item.variantName}</p>
                      {Number(item.discount) > 0 && (
                        <span className={styles.savedTag}>
                          Saved ₹{Number(item.discount).toFixed(0)}
                        </span>
                      )}
                    </div>
                    <div className={styles.orderItemPriceCol}>
                      <span className={styles.orderItemPrice}>
                        ₹{(Number(item.unitPrice) * item.quantity).toFixed(0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Pricing breakdown */}
              <div className={styles.pricingBreakdown}>
                <div className={styles.pricingLine}>
                  <span>Subtotal</span>
                  <span>₹{Number(order.subtotal).toFixed(0)}</span>
                </div>
                {Number(order.discount) > 0 && (
                  <div className={`${styles.pricingLine} ${styles.discount}`}>
                    <span>Discount</span>
                    <span>-₹{Number(order.discount).toFixed(0)}</span>
                  </div>
                )}
                <div className={styles.pricingLine}>
                  <span>Shipping</span>
                  <span>
                    {Number(order.shippingCost) === 0
                      ? <span className={styles.freeTag}>FREE</span>
                      : `₹${Number(order.shippingCost).toFixed(0)}`}
                  </span>
                </div>
                <div className={styles.pricingDivider} />
                <div className={`${styles.pricingLine} ${styles.total}`}>
                  <span>Total Paid</span>
                  <span>₹{Number(order.total).toFixed(0)}</span>
                </div>
                {totalSaved > 0 && (
                  <div className={styles.savedLine}>
                    <span>🎉 You saved on this order</span>
                    <span>₹{totalSaved.toFixed(0)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Delivery Details ──────────────────────────── */}
            <div className={styles.twoCol}>
              {/* Shipping Address */}
              {shippingAddr && (
                <div className={styles.infoCard}>
                  <div className={styles.infoCardHeader}>
                    <MapPin size={16} className={styles.infoCardIcon} />
                    <span className={styles.infoCardTitle}>Shipping To</span>
                  </div>
                  <p className={styles.infoCardBody}>
                    <strong>{shippingAddr.firstName} {shippingAddr.lastName}</strong><br />
                    {shippingAddr.line1}
                    {shippingAddr.line2 && <><br />{shippingAddr.line2}</>}
                    <br />
                    {shippingAddr.city}, {shippingAddr.state} – {shippingAddr.postalCode}
                    <br />
                    {shippingAddr.country.name}
                  </p>
                  <div className={styles.infoCardContact}>
                    <span><Phone size={11} /> {shippingAddr.phone}</span>
                    <span><Mail size={11} /> {user.email}</span>
                  </div>
                </div>
              )}

              {/* Delivery + Payment Info */}
              <div className={styles.infoCard}>
                <div className={styles.infoCardHeader}>
                  <Truck size={16} className={styles.infoCardIcon} />
                  <span className={styles.infoCardTitle}>Delivery Info</span>
                </div>
                <div className={styles.deliveryDetail}>
                  <div className={styles.deliveryRow}>
                    <span className={styles.deliveryLabel}>Estimated by</span>
                    <span className={styles.deliveryValue}>{deliveryDate}</span>
                  </div>
                  <div className={styles.deliveryRow}>
                    <span className={styles.deliveryLabel}>Shipping</span>
                    <span className={styles.deliveryValue}>
                      {Number(order.shippingCost) === 0
                        ? <span className={styles.freeTag}>FREE</span>
                        : `₹${Number(order.shippingCost).toFixed(0)}`}
                    </span>
                  </div>
                  <div className={styles.deliveryRow}>
                    <span className={styles.deliveryLabel}>Payment</span>
                    <span className={styles.deliveryValue}>
                      {GATEWAY_LABELS[payment?.gateway ?? ''] ?? 'Online'}
                    </span>
                  </div>
                  {payment?.paidAt && (
                    <div className={styles.deliveryRow}>
                      <span className={styles.deliveryLabel}>Paid at</span>
                      <span className={styles.deliveryValue}>
                        {new Date(payment.paidAt).toLocaleString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Next Steps ────────────────────────────────── */}
            <div className={styles.nextStepsRow}>
              <div className={styles.nextStep}>
                <div className={styles.nextStepIcon}><Mail size={20} /></div>
                <p className={styles.nextStepText}>
                  Confirmation sent to <strong>{user.email}</strong>
                </p>
              </div>
              <div className={styles.nextStep}>
                <div className={styles.nextStepIcon}><Package size={20} /></div>
                <p className={styles.nextStepText}>Tracking updates sent when your order ships</p>
              </div>
              <div className={styles.nextStep}>
                <div className={styles.nextStepIcon}><Star size={20} /></div>
                <p className={styles.nextStepText}>Review your purchase &amp; earn loyalty points</p>
              </div>
            </div>

            {/* ── Action Buttons ────────────────────────────── */}
            <div className={styles.actions}>
              <Link href="/account/orders" className={`btn btn--primary ${styles.actionBtn}`} id="view-orders-btn">
                Track Your Order <ArrowRight size={16} />
              </Link>
              <Link href="/shop" className={`btn btn--outline ${styles.actionBtn}`} id="continue-shopping-btn">
                Continue Shopping
              </Link>
            </div>
          </>
        ) : (
          <>
            {/* ── Fallback / Invalid Order State ──────────── */}
            <div className={styles.successHeader}>
              <div className={styles.errorIconWrapper} aria-hidden="true">
                <ShoppingBag size={52} strokeWidth={1.5} />
              </div>
              <h1 className={styles.successTitle}>Order Not Found</h1>
              <p className={styles.successSubtitle}>
                We couldn&apos;t find your order. If you completed payment, please check your order
                history or contact our support team.
              </p>
            </div>
            <div className={styles.actions}>
              <Link href="/account/orders" className={`btn btn--primary ${styles.actionBtn}`} id="view-orders-fallback-btn">
                View Order History <ArrowRight size={16} />
              </Link>
              <Link href="/shop" className={`btn btn--outline ${styles.actionBtn}`} id="continue-shopping-fallback-btn">
                Continue Shopping
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
