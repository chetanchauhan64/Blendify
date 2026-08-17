// ============================================================
// BLENDIFY — Automation & Workflow Management Page
// /admin/automation
// ============================================================
import type { Metadata } from 'next';
import { AutomationClient } from './AutomationClient';

export const metadata: Metadata = {
  title: 'Automation & Workflow Engine | Blendify Admin',
  description: 'Manage automated business workflows, triggers, actions, schedules, and execution logs.',
};

export const dynamic = 'force-dynamic';

export default function AutomationPage() {
  return <AutomationClient />;
}
