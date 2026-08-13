// ============================================================
// BLENDIFY — Admin Module: Cloudinary Media Library
// ============================================================
'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { CloudinaryUpload } from '@/components/admin/ui/CloudinaryUpload';
import { Toast } from '@/components/admin/ui/Toast';
import { FileImage, Image as ImageIcon, Search, Trash2, Copy, Filter } from 'lucide-react';

interface MediaAsset {
  id: string;
  url: string;
  name: string;
  sizeMb: number;
  format: string;
  folder: string;
}

export default function MediaLibraryPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([
    { id: '1', url: '/images/hero-bg.jpg', name: 'hero-roastery-background.jpg', sizeMb: 1.2, format: 'JPG', folder: 'banners' },
    { id: '2', url: '/images/bean-dark.png', name: 'espresso-dark-roast-mockup.png', sizeMb: 0.8, format: 'PNG', folder: 'products' },
    { id: '3', url: '/images/logo-dark.png', name: 'blendify-logo-dark.png', sizeMb: 0.2, format: 'PNG', folder: 'brand' },
  ]);

  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleUploadSuccess = (url: string) => {
    const filename = url.split('/').pop() || 'uploaded-asset.jpg';
    const newAsset: MediaAsset = {
      id: Date.now().toString(),
      url,
      name: filename,
      sizeMb: 0.5,
      format: filename.split('.').pop()?.toUpperCase() || 'JPG',
      folder: 'uploads',
    };
    setAssets([newAsset, ...assets]);
    setToast({ message: 'Media asset uploaded to Cloudinary!', type: 'success' });
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setToast({ message: 'URL copied to clipboard', type: 'success' });
  };

  const filtered = assets.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="admin-page-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader
        title="Cloudinary Media & Asset Library"
        subtitle="Upload, search, compress & manage product images, banners, and video assets"
      />

      {/* Cloudinary Uploader */}
      <div className="admin-card mb-6">
        <h3 className="font-bold text-stone-900 text-sm mb-3 flex items-center gap-2">
          <FileImage className="w-4 h-4 text-amber-700" /> Upload New Asset
        </h3>
        <CloudinaryUpload onUploadSuccess={handleUploadSuccess} />
      </div>

      {/* Filter Toolbar */}
      <div className="admin-table-toolbar mb-4">
        <div className="admin-search-input">
          <Search className="w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search media files by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Grid Display */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {filtered.map((asset) => (
          <div key={asset.id} className="admin-card p-2 border hover:border-amber-500 transition-all group">
            <div className="aspect-square bg-stone-100 rounded-lg flex items-center justify-center overflow-hidden mb-2 relative">
              <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
              <button
                onClick={() => copyUrl(asset.url)}
                className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-md shadow opacity-0 group-hover:opacity-100 transition-opacity text-stone-700"
                title="Copy URL"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="font-medium text-stone-800 text-xs truncate">{asset.name}</p>
            <div className="flex justify-between items-center text-[10px] text-stone-400 mt-1">
              <span className="uppercase">{asset.format} · {asset.sizeMb}MB</span>
              <span className="capitalize">{asset.folder}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
