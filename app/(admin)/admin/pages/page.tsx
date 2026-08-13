// ============================================================
// BLENDIFY — Admin Module: CMS Pages Manager
// ============================================================
'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Toast } from '@/components/admin/ui/Toast';
import { Drawer } from '@/components/admin/ui/Drawer';
import { File, Plus, Edit2, Trash2, Search, Save, Eye } from 'lucide-react';

interface PageItem {
  id: string;
  slug: string;
  title: string;
  content: string;
  isPublished: boolean;
  isSystem: boolean;
}

export default function PagesCmsPage() {
  const [pages, setPages] = useState<PageItem[]>([
    { id: 'p_1', slug: 'about', title: 'Our Story & Philosophy', content: '# About Blendify\nCraft roasters based in Bengaluru.', isPublished: true, isSystem: true },
    { id: 'p_2', slug: 'contact', title: 'Contact Us', content: '# Get in Touch\nhello@blendify.coffee', isPublished: true, isSystem: true },
    { id: 'p_3', slug: 'privacy', title: 'Privacy Policy', content: '# Privacy Policy\nYour data is protected.', isPublished: true, isSystem: true },
    { id: 'p_4', slug: 'refund', title: 'Refund Policy', content: '# Refund Terms\nContact support within 7 days.', isPublished: true, isSystem: true },
    { id: 'p_5', slug: 'shipping', title: 'Shipping Policy', content: '# Dispatch Lead Times\nPan India delivery in 2-4 days.', isPublished: true, isSystem: true },
    { id: 'p_6', slug: 'terms', title: 'Terms & Conditions', content: '# Store Terms\nBy using Blendify you agree.', isPublished: true, isSystem: true },
    { id: 'p_7', slug: 'careers', title: 'Join Our Roastery Team', content: '# Open Positions\nWe are hiring Q-graders & Baristas.', isPublished: true, isSystem: false },
  ]);

  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<PageItem | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({ title: '', slug: '', content: '', isPublished: true });

  const handleOpenCreate = () => {
    setEditingPage(null);
    setFormData({ title: '', slug: '', content: '', isPublished: true });
    setDrawerOpen(true);
  };

  const handleOpenEdit = (page: PageItem) => {
    setEditingPage(page);
    setFormData({ title: page.title, slug: page.slug, content: page.content, isPublished: page.isPublished });
    setDrawerOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPage) {
      setPages(pages.map((p) => (p.id === editingPage.id ? { ...p, ...formData } : p)));
      setToast({ message: 'Page content saved!', type: 'success' });
    } else {
      const newPage: PageItem = {
        id: `p_${Date.now()}`,
        slug: formData.slug || formData.title.toLowerCase().replace(/\s+/g, '-'),
        title: formData.title,
        content: formData.content,
        isPublished: formData.isPublished,
        isSystem: false,
      };
      setPages([...pages, newPage]);
      setToast({ message: 'New CMS page created!', type: 'success' });
    }
    setDrawerOpen(false);
  };

  const filtered = pages.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="admin-page-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader
        title="Static Pages CMS"
        subtitle="Manage About, Contact, Privacy, Terms, Refund, Careers & custom storefront pages"
        actionLabel="Create Page"
        onAction={handleOpenCreate}
      />

      <div className="admin-table-toolbar mb-4">
        <div className="admin-search-input">
          <Search className="w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search pages by title or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Page Title</th>
              <th>URL Slug</th>
              <th>Type</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td className="font-bold text-stone-900 flex items-center gap-2">
                  <File className="w-4 h-4 text-amber-700" /> {p.title}
                </td>
                <td className="font-mono text-xs text-stone-500">/{p.slug}</td>
                <td>
                  <span className="text-xs text-stone-500">{p.isSystem ? 'System Page' : 'Custom Page'}</span>
                </td>
                <td>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                      p.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {p.isPublished ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td>
                  <button onClick={() => handleOpenEdit(p)} className="p-1 hover:bg-stone-100 rounded text-stone-600">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={editingPage ? 'Edit CMS Page' : 'Create Custom Page'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Page Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="admin-input"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">URL Path Slug</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="admin-input font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Page Content (Markdown / HTML)</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={12}
              className="admin-textarea font-mono text-xs"
            />
          </div>
          <button type="submit" className="admin-btn-primary w-full justify-center">
            <Save className="w-4 h-4 mr-2" /> Save Page
          </button>
        </form>
      </Drawer>
    </div>
  );
}
