'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Check, MapPin } from 'lucide-react';
import styles from './OffersSection.module.css';
import type { Offer } from '@/lib/data/iced-tea-profiles';

interface Props {
  offers: Offer[];
}

export function OffersSection({ offers }: Props) {
  const [open, setOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pincode, setPincode] = useState('');
  const [deliveryMsg, setDeliveryMsg] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const handleCopy = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handlePincodeCheck = () => {
    if (!pincode || pincode.length < 6) return;
    setChecking(true);
    // Simulated delivery check — Blendify-authored message
    setTimeout(() => {
      setChecking(false);
      // Simulate "eligible" for any valid 6-digit pincode
      if (/^\d{6}$/.test(pincode)) {
        setDeliveryMsg(`✓ Delivery available to ${pincode}! Estimated delivery: 3–5 business days. Free shipping on orders above ₹499.`);
      } else {
        setDeliveryMsg('Please enter a valid 6-digit pincode.');
      }
    }, 800);
  };

  return (
    <div className={styles.wrapper}>
      {/* Header toggle */}
      <button
        type="button"
        className={styles.header}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="offers-panel"
      >
        <span className={styles.headerLeft}>
          <span className={styles.tagIcon} aria-hidden="true">🏷️</span>
          <span className={styles.count}>{offers.length} Offers Available</span>
        </span>
        <span className={styles.chevron} aria-hidden="true">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {/* Offers panel */}
      {open && (
        <div id="offers-panel" className={styles.panel}>
          {offers.map((offer) => {
            const isCopied = copiedId === offer.id;
            return (
              <div key={offer.id} className={styles.offerCard}>
                <div className={styles.offerLeft}>
                  <span className={styles.offerHeadline}>{offer.headline}</span>
                  <p className={styles.offerDesc}>{offer.description}</p>
                </div>
                <div className={styles.couponArea}>
                  <span className={styles.couponCode}>{offer.couponCode}</span>
                  <button
                    type="button"
                    className={`${styles.copyBtn} ${isCopied ? styles.copied : ''}`}
                    onClick={() => handleCopy(offer.id, offer.couponCode)}
                    aria-label={`Copy coupon code ${offer.couponCode}`}
                  >
                    {isCopied ? (
                      <>
                        <Check size={13} strokeWidth={2.5} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={13} strokeWidth={2} />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}

          {/* Pincode checker */}
          <div className={styles.pincodeSection}>
            <div className={styles.pincodeLabel}>
              <MapPin size={14} />
              Check delivery availability
            </div>
            <div className={styles.pincodeRow}>
              <input
                type="text"
                className={styles.pincodeInput}
                placeholder="Enter your pincode"
                value={pincode}
                onChange={(e) => {
                  setPincode(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setDeliveryMsg(null);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handlePincodeCheck()}
                maxLength={6}
                inputMode="numeric"
                aria-label="Enter pincode to check delivery"
              />
              <button
                type="button"
                className={styles.checkBtn}
                onClick={handlePincodeCheck}
                disabled={checking || pincode.length < 6}
              >
                {checking ? 'Checking…' : 'Check'}
              </button>
            </div>
            {deliveryMsg && (
              <p className={styles.deliveryMsg}>{deliveryMsg}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
