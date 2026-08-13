// ============================================================
// BLENDIFY — Admin Module: Homepage CMS & Section Reordering
// ============================================================
'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Toast } from '@/components/admin/ui/Toast';
import { Home, MoveUp, MoveDown, Eye, EyeOff, Save, Layers } from 'lucide-react';

interface HomeSection {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
}

export default function HomepageCmsPage() {
  const [sections, setSections] = useState<HomeSection[]>([
    { id: 'sec_1', name: 'Hero Banner Slider', type: 'hero_slider', enabled: true },
    { id: 'sec_2', name: 'Curated Coffee Collections', type: 'collections_grid', enabled: true },
    { id: 'sec_3', name: 'Flash Sales & Daily Offers Bar', type: 'flash_offers', enabled: true },
    { id: 'sec_4', name: 'Featured Fresh Beans Carousel', type: 'product_carousel', enabled: true },
    { id: 'sec_5', name: 'Brand Story Video & Origin Journey', type: 'video_story', enabled: true },
    { id: 'sec_6', name: 'Customer Cupping Reviews & Ratings', type: 'reviews_slider', enabled: true },
  ]);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const move = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;
    const updated = [...sections];
    const [moved] = updated.splice(idx, 1);
    updated.splice(targetIdx, 0, moved);
    setSections(updated);
  };

  const toggle = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleSave = () => {
    setToast({ message: 'Homepage section order and visibility saved!', type: 'success' });
  };

  return (
    <div className="admin-page-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader
        title="Homepage CMS & Section Layout Builder"
        subtitle="Enable, disable, and re-order homepage sections dynamically"
        actionLabel="Save Section Layout"
        onAction={handleSave}
      />

      <div className="admin-card space-y-3">
        <h3 className="font-bold text-stone-900 text-base mb-2 flex items-center gap-2">
          <Layers className="w-5 h-5 text-amber-700" /> Active Homepage Layout
        </h3>

        {sections.map((sec, idx) => (
          <div
            key={sec.id}
            className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
              sec.enabled ? 'bg-white border-stone-200' : 'bg-stone-50 border-stone-200 opacity-60'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-stone-100 font-mono text-xs text-stone-600 flex items-center justify-center font-bold">
                {idx + 1}
              </span>
              <div>
                <h4 className="font-bold text-stone-900 text-sm">{sec.name}</h4>
                <span className="font-mono text-xs text-stone-400">Type: {sec.type}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => move(idx, 'up')}
                disabled={idx === 0}
                className="p-1.5 hover:bg-stone-100 rounded text-stone-600 disabled:opacity-30"
              >
                <MoveUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => move(idx, 'down')}
                disabled={idx === sections.length - 1}
                className="p-1.5 hover:bg-stone-100 rounded text-stone-600 disabled:opacity-30"
              >
                <MoveDown className="w-4 h-4" />
              </button>
              <button
                onClick={() => toggle(sec.id)}
                className={`p-1.5 rounded transition-colors ${
                  sec.enabled ? 'text-emerald-600 hover:bg-emerald-50' : 'text-stone-400 hover:bg-stone-100'
                }`}
              >
                {sec.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
