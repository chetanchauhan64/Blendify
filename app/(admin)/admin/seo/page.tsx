// ============================================================
// BLENDIFY — Admin Module: Global SEO & OpenGraph Meta
// ============================================================
'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Toast } from '@/components/admin/ui/Toast';
import { Search, Globe, Share2, Save, RefreshCw } from 'lucide-react';

export default function SeoPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    siteTitle: 'Blendify — Specialty Artisanal Coffee Roasters',
    titleSuffix: '| Blendify Coffee Co.',
    metaDescription: 'Shop freshly roasted artisanal coffee beans, single-origin pour-overs, and specialty espresso blends delivered direct to your door.',
    ogTitle: 'Blendify — The Art of Specialty Coffee',
    ogDescription: 'Experience freshly roasted single-origin coffees and custom espresso blends.',
    ogImageUrl: 'https://blendify.coffee/og-image.jpg',
    twitterHandle: '@blendifycoffee',
    twitterCardType: 'summary_large_image',
    googleVerify: 'google-site-verification-token-12345',
    bingVerify: 'bing-site-verification-67890',
  });

  useEffect(() => {
    async function fetchSeo() {
      try {
        const res = await fetch('/api/admin/seo');
        const json = await res.json();
        if (json.success && json.data) {
          setFormData((prev) => ({ ...prev, ...json.data }));
        }
      } catch (err) {
        console.error('Failed to load SEO settings:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSeo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/seo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.success) {
        setToast({ message: 'SEO settings saved successfully!', type: 'success' });
      }
    } catch {
      setToast({ message: 'Error saving SEO settings', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader
        title="SEO & Meta Tag Management"
        subtitle="Manage default store Meta Titles, Meta Descriptions, OpenGraph images, and Search Engine verifications"
      />

      <form onSubmit={handleSubmit} className="admin-form-layout space-y-6">
        <div className="admin-card">
          <div className="admin-card-header">
            <Search className="w-5 h-5 text-amber-700" />
            <h3>Search Engine Title & Meta Description</h3>
          </div>
          <div className="admin-form-grid">
            <div className="admin-form-group">
              <label>Default Page Title</label>
              <input
                type="text"
                value={formData.siteTitle}
                onChange={(e) => setFormData({ ...formData, siteTitle: e.target.value })}
                className="admin-input"
              />
            </div>

            <div className="admin-form-group">
              <label>Title Suffix</label>
              <input
                type="text"
                value={formData.titleSuffix}
                onChange={(e) => setFormData({ ...formData, titleSuffix: e.target.value })}
                className="admin-input"
              />
            </div>

            <div className="admin-form-group full-width">
              <label>Default Meta Description</label>
              <textarea
                value={formData.metaDescription}
                onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                rows={3}
                className="admin-textarea"
              />
            </div>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <Share2 className="w-5 h-5 text-amber-700" />
            <h3>OpenGraph & Twitter Sharing Cards</h3>
          </div>
          <div className="admin-form-grid">
            <div className="admin-form-group">
              <label>OpenGraph Title (Facebook/LinkedIn)</label>
              <input
                type="text"
                value={formData.ogTitle}
                onChange={(e) => setFormData({ ...formData, ogTitle: e.target.value })}
                className="admin-input"
              />
            </div>

            <div className="admin-form-group">
              <label>OpenGraph Share Image URL</label>
              <input
                type="text"
                value={formData.ogImageUrl}
                onChange={(e) => setFormData({ ...formData, ogImageUrl: e.target.value })}
                className="admin-input"
              />
            </div>

            <div className="admin-form-group">
              <label>Twitter Handle</label>
              <input
                type="text"
                value={formData.twitterHandle}
                onChange={(e) => setFormData({ ...formData, twitterHandle: e.target.value })}
                className="admin-input"
              />
            </div>

            <div className="admin-form-group">
              <label>Twitter Card Type</label>
              <select
                value={formData.twitterCardType}
                onChange={(e) => setFormData({ ...formData, twitterCardType: e.target.value })}
                className="admin-select"
              >
                <option value="summary_large_image">Summary Large Image</option>
                <option value="summary">Summary</option>
              </select>
            </div>
          </div>
        </div>

        <div className="admin-form-actions">
          <button type="submit" disabled={saving} className="admin-btn-primary">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Global SEO
          </button>
        </div>
      </form>
    </div>
  );
}
