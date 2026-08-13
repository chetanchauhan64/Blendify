// ============================================================
// BLENDIFY — Analytics Dashboard Page
// /admin/analytics
// ============================================================
import type { Metadata } from 'next';
import { AnalyticsClient } from './AnalyticsClient';

export const metadata: Metadata = {
  title: 'Analytics & Business Intelligence | Blendify Admin',
  description: 'Comprehensive analytics dashboard for revenue, sales, products, customers, and business intelligence.',
};

export const dynamic = 'force-dynamic';

export default function AnalyticsPage() {
  return <AnalyticsClient />;
}
