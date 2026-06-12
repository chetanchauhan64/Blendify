import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { AddressManager } from '@/components/account/AddressManager';
import type { AddressDTO } from '@/types/auth';
import styles from '../profile/page.module.css';

export const metadata: Metadata = {
  title: 'My Addresses — BLENDIFY',
  description: 'Manage your delivery addresses on BLENDIFY.',
};

export default async function AddressesPage() {
  const user = await requireAuth();

  let addresses: AddressDTO[] = [];
  try {
    const rawAddresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    addresses = rawAddresses as unknown as AddressDTO[];
  } catch {
    // DB unavailable — show empty state gracefully
    addresses = [];
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className="section-label">Account</span>
        <h1 className={styles.title}>My Addresses</h1>
        <p className={styles.subtitle}>Manage your saved delivery addresses.</p>
      </div>
      <AddressManager initialAddresses={addresses} />
    </div>
  );
}
