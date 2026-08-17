// ============================================================
// BLENDIFY — Finance Dashboard Page
// /admin/finance
// ============================================================
import type { Metadata } from 'next';
import { FinanceClient } from './FinanceClient';

export const metadata: Metadata = {
  title: 'Finance Dashboard | Blendify Admin',
  description: 'Financial reporting, transaction visibility, reconciliation, payment analytics, and revenue intelligence.',
};

export const dynamic = 'force-dynamic';

export default function FinancePage() {
  return <FinanceClient />;
}
