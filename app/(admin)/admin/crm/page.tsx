// ============================================================
// BLENDIFY — CRM & Customer Relationship Management Page
// /admin/crm
// ============================================================
import type { Metadata } from 'next';
import { CrmClient } from './CrmClient';

export const metadata: Metadata = {
  title: 'CRM & Customer Relationship Management | Blendify Admin',
  description: 'Customer 360 profiles, lifecycle segmentation, customer value analytics, order history, and retention intelligence.',
};

export const dynamic = 'force-dynamic';

export default function CrmPage() {
  return <CrmClient />;
}
