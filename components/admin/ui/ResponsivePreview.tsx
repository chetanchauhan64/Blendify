// ============================================================
// BLENDIFY — Responsive Preview Component
// Desktop / Mobile preview for banners and announcement bars
// ============================================================
'use client';

import { useState } from 'react';
import { Monitor, Smartphone } from 'lucide-react';

interface ResponsivePreviewProps {
  desktopContent: React.ReactNode;
  mobileContent?: React.ReactNode;
  label?: string;
}

export function ResponsivePreview({ desktopContent, mobileContent, label = 'Preview' }: ResponsivePreviewProps) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');

  return (
    <div className="admin-preview-panel">
      <div className="admin-preview-tabs">
        <span style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 500, color: 'var(--admin-text-tertiary)', borderBottom: '1px solid var(--admin-border)' }}>
          {label}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex' }}>
          <button
            className={`admin-preview-tab ${device === 'desktop' ? 'active' : ''}`}
            onClick={() => setDevice('desktop')}
            id="preview-tab-desktop"
            type="button"
          >
            <Monitor size={14} style={{ display: 'inline', marginRight: '4px' }} />
            Desktop
          </button>
          <button
            className={`admin-preview-tab ${device === 'mobile' ? 'active' : ''}`}
            onClick={() => setDevice('mobile')}
            id="preview-tab-mobile"
            type="button"
          >
            <Smartphone size={14} style={{ display: 'inline', marginRight: '4px' }} />
            Mobile
          </button>
        </div>
      </div>
      <div style={{ padding: '16px', background: '#e5e7eb' }}>
        <div className={`admin-preview-frame ${device}`} style={{ borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {device === 'mobile' && mobileContent ? mobileContent : desktopContent}
        </div>
      </div>
    </div>
  );
}

/* Announcement Bar Preview */
interface AnnouncementPreviewProps {
  message: string;
  backgroundColor: string;
  textColor: string;
  linkText?: string;
  linkUrl?: string;
  mobile?: boolean;
}

export function AnnouncementBarPreview({ message, backgroundColor, textColor, linkText, linkUrl, mobile = false }: AnnouncementPreviewProps) {
  return (
    <div style={{
      backgroundColor,
      color: textColor,
      padding: mobile ? '6px 12px' : '8px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontSize: mobile ? '11px' : '13px',
      fontFamily: 'Inter, sans-serif',
      fontWeight: 500,
    }}>
      <span>{message}</span>
      {linkText && linkUrl && (
        <a
          href={linkUrl}
          style={{ color: textColor, fontWeight: 600, textDecoration: 'underline', fontSize: 'inherit' }}
          onClick={(e) => e.preventDefault()}
        >
          {linkText}
        </a>
      )}
    </div>
  );
}

/* Banner Preview */
interface BannerPreviewProps {
  title: string;
  subtitle?: string;
  imageUrl: string;
  ctaText?: string;
  textPosition?: 'left' | 'center' | 'right';
  textColor?: string;
  overlayOpacity?: number;
  badge?: string;
  mobile?: boolean;
}

export function BannerPreview({
  title, subtitle, imageUrl, ctaText, textPosition = 'left',
  textColor = '#ffffff', overlayOpacity = 0.4, badge, mobile = false,
}: BannerPreviewProps) {
  const alignMap = { left: 'flex-start', center: 'center', right: 'flex-end' };
  const textAlignMap = { left: 'left', center: 'center', right: 'right' };

  return (
    <div style={{
      position: 'relative',
      aspectRatio: mobile ? '4/3' : '21/9',
      overflow: 'hidden',
      background: '#1a1a2e',
    }}>
      {imageUrl && (
        <img
          src={imageUrl}
          alt={title}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
      <div style={{
        position: 'absolute', inset: 0,
        background: `rgba(0,0,0,${overlayOpacity})`,
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: alignMap[textPosition],
        justifyContent: 'center',
        padding: mobile ? '16px' : '24px 48px',
        color: textColor,
        fontFamily: 'Inter, sans-serif',
        textAlign: textAlignMap[textPosition] as 'left' | 'center' | 'right',
      }}>
        {badge && (
          <div style={{
            display: 'inline-block', background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '100px', padding: '3px 10px', fontSize: mobile ? '9px' : '11px',
            fontWeight: 600, letterSpacing: '0.5px', marginBottom: '8px',
          }}>
            {badge}
          </div>
        )}
        <div style={{ fontSize: mobile ? '16px' : '28px', fontWeight: 700, lineHeight: 1.2, marginBottom: '6px', letterSpacing: '-0.5px' }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: mobile ? '11px' : '14px', opacity: 0.85, marginBottom: '12px' }}>{subtitle}</div>
        )}
        {ctaText && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: textColor, color: '#111', borderRadius: '8px',
            padding: mobile ? '5px 12px' : '8px 20px', fontSize: mobile ? '11px' : '13px',
            fontWeight: 600, cursor: 'pointer',
          }}>
            {ctaText}
          </div>
        )}
      </div>
    </div>
  );
}
