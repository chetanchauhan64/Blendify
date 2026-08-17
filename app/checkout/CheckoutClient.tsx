'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, MapPin, Tag, Star, Shield, ChevronDown, ChevronUp, AlertCircle, Loader2, CreditCard, Smartphone, Landmark, Wallet, Phone } from 'lucide-react';
import { useCartStore } from '@/lib/store/cartStore';
import styles from './CheckoutClient.module.css';

// ── Types ─────────────────────────────────────────────────────

interface Address {
  id: string;
  type: string;
  firstName: string;
  lastName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  label?: string;
}

interface CheckoutUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  loyaltyPoints: number;
}

interface CheckoutClientProps {
  user: CheckoutUser;
  addresses: Address[];
}

// Razorpay types
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: { ondismiss?: () => void; confirm_close?: boolean };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  method?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config?: Record<string, any>;
}

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayFailedResponse {
  error: { description: string };
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: RazorpayOptions) => any;
  }
}

// ── Component ─────────────────────────────────────────────────

export function CheckoutClient({ user, addresses }: CheckoutClientProps) {
  const router = useRouter();
  const { items, subtotal, couponCode, clearCart } = useCartStore();

  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? ''
  );
  const [appliedCoupon, setAppliedCoupon] = useState(couponCode);
  const [couponInput, setCouponInput] = useState('');
  const [loyaltyToUse, setLoyaltyToUse] = useState(0);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderSummaryOpen, setOrderSummaryOpen] = useState(true);
  const [rzpLoaded, setRzpLoaded] = useState(false);

  // Track current orderId across Razorpay callback
  const currentOrderIdRef = useRef<string>('');
  const currentOrderNumberRef = useRef<string>('');

  // Display pricing (server recalculates authoritatively)
  const sub = subtotal();
  const shipping = sub >= 2499 ? 0 : 99;
  const loyaltyDiscount = loyaltyToUse * 0.5;
  const displayTotal = Math.max(0, sub + shipping - loyaltyDiscount);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRzpLoaded(true);
    script.onerror = () =>
      setError('Failed to load payment provider. Please refresh the page.');
    document.head.appendChild(script);
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Redirect to shop if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      router.replace('/shop');
    }
  }, [items.length, router]);

  // ── Razorpay Payment Verification ──────────────────────────

  const handleVerify = async (response: RazorpaySuccessResponse) => {
    // This runs INSIDE the Razorpay handler callback
    // DO NOT mark anything as paid here — only the server decides
    setIsLoading(true);
    setError(null);

    const orderId = currentOrderIdRef.current;
    const orderNumber = currentOrderNumberRef.current;

    try {
      const verifyRes = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          orderId,
        }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.success) {
        setError(
          verifyData.error ??
          'Payment verification failed. Please contact support with order number: ' + orderNumber
        );
        setIsLoading(false);
        return;
      }

      // Server verified → clear local cart → go to confirmation
      clearCart();
      router.push(`/checkout/success?order=${verifyData.orderNumber}`);
    } catch {
      setError(
        'Network error during payment verification. Please contact support. Your order number is: ' + orderNumber
      );
      setIsLoading(false);
    }
  };

  // ── Pay Now Handler ─────────────────────────────────────────

  const handlePayNow = async () => {
    if (!selectedAddressId) {
      setError('Please select a shipping address.');
      return;
    }
    if (!rzpLoaded || typeof window.Razorpay === 'undefined') {
      setError('Payment provider is not ready. Please refresh the page.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // ── Step 1: Server creates Razorpay order ─────────────
      // All amounts calculated server-side — client amount is display only
      const createRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingAddressId: selectedAddressId,
          couponCode: appliedCoupon || undefined,
          loyaltyPointsToUse: loyaltyToUse,
          notes: notes || undefined,
          currencyCode: 'INR',
        }),
      });

      const createData = await createRes.json();

      if (!createRes.ok || !createData.success) {
        setError(createData.error ?? 'Failed to create order. Please try again.');
        setIsLoading(false);
        return;
      }

      const { razorpayOrderId, amount, currency, keyId, orderId, orderNumber } = createData;

      // Store refs for the Razorpay callback
      currentOrderIdRef.current = orderId;
      currentOrderNumberRef.current = orderNumber;

      // ── Step 2: Open Razorpay Checkout ────────────────────
      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        order_id: razorpayOrderId,
        name: 'BLENDIFY',
        description: `Order #${orderNumber}`,
        prefill: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          contact: selectedAddress?.phone || '',
        },
        theme: { color: '#581312' },
        // Enable all Razorpay-supported payment methods
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
          emi: true,
        },
        // Prefer UPI Intent/QR flow over deprecated UPI Collect
        config: {
          display: {
            blocks: {
              utib: { name: 'Pay using UPI', instruments: [{ method: 'upi', flows: ['intent', 'qr'] }] },
            },
            sequence: ['block.utib'],
            preferences: { show_default_blocks: true },
          },
        },
        handler: handleVerify, // ← Step 3 happens here on success callback
        modal: {
          ondismiss: () => {
            setIsLoading(false);
            setError('Payment was cancelled. You can try again.');
          },
          confirm_close: true,
        },
      });

      rzp.on('payment.failed', (response: RazorpayFailedResponse) => {
        setIsLoading(false);
        setError(
          response.error?.description ?? 'Payment failed. Please try a different method.'
        );
      });

      rzp.open();
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  if (items.length === 0) {
    return null; // redirecting
  }

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <span className="section-label">Checkout</span>
          <h1 className={styles.title}>Complete Your Order</h1>
        </div>

        <div className={styles.grid}>
          {/* ── LEFT: Order Details ────────────────────────── */}
          <div className={styles.left}>

            {/* Cart Items */}
            <div className={styles.card}>
              <button
                className={styles.cardHeader}
                onClick={() => setOrderSummaryOpen((v) => !v)}
                aria-expanded={orderSummaryOpen}
              >
                <span className={styles.cardTitle}>
                  <ShoppingBag size={18} />
                  Your Items ({items.length})
                </span>
                {orderSummaryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {orderSummaryOpen && (
                <div className={styles.itemsList}>
                  {items.map((item) => {
                    const price =
                      item.isSubscription && item.product.subscriptionPrice
                        ? item.product.subscriptionPrice
                        : item.variant.price;
                    return (
                      <div key={item.id} className={styles.orderItem}>
                        <div className={styles.orderItemImage}>
                          {item.product.images?.[0] && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.product.images[0]} alt={item.product.name} />
                          )}
                        </div>
                        <div className={styles.orderItemInfo}>
                          <p className={styles.orderItemName}>{item.product.name}</p>
                          <p className={styles.orderItemVariant}>
                            {item.variant.size}
                            {item.isSubscription && (
                              <span className={styles.subBadge}>Subscribe</span>
                            )}
                          </p>
                          <p className={styles.orderItemQty}>Qty: {item.quantity}</p>
                        </div>
                        <span className={styles.orderItemPrice}>
                          ₹{(price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Shipping Address */}
            <div className={styles.card}>
              <div className={styles.cardHeader} style={{ cursor: 'default' }}>
                <span className={styles.cardTitle}>
                  <MapPin size={18} />
                  Shipping Address
                </span>
              </div>

              {addresses.length === 0 ? (
                <div className={styles.emptyAddresses}>
                  <p>No saved addresses found.</p>
                  <a href="/account/addresses" className={styles.addAddressLink}>
                    + Add Address
                  </a>
                </div>
              ) : (
                <div className={styles.addressList}>
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`${styles.addressCard} ${
                        selectedAddressId === addr.id ? styles.addressSelected : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="shippingAddress"
                        value={addr.id}
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className={styles.addressRadio}
                      />
                      <div className={styles.addressDetails}>
                        <p className={styles.addressName}>
                          {addr.firstName} {addr.lastName}
                          {addr.isDefault && (
                            <span className={styles.defaultBadge}>Default</span>
                          )}
                          {addr.label && (
                            <span className={styles.labelBadge}>{addr.label}</span>
                          )}
                        </p>
                        <p className={styles.addressLine}>
                          {addr.line1}
                          {addr.line2 ? `, ${addr.line2}` : ''}
                        </p>
                        <p className={styles.addressLine}>
                          {addr.city}, {addr.state} {addr.postalCode}
                        </p>
                        <p className={styles.addressLine}>
                          {addr.country} · {addr.phone}
                        </p>
                      </div>
                    </label>
                  ))}
                  <a href="/account/addresses" className={styles.addAddressLink}>
                    + Add New Address
                  </a>
                </div>
              )}
            </div>

            {/* Coupon */}
            <div className={styles.card}>
              <div className={styles.cardHeader} style={{ cursor: 'default' }}>
                <span className={styles.cardTitle}>
                  <Tag size={18} />
                  Coupon Code
                </span>
              </div>
              <div className={styles.couponRow}>
                <input
                  type="text"
                  id="coupon-input"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  className={styles.couponInput}
                  disabled={!!appliedCoupon}
                />
                {appliedCoupon ? (
                  <button
                    className={styles.couponRemoveBtn}
                    onClick={() => {
                      setAppliedCoupon('');
                      setCouponInput('');
                    }}
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    className={styles.couponApplyBtn}
                    onClick={() => {
                      if (couponInput.trim()) setAppliedCoupon(couponInput.trim());
                    }}
                    disabled={!couponInput.trim()}
                  >
                    Apply
                  </button>
                )}
              </div>
              {appliedCoupon && (
                <p className={styles.couponApplied}>
                  ✓ Coupon &quot;{appliedCoupon}&quot; will be validated at checkout
                </p>
              )}
            </div>

            {/* Loyalty Points */}
            {user.loyaltyPoints > 0 && (
              <div className={styles.card}>
                <div className={styles.cardHeader} style={{ cursor: 'default' }}>
                  <span className={styles.cardTitle}>
                    <Star size={18} />
                    Loyalty Points ({user.loyaltyPoints} available)
                  </span>
                </div>
                <div className={styles.loyaltyRow}>
                  <input
                    type="number"
                    id="loyalty-input"
                    min={0}
                    max={user.loyaltyPoints}
                    value={loyaltyToUse}
                    onChange={(e) =>
                      setLoyaltyToUse(
                        Math.min(Math.max(0, Number(e.target.value)), user.loyaltyPoints)
                      )
                    }
                    className={styles.loyaltyInput}
                    placeholder="Points to use"
                  />
                  <span className={styles.loyaltyValue}>
                    = ₹{(loyaltyToUse * 0.5).toFixed(2)} off
                  </span>
                </div>
                <p className={styles.loyaltyNote}>1 point = ₹0.50 discount</p>
              </div>
            )}

            {/* Notes */}
            <div className={styles.card}>
              <div className={styles.cardHeader} style={{ cursor: 'default' }}>
                <span className={styles.cardTitle}>Order Notes (optional)</span>
              </div>
              <textarea
                id="order-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special instructions, delivery preferences..."
                className={styles.notesInput}
                maxLength={500}
                rows={3}
              />
            </div>
          </div>

          {/* ── RIGHT: Order Summary + Pay ──────────────────── */}
          <div className={styles.right}>
            <div className={styles.summaryCard}>
              <h2 className={styles.summaryTitle}>Order Summary</h2>

              {/* Customer Info */}
              <div className={styles.customerInfo}>
                <p className={styles.customerName}>
                  {user.firstName} {user.lastName}
                </p>
                <p className={styles.customerEmail}>{user.email}</p>
                {selectedAddress?.phone && (
                  <p className={styles.customerPhone}>
                    <Phone size={12} />
                    {selectedAddress.phone}
                  </p>
                )}
              </div>

              <div className={styles.summaryLines}>
                <div className={styles.summaryLine}>
                  <span>Subtotal</span>
                  <span>₹{sub.toFixed(2)}</span>
                </div>
                <div className={styles.summaryLine}>
                  <span>Shipping</span>
                  <span>
                    {shipping === 0 ? (
                      <span className={styles.freeShipping}>FREE</span>
                    ) : (
                      `₹${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                {appliedCoupon && (
                  <div className={`${styles.summaryLine} ${styles.discount}`}>
                    <span>Coupon ({appliedCoupon})</span>
                    <span>Calculated server-side</span>
                  </div>
                )}
                {loyaltyToUse > 0 && (
                  <div className={`${styles.summaryLine} ${styles.discount}`}>
                    <span>Loyalty ({loyaltyToUse} pts)</span>
                    <span>-₹{loyaltyDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className={styles.summaryDivider} />
                <div className={`${styles.summaryLine} ${styles.total}`}>
                  <span>Estimated Total</span>
                  <span>₹{displayTotal.toFixed(2)}</span>
                </div>
                <p className={styles.totalNote}>
                  Final amount is verified server-side
                </p>
              </div>

              {/* Shipping to preview */}
              {selectedAddress && (
                <div className={styles.addressPreview}>
                  <p className={styles.addressPreviewTitle}>Shipping to</p>
                  <p className={styles.addressPreviewText}>
                    {selectedAddress.firstName} {selectedAddress.lastName}
                    <br />
                    {selectedAddress.line1}
                    {selectedAddress.line2 && (<><br />{selectedAddress.line2}</>)}
                    <br />
                    {selectedAddress.city}, {selectedAddress.state} {selectedAddress.postalCode}
                    <br />
                    {selectedAddress.country}
                    <br />
                    <span className={styles.addressPreviewPhone}>
                      <Phone size={11} /> {selectedAddress.phone}
                    </span>
                  </p>
                </div>
              )}

              {/* Tax */}
              <p className={styles.taxNote}>
                Taxes (GST) included in product prices
              </p>

              {/* Payment Methods */}
              <div className={styles.paymentMethods}>
                <p className={styles.paymentMethodsTitle}>Payment Methods</p>
                <div className={styles.paymentMethodsGrid}>
                  <div className={styles.paymentMethodItem}>
                    <Smartphone size={16} />
                    <span>UPI</span>
                  </div>
                  <div className={styles.paymentMethodItem}>
                    <CreditCard size={16} />
                    <span>Cards</span>
                  </div>
                  <div className={styles.paymentMethodItem}>
                    <Landmark size={16} />
                    <span>Net Banking</span>
                  </div>
                  <div className={styles.paymentMethodItem}>
                    <Wallet size={16} />
                    <span>Wallets</span>
                  </div>
                </div>
                <p className={styles.paymentMethodsNote}>
                  All payment methods powered by Razorpay
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className={styles.errorBox}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Pay Button */}
              <button
                id="pay-now-btn"
                className={styles.payBtn}
                onClick={handlePayNow}
                disabled={
                  isLoading || !rzpLoaded || items.length === 0 || !selectedAddressId
                }
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className={styles.spinning} />
                    Processing...
                  </>
                ) : (
                  <>
                    <Shield size={18} />
                    Pay ₹{displayTotal.toFixed(2)} Securely
                  </>
                )}
              </button>

              <div className={styles.securityNote}>
                <Shield size={12} />
                <span>Secured by Razorpay · 256-bit SSL encryption</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
