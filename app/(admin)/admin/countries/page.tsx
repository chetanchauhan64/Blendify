// ============================================================
// BLENDIFY — Admin Module: Supported Countries & Regions
// ============================================================
'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Toast } from '@/components/admin/ui/Toast';
import { Globe, Search, CheckCircle2, XCircle, Plus } from 'lucide-react';

interface CountryItem {
  id: string;
  name: string;
  code: string;
  currency: string;
  statesCount: number;
  isActive: boolean;
}

export default function CountriesPage() {
  const [countries, setCountries] = useState<CountryItem[]>([
    { id: '1', name: 'India', code: 'IN', currency: 'INR', statesCount: 28, isActive: true },
    { id: '2', name: 'United States', code: 'US', currency: 'USD', statesCount: 50, isActive: true },
    { id: '3', name: 'United Kingdom', code: 'GB', currency: 'GBP', statesCount: 4, isActive: true },
    { id: '4', name: 'United Arab Emirates', code: 'AE', currency: 'AED', statesCount: 7, isActive: true },
    { id: '5', name: 'Singapore', code: 'SG', currency: 'SGD', statesCount: 5, isActive: true },
    { id: '6', name: 'Germany', code: 'DE', currency: 'EUR', statesCount: 16, isActive: false },
    { id: '7', name: 'Australia', code: 'AU', currency: 'AUD', statesCount: 6, isActive: false },
  ]);

  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const toggleActive = (id: string) => {
    setCountries((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c))
    );
    setToast({ message: 'Country availability updated', type: 'success' });
  };

  const filtered = countries.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-page-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader
        title="Countries & Regional Coverage"
        subtitle="Manage supported countries, regional tax rules & shipping availability"
      />

      <div className="admin-table-toolbar mb-4">
        <div className="admin-search-input">
          <Search className="w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Filter countries by name or ISO code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Country</th>
              <th>ISO Code</th>
              <th>Primary Currency</th>
              <th>States / Regions</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td className="font-semibold text-stone-800 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-amber-700" /> {c.name}
                </td>
                <td className="font-mono text-xs">{c.code}</td>
                <td>{c.currency}</td>
                <td>{c.statesCount} States/Provinces</td>
                <td>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {c.isActive ? 'Supported' : 'Disabled'}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => toggleActive(c.id)}
                    className={`text-xs px-3 py-1 rounded font-medium transition-colors ${
                      c.isActive
                        ? 'bg-stone-200 hover:bg-stone-300 text-stone-800'
                        : 'bg-amber-700 hover:bg-amber-800 text-white'
                    }`}
                  >
                    {c.isActive ? 'Disable' : 'Enable'}
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
