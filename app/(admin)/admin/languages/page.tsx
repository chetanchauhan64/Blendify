// ============================================================
// BLENDIFY — Admin Module: Language & Translations
// ============================================================
'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Toast } from '@/components/admin/ui/Toast';
import { Languages, CheckCircle2, Search, Edit2 } from 'lucide-react';

interface LangItem {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  isDefault: boolean;
  completionPercent: number;
}

export default function LanguagesPage() {
  const [languages, setLanguages] = useState<LangItem[]>([
    { id: '1', code: 'en', name: 'English', nativeName: 'English (US/UK)', isDefault: true, completionPercent: 100 },
    { id: '2', code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', isDefault: false, completionPercent: 92 },
    { id: '3', code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', isDefault: false, completionPercent: 88 },
    { id: '4', code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', isDefault: false, completionPercent: 85 },
    { id: '5', code: 'ar', name: 'Arabic', nativeName: 'العربية', isDefault: false, completionPercent: 75 },
    { id: '6', code: 'de', name: 'German', nativeName: 'Deutsch', isDefault: false, completionPercent: 60 },
  ]);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const setDefault = (id: string) => {
    setLanguages((prev) =>
      prev.map((l) => ({ ...l, isDefault: l.id === id }))
    );
    setToast({ message: 'Default store language updated', type: 'success' });
  };

  return (
    <div className="admin-page-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader
        title="Language & Multilingual Translation"
        subtitle="Manage store languages, translation strings & RTL/LTR layout options"
      />

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Language</th>
              <th>Language Code</th>
              <th>Native Name</th>
              <th>Translation Coverage</th>
              <th>Default Language</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {languages.map((l) => (
              <tr key={l.id}>
                <td className="font-semibold text-stone-900 flex items-center gap-2">
                  <Languages className="w-4 h-4 text-amber-700" /> {l.name}
                </td>
                <td className="font-mono text-xs">{l.code}</td>
                <td className="font-medium text-stone-700">{l.nativeName}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-700 rounded-full"
                        style={{ width: `${l.completionPercent}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono">{l.completionPercent}%</span>
                  </div>
                </td>
                <td>
                  {l.isDefault ? (
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      Primary Default
                    </span>
                  ) : (
                    <button
                      onClick={() => setDefault(l.id)}
                      className="text-xs text-stone-500 hover:text-amber-800 underline"
                    >
                      Make Default
                    </button>
                  )}
                </td>
                <td>
                  <button className="text-xs px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded font-medium">
                    Edit Strings
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
