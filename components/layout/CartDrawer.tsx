'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/lib/store/cartStore';
import { useCurrency } from '@/lib/hooks/useCurrency';
import { formatPrice } from '@/lib/currency';
import styles from './CartDrawer.module.css';

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, itemCount, subtotal } = useCartStore();
  const currency = useCurrency();

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const count = itemCount();
  const sub = subtotal();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            style={{ zIndex: 'var(--z-overlay)' }}
          />
          <motion.aside
            className={styles.drawer}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 32 }}
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
          >
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                <ShoppingBag size={20} />
                <h2 className={styles.title}>Your Cart</h2>
                {count > 0 && <span className={styles.count}>{count}</span>}
              </div>
              <button className={styles.closeBtn} onClick={closeCart} aria-label="Close cart">
                <X size={20} />
              </button>
            </div>

            {/* Items */}
            <div className={styles.items}>
              {items.length === 0 ? (
                <motion.div
                  className={styles.empty}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <ShoppingBag size={48} strokeWidth={1} />
                  <h3>Your cart is empty</h3>
                  <p>Discover our premium coffee collection</p>
                  <Link href="/shop" className="btn btn--primary" onClick={closeCart}>
                    Shop Now
                  </Link>
                </motion.div>
              ) : (
                <AnimatePresence initial={false}>
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      className={styles.item}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.3 }}
                      layout
                    >
                      {/* Image */}
                      <div className={styles.itemImage}>
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                      </div>

                      {/* Details */}
                      <div className={styles.itemDetails}>
                        <div className={styles.itemHeader}>
                          <div>
                            <h4 className={styles.itemName}>{item.product.name}</h4>
                            <p className={styles.itemVariant}>
                              {item.variant.size}
                              {item.isSubscription && (
                                <span className={styles.subBadge}>Subscribe</span>
                              )}
                            </p>
                          </div>
                          <button
                            className={styles.removeBtn}
                            onClick={() => removeItem(item.id)}
                            aria-label={`Remove ${item.product.name}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className={styles.itemFooter}>
                          {/* Quantity */}
                          <div className={styles.qty}>
                            <button
                              className={styles.qtyBtn}
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              aria-label="Decrease quantity"
                            >
                              <Minus size={12} />
                            </button>
                            <span className={styles.qtyValue}>{item.quantity}</span>
                            <button
                              className={styles.qtyBtn}
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              aria-label="Increase quantity"
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          <span className={styles.itemPrice}>
                            {formatPrice(
                              (item.isSubscription && item.product.subscriptionPrice
                                ? item.product.subscriptionPrice
                                : item.variant.price) * item.quantity,
                              currency
                            )}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className={styles.footer}>
                <div className={styles.subtotal}>
                  <span>Subtotal</span>
                  <span className={styles.subtotalAmount}>{formatPrice(sub, currency)}</span>
                </div>
                <p className={styles.shipping}>Shipping & taxes calculated at checkout</p>

                <Link
                  href="/checkout"
                  className={`btn btn--primary btn--lg ${styles.checkoutBtn}`}
                  onClick={closeCart}
                >
                  Checkout <ArrowRight size={16} />
                </Link>

                <Link href="/cart" className={`btn btn--outline ${styles.viewCartBtn}`} onClick={closeCart}>
                  View Full Cart
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
