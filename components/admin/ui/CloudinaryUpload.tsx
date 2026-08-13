// ============================================================
// BLENDIFY — Cloudinary Upload Component
// Direct browser-to-Cloudinary uploads with preview
// ============================================================
'use client';

import { useState, useRef, useCallback, useId } from 'react';
import { Upload, X, Image as ImageIcon, RefreshCw, AlertCircle } from 'lucide-react';

interface CloudinaryUploadProps {
  value?: string;
  onChange?: (url: string) => void;
  onUploadSuccess?: (url: string) => void;
  onRemove?: () => void;
  folder?: string;
  accept?: string;
  aspectRatio?: string;
  label?: string;
  hint?: string;
  id?: string;
}

export function CloudinaryUpload({
  value,
  onChange,
  onUploadSuccess,
  onRemove,
  folder = 'general',
  accept = 'image/*',
  aspectRatio = '16/9',
  label,
  hint,
  id,
}: CloudinaryUploadProps) {
  const handleUrlChange = useCallback((url: string) => {
    onChange?.(url);
    onUploadSuccess?.(url);
  }, [onChange, onUploadSuccess]);
  const uid = useId();
  const effectiveId = id ?? `cloudinary-upload-${uid}`;
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be under 10MB');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Get signed upload credentials from server
      const sigRes = await fetch(`/api/admin/cloudinary/sign?folder=${encodeURIComponent(folder)}`);
      if (!sigRes.ok) throw new Error('Failed to get upload credentials');

      const { signature, timestamp, cloudName, apiKey, folder: uploadFolder } = await sigRes.json();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signature);
      formData.append('timestamp', String(timestamp));
      formData.append('api_key', apiKey);
      formData.append('folder', uploadFolder);

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Upload failed');

      const data = await uploadRes.json();
      handleUrlChange(data.secure_url);
    } catch (e) {
      setError((e as Error).message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [folder, handleUrlChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {label && <label className="admin-label" htmlFor={effectiveId}>{label}</label>}

      {value ? (
        /* Preview state */
        <div className="admin-upload-preview" style={{ aspectRatio }}>
          <img src={value} alt="Uploaded preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div className="admin-upload-preview-actions">
            <button
              type="button"
              className="admin-btn admin-btn-secondary admin-btn-sm"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              id={`${effectiveId}-replace`}
            >
              {uploading ? <span className="admin-spinner" style={{ width: 12, height: 12 }} /> : <RefreshCw size={12} />}
              Replace
            </button>
            {onRemove && (
              <button
                type="button"
                className="admin-btn admin-btn-danger admin-btn-sm"
                onClick={onRemove}
                id={`${effectiveId}-remove`}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Drop zone */
        <div
          className={`admin-upload-zone ${dragOver ? 'drag-over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          aria-label={`Upload image${label ? ` for ${label}` : ''}`}
          id={effectiveId}
        >
          {uploading ? (
            <>
              <div className="admin-spinner" style={{ margin: '0 auto 8px' }} />
              <p className="admin-upload-zone-title">Uploading...</p>
            </>
          ) : (
            <>
              <div className="admin-upload-zone-icon">
                <ImageIcon size={24} />
              </div>
              <p className="admin-upload-zone-title">Drop image here or click to browse</p>
              <p className="admin-upload-zone-sub">PNG, JPG, WebP — max 10MB</p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-hidden="true"
      />

      {hint && !error && (
        <p style={{ fontSize: '11px', color: 'var(--admin-text-tertiary)', margin: 0 }}>{hint}</p>
      )}

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--admin-error)' }}>
          <AlertCircle size={13} />
          {error}
        </div>
      )}
    </div>
  );
}
