import type { Metadata } from 'next';
import { PRODUCTS } from '@/lib/data/products';
import { COLLECTIONS } from '@/lib/data/collections';
import { ShopClient } from './ShopClient';

export const metadata: Metadata = {
  title: 'Shop All Coffee',
  description: 'Browse the full BLENDIFY collection. Premium specialty coffee from Ethiopia, Colombia, Panama, and beyond.',
};

export default function ShopPage() {
  return <ShopClient products={PRODUCTS} collections={COLLECTIONS} />;
}
