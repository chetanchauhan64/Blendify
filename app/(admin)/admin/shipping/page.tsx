// ============================================================
// BLENDIFY — Admin Module: Shipping Zones & Rates
// ============================================================
'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Toast } from '@/components/admin/ui/Toast';
import { Drawer } from '@/components/admin/ui/Drawer';
import { Truck, Plus, Edit2, Trash2, Globe, Clock, CheckCircle2, Save, Search } from 'lucide-react';

interface ShippingZone {
  id: string;
  name: string;
  description: string;
  countries: string[];
  baseRate: number;
  perKgRate: number;
  freeAbove: number | null;
  minDays: number;
  maxDays: number;
  isActive: boolean;
}

export default function ShippingPage() {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    countries: 'India',
    baseRate: 99,
    perKgRate: 20,
    freeAbove: 999,
    minDays: 2,
    maxDays: 4,
    isActive: true,
  });

  const fetchZones = async () => {
    try {
      const res = await fetch('/api/admin/shipping');
      const json = await res.json();
      if (json.success && json.data) {
        setZones(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch shipping zones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleOpenCreate = () => {
    setEditingZone(null);
    setFormData({
      name: '',
      description: '',
      countries: 'India',
      baseRate: 99,
      perKgRate: 20,
      freeAbove: 999,
      minDays: 2,
      maxDays: 4,
      isActive: true,
    });
    setDrawerOpen(true);
  };

  const handleOpenEdit = (zone: ShippingZone) => {
    setEditingZone(zone);
    setFormData({
      name: zone.name,
      description: zone.description,
      countries: zone.countries.join(', '),
      baseRate: zone.baseRate,
      perKgRate: zone.perKgRate,
      freeAbove: zone.freeAbove ?? 0,
      minDays: zone.minDays,
      maxDays: zone.maxDays,
      isActive: zone.isActive,
    });
    setDrawerOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        id: editingZone?.id,
        name: formData.name,
        description: formData.description,
        countries: formData.countries.split(',').map((c) => c.trim()),
        baseRate: Number(formData.baseRate),
        perKgRate: Number(formData.perKgRate),
        freeAbove: formData.freeAbove ? Number(formData.freeAbove) : null,
        minDays: Number(formData.minDays),
        maxDays: Number(formData.maxDays),
        isActive: formData.isActive,
      };

      const method = editingZone ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/shipping', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setToast({ message: `Shipping zone ${editingZone ? 'updated' : 'created'} successfully!`, type: 'success' });
        setDrawerOpen(false);
        fetchZones();
      } else {
        setToast({ message: json.error || 'Failed to save zone', type: 'error' });
      }
    } catch {
      setToast({ message: 'Network error', type: 'error' });
    }
  };

  const filteredZones = zones.filter((z) => z.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="admin-page-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <PageHeader
        title="Shipping Zones & Delivery Rules"
        subtitle="Manage shipping tiers, weight charges, free shipping thresholds & delivery lead times"
        actionLabel="Add Shipping Zone"
        onAction={handleOpenCreate}
      />

      {/* Toolbar Search */}
      <div className="admin-table-toolbar mb-6">
        <div className="admin-search-input">
          <Search className="w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search shipping zones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Cards / Table List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredZones.map((zone) => (
          <div key={zone.id} className="admin-card relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-900 mb-2">
                  <Globe className="w-3 h-3" /> {zone.countries.join(', ')}
                </span>
                <h3 className="text-lg font-bold text-stone-900">{zone.name}</h3>
                <p className="text-xs text-stone-500 mt-1">{zone.description}</p>
              </div>

              <button
                onClick={() => handleOpenEdit(zone)}
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors text-stone-600"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>

            <hr className="my-4 border-stone-200" />

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-stone-400 block">Base Freight Charge</span>
                <span className="font-bold text-stone-800 text-sm">₹{zone.baseRate}</span>
              </div>
              <div>
                <span className="text-stone-400 block">Extra Weight Rate</span>
                <span className="font-bold text-stone-800 text-sm">₹{zone.perKgRate} / kg</span>
              </div>
              <div>
                <span className="text-stone-400 block">Free Shipping Threshold</span>
                <span className="font-bold text-emerald-700 text-sm">
                  {zone.freeAbove ? `Orders > ₹${zone.freeAbove}` : 'No Free Tier'}
                </span>
              </div>
              <div>
                <span className="text-stone-400 block">Est. Delivery Lead Time</span>
                <span className="font-bold text-stone-800 text-sm">{zone.minDays} - {zone.maxDays} Business Days</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Drawer Form */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingZone ? 'Edit Shipping Zone' : 'Create Shipping Zone'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Zone Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Domestic Express"
              className="admin-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Internal notes or customer details"
              className="admin-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Included Countries (Comma separated)</label>
            <input
              type="text"
              required
              value={formData.countries}
              onChange={(e) => setFormData({ ...formData, countries: e.target.value })}
              className="admin-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Base Rate (₹)</label>
              <input
                type="number"
                required
                value={formData.baseRate}
                onChange={(e) => setFormData({ ...formData, baseRate: Number(e.target.value) })}
                className="admin-input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Rate per Kg (₹)</label>
              <input
                type="number"
                required
                value={formData.perKgRate}
                onChange={(e) => setFormData({ ...formData, perKgRate: Number(e.target.value) })}
                className="admin-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Free Shipping Order Min (₹)</label>
            <input
              type="number"
              value={formData.freeAbove}
              onChange={(e) => setFormData({ ...formData, freeAbove: Number(e.target.value) })}
              placeholder="Leave 0 for no free shipping"
              className="admin-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Min Days</label>
              <input
                type="number"
                required
                value={formData.minDays}
                onChange={(e) => setFormData({ ...formData, minDays: Number(e.target.value) })}
                className="admin-input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Max Days</label>
              <input
                type="number"
                required
                value={formData.maxDays}
                onChange={(e) => setFormData({ ...formData, maxDays: Number(e.target.value) })}
                className="admin-input"
              />
            </div>
          </div>

          <div className="pt-4">
            <button type="submit" className="admin-btn-primary w-full justify-center">
              <Save className="w-4 h-4 mr-2" /> Save Shipping Zone
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
