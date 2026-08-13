// ============================================================
// BLENDIFY — Confirm Dialog Component (Luxury Redesign)
// Brand-consistent cream modal with warm shadows
// ============================================================
'use client';

import { AlertTriangle, Trash2, CheckCircle, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel  = 'Cancel',
  variant      = 'danger',
  loading      = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Focus confirm button when dialog opens
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => confirmRef.current?.focus(), 60);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Keyboard handlers
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter' && !loading) onConfirm();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, loading, onConfirm, onCancel]);

  if (!open) return null;

  const iconMap: Record<string, { Icon: React.ElementType; cls: string }> = {
    danger:  { Icon: Trash2,        cls: 'danger' },
    warning: { Icon: AlertTriangle, cls: 'warning' },
    default: { Icon: CheckCircle,   cls: 'accent' },
  };

  const { Icon, cls } = iconMap[variant];

  return (
    <div
      className="admin-modal-overlay"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
    >
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 20px 0' }}>
          <button
            className="admin-icon-btn"
            onClick={onCancel}
            aria-label="Close dialog"
            style={{ width: 28, height: 28 }}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="admin-modal-header" style={{ paddingTop: 8 }}>
          <div className={`admin-modal-icon ${cls}`} aria-hidden="true">
            <Icon size={22} />
          </div>
          <h2 className="admin-modal-title" id="confirm-dialog-title">
            {title}
          </h2>
          <p className="admin-modal-desc" id="confirm-dialog-desc">
            {description}
          </p>
        </div>

        <div className="admin-modal-footer" style={{ paddingTop: '24px' }}>
          <button
            className="admin-btn admin-btn-ghost"
            onClick={onCancel}
            disabled={loading}
            id="confirm-dialog-cancel"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            className={`admin-btn ${variant === 'danger' ? 'admin-btn-danger' : variant === 'warning' ? 'admin-btn-gold' : 'admin-btn-primary'}`}
            onClick={onConfirm}
            disabled={loading}
            id="confirm-dialog-confirm"
            aria-busy={loading}
          >
            {loading && (
              <span
                className="admin-spinner"
                style={{ width: 14, height: 14, borderTopColor: '#FAF0E6' }}
                aria-hidden="true"
              />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
