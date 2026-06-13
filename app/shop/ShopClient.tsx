'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X, SlidersHorizontal } from 'lucide-react';
import type { Product } from '@/types';
import { ProductCard } from '@/components/shop/ProductCard';
import { QuickViewModal } from '@/components/shop/QuickViewModal';
import styles from './ShopClient.module.css';


// ── Constants ────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: 'featured',   label: 'Featured' },
  { value: 'best-selling', label: 'Best Selling' },
  { value: 'new',        label: 'New Arrivals' },
  { value: 'price-asc',  label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating',     label: 'Highest Rated' },
];

const PRICE_OPTIONS = [
  { value: 'all',          label: 'All Prices' },
  { value: 'low-high',     label: 'Low to High' },
  { value: 'high-low',     label: 'High to Low' },
  { value: 'under-500',    label: 'Under ₹500' },
  { value: '500-1000',     label: '₹500 – ₹999' },
  { value: 'above-1000',   label: 'Above ₹999' },
];

const FLAVOUR_OPTIONS = [
  'All Flavours',
  'Mocha',
  'Vanilla',
  'Hazelnut',
  'Espresso',
  'Caramel',
  'Strawberry',
  'Irish Cream',
];

// ── Dropdown component ────────────────────────────────────────────

interface DropdownProps {
  label: string;
  value: string;
  options: string[] | { value: string; label: string }[];
  onChange: (v: string) => void;
  id: string;
}

