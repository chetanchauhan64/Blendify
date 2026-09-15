'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag, MapPin, Tag, Star, Shield, ChevronDown, ChevronUp,
  AlertCircle, Loader2, CreditCard, Smartphone, Landmark, Wallet,
  Phone, Mail, CheckCircle2, X, RefreshCw, Edit2, Plus, Truck,
  Gift, Zap, ChevronRight,
} from 'lucide-react';
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
  phone?: string | null;
  phoneVerified?: boolean;
}

interface CheckoutClientProps {
  user: CheckoutUser;
  addresses: Address[];
}

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

type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet';

// ── Savings Calculator ────────────────────────────────────────
function useSavings(items: import('@/types').CartItem[]): number {
  // MRP savings (compareAtPrice vs actual price)
  return items.reduce((sum, item) => {
    const compareAt = item.variant.compareAtPrice ?? item.product.compareAtPrice;
    const actual = item.isSubscription && item.product.subscriptionPrice
      ? item.product.subscriptionPrice
      : item.variant.price;
    if (compareAt && compareAt > actual) {
      return sum + (compareAt - actual) * item.quantity;
    }
    return sum;
  }, 0);
}

// ── Payment Method Icons (SVG inline for payment providers) ──
const UpiIcon = () => (
  <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
    <rect width="40" height="40" rx="8" fill="#F5F5F5"/>
    <text x="50%" y="58%" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#581312" fontFamily="Inter,sans-serif">UPI</text>
  </svg>
);

const GPayIcon = () => (
  <svg width="32" height="20" viewBox="0 0 60 24" fill="none">
    <text x="0" y="18" fontSize="16" fontWeight="700" fill="#4285F4" fontFamily="sans-serif">G</text>
    <text x="14" y="18" fontSize="16" fontWeight="400" fill="#34A853" fontFamily="sans-serif">P</text>
    <text x="24" y="18" fontSize="16" fontWeight="400" fill="#FBBC05" fontFamily="sans-serif">a</text>
    <text x="34" y="18" fontSize="16" fontWeight="400" fill="#EA4335" fontFamily="sans-serif">y</text>
  </svg>
);

const PhonePeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
    <rect width="40" height="40" rx="8" fill="#5F259F"/>
    <text x="50%" y="62%" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white" fontFamily="Inter,sans-serif">Pe</text>
  </svg>
);

const PaytmIcon = () => (
  <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
    <rect width="40" height="40" rx="8" fill="#00BAF2"/>
    <text x="50%" y="62%" textAnchor="middle" fontSize="8" fontWeight="bold" fill="white" fontFamily="Inter,sans-serif">PAYTM</text>
  </svg>
);

const VisaIcon = () => (
  <svg width="36" height="22" viewBox="0 0 60 36" fill="none">
    <rect width="60" height="36" rx="4" fill="#1A1F71"/>
    <text x="50%" y="65%" textAnchor="middle" fontSize="16" fontWeight="bold" fill="white" fontFamily="sans-serif" letterSpacing="1">VISA</text>
  </svg>
);

const McIcon = () => (
  <svg width="32" height="20" viewBox="0 0 50 30" fill="none">
    <circle cx="18" cy="15" r="13" fill="#EB001B"/>
    <circle cx="32" cy="15" r="13" fill="#F79E1B"/>
    <path d="M25 5.3A13 13 0 0132 15a13 13 0 01-7 9.7A13 13 0 0118 15a13 13 0 017-9.7z" fill="#FF5F00"/>
  </svg>
);

// ── Component ─────────────────────────────────────────────────

