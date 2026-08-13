// ============================================================
// BLENDIFY — Global Search Component
// ============================================================
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Star, Tag, Zap, Package2, Gift, Coins, Users, Mail, Bell, Megaphone, Image, Layers, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const MODULES = [
  { key: 'reviews', label: 'Reviews', href: '/admin/reviews', icon: Star },
  { key: 'coupons', label: 'Coupons', href: '/admin/coupons', icon: Tag },
  { key: 'discounts', label: 'Discount Rules', href: '/admin/discounts', icon: Zap },
  { key: 'flash-sales', label: 'Flash Sales', href: '/admin/flash-sales', icon: Zap },
  { key: 'bundles', label: 'Bundles', href: '/admin/bundles', icon: Package2 },
  { key: 'gift-cards', label: 'Gift Cards', href: '/admin/gift-cards', icon: Gift },
  { key: 'loyalty', label: 'Loyalty Program', href: '/admin/loyalty', icon: Coins },
  { key: 'referrals', label: 'Referral Program', href: '/admin/referrals', icon: Users },
  { key: 'newsletter', label: 'Newsletter', href: '/admin/newsletter', icon: Mail },
  { key: 'email-campaigns', label: 'Email Campaigns', href: '/admin/email-campaigns', icon: Mail },
  { key: 'push-notifications', label: 'Push Notifications', href: '/admin/push-notifications', icon: Bell },
  { key: 'announcement-bars', label: 'Announcements', href: '/admin/announcement-bars', icon: Megaphone },
  { key: 'banners', label: 'Homepage Banners', href: '/admin/banners', icon: Image },
  { key: 'popups', label: 'Popup Campaigns', href: '/admin/popups', icon: Layers },
];

interface SearchResult {
  type: 'module' | 'record';
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
}

interface GlobalSearchProps {
  onClose: () => void;
}

export function GlobalSearch({ onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Filter modules locally
  useEffect(() => {
    if (!query.trim()) {
      setResults(MODULES.map((m) => ({
        type: 'module' as const,
        label: m.label,
        description: 'Go to module',
        href: m.href,
        icon: m.icon,
      })));
      setSelected(0);
      return;
    }

    const q = query.toLowerCase();
    const moduleResults: SearchResult[] = MODULES
      .filter((m) => m.label.toLowerCase().includes(q) || m.key.includes(q))
      .map((m) => ({
        type: 'module' as const,
        label: m.label,
        description: 'Go to module',
        href: m.href,
        icon: m.icon,
      }));

    setResults(moduleResults);
    setSelected(0);

    // Also search across API for records
    if (query.length >= 2) {
      setLoading(true);
      fetch(`/api/admin/search?query=${encodeURIComponent(query)}&limit=8`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            const apiResults: SearchResult[] = data.results.map((r: { module: string; label: string; description: string; href: string }) => {
              const mod = MODULES.find((m) => m.key === r.module);
              return {
                type: 'record' as const,
                label: r.label,
                description: r.description,
                href: r.href,
                icon: mod?.icon ?? Search,
              };
            });
            setResults([...moduleResults, ...apiResults]);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [query]);

  const navigate = useCallback((href: string) => {
    router.push(href);
    onClose();
  }, [router, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selected]) {
      navigate(results[selected].href);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="admin-global-search" onClick={onClose} role="dialog" aria-modal="true" aria-label="Global search">
      <div className="admin-global-search-box" onClick={(e) => e.stopPropagation()}>
        {/* Input */}
        <div className="admin-global-search-input-row">
          <Search size={16} style={{ color: 'var(--admin-text-tertiary)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            className="admin-global-search-input"
            placeholder="Search modules, coupons, campaigns..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            id="admin-global-search-input"
            autoComplete="off"
          />
          {loading && <div className="admin-spinner" style={{ width: 16, height: 16 }} />}
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-text-tertiary)', display: 'flex' }}
            aria-label="Close search"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="admin-global-search-results" role="listbox" aria-label="Search results">
            {results.length > 0 && query && (
              <div style={{ padding: '6px 16px 4px', fontSize: '10px', color: 'var(--admin-text-tertiary)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                {results.filter((r) => r.type === 'module').length > 0 ? 'Modules' : 'Results'}
              </div>
            )}
            {results.map((result, i) => {
              const Icon = result.icon;
              return (
                <div
                  key={`${result.href}-${i}`}
                  className="admin-search-result-item"
                  style={i === selected ? { background: 'var(--admin-surface-raised)' } : {}}
                  onClick={() => navigate(result.href)}
                  role="option"
                  aria-selected={i === selected}
                  id={`admin-search-result-${i}`}
                >
                  <div className="admin-search-result-icon">
                    <Icon size={14} />
                  </div>
                  <div className="admin-search-result-info">
                    <div className="admin-search-result-title">{result.label}</div>
                    <div className="admin-search-result-module">{result.description}</div>
                  </div>
                  <ArrowRight size={12} style={{ color: 'var(--admin-text-tertiary)', flexShrink: 0 }} />
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="admin-global-search-footer">
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
