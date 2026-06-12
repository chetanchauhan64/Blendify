'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { User, MapPin, ShoppingBag, Heart, LogOut, ChevronRight, Star } from 'lucide-react';
import type { UserDTO } from '@/types/auth';
import { signOut } from '@/lib/actions/auth';
import styles from './AccountSidebar.module.css';

interface Props {
  user: UserDTO;
}

const NAV_ITEMS = [
  { href: '/account', label: 'Dashboard', icon: User, exact: true },
  { href: '/account/profile', label: 'Profile', icon: User },
  { href: '/account/addresses', label: 'Addresses', icon: MapPin },
  { href: '/account/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/account/wishlist', label: 'Wishlist', icon: Heart },
];

export function AccountSidebar({ user }: Props) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside className={styles.sidebar}>
      {/* User card */}
      <div className={styles.userCard}>
        <div className={styles.avatar}>
          {user.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar} alt={user.fullName} className={styles.avatarImg} />
          ) : (
            <span className={styles.avatarInitials}>
              {user.firstName[0]}{user.lastName[0]}
            </span>
          )}
        </div>
        <div className={styles.userInfo}>
          <p className={styles.userName}>{user.fullName}</p>
          <p className={styles.userEmail}>{user.email}</p>
          <span className={styles.loyaltyBadge}>
            <Star size={10} />
            {user.loyaltyTier ?? 'BRONZE'}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className={styles.nav} aria-label="Account navigation">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={`${styles.navItem} ${isActive(href, exact) ? styles.navItemActive : ''}`}
          >
            <Icon size={16} />
            <span>{label}</span>
            <ChevronRight size={14} className={styles.chevron} />
          </Link>
        ))}
      </nav>

      {/* Sign out — uses server action via form */}
      <form action={signOut}>
        <button type="submit" className={styles.signOut}>
          <LogOut size={16} />
          Sign Out
        </button>
      </form>
    </aside>
  );
}
