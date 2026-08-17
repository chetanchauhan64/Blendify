// ============================================================
// BLENDIFY — Customer Support Page
// /admin/support
// ============================================================
import type { Metadata } from 'next';
import { SupportClient } from './SupportClient';

export const metadata: Metadata = {
  title: 'Customer Support | Blendify Admin',
  description: 'Support ticket management, helpdesk, customer communication, and resolution tracking.',
};

export const dynamic = 'force-dynamic';

export default function SupportPage() {
  return <SupportClient />;
}
