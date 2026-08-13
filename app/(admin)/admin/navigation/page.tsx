// ============================================================
// BLENDIFY — Admin Module: Navigation Menu Manager
// ============================================================
'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Toast } from '@/components/admin/ui/Toast';
import { Menu, Plus, Trash2, Save, MoveUp, MoveDown } from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  url: string;
}

export default function NavigationPage() {
  const [items, setItems] = useState<MenuItem[]>([
    { id: '1', label: 'Shop Coffee', url: '/shop' },
    { id: '2', label: 'Single Origin', url: '/shop/single-origin' },
    { id: '3', label: 'Subscriptions', url: '/subscriptions' },
    { id: '4', label: 'Brew Guides', url: '/brew-guides' },
    { id: '5', label: 'About Us', url: '/about' },
  ]);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), label: 'New Navigation Link', url: '/new-link' }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const handleSave = () => {
    setToast({ message: 'Header menu navigation updated!', type: 'success' });
  };

  return (
    <div className="admin-page-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader
        title="Navigation Menu Manager"
        subtitle="Configure storefront main header menu, dropdown items & links"
        actionLabel="Save Menu"
        onAction={handleSave}
      />

      <div className="admin-card space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
            <Menu className="w-5 h-5 text-amber-700" /> Header Menu Items
          </h3>
          <button onClick={addItem} className="admin-btn-secondary text-xs py-1 px-3">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Link
          </button>
        </div>

        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={item.id} className="p-3 bg-stone-50 rounded-xl border flex items-center gap-4">
              <input
                type="text"
                value={item.label}
                onChange={(e) => {
                  const updated = [...items];
                  updated[idx].label = e.target.value;
                  setItems(updated);
                }}
                className="admin-input font-medium text-xs flex-1"
                placeholder="Link Label"
              />
              <input
                type="text"
                value={item.url}
                onChange={(e) => {
                  const updated = [...items];
                  updated[idx].url = e.target.value;
                  setItems(updated);
                }}
                className="admin-input font-mono text-xs flex-1"
                placeholder="URL Path"
              />
              <button onClick={() => removeItem(item.id)} className="text-red-600 hover:text-red-800 p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
