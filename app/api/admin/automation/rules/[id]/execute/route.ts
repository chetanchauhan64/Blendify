// ============================================================
// BLENDIFY — Automation Rule Manual Execution API
// POST /api/admin/automation/rules/[id]/execute
//
// Triggers safe server-side execution of an enabled automation rule.
// ============================================================
import { NextRequest } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { automationService } from '@/lib/services/automation.service';
import { ok, badRequest, serverError } from '@/lib/utils/api';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdminAccess();
    const { id } = await context.params;

    let payloadContext: Record<string, unknown> = {};
    try {
      const body = await req.json();
      if (typeof body === 'object' && body !== null) {
        payloadContext = body;
      }
    } catch {
      // Body is optional for manual triggers
    }

    const executionResult = await automationService.executeRule(id, admin.id, payloadContext);

    return ok(executionResult);
  } catch (error) {
    if (error instanceof Error && (error.message.includes('NEXT_REDIRECT') || error.message === 'NEXT_REDIRECT')) {
      throw error;
    }
    const msg = error instanceof Error ? error.message : 'Execution failed';
    if (msg.includes('not found') || msg.includes('disabled')) {
      return badRequest(msg);
    }
    console.error('[Automation Rule Execute API]', error);
    return serverError(`Failed to execute automation rule: ${msg}`);
  }
}
