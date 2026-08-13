// ============================================================
// BLENDIFY — Admin Module: Tax Configuration & GST Rules
// ============================================================
'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Toast } from '@/components/admin/ui/Toast';
import { Receipt, Percent, ShieldAlert, Plus, Trash2, Save, RefreshCw } from 'lucide-react';

interface TaxRuleItem {
  id: string;
  name: string;
  rate: number;
  category: string;
}

export default function TaxConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    cgstRate: 9,
    sgstRate: 9,
    igstRate: 18,
    gstRates: [5, 12, 18, 28],
    taxIncluded: true,
    applyOnShipping: true,
    rules: [
      { id: '1', name: 'Standard GST Coffee Beans', rate: 5, category: 'Coffee' },
      { id: '2', name: 'Brewing Equipment Tax', rate: 18, category: 'Equipment' },
    ] as TaxRuleItem[],
  });

  useEffect(() => {
    async function fetchTax() {
      try {
        const res = await fetch('/api/admin/tax-config');
        const json = await res.json();
        if (json.success && json.data) {
          setFormData((prev) => ({ ...prev, ...json.data }));
        }
      } catch (err) {
        console.error('Failed to load tax config:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTax();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/tax-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.success) {
        setToast({ message: 'Tax configuration saved successfully!', type: 'success' });
      } else {
        setToast({ message: json.error || 'Failed to save tax config', type: 'error' });
      }
    } catch {
      setToast({ message: 'Network error. Please try again.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const addRule = () => {
    const newRule: TaxRuleItem = {
      id: Date.now().toString(),
      name: 'New Custom Tax Rule',
      rate: 18,
      category: 'General',
    };
    setFormData({ ...formData, rules: [...formData.rules, newRule] });
  };

  const removeRule = (id: string) => {
    setFormData({ ...formData, rules: formData.rules.filter((r) => r.id !== id) });
  };

  if (loading) {
    return (
      <div className="admin-page-container">
        <PageHeader title="Tax Configuration" subtitle="GST slabs, IGST/CGST/SGST splitting & category tax rules" />
        <div className="admin-card animate-pulse" style={{ height: 400 }} />
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader
        title="Tax Configuration"
        subtitle="Manage GST slabs, intrastate vs interstate tax splitting, and category-level tax rates"
      />

      <form onSubmit={handleSubmit} className="admin-form-layout">
        {/* Default GST Split */}
        <div className="admin-card">
          <div className="admin-card-header">
            <Percent className="w-5 h-5 text-amber-700" />
            <h3>Default GST Breakdown</h3>
          </div>
          <div className="admin-form-grid">
            <div className="admin-form-group">
              <label>CGST Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.cgstRate}
                onChange={(e) => setFormData({ ...formData, cgstRate: parseFloat(e.target.value) || 0 })}
                className="admin-input"
              />
            </div>

            <div className="admin-form-group">
              <label>SGST Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.sgstRate}
                onChange={(e) => setFormData({ ...formData, sgstRate: parseFloat(e.target.value) || 0 })}
                className="admin-input"
              />
            </div>

            <div className="admin-form-group">
              <label>Integrated IGST Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.igstRate}
                onChange={(e) => setFormData({ ...formData, igstRate: parseFloat(e.target.value) || 0 })}
                className="admin-input"
              />
            </div>

            <div className="admin-form-group">
              <label>Tax Inclusivity</label>
              <select
                value={formData.taxIncluded ? 'inclusive' : 'exclusive'}
                onChange={(e) => setFormData({ ...formData, taxIncluded: e.target.value === 'inclusive' })}
                className="admin-select"
              >
                <option value="inclusive">Prices Include Tax (Inclusive)</option>
                <option value="exclusive">Tax Added at Checkout (Exclusive)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Custom Category Tax Rules */}
        <div className="admin-card mt-6">
          <div className="admin-card-header flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-700" />
              <h3>Category Specific Tax Rules</h3>
            </div>
            <button type="button" onClick={addRule} className="admin-btn-secondary text-xs py-1 px-3">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Rule
            </button>
          </div>

          <div className="admin-table-container mt-4">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Rule Name</th>
                  <th>Category</th>
                  <th>GST Rate (%)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {formData.rules.map((rule, idx) => (
                  <tr key={rule.id}>
                    <td>
                      <input
                        type="text"
                        value={rule.name}
                        onChange={(e) => {
                          const updated = [...formData.rules];
                          updated[idx].name = e.target.value;
                          setFormData({ ...formData, rules: updated });
                        }}
                        className="admin-input py-1 text-sm"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={rule.category}
                        onChange={(e) => {
                          const updated = [...formData.rules];
                          updated[idx].category = e.target.value;
                          setFormData({ ...formData, rules: updated });
                        }}
                        className="admin-input py-1 text-sm"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={rule.rate}
                        onChange={(e) => {
                          const updated = [...formData.rules];
                          updated[idx].rate = parseFloat(e.target.value) || 0;
                          setFormData({ ...formData, rules: updated });
                        }}
                        className="admin-input py-1 text-sm w-24"
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => removeRule(rule.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Remove Rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Submit */}
        <div className="admin-form-actions mt-6">
          <button type="submit" disabled={saving} className="admin-btn-primary">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Tax Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