export function CheckoutClient({ user, addresses }: CheckoutClientProps) {
  const router = useRouter();
  const { items, subtotal: getSubtotal, couponCode, clearCart } = useCartStore();

  // ── Address state ─────────────────────────────────────────
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? ''
  );
  const [showAddressSelector, setShowAddressSelector] = useState(false);

  // ── Coupon state ──────────────────────────────────────────
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(couponCode || '');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponType, setCouponType] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponModalData, setCouponModalData] = useState<{ code: string; amount: number; message: string } | null>(null);

  // ── Phone/OTP state ───────────────────────────────────────
  const [phone, setPhone] = useState(user.phone ? user.phone.replace(/^\+91/, '') : '');
  const [phoneVerified, setPhoneVerified] = useState(user.phoneVerified ?? false);
  const [showOtpSection, setShowOtpSection] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [normalizedPhone, setNormalizedPhone] = useState(user.phone ?? '');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Shipping state ────────────────────────────────────────
  const [shippingAmount, setShippingAmount] = useState<number>(0);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingIsFree, setShippingIsFree] = useState(false);

  // ── Payment state ─────────────────────────────────────────
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('upi');
  const [paymentMethodOpen, setPaymentMethodOpen] = useState<PaymentMethod | null>('upi');

  // ── Notes / Loyalty ───────────────────────────────────────
  const [notes, setNotes] = useState('');
  const [loyaltyToUse, setLoyaltyToUse] = useState(0);

  // ── UI state ──────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rzpLoaded, setRzpLoaded] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [orderSummaryOpen, setOrderSummaryOpen] = useState(true);

  // ── Order refs ────────────────────────────────────────────
  const currentOrderIdRef = useRef<string>('');
  const currentOrderNumberRef = useRef<string>('');

  // ── Computed pricing ──────────────────────────────────────
  const sub = getSubtotal();
  const mrpSavings = useSavings(items);
  const loyaltyDiscount = loyaltyToUse * 0.5;
  const totalDiscount = couponDiscount + loyaltyDiscount;
  const displayTotal = Math.max(0, sub + shippingAmount - totalDiscount);
  const totalSaved = mrpSavings + totalDiscount + (shippingIsFree ? 99 : 0);

  // ── Load Razorpay script ──────────────────────────────────
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRzpLoaded(true);
    script.onerror = () => setError('Failed to load payment provider. Please refresh.');
    document.head.appendChild(script);
    return () => { if (document.head.contains(script)) document.head.removeChild(script); };
  }, []);

  // ── Redirect if cart empty ────────────────────────────────
  useEffect(() => {
    if (items.length === 0) router.replace('/shop');
  }, [items.length, router]);

  // ── Fetch shipping when address changes ───────────────────
  const fetchShipping = useCallback(async (addressId: string) => {
    if (!addressId) return;
    setShippingLoading(true);
    try {
      const res = await fetch('/api/checkout/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addressId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShippingAmount(data.shippingAmount);
        setDeliveryDate(data.deliveryDateFormatted ?? '');
        setShippingIsFree(data.isFreeShipping);
      }
    } catch {
      // Non-blocking — use fallback
      const fallback = sub >= 2499 ? 0 : 99;
      setShippingAmount(fallback);
      setShippingIsFree(fallback === 0);
    } finally {
      setShippingLoading(false);
    }
  }, [sub]);

  useEffect(() => {
    if (selectedAddressId) fetchShipping(selectedAddressId);
  }, [selectedAddressId, fetchShipping]);

  // ── OTP countdown ─────────────────────────────────────────
  useEffect(() => {
    if (otpCountdown > 0) {
      countdownRef.current = setInterval(() => {
        setOtpCountdown((v) => {
          if (v <= 1) { clearInterval(countdownRef.current!); return 0; }
          return v - 1;
        });
      }, 1000);
    }
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [otpCountdown]);

  // ── Handle coupon apply ───────────────────────────────────
  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await fetch('/api/checkout/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setCouponError(data.error ?? 'Invalid coupon code.');
        return;
      }
      setAppliedCoupon(data.code);
      setCouponDiscount(data.discountAmount);
      setCouponType(data.discountType);
      setCouponInput('');
      setCouponModalData({ code: data.code, amount: data.discountAmount, message: data.message });
      setShowCouponModal(true);
    } catch {
      setCouponError('Failed to validate coupon. Please try again.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon('');
    setCouponDiscount(0);
    setCouponType('');
    setCouponInput('');
    setCouponError('');
  };

  // ── Handle OTP send ───────────────────────────────────────
  const handleSendOtp = async () => {
    if (phone.length !== 10) return;
    setPhoneLoading(true);
    setOtpError('');
    try {
      const res = await fetch('/api/checkout/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setOtpError(data.error ?? 'Failed to send OTP.');
        return;
      }
      setNormalizedPhone(data.phone ?? `+91${phone}`);
      setOtpSent(true);
      setShowOtpSection(true);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpCountdown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setOtpError('Failed to send OTP. Please try again.');
    } finally {
      setPhoneLoading(false);
    }
  };

  // ── Handle OTP digit input ────────────────────────────────
  const handleOtpDigit = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otpDigits];
    next[idx] = val;
    setOtpDigits(next);
    setOtpError('');
    if (val && idx < 5) {
      otpRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setOtpDigits(text.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  // ── Handle OTP verify ─────────────────────────────────────
  const handleVerifyOtp = async () => {
    const code = otpDigits.join('');
    if (code.length !== 6) return;
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await fetch('/api/checkout/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setOtpError(data.error ?? 'Invalid OTP.');
        return;
      }
      setPhoneVerified(true);
      setShowOtpSection(false);
    } catch {
      setOtpError('Verification failed. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // ── Payment verification ──────────────────────────────────
  const handleVerify = async (response: RazorpaySuccessResponse) => {
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
        setError(verifyData.error ?? 'Payment verification failed. Contact support. Order: ' + orderNumber);
        setIsLoading(false);
        return;
      }
      clearCart();
      router.push(`/checkout/success?order=${verifyData.orderNumber}`);
    } catch {
      setError('Network error during verification. Contact support. Order: ' + orderNumber);
      setIsLoading(false);
    }
  };

  // ── Pay Now ───────────────────────────────────────────────
  const handlePayNow = async () => {
    if (!selectedAddressId) { setError('Please select a shipping address.'); return; }
    if (!rzpLoaded || typeof window.Razorpay === 'undefined') {
      setError('Payment provider not ready. Please refresh.'); return;
    }
    setIsLoading(true);
    setError(null);
    try {
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
        setError(createData.error ?? 'Failed to create order.'); setIsLoading(false); return;
      }
      const { razorpayOrderId, amount, currency, keyId, orderId, orderNumber } = createData;
      currentOrderIdRef.current = orderId;
      currentOrderNumberRef.current = orderNumber;

      const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

      // Build Razorpay config — preferred payment method flows
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzpConfig: Record<string, any> = {
        display: {
          blocks: {},
          sequence: [] as string[],
          preferences: { show_default_blocks: true },
        },
      };

      if (selectedPaymentMethod === 'upi') {
        rzpConfig.display.blocks.upi = {
          name: 'Pay via UPI',
          instruments: [{ method: 'upi', flows: ['intent', 'qr', 'collect'] }],
        };
        rzpConfig.display.sequence = ['block.upi'];
      }

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
          contact: normalizedPhone || selectedAddress?.phone || '',
        },
        theme: { color: '#581312' },
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
          emi: true,
        },
        config: rzpConfig,
        handler: handleVerify,
        modal: {
          ondismiss: () => { setIsLoading(false); setError('Payment cancelled. You can try again.'); },
          confirm_close: true,
        },
      });

      rzp.on('payment.failed', (response: RazorpayFailedResponse) => {
        setIsLoading(false);
        setError(response.error?.description ?? 'Payment failed. Please try a different method.');
      });

      rzp.open();
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  if (items.length === 0) return null;

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
  const totalItemCount = items.reduce((s, i) => s + i.quantity, 0);

  const togglePaymentMethod = (method: PaymentMethod) => {
    setPaymentMethodOpen(paymentMethodOpen === method ? null : method);
    setSelectedPaymentMethod(method);
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      {/* ── Exit Confirmation Modal ─────────────────────── */}
      {showExitModal && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Exit checkout">
          <div className={styles.exitModal}>
            <button className={styles.exitModalClose} onClick={() => setShowExitModal(false)} aria-label="Close">
              <X size={20} />
            </button>
            <div className={styles.exitModalIcon}>🛒</div>
            <h2 className={styles.exitModalTitle}>Are You Sure You Want To Exit?</h2>
            <p className={styles.exitModalSub}>Your cart items will be saved but your checkout progress will be lost.</p>
            <div className={styles.exitModalActions}>
              <button className={styles.exitModalContinue} onClick={() => setShowExitModal(false)}>
                No, Continue Checkout
              </button>
              <button className={styles.exitModalLeave} onClick={() => router.push('/shop')}>
                Yes, Exit Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Coupon Success Modal ───────────────────────── */}
      {showCouponModal && couponModalData && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Coupon applied">
          <div className={styles.couponModal}>
            <button className={styles.couponModalClose} onClick={() => setShowCouponModal(false)} aria-label="Close">
              <X size={20} />
            </button>
            <div className={styles.confetti} aria-hidden="true">
              {['🎉','✨','🎊','⭐','💫','🎈'].map((e, i) => (
                <span key={i} className={styles.confettiPiece} style={{ '--i': i } as React.CSSProperties}>{e}</span>
              ))}
            </div>
            <div className={styles.couponModalIcon}>🎉</div>
            <h2 className={styles.couponModalTitle}>Hurray!</h2>
            <p className={styles.couponModalCode}>
              <strong>{couponModalData.code}</strong> applied successfully.
            </p>
            <p className={styles.couponModalSaving}>
              You saved <strong>₹{couponModalData.amount.toFixed(0)}</strong> with this coupon.
            </p>
            <button className={styles.couponModalBtn} onClick={() => setShowCouponModal(false)}>
              Yay, Thanks!
            </button>
          </div>
        </div>
      )}

      <div className={styles.container}>
        {/* ── Header with back ────────────────────────── */}
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => setShowExitModal(true)} aria-label="Go back">
            ← Back
          </button>
          <h1 className={styles.title}>Checkout</h1>
          <div className={styles.headerRight} />
        </div>

        <div className={styles.grid}>
          {/* ══ LEFT COLUMN ══════════════════════════════ */}
          <div className={styles.left}>

            {/* ── 1. ORDER SUMMARY ─────────────────────── */}
            <div className={styles.card}>
              <button
                className={styles.cardHeader}
                onClick={() => setOrderSummaryOpen((v) => !v)}
                aria-expanded={orderSummaryOpen}
              >
                <span className={styles.cardTitle}>
                  <ShoppingBag size={18} />
                  Order Summary ({totalItemCount} {totalItemCount === 1 ? 'item' : 'items'})
                </span>
                <span className={styles.summaryHeaderRight}>
                  {mrpSavings > 0 && (
                    <span className={styles.offersBadge}>
                      🎉 You save ₹{mrpSavings.toFixed(0)}
                    </span>
                  )}
                  {orderSummaryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </button>

              {orderSummaryOpen && (
                <div className={styles.itemsList}>
                  {items.map((item) => {
                    const price = item.isSubscription && item.product.subscriptionPrice
                      ? item.product.subscriptionPrice
                      : item.variant.price;
                    const compareAt = item.variant.compareAtPrice ?? item.product.compareAtPrice;
                    return (
                      <div key={item.id} className={styles.orderItem}>
                        <div className={styles.orderItemImage}>
                          {item.product.images?.[0] && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.product.images[0]} alt={item.product.name} />
                          )}
                          <span className={styles.orderItemQtyBadge}>{item.quantity}</span>
                        </div>
                        <div className={styles.orderItemInfo}>
                          <p className={styles.orderItemName}>{item.product.name}</p>
                          <p className={styles.orderItemVariant}>{item.variant.size ?? item.variant.sku}</p>
                          {item.isSubscription && (
                            <span className={styles.subBadge}>Subscribe &amp; Save</span>
                          )}
                        </div>
                        <div className={styles.orderItemPriceCol}>
                          <span className={styles.orderItemPrice}>₹{(price * item.quantity).toFixed(0)}</span>
                          {compareAt && compareAt > price && (
                            <span className={styles.orderItemCompare}>₹{(compareAt * item.quantity).toFixed(0)}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Savings Banner */}
              {totalSaved > 0 && (
                <div className={styles.savingsBanner}>
                  <span>🥰 Yay! You&apos;ve saved <strong>₹{totalSaved.toFixed(0)}</strong> so far</span>
                </div>
              )}
            </div>

            {/* ── 2. COUPON SECTION ────────────────────── */}
            <div className={styles.card}>
              <div className={styles.cardHeaderStatic}>
                <span className={styles.cardTitle}>
                  <Tag size={18} />
                  Coupon Code
                </span>
              </div>

              {appliedCoupon ? (
                <div className={styles.appliedCouponRow}>
                  <div className={styles.appliedCouponInfo}>
                    <CheckCircle2 size={16} className={styles.couponCheckIcon} />
                    <div>
                      <p className={styles.appliedCouponCode}>{appliedCoupon}</p>
                      <p className={styles.appliedCouponSaving}>
                        {couponType === 'FREE_SHIPPING'
                          ? 'Free shipping applied'
                          : `₹${couponDiscount.toFixed(0)} saved`}
                      </p>
                    </div>
                  </div>
                  <button className={styles.removeCouponBtn} onClick={handleRemoveCoupon}>
                    <X size={14} /> Remove
                  </button>
                </div>
              ) : (
                <div className={styles.couponRow}>
                  <div className={styles.couponInputWrapper}>
                    <Tag size={16} className={styles.couponIcon} />
                    <input
                      type="text"
                      id="coupon-input"
                      value={couponInput}
                      onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleApplyCoupon(); }}
                      placeholder="Enter coupon code"
                      className={styles.couponInput}
                      aria-label="Enter coupon code"
                    />
                  </div>
                  <button
                    className={styles.couponApplyBtn}
                    onClick={handleApplyCoupon}
                    disabled={!couponInput.trim() || couponLoading}
                    aria-label="Apply coupon"
                  >
                    {couponLoading ? <Loader2 size={14} className={styles.spinning} /> : 'Apply'}
                  </button>
                </div>
              )}
              {couponError && (
                <p className={styles.couponError}>
                  <AlertCircle size={14} /> {couponError}
                </p>
              )}
            </div>

            {/* ── 3. PHONE VERIFICATION ────────────────── */}
            <div className={styles.card}>
              <div className={styles.cardHeaderStatic}>
                <span className={styles.cardTitle}>
                  <Phone size={18} />
                  Mobile Number
                </span>
                {phoneVerified && (
                  <span className={styles.verifiedBadge}>
                    <CheckCircle2 size={13} /> Verified
                  </span>
                )}
              </div>

              <div className={styles.phoneSection}>
                <div className={styles.phoneInputRow}>
                  <div className={styles.countryCodeBox}>
                    <span className={styles.countryFlag}>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    id="phone-input"
                    value={phone}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhone(v);
                      if (phoneVerified) setPhoneVerified(false);
                      setShowOtpSection(false);
                      setOtpSent(false);
                      setOtpError('');
                    }}
                    placeholder="10-digit mobile number"
                    className={styles.phoneInput}
                    maxLength={10}
                    aria-label="Mobile number"
                  />
                  {!phoneVerified && (
                    <button
                      className={styles.verifyBtn}
                      onClick={handleSendOtp}
                      disabled={phone.length !== 10 || phoneLoading || otpCountdown > 0}
                      aria-label={otpSent ? 'Resend OTP' : 'Send OTP'}
                    >
                      {phoneLoading
                        ? <Loader2 size={14} className={styles.spinning} />
                        : otpSent && otpCountdown > 0
                          ? `Resend in ${otpCountdown}s`
                          : otpSent
                            ? 'Resend OTP'
                            : 'Send OTP'}
                    </button>
                  )}
                </div>

                {/* OTP input */}
                {showOtpSection && !phoneVerified && (
                  <div className={styles.otpSection}>
                    <p className={styles.otpSentMsg}>
                      OTP sent to <strong>+91 {phone.slice(0, 5)} {phone.slice(5)}</strong>
                      <span className={styles.otpChannelNote}> (check your email)</span>
                    </p>
                    <div className={styles.otpInputRow} onPaste={handleOtpPaste}>
                      {otpDigits.map((d, i) => (
                        <input
                          key={i}
                          ref={(el) => { otpRefs.current[i] = el; }}
                          type="text"
                          inputMode="numeric"
                          pattern="\d"
                          maxLength={1}
                          value={d}
                          onChange={(e) => handleOtpDigit(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          className={`${styles.otpDigit} ${otpError ? styles.otpDigitError : ''}`}
                          aria-label={`OTP digit ${i + 1}`}
                        />
                      ))}
                    </div>
                    {otpError && (
                      <p className={styles.otpError}><AlertCircle size={13} /> {otpError}</p>
                    )}
                    <div className={styles.otpFooterRow}>
                      {otpCountdown > 0 ? (
                        <span className={styles.otpCountdown}>
                          <RefreshCw size={13} /> Resend OTP in <strong>{otpCountdown}s</strong>
                        </span>
                      ) : (
                        <button className={styles.resendBtn} onClick={handleSendOtp} disabled={phoneLoading}>
                          <RefreshCw size={13} /> Resend OTP
                        </button>
                      )}
                    </div>
                    <button
                      className={styles.verifyOtpBtn}
                      onClick={handleVerifyOtp}
                      disabled={otpDigits.join('').length !== 6 || otpLoading}
                      aria-label="Verify OTP"
                    >
                      {otpLoading
                        ? <><Loader2 size={16} className={styles.spinning} /> Verifying...</>
                        : 'Verify & Continue'}
                    </button>
                  </div>
                )}

                {phoneVerified && (
                  <div className={styles.phoneVerifiedRow}>
                    <CheckCircle2 size={16} className={styles.verifiedIcon} />
                    <span>+91 {phone} verified</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── 4. DELIVERY ADDRESS ───────────────────── */}
            <div className={styles.card}>
              <div className={styles.cardHeaderStatic}>
                <span className={styles.cardTitle}>
                  <MapPin size={18} />
                  Delivery Details
                </span>
                <button
                  className={styles.changeLinkBtn}
                  onClick={() => setShowAddressSelector((v) => !v)}
                  aria-label="Change delivery address"
                >
                  {showAddressSelector ? 'Done' : 'Change'}
                </button>
              </div>

              {showAddressSelector ? (
                <div className={styles.addressSelector}>
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`${styles.addressOption} ${selectedAddressId === addr.id ? styles.addressOptionSelected : ''}`}
                    >
                      <input
                        type="radio"
                        name="shippingAddress"
                        value={addr.id}
                        checked={selectedAddressId === addr.id}
                        onChange={() => { setSelectedAddressId(addr.id); setShowAddressSelector(false); }}
                        className={styles.addressRadio}
                      />
                      <div className={styles.addressOptionBody}>
                        <p className={styles.addressOptionName}>
                          {addr.firstName} {addr.lastName}
                          {addr.label && <span className={styles.labelBadge}>{addr.label}</span>}
                          {addr.isDefault && <span className={styles.defaultBadge}>Default</span>}
                        </p>
                        <p className={styles.addressOptionLine}>
                          {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} – {addr.postalCode}
                        </p>
                        <p className={styles.addressOptionPhone}><Phone size={11} /> {addr.phone}</p>
                      </div>
                    </label>
                  ))}
                  <a href="/account/addresses" className={styles.addAddressLink}>
                    <Plus size={14} /> Add New Address
                  </a>
                </div>
              ) : selectedAddress ? (
                <div className={styles.selectedAddressCard}>
                  <div className={styles.selectedAddressHeader}>
                    <span className={styles.selectedAddrName}>
                      {selectedAddress.firstName} {selectedAddress.lastName}
                    </span>
                    {selectedAddress.label && (
                      <span className={styles.labelBadge}>{selectedAddress.label}</span>
                    )}
                    {selectedAddress.type && (
                      <span className={styles.typeBadge}>{selectedAddress.type}</span>
                    )}
                  </div>
                  <p className={styles.selectedAddrLine}>
                    {selectedAddress.line1}
                    {selectedAddress.line2 && `, ${selectedAddress.line2}`}
                  </p>
                  <p className={styles.selectedAddrLine}>
                    {selectedAddress.city}, {selectedAddress.state}, {selectedAddress.country} – {selectedAddress.postalCode}
                  </p>
                  <div className={styles.selectedAddrContact}>
                    <span><Phone size={12} /> {selectedAddress.phone}</span>
                    <span><Mail size={12} /> {user.email}</span>
                  </div>
                </div>
              ) : (
                <div className={styles.noAddress}>
                  <p>No address found.</p>
                  <a href="/account/addresses" className={styles.addAddressLink}>+ Add Address</a>
                </div>
              )}
            </div>

            {/* ── 5. SHIPPING INFO ─────────────────────── */}
            {selectedAddress && (
              <div className={styles.card}>
                <div className={styles.shippingInfo}>
                  <Truck size={20} className={styles.shippingIcon} />
                  <div className={styles.shippingDetails}>
                    {shippingLoading ? (
                      <div className={styles.shippingLoading}>
                        <div className={styles.shimmBar} />
                        <div className={styles.shimmBarShort} />
                      </div>
                    ) : (
                      <>
                        <p className={styles.shippingMethod}>
                          Standard Delivery
                          {deliveryDate && ` · ${deliveryDate}`}
                        </p>
                        <p className={styles.shippingCharge}>
                          Shipping Charges:{' '}
                          {shippingIsFree
                            ? <span className={styles.freeTag}>FREE</span>
                            : `₹${shippingAmount}`}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── 6. LOYALTY POINTS ────────────────────── */}
            {user.loyaltyPoints > 0 && (
              <div className={styles.card}>
                <div className={styles.cardHeaderStatic}>
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
                    onChange={(e) => setLoyaltyToUse(Math.min(Math.max(0, Number(e.target.value)), user.loyaltyPoints))}
                    className={styles.loyaltyInput}
                    placeholder="0"
                  />
                  <span className={styles.loyaltyValue}>= ₹{(loyaltyToUse * 0.5).toFixed(2)} off</span>
                </div>
                <p className={styles.loyaltyNote}>1 point = ₹0.50 discount</p>
              </div>
            )}

            {/* ── 7. ORDER NOTES ──────────────────────── */}
            <div className={styles.card}>
              <div className={styles.cardHeaderStatic}>
                <span className={styles.cardTitle}>Order Notes (optional)</span>
              </div>
              <textarea
                id="order-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special delivery instructions..."
                className={styles.notesInput}
                maxLength={500}
                rows={2}
              />
            </div>

            {/* ── 8. OFFERS / CASHBACK ─────────────────── */}
            <div className={styles.card}>
              <div className={styles.cardHeaderStatic}>
                <span className={styles.cardTitle}>
                  <Gift size={18} />
                  Offers &amp; Benefits
                </span>
                <button className={styles.viewOffersLink}>View All <ChevronRight size={14} /></button>
              </div>
              <div className={styles.offersScroll}>
                {/* UPI cashback offer */}
                <div className={styles.offerCard}>
                  <div className={styles.offerCardIcon} style={{ background: '#4285F4' }}>
                    <Zap size={16} color="#fff" />
                  </div>
                  <div className={styles.offerCardBody}>
                    <p className={styles.offerCardTitle}>Pay via UPI</p>
                    <p className={styles.offerCardDesc}>Get ₹0 extra fee on UPI payments</p>
                  </div>
                </div>
                {/* Free shipping reminder */}
                {!shippingIsFree && sub > 0 && (
                  <div className={styles.offerCard}>
                    <div className={styles.offerCardIcon} style={{ background: '#16a34a' }}>
                      <Truck size={16} color="#fff" />
                    </div>
                    <div className={styles.offerCardBody}>
                      <p className={styles.offerCardTitle}>Free Shipping</p>
                      <p className={styles.offerCardDesc}>
                        Add ₹{Math.max(0, 2499 - sub).toFixed(0)} more for free delivery
                      </p>
                    </div>
                  </div>
                )}
                {shippingIsFree && (
                  <div className={styles.offerCard}>
                    <div className={styles.offerCardIcon} style={{ background: '#16a34a' }}>
                      <CheckCircle2 size={16} color="#fff" />
                    </div>
                    <div className={styles.offerCardBody}>
                      <p className={styles.offerCardTitle}>Free Shipping Unlocked! 🎉</p>
                      <p className={styles.offerCardDesc}>You qualify for free delivery</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ══ RIGHT COLUMN — PAY VIA ═════════════════════ */}
          <div className={styles.right}>

            {/* ── ORDER TOTAL SUMMARY ───────────────────── */}
            <div className={styles.summaryCard}>
              <div className={styles.summaryLines}>
                <div className={styles.summaryLine}>
                  <span>Subtotal ({totalItemCount} items)</span>
                  <span>₹{sub.toFixed(0)}</span>
                </div>
                <div className={styles.summaryLine}>
                  <span>Shipping</span>
                  <span>
                    {shippingLoading
                      ? '...'
                      : shippingIsFree
                        ? <span className={styles.freeShipping}>FREE</span>
                        : `₹${shippingAmount}`}
                  </span>
                </div>
                {couponDiscount > 0 && (
                  <div className={`${styles.summaryLine} ${styles.discount}`}>
                    <span>Coupon ({appliedCoupon})</span>
                    <span>-₹{couponDiscount.toFixed(0)}</span>
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
                  <span>Total Payable</span>
                  <span>₹{displayTotal.toFixed(0)}</span>
                </div>
                {totalSaved > 0 && (
                  <div className={styles.savedLine}>
                    <span>🎉 Total savings</span>
                    <span className={styles.savedAmount}>₹{totalSaved.toFixed(0)}</span>
                  </div>
                )}
              </div>
              <p className={styles.taxNote}>GST included in product prices</p>
            </div>

            {/* ── PAY VIA ───────────────────────────────── */}
            <div className={styles.payViaCard}>
              <div className={styles.payViaHeader}>
                <span className={styles.payViaTitle}>Pay via</span>
                <span className={styles.payViaSubtitle}>
                  <Zap size={13} /> Enjoy fast delivery on all prepaid orders.
                </span>
              </div>

              {/* UPI */}
              <div className={styles.payMethodRow}>
                <button
                  className={`${styles.payMethodBtn} ${paymentMethodOpen === 'upi' ? styles.payMethodBtnActive : ''}`}
                  onClick={() => togglePaymentMethod('upi')}
                  aria-expanded={paymentMethodOpen === 'upi'}
                  aria-controls="pay-method-upi"
                  id="pay-method-upi-btn"
                >
                  <span className={styles.payMethodLeft}>
                    <span className={styles.payMethodIconBox}><Smartphone size={18} /></span>
                    <span className={styles.payMethodName}>UPI Payment</span>
                  </span>
                  <span className={styles.payMethodRight}>
                    <span className={styles.payMethodAmount}>₹{displayTotal.toFixed(0)}</span>
                    {paymentMethodOpen === 'upi' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </button>
                {paymentMethodOpen === 'upi' && (
                  <div className={styles.payMethodContent} id="pay-method-upi" role="region" aria-labelledby="pay-method-upi-btn">
                    <p className={styles.upiScanMsg}>Scan QR code &amp; pay via any UPI app</p>
                    <div className={styles.upiAppGrid}>
                      <div className={styles.upiApp}><GPayIcon /><span>Google Pay</span></div>
                      <div className={styles.upiApp}><PhonePeIcon /><span>PhonePe</span></div>
                      <div className={styles.upiApp}><PaytmIcon /><span>Paytm</span></div>
                      <div className={styles.upiApp}><UpiIcon /><span>Other UPI</span></div>
                    </div>
                    <p className={styles.upiNote}>
                      Powered by Razorpay. Select your preferred UPI app after clicking &quot;Pay Now&quot;.
                    </p>
                  </div>
                )}
              </div>

              {/* Credit/Debit Card */}
              <div className={styles.payMethodDivider} />
              <div className={styles.payMethodRow}>
                <button
                  className={`${styles.payMethodBtn} ${paymentMethodOpen === 'card' ? styles.payMethodBtnActive : ''}`}
                  onClick={() => togglePaymentMethod('card')}
                  aria-expanded={paymentMethodOpen === 'card'}
                  aria-controls="pay-method-card"
                  id="pay-method-card-btn"
                >
                  <span className={styles.payMethodLeft}>
                    <span className={styles.payMethodIconBox}><CreditCard size={18} /></span>
                    <span className={styles.payMethodName}>Credit / Debit Card</span>
                  </span>
                  <span className={styles.payMethodRight}>
                    <span className={styles.payMethodAmount}>₹{displayTotal.toFixed(0)}</span>
                    {paymentMethodOpen === 'card' ? <ChevronUp size={16} /> : <ChevronRight size={16} />}
                  </span>
                </button>
                {paymentMethodOpen === 'card' && (
                  <div className={styles.payMethodContent} id="pay-method-card" role="region" aria-labelledby="pay-method-card-btn">
                    <div className={styles.cardIconRow}>
                      <VisaIcon />
                      <McIcon />
                      <span className={styles.cardIconLabel}>RuPay</span>
                      <span className={styles.cardIconLabel}>Amex</span>
                    </div>
                    <p className={styles.upiNote}>Enter your card details securely via Razorpay checkout.</p>
                  </div>
                )}
              </div>

              {/* Net Banking */}
              <div className={styles.payMethodDivider} />
              <div className={styles.payMethodRow}>
                <button
                  className={`${styles.payMethodBtn} ${paymentMethodOpen === 'netbanking' ? styles.payMethodBtnActive : ''}`}
                  onClick={() => togglePaymentMethod('netbanking')}
                  aria-expanded={paymentMethodOpen === 'netbanking'}
                  aria-controls="pay-method-nb"
                  id="pay-method-nb-btn"
                >
                  <span className={styles.payMethodLeft}>
                    <span className={styles.payMethodIconBox}><Landmark size={18} /></span>
                    <span className={styles.payMethodName}>Net Banking</span>
                  </span>
                  <span className={styles.payMethodRight}>
                    <span className={styles.payMethodAmount}>₹{displayTotal.toFixed(0)}</span>
                    {paymentMethodOpen === 'netbanking' ? <ChevronUp size={16} /> : <ChevronRight size={16} />}
                  </span>
                </button>
                {paymentMethodOpen === 'netbanking' && (
                  <div className={styles.payMethodContent} id="pay-method-nb" role="region" aria-labelledby="pay-method-nb-btn">
                    <p className={styles.upiNote}>All major banks supported via Razorpay. Select your bank after clicking &quot;Pay Now&quot;.</p>
                  </div>
                )}
              </div>

              {/* Wallets */}
              <div className={styles.payMethodDivider} />
              <div className={styles.payMethodRow}>
                <button
                  className={`${styles.payMethodBtn} ${paymentMethodOpen === 'wallet' ? styles.payMethodBtnActive : ''}`}
                  onClick={() => togglePaymentMethod('wallet')}
                  aria-expanded={paymentMethodOpen === 'wallet'}
                  aria-controls="pay-method-wallet"
                  id="pay-method-wallet-btn"
                >
                  <span className={styles.payMethodLeft}>
                    <span className={styles.payMethodIconBox}><Wallet size={18} /></span>
                    <span className={styles.payMethodName}>Wallets</span>
                  </span>
                  <span className={styles.payMethodRight}>
                    <span className={styles.payMethodAmount}>₹{displayTotal.toFixed(0)}</span>
                    {paymentMethodOpen === 'wallet' ? <ChevronUp size={16} /> : <ChevronRight size={16} />}
                  </span>
                </button>
                {paymentMethodOpen === 'wallet' && (
                  <div className={styles.payMethodContent} id="pay-method-wallet" role="region" aria-labelledby="pay-method-wallet-btn">
                    <p className={styles.upiNote}>Paytm Wallet, Amazon Pay, Mobikwik and more via Razorpay.</p>
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className={styles.errorBox} role="alert">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                  <button className={styles.errorClose} onClick={() => setError(null)} aria-label="Dismiss error">
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Pay Button */}
              <button
                id="pay-now-btn"
                className={styles.payBtn}
                onClick={handlePayNow}
                disabled={isLoading || !rzpLoaded || items.length === 0 || !selectedAddressId}
              >
                {isLoading ? (
                  <><Loader2 size={18} className={styles.spinning} /> Processing...</>
                ) : (
                  <><Shield size={18} /> Pay ₹{displayTotal.toFixed(0)} Securely</>
                )}
              </button>

              <div className={styles.securityNote}>
                <Shield size={12} />
                <span>Secured by Razorpay · 256-bit SSL encryption</span>
              </div>

              {/* Edit address quick link */}
              <div className={styles.quickLinks}>
                <a href="/account/addresses" className={styles.quickLink}>
                  <Edit2 size={12} /> Manage Addresses
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
