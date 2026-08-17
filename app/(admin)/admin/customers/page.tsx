// ============================================================
// BLENDIFY — Customers Module (Forwarded to CRM)
// /admin/customers -> /admin/crm?tab=customers
// ============================================================
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function CustomersPage() {
  redirect('/admin/crm?tab=customers');
}
