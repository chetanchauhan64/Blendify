'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Filter, SlidersHorizontal, X } from 'lucide-react';
import type { Product, Collection } from '@/types';
import { ProductCard } from '@/components/shop/ProductCard';
import styles from './ShopClient.module.css';

interface Props {
  products: Product[];
  collections: Collection[];
}

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'new', label: 'New Arrivals' },
];

const ROAST_FILTERS = ['light', 'medium', 'medium-dark', 'dark', 'extra-dark'];
const FORMAT_FILTERS = ['bag', 'bottle', 'capsule', 'kit'];

export function ShopClient({ products, collections }: Props) {
  const [sort, setSort] = useState('featured');
  const [activeCollections, setActiveCollections] = useState<string[]>([]);
  const [activeRoasts, setActiveRoasts] = useState<string[]>([]);
  const [activeFormats, setActiveFormats] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const toggleFilter = (list: string[], setList: (v: string[]) => void, val: string) => {
    setList(list.includes(val) ? list.filter((v) => v !== val) : [...list, val]);
  };

  const filtered = useMemo(() => {
    let result = [...products];

    if (activeCollections.length > 0) {
      result = result.filter((p) => p.collections.some((c) => activeCollections.includes(c)));
    }
    if (activeRoasts.length > 0) {
      result = result.filter((p) => activeRoasts.includes(p.roastLevel));
    }
    if (activeFormats.length > 0) {
      result = result.filter((p) => activeFormats.includes(p.format));
    }

    switch (sort) {
      case 'price-asc': result.sort((a, b) => a.basePrice - b.basePrice); break;
      case 'price-desc': result.sort((a, b) => b.basePrice - a.basePrice); break;
      case 'rating': result.sort((a, b) => b.rating - a.rating); break;
      case 'new': result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)); break;
      default: result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0)); break;
    }

    return result;
  }, [products, activeCollections, activeRoasts, activeFormats, sort]);

  const activeFilterCount = activeCollections.length + activeRoasts.length + activeFormats.length;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.hero}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="section-label">Explore</span>
            <h1 className={styles.heroTitle}>All Coffee</h1>
            <p className={styles.heroSub}>{filtered.length} coffees · From {products.length} origins</p>
          </motion.div>
        </div>
      </div>

      <div className={`container ${styles.content}`}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <button
            id="shop-filter-toggle"
            className={`btn btn--glass ${styles.filterBtn}`}
            onClick={() => setFiltersOpen(!filtersOpen)}
            aria-expanded={filtersOpen}
          >
            <SlidersHorizontal size={16} />
            Filters
            {activeFilterCount > 0 && (
              <span className={styles.filterCount}>{activeFilterCount}</span>
            )}
          </button>

          <div className={styles.activeFilters}>
            {activeCollections.map((c) => (
              <button key={c} className={styles.activeFilter} onClick={() => toggleFilter(activeCollections, setActiveCollections, c)}>
                {c} <X size={12} />
              </button>
            ))}
            {activeRoasts.map((r) => (
              <button key={r} className={styles.activeFilter} onClick={() => toggleFilter(activeRoasts, setActiveRoasts, r)}>
                {r} <X size={12} />
              </button>
            ))}
          </div>

          <div className={styles.sortWrapper}>
            <label htmlFor="shop-sort" className="sr-only">Sort by</label>
            <select
              id="shop-sort"
              className={styles.sortSelect}
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.layout}>
          {/* Sidebar */}
          {filtersOpen && (
            <motion.aside
              className={styles.sidebar}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              aria-label="Filters"
            >
              {/* Collections */}
              <div className={styles.filterGroup}>
                <h3 className={styles.filterTitle}>Collection</h3>
                <div className={styles.filterOptions}>
                  {collections.map((c) => (
                    <label key={c.id} className={styles.filterOption}>
                      <input
                        type="checkbox"
                        checked={activeCollections.includes(c.slug)}
                        onChange={() => toggleFilter(activeCollections, setActiveCollections, c.slug)}
                        className={styles.filterCheckbox}
                        aria-label={c.name}
                      />
                      <span>{c.name}</span>
                      <span className={styles.filterOptionCount}>{c.productCount}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Roast Level */}
              <div className={styles.filterGroup}>
                <h3 className={styles.filterTitle}>Roast Level</h3>
                <div className={styles.filterOptions}>
                  {ROAST_FILTERS.map((r) => (
                    <label key={r} className={styles.filterOption}>
                      <input
                        type="checkbox"
                        checked={activeRoasts.includes(r)}
                        onChange={() => toggleFilter(activeRoasts, setActiveRoasts, r)}
                        className={styles.filterCheckbox}
                        aria-label={r}
                      />
                      <span className={styles.capitalize}>{r.replace('-', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Format */}
              <div className={styles.filterGroup}>
                <h3 className={styles.filterTitle}>Format</h3>
                <div className={styles.filterOptions}>
                  {FORMAT_FILTERS.map((f) => (
                    <label key={f} className={styles.filterOption}>
                      <input
                        type="checkbox"
                        checked={activeFormats.includes(f)}
                        onChange={() => toggleFilter(activeFormats, setActiveFormats, f)}
                        className={styles.filterCheckbox}
                        aria-label={f}
                      />
                      <span className={styles.capitalize}>{f}</span>
                    </label>
                  ))}
                </div>
              </div>

              {activeFilterCount > 0 && (
                <button
                  className="btn btn--ghost"
                  style={{ width: '100%', justifyContent: 'center', marginTop: 'var(--space-2)' }}
                  onClick={() => { setActiveCollections([]); setActiveRoasts([]); setActiveFormats([]); }}
                >
                  Clear All Filters
                </button>
              )}
            </motion.aside>
          )}

          {/* Products */}
          <div className={`${styles.grid} ${filtersOpen ? styles.gridNarrow : ''}`}>
            {filtered.length === 0 ? (
              <div className={styles.empty}>
                <Filter size={48} strokeWidth={1} />
                <h3>No products match your filters</h3>
                <p>Try adjusting your filters or clearing them.</p>
              </div>
            ) : (
              filtered.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
