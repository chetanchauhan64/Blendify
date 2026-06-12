import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { Calendar, Mail, Shield, Star, Award } from 'lucide-react';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'My Account — BLENDIFY',
  description: 'Manage your BLENDIFY account, orders, and preferences.',
};

export default async function AccountPage() {
  const user = await requireAuth();

  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Member';

  const tierColors: Record<string, string> = {
    BRONZE: '#cd7f32',
    SILVER: '#aaa9ad',
    GOLD: '#d4af37',
    PLATINUM: '#9ebcd4',
  };

  return (
    <div className={styles.page}>
      {/* Page Header */}
      <div className={styles.header}>
        <span className="section-label">Account</span>
        <h1 className={styles.title}>Welcome back, {user.firstName}</h1>
        <p className={styles.subtitle}>Here&apos;s an overview of your account.</p>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(88,19,18,0.08)' }}>
            <Mail size={20} style={{ color: 'var(--brand-maroon)' }} />
          </div>
          <div>
            <p className={styles.statLabel}>Email</p>
            <p className={styles.statValue}>{user.email}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(212,136,10,0.08)' }}>
            <Award size={20} style={{ color: 'var(--brand-amber)' }} />
          </div>
          <div>
            <p className={styles.statLabel}>Loyalty Points</p>
            <p className={styles.statValue}>{(user.loyaltyPoints ?? 0).toLocaleString()} pts</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{ background: `${tierColors[user.loyaltyTier ?? 'BRONZE']}18` }}
          >
            <Star size={20} style={{ color: tierColors[user.loyaltyTier ?? 'BRONZE'] }} />
          </div>
          <div>
            <p className={styles.statLabel}>Member Tier</p>
            <p className={styles.statValue} style={{ color: tierColors[user.loyaltyTier ?? 'BRONZE'] }}>
              {user.loyaltyTier ?? 'BRONZE'}
            </p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(22,163,74,0.08)' }}>
            <Shield size={20} style={{ color: '#16a34a' }} />
          </div>
          <div>
            <p className={styles.statLabel}>Role</p>
            <p className={styles.statValue}>{user.role}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(88,19,18,0.06)' }}>
            <Calendar size={20} style={{ color: 'var(--brand-maroon)' }} />
          </div>
          <div>
            <p className={styles.statLabel}>Member Since</p>
            <p className={styles.statValue}>{joinDate}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.actionsGrid}>
          <a href="/account/profile" className={styles.actionCard}>
            <h3>Edit Profile</h3>
            <p>Update your name and contact info</p>
          </a>
          <a href="/account/addresses" className={styles.actionCard}>
            <h3>Manage Addresses</h3>
            <p>Add, edit, or set a default delivery address</p>
          </a>
          <a href="/account/orders" className={styles.actionCard}>
            <h3>Order History</h3>
            <p>Track and review your past orders</p>
          </a>
          <a href="/account/wishlist" className={styles.actionCard}>
            <h3>Wishlist</h3>
            <p>View your saved coffee products</p>
          </a>
        </div>
      </div>
    </div>
  );
}
