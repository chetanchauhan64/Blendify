// ============================================================
// BLENDIFY — Export Menu Component (Luxury Redesign)
// Supports CSV, Excel, PDF, Print — warm cream dropdown
// ============================================================
'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, FileText, File, Printer, Table, ChevronDown } from 'lucide-react';

// Fallback for older Toast API — works with both new and old exports
function showToast(type: 'success' | 'error', title: string, desc?: string) {
  try {
    const w = window as unknown as Record<string, unknown>;
    const t = w.__blendifyToast as { toast?: (opts: Record<string, unknown>) => void } | undefined;
    if (t?.toast) {
      t.toast({ type, title, description: desc });
    }
  } catch { /* ignore */ }
}

interface ExportMenuProps {
  onExport: (format: 'csv' | 'excel' | 'pdf' | 'print') => Promise<void> | void;
  disabled?: boolean;
  id?: string;
}

const FORMATS = [
  { key: 'csv'   as const, label: 'Export CSV',   icon: Table,    desc: 'Comma-separated values',  color: '#2D7A4F' },
  { key: 'excel' as const, label: 'Export Excel',  icon: File,     desc: 'Microsoft Excel format',  color: '#1565A0' },
  { key: 'pdf'   as const, label: 'Export PDF',    icon: FileText, desc: 'Print-ready document',    color: '#B91C1C' },
  { key: 'print' as const, label: 'Print',         icon: Printer,  desc: 'Open system print dialog', color: '#581312' },
];

export function ExportMenu({ onExport, disabled = false, id = 'export-menu' }: ExportMenuProps) {
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleExport = async (format: 'csv' | 'excel' | 'pdf' | 'print') => {
    setOpen(false);
    setLoading(format);
    try {
      await onExport(format);
      showToast('success', `Exported as ${format.toUpperCase()}`);
    } catch (e) {
      showToast('error', 'Export failed', (e as Error).message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="admin-export-menu" ref={ref} id={id}>
      <button
        className="admin-btn admin-btn-secondary"
        onClick={() => setOpen(!open)}
        disabled={disabled || !!loading}
        aria-expanded={open}
        aria-haspopup="menu"
        id={`${id}-trigger`}
        aria-label="Export data"
      >
        {loading ? (
          <span className="admin-spinner admin-spinner-sm" aria-hidden="true" />
        ) : (
          <Download size={14} aria-hidden="true" />
        )}
        Export
        <ChevronDown
          size={13}
          style={{ transition: 'transform 200ms', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          className="admin-export-dropdown"
          role="menu"
          aria-label="Export format options"
        >
          <div style={{
            padding: '8px 16px 6px',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            color: 'var(--admin-text-disabled)',
            borderBottom: '1px solid var(--admin-border)',
            marginBottom: 4,
          }}>
            Export Format
          </div>

          {FORMATS.map((fmt) => {
            const Icon = fmt.icon;
            return (
              <button
                key={fmt.key}
                className="admin-export-item"
                onClick={() => handleExport(fmt.key)}
                disabled={!!loading}
                role="menuitem"
                id={`${id}-${fmt.key}`}
                aria-label={`${fmt.label}: ${fmt.desc}`}
              >
                <div
                  style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: `${fmt.color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                >
                  <Icon size={14} style={{ color: fmt.color }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--admin-text-primary)', fontSize: '13px' }}>
                    {fmt.label}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--admin-text-tertiary)' }}>
                    {fmt.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
