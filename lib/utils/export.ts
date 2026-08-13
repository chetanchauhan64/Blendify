// ============================================================
// BLENDIFY — Export Utilities (CSV, Excel, PDF, Print)
// ============================================================
import 'server-only';

// ── Types ────────────────────────────────────────────────────
export type ExportColumn<T> = {
  header: string;
  key: keyof T | ((row: T) => string | number | boolean | null | undefined);
  width?: number;
};

export type ExportFormat = 'csv' | 'excel' | 'pdf' | 'print';

// ── CSV Export ───────────────────────────────────────────────
export function generateCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
): string {
  const escapeCell = (value: unknown): string => {
    const str = value === null || value === undefined ? '' : String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const header = columns.map((col) => escapeCell(col.header)).join(',');
  const rows = data.map((row) =>
    columns.map((col) => {
      const value = typeof col.key === 'function' ? col.key(row) : row[col.key as string];
      return escapeCell(value);
    }).join(',')
  );

  return [header, ...rows].join('\n');
}

export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.csv"`,
    },
  });
}

// ── Excel-compatible XML (simple XLSX alternative without native deps) ──
export function generateExcelXML<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  sheetName = 'Data',
): string {
  const escapeXML = (value: unknown): string => {
    const str = value === null || value === undefined ? '' : String(value);
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const headerRow = columns
    .map((col) => `<Cell><Data ss:Type="String">${escapeXML(col.header)}</Data></Cell>`)
    .join('');

  const dataRows = data
    .map((row) => {
      const cells = columns
        .map((col) => {
          const value = typeof col.key === 'function' ? col.key(row) : row[col.key as string];
          const type = typeof value === 'number' ? 'Number' : 'String';
          return `<Cell><Data ss:Type="${type}">${escapeXML(value)}</Data></Cell>`;
        })
        .join('');
      return `<Row>${cells}</Row>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="${sheetName}">
  <Table>
   <Row>${headerRow}</Row>
   ${dataRows}
  </Table>
 </Worksheet>
</Workbook>`;
}

export function excelResponse(xml: string, filename: string): Response {
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/vnd.ms-excel',
      'Content-Disposition': `attachment; filename="${filename}.xls"`,
    },
  });
}

// ── PDF (HTML-based for browser print) ──────────────────────
export function generatePDFHtml<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  title: string,
): string {
  const headers = columns.map((c) => `<th>${c.header}</th>`).join('');
  const rows = data.map((row) => {
    const cells = columns.map((col) => {
      const value = typeof col.key === 'function' ? col.key(row) : row[col.key as string];
      return `<td>${value ?? ''}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; color: #333; }
  h1 { font-size: 18px; margin-bottom: 8px; }
  p.meta { color: #666; font-size: 11px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #581312; color: #fff; padding: 8px; text-align: left; font-size: 11px; }
  td { padding: 6px 8px; border-bottom: 1px solid #eee; font-size: 11px; }
  tr:nth-child(even) td { background: #f9f9f9; }
  @media print { body { margin: 0; } }
</style>
</head>
<body>
<h1>${title}</h1>
<p class="meta">Exported: ${new Date().toLocaleString()} · ${data.length} records</p>
<table>
<thead><tr>${headers}</tr></thead>
<tbody>${rows}</tbody>
</table>
</body>
</html>`;
}

export function pdfHtmlResponse(html: string, filename: string): Response {
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.html"`,
    },
  });
}

// ── Format helpers ───────────────────────────────────────────
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount);
}
