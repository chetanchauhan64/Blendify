// ============================================================
// BLENDIFY — Admin Module: Invoice Templates & Branding
// ============================================================
'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Toast } from '@/components/admin/ui/Toast';
import { Receipt, QrCode, FileText, Save, RefreshCw, Eye } from 'lucide-react';

export default function InvoiceTemplatesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    companyName: 'Blendify Specialty Coffee Pvt Ltd',
    logoUrl: '/images/logo.svg',
    address: '123 Roastery Lane, Indiranagar, Bengaluru, KA 560038',
    gstNumber: '29ABCDE1234F1Z5',
    panNumber: 'ABCDE1234F',
    footer: 'Computer generated tax invoice. No signature required.',
    showQrCode: true,
    showSignature: false,
    colorScheme: 'default',
    notes: 'Coffee beans are exempt under GST HSN 0901 when unroasted.',
  });

  useEffect(() => {
    async function fetchTpl() {
      try {
        const res = await fetch('/api/admin/invoice-templates');
        const json = await res.json();
        if (json.success && json.data) {
          setFormData((prev) => ({ ...prev, ...json.data }));
        }
      } catch (err) {
        console.error('Failed to load invoice template:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTpl();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/invoice-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.success) {
        setToast({ message: 'Invoice template branding saved!', type: 'success' });
      }
    } catch {
      setToast({ message: 'Error saving invoice template', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader
        title="PDF Invoice Branding & Layout"
        subtitle="Configure tax invoice branding, UPI QR codes, tax headers and legal disclaimers"
      />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form Controls */}
        <div className="admin-card space-y-4">
          <h3 className="font-bold text-stone-900 text-lg flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-700" /> Invoice Header & Legal
          </h3>

          <div>
            <label className="block text-xs font-semibold mb-1">Company Legal Name</label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="admin-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">GSTIN Number</label>
            <input
              type="text"
              value={formData.gstNumber}
              onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
              className="admin-input font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Registered Billing Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={2}
              className="admin-textarea"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Invoice Footer Disclaimer</label>
            <input
              type="text"
              value={formData.footer}
              onChange={(e) => setFormData({ ...formData, footer: e.target.value })}
              className="admin-input"
            />
          </div>

          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-800">
              <input
                type="checkbox"
                checked={formData.showQrCode}
                onChange={(e) => setFormData({ ...formData, showQrCode: e.target.checked })}
                className="w-4 h-4 text-amber-700 rounded"
              />
              Show Payment / Verify QR Code
            </label>
          </div>

          <button type="submit" disabled={saving} className="admin-btn-primary w-full justify-center mt-4">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Invoice Template
          </button>
        </div>

        {/* Live Invoice Preview */}
        <div className="admin-card bg-stone-50 border border-stone-200">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <span className="font-bold text-xs uppercase tracking-wider text-stone-500 flex items-center gap-1">
              <Eye className="w-4 h-4" /> Live PDF Preview
            </span>
            <span className="font-mono text-xs text-stone-400">TAX INVOICE #BLND-1049</span>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4 text-xs">
            <div className="flex justify-between border-b pb-4">
              <div>
                <h4 className="font-bold text-amber-900 text-sm">{formData.companyName}</h4>
                <p className="text-stone-500 text-[11px] mt-1">{formData.address}</p>
                <p className="font-mono text-[11px] text-stone-600 mt-1">GSTIN: {formData.gstNumber}</p>
              </div>
              {formData.showQrCode && (
                <div className="w-14 h-14 bg-stone-100 border flex items-center justify-center rounded">
                  <QrCode className="w-8 h-8 text-stone-800" />
                </div>
              )}
            </div>

            <div className="py-2 text-stone-600">
              <p>Item: <strong>Dark Roast Espresso Whole Beans (500g)</strong> x 2 — ₹1,198</p>
              <p className="mt-1 text-[11px] text-stone-400">CGST (2.5%): ₹29.95 | SGST (2.5%): ₹29.95</p>
            </div>

            <div className="border-t pt-2 text-[10px] text-stone-400 italic">
              {formData.footer}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
