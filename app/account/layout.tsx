import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { AccountSidebar } from '@/components/account/AccountSidebar';
import styles from './layout.module.css';

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  // Server-side protection (middleware is the first gate, this is the second)
  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div className={styles.layout}>
      <div className="container">
        <div className={styles.inner}>
          <AccountSidebar user={user} />
          <main className={styles.content}>{children}</main>
        </div>
      </div>
    </div>
  );
}
