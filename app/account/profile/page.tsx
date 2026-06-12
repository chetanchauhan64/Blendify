import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { ProfileForm } from '@/components/account/ProfileForm';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Edit Profile — BLENDIFY',
  description: 'Update your BLENDIFY account profile information.',
};

export default async function ProfilePage() {
  const user = await requireAuth();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className="section-label">Account</span>
        <h1 className={styles.title}>Edit Profile</h1>
        <p className={styles.subtitle}>Update your personal information.</p>
      </div>
      <ProfileForm user={user} />
    </div>
  );
}
