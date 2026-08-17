// ============================================================
// BLENDIFY — Automation Export API
// GET /api/admin/automation/export
//
// Formats: csv, excel, pdf, print
// Reuses lib/utils/export.ts. Respects active filters.
// Max 5000 records. Creates AuditLog entry for exports.
// Never exports passwords, JWTs, secrets, or API keys.
// ============================================================
import { NextRequest } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { prisma } from '@/lib/db/prisma';
import { serverError, badRequest } from '@/lib/utils/api';
import {
  generateCSV, csvResponse,
  generateExcelXML, excelResponse,
  generatePDFHtml, pdfHtmlResponse,
  formatDateTime,
  type ExportColumn,
} from '@/lib/utils/export';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const QuerySchema = z.object({
  format: z.enum(['csv', 'excel', 'pdf', 'print']),
  type: z.enum(['rules', 'executions']).default('executions'),
  search: z.string().optional(),
  status: z.string().optional(),
  triggerType: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

type ExecutionExport = {
  id: string;
  ruleName: string;
  triggerType: string;
  status: string;
  startedAt: string;
  completedAt: string;
  durationMs: string;
  executedBy: string;
  error: string;
};

const EXECUTION_COLUMNS: ExportColumn<ExecutionExport>[] = [
  { header: 'Execution ID', key: 'id' },
  { header: 'Automation Rule', key: 'ruleName' },
  { header: 'Trigger', key: 'triggerType' },
  { header: 'Status', key: 'status' },
  { header: 'Started At', key: 'startedAt' },
  { header: 'Completed At', key: 'completedAt' },
  { header: 'Duration (ms)', key: 'durationMs' },
  { header: 'Executed By', key: 'executedBy' },
  { header: 'Error Summary', key: 'error' },
];

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdminAccess();

    const raw = Object.fromEntries(new URL(req.url).searchParams.entries());
    const parseResult = QuerySchema.safeParse(raw);
    if (!parseResult.success) {
      return badRequest('Invalid query parameters', parseResult.error.flatten().fieldErrors);
    }

    const { format, type, search, status, triggerType, dateFrom, dateTo } = parseResult.data;

    const where: Prisma.AutomationExecutionWhereInput = {};
    if (status && status !== 'ALL') {
      where.status = status as Prisma.EnumAutomationExecutionStatusFilter;
    }
    if (triggerType && triggerType !== 'ALL') {
      where.triggerType = triggerType as Prisma.EnumAutomationTriggerTypeFilter;
    }
    if (dateFrom) {
      where.createdAt = { ...(where.createdAt as Prisma.DateTimeFilter || {}), gte: new Date(dateFrom) };
    }
    if (dateTo) {
      const existing = (where.createdAt as Prisma.DateTimeFilter) || {};
      where.createdAt = { ...existing, lte: new Date(new Date(dateTo).getTime() + 86400000) };
    }
    if (search) {
      where.OR = [
        { rule: { name: { contains: search, mode: 'insensitive' } } },
        { error: { contains: search, mode: 'insensitive' } },
      ];
    }

    const executions = await prisma.automationExecution.findMany({
      where,
      include: {
        rule: { select: { name: true } },
        executedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    });

    const data: ExecutionExport[] = executions.map((e) => ({
      id: e.id,
      ruleName: e.rule.name,
      triggerType: e.triggerType,
      status: e.status,
      startedAt: formatDateTime(e.startedAt),
      completedAt: formatDateTime(e.completedAt),
      durationMs: e.durationMs ? `${e.durationMs}ms` : '—',
      executedBy: e.executedBy ? `${e.executedBy.firstName} ${e.executedBy.lastName}` : 'System / Auto',
      error: e.error || 'None',
    }));

    const now = new Date();
    const filename = `automation-executions-${now.toISOString().slice(0, 10)}`;

    // AuditLog
    try {
      await prisma.auditLog.create({
        data: {
          userId: admin.id,
          userEmail: admin.email,
          action: 'EXPORT',
          module: 'automation',
          entityId: 'executions',
          entityLabel: `Automation export (${format}) — ${data.length} records`,
          after: { format, type, status, triggerType, recordCount: data.length },
          ip: req.headers.get('x-forwarded-for') ?? '',
          userAgent: req.headers.get('user-agent') ?? '',
        },
      });
    } catch {
      // Non-critical
    }

    switch (format) {
      case 'csv':
        return csvResponse(generateCSV(data, EXECUTION_COLUMNS), filename);
      case 'excel':
        return excelResponse(generateExcelXML(data, EXECUTION_COLUMNS, 'Automation Executions'), filename);
      case 'pdf':
      case 'print':
        return pdfHtmlResponse(generatePDFHtml(data, EXECUTION_COLUMNS, 'Blendify — Automation Execution History'), filename);
    }
  } catch (error) {
    if (error instanceof Error && (error.message.includes('NEXT_REDIRECT') || error.message === 'NEXT_REDIRECT')) {
      throw error;
    }
    console.error('[Automation Export API]', error);
    return serverError('Failed to export automation data');
  }
}
