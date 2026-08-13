// ============================================================
// BLENDIFY — Drawer Component (Luxury Redesign)
// Features: Unsaved Changes Warning, Smooth animation, Brand colors
// ============================================================
'use client';

import { useEffect, useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface DrawerProps {
  open?: boolean;
  isOpen?: boolean;
  title: string;
  subtitle?: string;
  width?: number;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  hasUnsavedChanges?: boolean;
  onDiscardChanges?: () => void;
}

export function Drawer({
  open,
  isOpen,
  title,
  subtitle,
  width = 540,
  onClose,
  children,
  footer,
  hasUnsavedChanges = false,
  onDiscardChanges,
}: DrawerProps) {
  const isDrawerOpen = open ?? isOpen ?? false;
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!isDrawerOpen) return;
      if (e.key === 'Escape') {
        if (hasUnsavedChanges) {
          setShowDiscardConfirm(true);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isDrawerOpen, onClose, hasUnsavedChanges]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isDrawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isDrawerOpen]);

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const handleDiscard = () => {
    setShowDiscardConfirm(false);
    onDiscardChanges?.();
    onClose();
  };

  const effectiveWidth = typeof window !== 'undefined'
    ? Math.min(width, window.innerWidth)
    : width;

  return (
    <>
      {/* Overlay */}
      <div
        className={`admin-drawer-overlay ${isDrawerOpen ? 'open' : ''}`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside
        className={`admin-drawer ${isDrawerOpen ? 'open' : ''}`}
        style={{ width: effectiveWidth }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        aria-hidden={!isDrawerOpen}
      >
        {/* Header */}
        <div className="admin-drawer-header">
          <div className="admin-drawer-header-left">
            <h2 className="admin-drawer-title">{title}</h2>
            {subtitle && (
              <p className="admin-drawer-subtitle">{subtitle}</p>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Unsaved changes indicator */}
            {hasUnsavedChanges && (
              <div className="admin-unsaved-indicator" title="You have unsaved changes">
                <span className="admin-unsaved-dot" aria-hidden="true" />
                <span>Unsaved</span>
              </div>
            )}

            <button
              className="admin-icon-btn"
              onClick={handleClose}
              aria-label="Close panel"
              id="admin-drawer-close"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="admin-drawer-body">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="admin-drawer-footer">
            {hasUnsavedChanges && (
              <div className="admin-unsaved-indicator" style={{ marginRight: 'auto' }}>
                <span className="admin-unsaved-dot" aria-hidden="true" />
                <span style={{ fontSize: 12 }}>Unsaved changes</span>
              </div>
            )}
            <div className="admin-drawer-footer-actions">
              {footer}
            </div>
          </div>
        )}
      </aside>

      {/* Discard Changes Confirmation */}
      {showDiscardConfirm && (
        <div
          className="admin-modal-overlay"
          style={{ zIndex: 75 }}
          role="dialog"
          aria-modal="true"
          aria-label="Discard changes confirmation"
        >
          <div className="admin-modal">
            <div className="admin-modal-header">
              <div className="admin-modal-icon warning">
                <AlertTriangle size={22} aria-hidden="true" />
              </div>
              <h3 className="admin-modal-title">Discard Changes?</h3>
              <p className="admin-modal-desc">
                You have unsaved changes. If you close now, all changes will be lost permanently.
              </p>
            </div>
            <div className="admin-modal-footer">
              <button
                className="admin-btn admin-btn-ghost"
                onClick={() => setShowDiscardConfirm(false)}
                id="admin-discard-cancel-btn"
              >
                Keep Editing
              </button>
              <button
                className="admin-btn admin-btn-danger"
                onClick={handleDiscard}
                id="admin-discard-confirm-btn"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
