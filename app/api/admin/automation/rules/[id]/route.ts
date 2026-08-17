// ============================================================
// BLENDIFY — Single Automation Rule API
// GET    /api/admin/automation/rules/[id] — Rule details & history
// PUT    /api/admin/automation/rules/[id] — Update rule configuration
// DELETE /api/admin/automation/rules/[id] — Safely delete rule
// ============================================================
import { NextRequest } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { prisma } from '@/lib/db/prisma';
import { ok, notFound, badRequest, serverError, noContent } from '@/lib/utils/api';
import { z } from 'zod';

const UpdateRuleSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  triggerType: z.enum([
    'ORDER_CREATED',
    'ORDER_PAID',
    'ORDER_CANCELLED',
    'PAYMENT_FAILED',
    'RETURN_REQUESTED',
    'RETURN_RESOLVED',
    'CUSTOMER_CREATED',
    'REVIEW_SUBMITTED',
    'SCHEDULED',
  ]).optional(),
  triggerConfig: z.record(z.string(), z.unknown()).optional(),
  actionType: z.enum([
    'SEND_EMAIL',
    'CREATE_NOTIFICATION',
    'UPDATE_RECORD',
    'CREATE_AUDIT_LOG',
    'TRIGGER_WORKFLOW',
  ]).optional(),
  actionConfig: z.record(z.string(), z.unknown()).optional(),
  conditions: z.array(z.record(z.string(), z.unknown())).optional(),
  isActive: z.boolean().optional(),
  schedule: z.string().max(100).nullable().optional(),
});

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminAccess();
    const { id } = await context.params;

    const rule = await prisma.automationRule.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        executions: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            executedBy: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });

    if (!rule) {
      return notFound('Automation rule not found');
    }

    const finished = rule.successRuns + rule.failureRuns;
    const successRate = finished > 0 ? Math.round((rule.successRuns / finished) * 1000) / 10 : 100;

    return ok({
      ...rule,
      successRate,
      executions: rule.executions.map((e) => ({
        id: e.id,
        status: e.status,
        triggerType: e.triggerType,
        startedAt: e.startedAt,
        completedAt: e.completedAt,
        durationMs: e.durationMs,
        result: e.result,
        error: e.error,
        executedBy: e.executedBy ? `${e.executedBy.firstName} ${e.executedBy.lastName}` : 'System',
      })),
    });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('NEXT_REDIRECT') || error.message === 'NEXT_REDIRECT')) {
      throw error;
    }
    console.error('[Automation Rule GET]', error);
    return serverError('Failed to load automation rule');
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdminAccess();
    const { id } = await context.params;

    const body = await req.json();
    const parseResult = UpdateRuleSchema.safeParse(body);
    if (!parseResult.success) {
      return badRequest('Validation failed', parseResult.error.flatten().fieldErrors);
    }

    const existing = await prisma.automationRule.findUnique({ where: { id } });
    if (!existing) {
      return notFound('Automation rule not found');
    }

    const data = parseResult.data;
    const updatePayload: Record<string, unknown> = {};

    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.triggerType !== undefined) updatePayload.triggerType = data.triggerType;
    if (data.triggerConfig !== undefined) updatePayload.triggerConfig = JSON.parse(JSON.stringify(data.triggerConfig));
    if (data.actionType !== undefined) updatePayload.actionType = data.actionType;
    if (data.actionConfig !== undefined) updatePayload.actionConfig = JSON.parse(JSON.stringify(data.actionConfig));
    if (data.conditions !== undefined) updatePayload.conditions = JSON.parse(JSON.stringify(data.conditions));
    if (data.isActive !== undefined) updatePayload.isActive = data.isActive;
    if (data.schedule !== undefined) updatePayload.schedule = data.schedule;

    const updated = await prisma.automationRule.update({
      where: { id },
      data: updatePayload,
    });

    // AuditLog
    try {
      await prisma.auditLog.create({
        data: {
          userId: admin.id,
          userEmail: admin.email,
          action: 'UPDATE',
          module: 'automation',
          entityId: id,
          entityLabel: `Rule: ${updated.name}`,
          before: {
            name: existing.name,
            isActive: existing.isActive,
            triggerType: existing.triggerType,
            actionType: existing.actionType,
          },
          after: JSON.parse(JSON.stringify(updatePayload)),
          ip: req.headers.get('x-forwarded-for') ?? '',
          userAgent: req.headers.get('user-agent') ?? '',
        },
      });
    } catch {
      // Non-critical
    }

    return ok(updated);
  } catch (error) {
    if (error instanceof Error && (error.message.includes('NEXT_REDIRECT') || error.message === 'NEXT_REDIRECT')) {
      throw error;
    }
    console.error('[Automation Rule PUT]', error);
    return serverError('Failed to update automation rule');
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdminAccess();
    const { id } = await context.params;

    const existing = await prisma.automationRule.findUnique({ where: { id } });
    if (!existing) {
      return notFound('Automation rule not found');
    }

    await prisma.automationRule.delete({ where: { id } });

    // AuditLog
    try {
      await prisma.auditLog.create({
        data: {
          userId: admin.id,
          userEmail: admin.email,
          action: 'DELETE',
          module: 'automation',
          entityId: id,
          entityLabel: `Rule: ${existing.name}`,
          before: { name: existing.name, triggerType: existing.triggerType, actionType: existing.actionType },
          ip: req.headers.get('x-forwarded-for') ?? '',
          userAgent: req.headers.get('user-agent') ?? '',
        },
      });
    } catch {
      // Non-critical
    }

    return noContent();
  } catch (error) {
    if (error instanceof Error && (error.message.includes('NEXT_REDIRECT') || error.message === 'NEXT_REDIRECT')) {
      throw error;
    }
    console.error('[Automation Rule DELETE]', error);
    return serverError('Failed to delete automation rule');
  }
}
