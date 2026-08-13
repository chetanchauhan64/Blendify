// ============================================================
// BLENDIFY — Premium Notification System (Toast)
// Features: Success/Warning/Error/Info, Undo, Progress bar,
//           Auto-dismiss, Persistent, Action buttons, Queue
// ============================================================
'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

type ToastType    = 'success' | 'warning' | 'error' | 'info';
type ToastVariant = 'default' | 'persistent' | 'progress';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;       // ms — 0 = persistent
  variant?: ToastVariant;
  progress?: number;       // 0–100 for progress variant
  action?: ToastAction;
  undoAction?: () => void;
  exiting?: boolean;
}

interface ToastContextType {
  toast: (opts: Omit<ToastItem, 'id'>) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
  updateProgress: (id: string, progress: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const ICONS: Record<ToastType, React.ElementType> = {
  success: CheckCircle,
  warning: AlertTriangle,
  error:   XCircle,
  info:    Info,
};

export function ToastProvider() {
  const [toasts, setToasts]   = useState<ToastItem[]>([]);
  const timers                = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => t.id === id ? { ...t, exiting: true } : t)
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);

    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const dismissAll = useCallback(() => {
    setToasts((prev) => prev.map((t) => ({ ...t, exiting: true })));
    timers.current.forEach((timer) => clearTimeout(timer));
    timers.current.clear();
    setTimeout(() => setToasts([]), 350);
  }, []);

  const toast = useCallback((opts: Omit<ToastItem, 'id'>): string => {
    const id       = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const duration = opts.duration ?? (opts.variant === 'persistent' ? 0 : 4500);
    const item: ToastItem = { id, ...opts, duration };

    setToasts((prev) => {
      // Queue management: max 5 visible
      const next = [...prev, item];
      if (next.length > 5) return next.slice(next.length - 5);
      return next;
    });

    if (duration > 0) {
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
    }

    return id;
  }, [dismiss]);

  const updateProgress = useCallback((id: string, progress: number) => {
    setToasts((prev) =>
      prev.map((t) => t.id === id ? { ...t, progress } : t)
    );
  }, []);

  // Expose via global window for convenience — must be in useEffect, not render
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).__blendifyToast = { toast, dismiss, dismissAll };
    }
  }, [toast, dismiss, dismissAll]);

  return (
    <ToastContext.Provider value={{ toast, dismiss, dismissAll, updateProgress }}>
      <div
        className="admin-toast-container"
        role="region"
        aria-label="Notifications"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          const durationMs = (t.duration ?? 4500);
          return (
            <div
              key={t.id}
              className={`admin-toast ${t.type}${t.exiting ? ' admin-toast-exiting' : ''}`}
              role="alert"
              aria-live={t.type === 'error' ? 'assertive' : 'polite'}
              aria-atomic="true"
            >
              {/* Icon */}
              <div className="admin-toast-icon" aria-hidden="true">
                <Icon size={16} />
              </div>

              {/* Content */}
              <div className="admin-toast-content">
                <div className="admin-toast-title">{t.title}</div>
                {t.description && (
                  <div className="admin-toast-desc">{t.description}</div>
                )}

                {/* Progress bar indicator */}
                {t.variant === 'progress' && t.progress !== undefined && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{
                      height: 4, borderRadius: 2,
                      background: 'var(--admin-border)',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(100, Math.max(0, t.progress))}%`,
                        background: 'var(--admin-accent)',
                        borderRadius: 2,
                        transition: 'width 400ms ease',
                      }} />
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--admin-text-tertiary)', marginTop: 4 }}>
                      {t.progress}% complete
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                {(t.action || t.undoAction) && (
                  <div className="admin-toast-actions">
                    {t.undoAction && (
                      <button
                        className="admin-toast-action-btn"
                        onClick={() => { t.undoAction?.(); dismiss(t.id); }}
                        aria-label="Undo action"
                      >
                        ↩ Undo
                      </button>
                    )}
                    {t.action && (
                      <button
                        className="admin-toast-action-btn"
                        onClick={() => { t.action?.onClick(); dismiss(t.id); }}
                      >
                        {t.action.label}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Close */}
              <button
                className="admin-toast-close"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
              >
                <X size={14} aria-hidden="true" />
              </button>

              {/* Auto-dismiss progress bar */}
              {durationMs > 0 && t.variant !== 'progress' && (
                <div
                  className="admin-toast-progress"
                  style={{
                    animationDuration: `${durationMs}ms`,
                    background: t.type === 'success' ? 'var(--admin-success)'
                      : t.type === 'error'   ? 'var(--admin-error)'
                      : t.type === 'warning' ? 'var(--admin-warning)'
                      :                         'var(--admin-info)',
                  }}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────
// BACKWARDS-COMPATIBLE adminToast API
// All existing pages use adminToast.success/error/info/warning.
// This bridges to the new window.__blendifyToast system.
// ─────────────────────────────────────────────────────────────
function fireToast(type: ToastType, title: string, description?: string) {
  if (typeof window === 'undefined') return;
  try {
    const w = window as unknown as Record<string, unknown>;
    const t = w.__blendifyToast as { toast?: (opts: object) => void } | undefined;
    if (t?.toast) {
      t.toast({ type, title, description });
      return;
    }
  } catch { /* ignore */ }

  // Fallback: browser alert for SSR or if ToastProvider not mounted
  if (process.env.NODE_ENV === 'development') {
    console.info(`[Toast][${type}] ${title}`, description ?? '');
  }
}

/** @deprecated Use useToast() hook instead. Legacy API for existing pages. */
export const adminToast = {
  success: (title: string, description?: string) => fireToast('success', title, description),
  error:   (title: string, description?: string) => fireToast('error',   title, description),
  warning: (title: string, description?: string) => fireToast('warning', title, description),
  info:    (title: string, description?: string) => fireToast('info',    title, description),
};

/** Standalone Toast notification banner for direct page rendering */
export function Toast({
  message,
  type = 'success',
  onClose,
}: {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose?: () => void;
}) {
  const Icon = ICONS[type] || CheckCircle;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`admin-toast ${type}`}
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 16px',
        borderRadius: 10,
        background: type === 'error' ? '#FEF2F2' : type === 'warning' ? '#FFFBEB' : '#F0FDF4',
        border: `1px solid ${type === 'error' ? '#FCA5A5' : type === 'warning' ? '#FDE68A' : '#86EFAC'}`,
        color: type === 'error' ? '#991B1B' : type === 'warning' ? '#92400E' : '#166534',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
      }}
    >
      <Icon size={16} />
      <span style={{ fontSize: '13px', fontWeight: 500 }}>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 8, opacity: 0.7 }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

