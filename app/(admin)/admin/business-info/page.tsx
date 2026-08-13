// ============================================================
// BLENDIFY — Admin Module: Business Information
// ============================================================
'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Toast } from '@/components/admin/ui/Toast';
import { Building2, FileText, Receipt, ShieldCheck, Save, RefreshCw } from 'lucide-react';

export default function BusinessInfoPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    companyName: 'Blendify Specialty Coffee Private Limited',
    legalName: 'Blendify Specialty Coffee Pvt Ltd',
    gstNumber: '29ABCDE1234F1Z5',
    panNumber: 'ABCDE1234F',
    cinNumber: 'U15490KA2024PTC188888',
    regNumber: 'REG-2024-88991',
    invoicePrefix: 'BLND-INV',
    invoiceNote: 'Thank you for choosing Blendify Specialty Coffee.',
    address: '123 Roastery Lane, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
    country: 'India',
  });

  useEffect(() => {
    async function fetchInfo() {
      try {
        const res = await fetch('/api/admin/business-info');
        const json = await res.json();
        if (json.success && json.data) {
          setFormData((prev) => ({ ...prev, ...json.data }));
        }
      } catch (err) {
        console.error('Failed to load business info:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchInfo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/business-info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.success) {
        setToast({ message: 'Business information saved successfully!', type: 'success' });
      } else {
        setToast({ message: json.error || 'Failed to save business info', type: 'error' });
      }
    } catch {
      setToast({ message: 'Network error. Please try again.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page-container">
        <PageHeader title="Business Information" subtitle="Legal registrations, tax numbers & invoicing details" />
        <div className="admin-card animate-pulse" style={{ height: 400 }} />
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader
        title="Business Information"
        subtitle="Manage company registration, GSTIN, PAN, CIN & official invoice headers"
      />

      <form onSubmit={handleSubmit} className="admin-form-layout">
        {/* Company Registration Details */}
        <div className="admin-card">
          <div className="admin-card-header">
            <Building2 className="w-5 h-5 text-amber-700" />
            <h3>Company Registration</h3>
          </div>
          <div className="admin-form-grid">
            <div className="admin-form-group">
              <label>Trade Name / Display Name</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                required
                className="admin-input"
              />
            </div>

            <div className="admin-form-group">
              <label>Legal Registered Name</label>
              <input
                type="text"
                value={formData.legalName}
                onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                required
                className="admin-input"
              />
            </div>

            <div className="admin-form-group">
              <label>Corporate Identification Number (CIN)</label>
              <input
                type="text"
                value={formData.cinNumber}
                onChange={(e) => setFormData({ ...formData, cinNumber: e.target.value })}
                className="admin-input"
              />
            </div>

            <div className="admin-form-group">
              <label>Registration Number</label>
              <input
                type="text"
                value={formData.regNumber}
                onChange={(e) => setFormData({ ...formData, regNumber: e.target.value })}
                className="admin-input"
              />
            </div>
          </div>
        </div>

        {/* Tax Registration Identifiers */}
        <div className="admin-card mt-6">
          <div className="admin-card-header">
            <ShieldCheck className="w-5 h-5 text-amber-700" />
            <h3>Tax Identifiers (India)</h3>
          </div>
          <div className="admin-form-grid">
            <div className="admin-form-group">
              <label>GSTIN Number</label>
              <input
                type="text"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                placeholder="29ABCDE1234F1Z5"
                className="admin-input font-mono"
              />
            </div>

            <div className="admin-form-group">
              <label>PAN Number</label>
              <input
                type="text"
                value={formData.panNumber}
                onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                placeholder="ABCDE1234F"
                className="admin-input font-mono"
              />
            </div>
          </div>
        </div>

        {/* Invoicing Setup */}
        <div className="admin-card mt-6">
          <div className="admin-card-header">
            <Receipt className="w-5 h-5 text-amber-700" />
            <h3>Invoice Defaults</h3>
          </div>
          <div className="admin-form-grid">
            <div className="admin-form-group">
              <label>Invoice Prefix</label>
              <input
                type="text"
                value={formData.invoicePrefix}
                onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                className="admin-input font-mono"
              />
            </div>

            <div className="admin-form-group full-width">
              <label>Invoice Footer Note</label>
              <textarea
                value={formData.invoiceNote}
                onChange={(e) => setFormData({ ...formData, invoiceNote: e.target.value })}
                rows={2}
                className="admin-textarea"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="admin-form-actions mt-6">
          <button type="submit" disabled={saving} className="admin-btn-primary">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Business Information
          </button>
        </div>
      </form>
    </div>
  );
}
