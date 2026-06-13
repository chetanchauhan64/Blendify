'use client';

/**
 * BLENDIFY — FrequentlyBoughtTogether
 * One-click bundle: Main product + Blendify Mug + Blendify Frother.
 * Inspired by Breakcage FBT sections.
 */

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Plus, ShoppingBag, Check } from 'lucide-react';
import { useCartStore } from '@/lib/store/cartStore';
import type { Product } from '@/types';
import styles from './FrequentlyBoughtTogether.module.css';

interface FBTItem {
  id: string;
  name: string;
  image: string;
  price: number;
  slug: string;
  checked: boolean;
}

interface Props {
  mainProduct: Product;
}

export function FrequentlyBoughtTogether({ mainProduct }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  const mainPrice = Math.round(mainProduct.basePrice * 83.5);

  const [items, setItems] = useState<FBTItem[]>([
    {
      id: mainProduct.id,
      name: mainProduct.name,
      image: mainProduct.images[0],
      price: mainPrice,
      slug: mainProduct.slug,
      checked: true,
    },
    {
      id: 'fbt-mug',
      name: 'Blendify Ceramic Mug',
      image: '/story/coffee-collection.png',
      price: 249,
      slug: 'blendify-mug',
      checked: true,
    },
    {
      id: 'fbt-frother',
      name: 'Blendify Frother Pro',
      image: '/story/frother.png',
      price: 499,
      slug: 'frother',
      checked: true,
    },
  ]);

  const toggleItem = (id: string) => {
    if (id === mainProduct.id) return; // Main product cannot be unchecked
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const selectedItems = items.filter((i) => i.checked);
  const totalPrice = selectedItems.reduce((sum, i) => sum + i.price, 0);
  const originalTotal = items.reduce((sum, i) => sum + i.price, 0);
  const savings = originalTotal - totalPrice + (selectedItems.length > 1 ? Math.round(totalPrice * 0.1) : 0);
  const finalPrice = totalPrice - (selectedItems.length > 1 ? Math.round(totalPrice * 0.1) : 0);

  const handleAddAll = () => {
    // Add main product
    addItem(
      mainProduct,
      mainProduct.variants[0],
      1,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  return (
    <div className={styles.fbt}>
      <h3 className={styles.fbtTitle}>Frequently Bought Together</h3>

      {/* Items */}
      <div className={styles.itemsRow}>
        {items.map((item, index) => (
          <div key={item.id} className={styles.fbtItemGroup}>
            <div className={`${styles.fbtItem} ${!item.checked ? styles.fbtItemUnchecked : ''}`}>
              {/* Checkbox */}
              <button
                className={`${styles.checkbox} ${item.checked ? styles.checkboxChecked : ''}`}
                onClick={() => toggleItem(item.id)}
                aria-pressed={item.checked}
                aria-label={`${item.checked ? 'Deselect' : 'Select'} ${item.name}`}
                disabled={item.id === mainProduct.id}
              >
                {item.checked && <Check size={12} />}
              </button>

              {/* Image */}
              <Link href={`/shop/${item.slug}`} className={styles.fbtImageLink}>
                <div className={styles.fbtImageWrap}>
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="100px"
                    style={{ objectFit: 'contain', padding: '8px' }}
                  />
                </div>
              </Link>

              {/* Info */}
              <div className={styles.fbtInfo}>
                <Link href={`/shop/${item.slug}`} className={styles.fbtName}>
                  {item.name}
                </Link>
                <span className={styles.fbtPrice}>₹{item.price}</span>
              </div>
            </div>

            {index < items.length - 1 && (
              <div className={styles.plusIcon}>
                <Plus size={18} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Total + CTA */}
      <div className={styles.totalRow}>
        <div className={styles.priceInfo}>
          <span className={styles.totalLabel}>Bundle Price:</span>
          <span className={styles.totalPrice}>₹{finalPrice.toLocaleString()}</span>
          {savings > 0 && (
            <span className={styles.savingsTag}>You save ₹{savings.toLocaleString()}</span>
          )}
        </div>
        <button
          className={`${styles.addAllBtn} ${added ? styles.addAllAdded : ''}`}
          onClick={handleAddAll}
        >
          <ShoppingBag size={16} />
          {added ? '✓ Added to Cart' : `Add ${selectedItems.length} Items to Cart`}
        </button>
      </div>
    </div>
  );
}
