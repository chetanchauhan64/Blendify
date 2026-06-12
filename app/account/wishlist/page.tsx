import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { WishlistClient } from './WishlistClient';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Wishlist — BLENDIFY',
  description: 'Your saved BLENDIFY coffee products.',
};

export default async function WishlistPage() {
  const user = await requireAuth();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className="section-label">Account</span>
        <h1 className={styles.title}>Wishlist</h1>
        <p className={styles.subtitle}>Your saved coffees, {user.firstName}.</p>
      </div>

      <WishlistClient />
    </div>
  );
}