function Dropdown({ label, value, options, onChange, id }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getLabel = (v: string) => {
    for (const o of options) {
      if (typeof o === 'string') { if (o === v) return o; }
      else { if (o.value === v) return o.label; }
    }
    return v;
  };

  const isDefault = value === (
    typeof options[0] === 'string' ? options[0] : (options[0] as { value: string }).value
  );

  return (
    <div className={styles.dropdown} ref={ref}>
      <button
        id={id}
        className={`${styles.dropdownTrigger} ${!isDefault ? styles.dropdownTriggerActive : ''}`}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span>{isDefault ? label : getLabel(value)}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}>
          <ChevronDown size={14} strokeWidth={2.5} />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.dropdownMenu}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            role="listbox"
          >
            {options.map((o) => {
              const val = typeof o === 'string' ? o : o.value;
              const lbl = typeof o === 'string' ? o : o.label;
              return (
                <button
                  key={val}
                  className={`${styles.dropdownItem} ${value === val ? styles.dropdownItemActive : ''}`}
                  role="option"
                  aria-selected={value === val}
                  onClick={() => { onChange(val); setOpen(false); }}
                >
                  {lbl}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Toggle Switch ─────────────────────────────────────────────────

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}

function Toggle({ checked, onChange, id }: ToggleProps) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      className={`${styles.toggle} ${checked ? styles.toggleOn : ''}`}
      onClick={() => onChange(!checked)}
    >
      <motion.span
        className={styles.toggleThumb}
        animate={{ x: checked ? 18 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────

interface Props {
  products: Product[];
  collections?: unknown[];
}

// INR conversion rate (matches currency store default for IN region)
const INR_RATE = 83.5;

export function ShopClient({ products }: Props) {
  const [sort,             setSort]            = useState('featured');
  const [inStockOnly,      setInStockOnly]      = useState(false);
  const [priceFilter,      setPriceFilter]      = useState('all');
  const [flavour,          setFlavour]          = useState('All Flavours');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Derive active chips for display
  const chips: { label: string; clear: () => void }[] = [];
  if (inStockOnly)                   chips.push({ label: 'In Stock',    clear: () => setInStockOnly(false) });
  if (priceFilter !== 'all')         chips.push({ label: PRICE_OPTIONS.find(o => o.value === priceFilter)?.label ?? priceFilter, clear: () => setPriceFilter('all') });
  if (flavour !== 'All Flavours')    chips.push({ label: flavour,       clear: () => setFlavour('All Flavours') });

  const filtered = useMemo(() => {
    let result = [...products];

    // In stock filter
    if (inStockOnly) {
      result = result.filter((p) =>
        p.variants.some((v) => v.inventory > 0)
      );
    }

    // Flavour filter — match by tag or name
    if (flavour !== 'All Flavours') {
      const f = flavour.toLowerCase();
      result = result.filter((p) =>
        p.name.toLowerCase().includes(f) ||
        p.tags.some((t) => t.toLowerCase().includes(f))
      );
    }

    // Price filter (convert USD basePrice to INR for comparison)
    if (priceFilter === 'under-500') {
      result = result.filter((p) => p.basePrice * INR_RATE < 500);
    } else if (priceFilter === '500-1000') {
      result = result.filter((p) => {
        const inr = p.basePrice * INR_RATE;
        return inr >= 500 && inr < 1000;
      });
    } else if (priceFilter === 'above-1000') {
      result = result.filter((p) => p.basePrice * INR_RATE >= 1000);
    }

    // Sort
    switch (sort) {
      case 'best-selling': result.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0)); break;
      case 'price-asc':
      case 'low-high':     result.sort((a, b) => a.basePrice - b.basePrice); break;
      case 'price-desc':
      case 'high-low':     result.sort((a, b) => b.basePrice - a.basePrice); break;
      case 'rating':       result.sort((a, b) => b.rating - a.rating); break;
      case 'new':          result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)); break;
      default:             result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0)); break;
    }

    return result;
  }, [products, inStockOnly, flavour, priceFilter, sort]);

  return (
    <div className={styles.page}>
      {/* ── Filter Bar ────────────────────────────────────── */}
      <div className={styles.filterBar}>
        <div className={styles.filterBarInner}>

          {/* Left: In Stock toggle */}
          <div className={styles.filterLeft}>
            <label htmlFor="instock-toggle" className={styles.toggleLabel}>
              In stock only
            </label>
            <Toggle
              id="instock-toggle"
              checked={inStockOnly}
              onChange={setInStockOnly}
            />
          </div>

          {/* Center: Price + Flavours dropdowns */}
          <div className={styles.filterCenter}>
            <Dropdown
              id="price-filter"
              label="Price"
              value={priceFilter}
              options={PRICE_OPTIONS}
              onChange={setPriceFilter}
            />
            <Dropdown
              id="flavour-filter"
              label="Flavours"
              value={flavour}
              options={FLAVOUR_OPTIONS}
              onChange={setFlavour}
            />
          </div>

          {/* Right: Sort by */}
          <div className={styles.filterRight}>
            <span className={styles.sortLabel}>Sort by:</span>
            <Dropdown
              id="sort-by"
              label="Featured"
              value={sort}
              options={SORT_OPTIONS}
              onChange={setSort}
            />
          </div>

        </div>
      </div>

      {/* ── Active Filter Chips ───────────────────────────── */}
      <AnimatePresence>
        {chips.length > 0 && (
          <motion.div
            className={styles.chipRow}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className={styles.chipRowInner}>
              {chips.map((chip) => (
                <motion.button
                  key={chip.label}
                  className={styles.chip}
                  onClick={chip.clear}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.15 }}
                >
                  {chip.label}
                  <X size={12} strokeWidth={2.5} />
                </motion.button>
              ))}

              {chips.length > 1 && (
                <button
                  className={styles.clearAll}
                  onClick={() => {
                    setInStockOnly(false);
                    setPriceFilter('all');
                    setFlavour('All Flavours');
                  }}
                >
                  Clear all
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Product Grid ──────────────────────────────────── */}
      <div className={styles.gridWrapper}>
        <div className={styles.grid}>
          {filtered.length === 0 ? (
            <div className={styles.empty}>
              <SlidersHorizontal size={44} strokeWidth={1} />
              <h3>No products found.</h3>
              <p>Try adjusting or removing your filters.</p>
              <button
                className={styles.clearFiltersBtn}
                onClick={() => {
                  setInStockOnly(false);
                  setPriceFilter('all');
                  setFlavour('All Flavours');
                }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            filtered.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                index={i}
                onQuickView={setQuickViewProduct}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Quick View Modal ────────────────────────────── */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}
