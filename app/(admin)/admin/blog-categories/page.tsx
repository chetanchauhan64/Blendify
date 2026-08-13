// ============================================================
// BLENDIFY — Admin Module: Blog Categories CRUD
// ============================================================
'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Toast } from '@/components/admin/ui/Toast';
import { Drawer } from '@/components/admin/ui/Drawer';
import { FolderTree, Plus, Edit2, Trash2, Search, Save } from 'lucide-react';

interface BlogCat {
  id: string;
  name: string;
  slug: string;
  description: string;
  postCount: number;
  isActive: boolean;
}

export default function BlogCategoriesPage() {
  const [categories, setCategories] = useState<BlogCat[]>([
    { id: 'bc_1', name: 'Brewing Guides', slug: 'brewing-guides', description: 'Pour-over, Aeropress & Espresso step-by-step recipes', postCount: 12, isActive: true },
    { id: 'bc_2', name: 'Origin Stories', slug: 'origin-stories', description: 'Visits to coffee estates of Coorg, Chikmagalur & Yercaud', postCount: 8, isActive: true },
    { id: 'bc_3', name: 'Roasting Science', slug: 'roasting-science', description: 'Maillard reaction, roast profiles & first crack chemistry', postCount: 5, isActive: true },
  ]);

  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<BlogCat | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({ name: '', slug: '', description: '', isActive: true });

  const handleOpenCreate = () => {
    setEditingCat(null);
    setFormData({ name: '', slug: '', description: '', isActive: true });
    setDrawerOpen(true);
  };

  const handleOpenEdit = (cat: BlogCat) => {
    setEditingCat(cat);
    setFormData({ name: cat.name, slug: cat.slug, description: cat.description, isActive: cat.isActive });
    setDrawerOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCat) {
      setCategories(categories.map((c) => (c.id === editingCat.id ? { ...c, ...formData } : c)));
      setToast({ message: 'Blog category updated!', type: 'success' });
    } else {
      const newCat: BlogCat = {
        id: `bc_${Date.now()}`,
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
        description: formData.description,
        postCount: 0,
        isActive: formData.isActive,
      };
      setCategories([newCat, ...categories]);
      setToast({ message: 'Blog category created!', type: 'success' });
    }
    setDrawerOpen(false);
  };

  const filtered = categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="admin-page-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader
        title="Blog Categories"
        subtitle="Manage coffee journal & brewing guide article categories"
        actionLabel="Create Category"
        onAction={handleOpenCreate}
      />

      <div className="admin-table-toolbar mb-4">
        <div className="admin-search-input">
          <Search className="w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Category Name</th>
              <th>Slug</th>
              <th>Description</th>
              <th>Published Posts</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td className="font-bold text-stone-900 flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-amber-700" /> {c.name}
                </td>
                <td className="font-mono text-xs text-stone-500">{c.slug}</td>
                <td className="text-xs text-stone-600 max-w-xs truncate">{c.description}</td>
                <td className="font-semibold text-stone-800">{c.postCount} Articles</td>
                <td>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                      c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {c.isActive ? 'Active' : 'Hidden'}
                  </span>
                </td>
                <td>
                  <button onClick={() => handleOpenEdit(c)} className="p-1 hover:bg-stone-100 rounded text-stone-600">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={editingCat ? 'Edit Category' : 'Create Blog Category'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Category Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="admin-input"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">URL Slug</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="admin-input font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="admin-textarea"
            />
          </div>
          <button type="submit" className="admin-btn-primary w-full justify-center">
            <Save className="w-4 h-4 mr-2" /> Save Category
          </button>
        </form>
      </Drawer>
    </div>
  );
}
