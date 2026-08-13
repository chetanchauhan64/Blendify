// ============================================================
// BLENDIFY — Admin Module: Brand Assets & Colors
// ============================================================
'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Toast } from '@/components/admin/ui/Toast';
import { Palette, Save, RefreshCw } from 'lucide-react';

export default function BrandAssetsPage() {
  const [formData, setFormData] = useState({
    logoUrl: '/images/logo-dark.png',
    logoDarkUrl: '/images/logo-dark.png',
    logoLightUrl: '/images/logo-light.png',
    faviconUrl: '/favicon.ico',
    ogImageUrl: '/images/og-share.png',
    primaryColor: '#581312',
    secondaryColor: '#C47C0A',
    accentColor: '#2C1008',
    fontDisplay: 'Playfair Display',
    fontBody: 'Inter',
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setToast({ message: 'Brand assets and design system tokens updated!', type: 'success' });
  };

  return (
    <div className="admin-page-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader
        title="Brand Assets & Design Tokens"
        subtitle="Manage official logos, favicons, brand palette (Latte Cream, Espresso, Gold) & typography"
      />

      <form onSubmit={handleSave} className="admin-card space-y-4 max-w-xl">
        <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
          <Palette className="w-5 h-5 text-amber-700" /> Color Palette Tokens
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Primary Color (Maroon)</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.primaryColor}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                className="w-8 h-8 rounded border cursor-pointer"
              />
              <input type="text" value={formData.primaryColor} className="admin-input font-mono text-xs" readOnly />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Secondary Color (Gold)</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.secondaryColor}
                onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                className="w-8 h-8 rounded border cursor-pointer"
              />
              <input type="text" value={formData.secondaryColor} className="admin-input font-mono text-xs" readOnly />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">Logo URL (Dark Header)</label>
          <input
            type="text"
            value={formData.logoDarkUrl}
            onChange={(e) => setFormData({ ...formData, logoDarkUrl: e.target.value })}
            className="admin-input"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">Favicon URL</label>
          <input
            type="text"
            value={formData.faviconUrl}
            onChange={(e) => setFormData({ ...formData, faviconUrl: e.target.value })}
            className="admin-input"
          />
        </div>

        <button type="submit" className="admin-btn-primary mt-4">
          <Save className="w-4 h-4 mr-2" /> Save Brand Assets
        </button>
      </form>
    </div>
  );
}
