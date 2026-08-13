// ============================================================
// BLENDIFY — Admin Module: Social Media Profiles
// ============================================================
'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Toast } from '@/components/admin/ui/Toast';
import { Share2, Save, RefreshCw, Globe } from 'lucide-react';

export default function SocialMediaPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    instagram: 'https://instagram.com/blendifycoffee',
    facebook: 'https://facebook.com/blendifycoffee',
    linkedin: 'https://linkedin.com/company/blendifycoffee',
    youtube: 'https://youtube.com/@blendifycoffee',
    twitter: 'https://twitter.com/blendifycoffee',
    pinterest: 'https://pinterest.com/blendifycoffee',
    threads: 'https://threads.net/@blendifycoffee',
    whatsapp: '+919876543210',
  });

  useEffect(() => {
    async function fetchSocial() {
      try {
        const res = await fetch('/api/admin/social-media');
        const json = await res.json();
        if (json.success && json.data) {
          setFormData((prev) => ({ ...prev, ...json.data }));
        }
      } catch (err) {
        console.error('Failed to load social links:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSocial();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/social-media', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.success) {
        setToast({ message: 'Social media profile links saved!', type: 'success' });
      }
    } catch {
      setToast({ message: 'Error saving links', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader
        title="Social Media Links & Handles"
        subtitle="Manage official social channels displayed on storefront footer and emails"
      />

      <form onSubmit={handleSubmit} className="admin-card max-w-2xl space-y-4">
        <h3 className="font-bold text-stone-900 text-lg flex items-center gap-2">
          <Share2 className="w-5 h-5 text-amber-700" /> Official Channels
        </h3>

        <div>
          <label className="block text-xs font-semibold mb-1">Instagram URL</label>
          <input
            type="url"
            value={formData.instagram}
            onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
            className="admin-input"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">Facebook Page URL</label>
          <input
            type="url"
            value={formData.facebook}
            onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
            className="admin-input"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">YouTube Channel URL</label>
          <input
            type="url"
            value={formData.youtube}
            onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
            className="admin-input"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">X (Twitter) Handle / URL</label>
          <input
            type="url"
            value={formData.twitter}
            onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
            className="admin-input"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">LinkedIn Company Page</label>
          <input
            type="url"
            value={formData.linkedin}
            onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
            className="admin-input"
          />
        </div>

        <div className="pt-2">
          <button type="submit" disabled={saving} className="admin-btn-primary">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Social Links
          </button>
        </div>
      </form>
    </div>
  );
}
