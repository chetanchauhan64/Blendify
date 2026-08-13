// ============================================================
// BLENDIFY — Admin Module: Store Settings
// ============================================================
'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Toast } from '@/components/admin/ui/Toast';
import { Store, Globe, Clock, DollarSign, Mail, Phone, MapPin, Save, RefreshCw } from 'lucide-react';

export default function StoreSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    storeName: 'BLENDIFY',
    brandName: 'BLENDIFY Coffee Co.',
    tagline: 'The Art of Artisanal Coffee',
    storeEmail: 'hello@blendify.coffee',
    supportEmail: 'support@blendify.coffee',
    phone: '+91 (800) 123-4567',
    address: '123 Roastery Lane, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    pincode: '560038',
    timezone: 'Asia/Kolkata',
    defaultCurrency: 'INR',
    language: 'en',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'en-IN',
    logoUrl: '/images/logo.svg',
    faviconUrl: '/favicon.ico',
    storeStatus: 'live',
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/admin/settings');
        const json = await res.json();
        if (json.success && json.data) {
          setFormData((prev) => ({ ...prev, ...json.data }));
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.success) {
        setToast({ message: 'Store settings saved successfully!', type: 'success' });
      } else {
        setToast({ message: json.error || 'Failed to save settings', type: 'error' });
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
        <PageHeader title="Store Settings" subtitle="Configure core store preferences, localization, and branding" />
        <div className="admin-card animate-pulse" style={{ height: 400 }} />
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader
        title="Store Settings"
        subtitle="Manage brand identity, contact details, currency, timezone, and localization"
      />

      <form onSubmit={handleSubmit} className="admin-form-layout">
        {/* Brand & Store Information */}
        <div className="admin-card">
          <div className="admin-card-header">
            <Store className="w-5 h-5 text-amber-700" />
            <h3>Brand Identity</h3>
          </div>
          <div className="admin-form-grid">
            <div className="admin-form-group">
              <label>Store Name</label>
              <input
                type="text"
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                required
                className="admin-input"
              />
            </div>

            <div className="admin-form-group">
              <label>Brand Name</label>
              <input
                type="text"
                value={formData.brandName}
                onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                required
                className="admin-input"
              />
            </div>

            <div className="admin-form-group full-width">
              <label>Brand Tagline</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="admin-input"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="admin-card mt-6">
          <div className="admin-card-header">
            <Mail className="w-5 h-5 text-amber-700" />
            <h3>Contact Details & Address</h3>
          </div>
          <div className="admin-form-grid">
            <div className="admin-form-group">
              <label>Store Email</label>
              <input
                type="email"
                value={formData.storeEmail}
                onChange={(e) => setFormData({ ...formData, storeEmail: e.target.value })}
                className="admin-input"
              />
            </div>

            <div className="admin-form-group">
              <label>Support Email</label>
              <input
                type="email"
                value={formData.supportEmail}
                onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                className="admin-input"
              />
            </div>

            <div className="admin-form-group">
              <label>Customer Support Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="admin-input"
              />
            </div>

            <div className="admin-form-group">
              <label>City & State</label>
              <input
                type="text"
                value={`${formData.city}, ${formData.state}`}
                onChange={(e) => {
                  const parts = e.target.value.split(',');
                  setFormData({ ...formData, city: parts[0]?.trim() || '', state: parts[1]?.trim() || '' });
                }}
                className="admin-input"
              />
            </div>

            <div className="admin-form-group full-width">
              <label>Full Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                className="admin-textarea"
              />
            </div>
          </div>
        </div>

        {/* Localization */}
        <div className="admin-card mt-6">
          <div className="admin-card-header">
            <Globe className="w-5 h-5 text-amber-700" />
            <h3>Localization & Formats</h3>
          </div>
          <div className="admin-form-grid">
            <div className="admin-form-group">
              <label>Timezone</label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="admin-select"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
              </select>
            </div>

            <div className="admin-form-group">
              <label>Default Currency</label>
              <select
                value={formData.defaultCurrency}
                onChange={(e) => setFormData({ ...formData, defaultCurrency: e.target.value })}
                className="admin-select"
              >
                <option value="INR">INR (₹ Indian Rupee)</option>
                <option value="USD">USD ($ US Dollar)</option>
                <option value="EUR">EUR (€ Euro)</option>
                <option value="GBP">GBP (£ British Pound)</option>
              </select>
            </div>

            <div className="admin-form-group">
              <label>Date Format</label>
              <select
                value={formData.dateFormat}
                onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value })}
                className="admin-select"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 05/08/2026)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 08/05/2026)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-08-05)</option>
              </select>
            </div>

            <div className="admin-form-group">
              <label>Number Format</label>
              <select
                value={formData.numberFormat}
                onChange={(e) => setFormData({ ...formData, numberFormat: e.target.value })}
                className="admin-select"
              >
                <option value="en-IN">Indian Format (1,00,000.00)</option>
                <option value="en-US">US Format (100,000.00)</option>
                <option value="de-DE">European Format (100.000,00)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="admin-form-actions mt-6">
          <button type="submit" disabled={saving} className="admin-btn-primary">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
