// ============================================================
// BLENDIFY — /admin/unauthorized
// Shown when an authenticated user without ADMIN/SUPER_ADMIN role
// attempts to access the admin panel.
// Does NOT render inside AdminShell — detected via x-admin-public.
// ============================================================
import Link from 'next/link';
import type { Metadata } from 'next';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Unauthorized — BLENDIFY Admin',
  robots: { index: false, follow: false },
};

export default function AdminUnauthorizedPage() {
  return (
    <div className={styles.page}>
      <div className={styles.backdrop} />

      <div className={styles.card}>
        <div className={styles.iconWrap} aria-hidden="true">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path
              d="M16 3a13 13 0 1 0 0 26A13 13 0 0 0 16 3Z"
              stroke="#ef4444"
              strokeWidth="1.5"
            />
            <path
              d="M16 10v7M16 21h.01"
              stroke="#ef4444"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <span className={styles.code}>403</span>
        <h1 className={styles.title}>Access Denied</h1>
        <p className={styles.body}>
          Your account does not have administrator privileges.
          Only accounts with an <strong>ADMIN</strong> or <strong>SUPER_ADMIN</strong> role
          can access this panel.
        </p>
        <p className={styles.body}>
          If you believe this is an error, please contact the system administrator.
        </p>

        <div className={styles.actions}>
          <Link href="/account" id="unauthorized-go-account" className={styles.btnPrimary}>
            Go to My Account
          </Link>
          <Link href="/" id="unauthorized-go-home" className={styles.btnSecondary}>
            Back to Store
          </Link>
        </div>
      </div>
    </div>
  );
}
