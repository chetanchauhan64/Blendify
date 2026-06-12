'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, User, Menu, X, ChevronDown, Heart } from 'lucide-react';
import { useCartStore } from '@/lib/store/cartStore';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { useRegionStore } from '@/lib/store/regionStore';
import { REGIONS } from '@/lib/currency';
import type { Region } from '@/types';
import { AnnouncementBar } from './AnnouncementBar';
import styles from './Navbar.module.css';

// ── Nav links ─────────────────────────────────────────────────
const NAV_LINKS = [
  { label: 'Home',       href: '/' },
  {
    label: 'Shop',
    href: '/shop',
    children: [
      { label: 'All Coffee',       href: '/shop' },
      { label: 'Instant Coffee',   href: '/collections/instant' },
      { label: 'Flavoured Coffee', href: '/collections/flavoured' },
      { label: 'Bundles',          href: '/collections/bundles' },
      { label: 'Gift Packs',       href: '/collections/gifts' },
    ],
  },
  {
    label: 'Categories',
    href: '/collections',
    children: [
      { label: 'Dark Roast',   href: '/collections/dark-roast' },
      { label: 'Medium Roast', href: '/collections/medium-roast' },
      { label: 'Light Roast',  href: '/collections/light-roast' },
      { label: 'Cold Brew',    href: '/collections/cold-brew' },
    ],
  },
  { label: 'About',   href: '/about' },
  { label: 'Contact', href: '/contact' },
];

const REGION_LIST = Object.values(REGIONS).filter((r) => r.code !== 'GLOBAL');

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled]             = useState(false);
  const [mobileOpen, setMobileOpen]         = useState(false);
  const [regionOpen, setRegionOpen]         = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchOpen, setSearchOpen]         = useState(false);
  const [searchQuery, setSearchQuery]       = useState('');
  // ── Hydration fix: defer client-only store values ──────────
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const dropdownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cartCount     = useCartStore((s) => s.itemCount());
  const wishlistCount = useWishlistStore((s) => s.itemCount());
  const toggleCart    = useCartStore((s) => s.toggleCart);
  const { region, currency, setRegion } = useRegionStore();
  const currentRegion = REGIONS[region];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleDropdownEnter = (label: string) => {
    if (dropdownTimer.current) clearTimeout(dropdownTimer.current);
    setActiveDropdown(label);
  };

  const handleDropdownLeave = () => {
    dropdownTimer.current = setTimeout(() => setActiveDropdown(null), 120);
  };

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      <AnnouncementBar />

      {/* ── Main Navbar ─────────────────────────────────────── */}
      <nav
        className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className={styles.inner}>

          {/* Logo */}
          <Link href="/" className={styles.logo} aria-label="BLENDIFY — Home">
            <div className={styles.logoMark}>
              <svg width="32" height="32" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                <circle cx="20" cy="20" r="18" fill="rgba(88,19,18,0.08)" stroke="#581312" strokeWidth="1.5"/>
                <path d="M13 20c0-4 3.5-7 7-7s7 3 7 7" stroke="#581312" strokeWidth="2" strokeLinecap="round"/>
                <path d="M10 26h20M14 30h12" stroke="#581312" strokeWidth="2" strokeLinecap="round"/>
                <path d="M27 16c2 0 4 1 4 3s-2 3-4 3" stroke="#8B3030" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              </svg>
              <div className={styles.logoWords}>
                <span className={styles.logoMain}>BLENDIFY</span>
                <span className={styles.logoSub}>The Art of Coffee</span>
              </div>
            </div>
          </Link>

          {/* Center Nav Links */}
          <ul className={styles.navLinks} role="menubar">
            {NAV_LINKS.map((link) => (
              <li
                key={link.label}
                className={styles.navItem}
                onMouseEnter={() => link.children && handleDropdownEnter(link.label)}
                onMouseLeave={handleDropdownLeave}
                role="none"
              >
                <Link
                  href={link.href}
                  className={`${styles.navLink} ${isActive(link.href) ? styles.navLinkActive : ''}`}
                  role="menuitem"
                >
                  {link.label}
                  {link.children && <ChevronDown size={13} className={styles.navChevron} />}
                </Link>

                {link.children && (
                  <AnimatePresence>
                    {activeDropdown === link.label && (
                      <motion.div
                        className={styles.dropdown}
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                        onMouseEnter={() => handleDropdownEnter(link.label)}
                        onMouseLeave={handleDropdownLeave}
                      >
                        {link.children.map((child) => (
                          <Link
                            key={child.label}
                            href={child.href}
                            className={styles.dropdownItem}
                            onClick={() => setActiveDropdown(null)}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </li>
            ))}
          </ul>

          {/* Right Actions */}
          <div className={styles.actions}>

            {/* Region / Currency */}
            <div className={styles.regionWrapper}>
              <button
                id="region-selector"
                className={styles.regionBtn}
                onClick={() => setRegionOpen(!regionOpen)}
                aria-label="Select region"
                aria-expanded={regionOpen}
              >
                <span>{currentRegion.flag}</span>
                <span className={styles.regionCode}>{currency}</span>
                <ChevronDown size={11} />
              </button>

              <AnimatePresence>
                {regionOpen && (
                  <motion.div
                    className={styles.regionPanel}
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.18 }}
                  >
                    <p className={styles.regionPanelTitle}>Region & Currency</p>
                    <div className={styles.regionGrid}>
                      {REGION_LIST.map((r) => (
                        <button
                          key={r.code}
                          className={`${styles.regionOption} ${region === r.code ? styles.regionOptionActive : ''}`}
                          onClick={() => { setRegion(r.code as Region); setRegionOpen(false); }}
                        >
                          <span>{r.flag}</span>
                          <span>{r.name}</span>
                          <span className={styles.regionCurrency}>{r.currency}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Search */}
            <button className={styles.iconBtn} onClick={() => setSearchOpen(!searchOpen)} aria-label="Search">
              <Search size={18} />
            </button>

            {/* Wishlist */}
            <Link href="/wishlist" className={styles.iconBtn} aria-label="Wishlist">
              <Heart size={18} />
              {/* mounted guard prevents hydration mismatch */}
              {mounted && wishlistCount > 0 && (
                <span className={styles.badge}>{wishlistCount}</span>
              )}
            </Link>

            {/* Account */}
            <Link href="/account" className={styles.iconBtn} aria-label="My account">
              <User size={18} />
            </Link>

            {/* Cart — suppressHydrationWarning on aria-label + mounted guard on badge */}
            <button
              id="cart-toggle"
              className={`${styles.iconBtn} ${styles.cartBtn}`}
              onClick={toggleCart}
              aria-label={mounted ? `Open cart (${cartCount} items)` : 'Open cart'}
              suppressHydrationWarning
            >
              <ShoppingBag size={18} />
              {mounted && cartCount > 0 && (
                <motion.span
                  className={styles.badge}
                  key={cartCount}
                  initial={{ scale: 1.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  {cartCount}
                </motion.span>
              )}
            </button>

            {/* Mobile toggle */}
            <button
              className={`${styles.iconBtn} ${styles.mobileOnly}`}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              className={styles.searchBar}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
            >
              <div className={styles.searchInner}>
                <Search size={16} className={styles.searchIcon} />
                <input
                  autoFocus
                  type="search"
                  placeholder="Search coffees, collections, flavours…"
                  className={styles.searchInput}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className={styles.searchClose} onClick={() => { setSearchOpen(false); setSearchQuery(''); }}>
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── Mobile Menu ─────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              className={styles.mobileMenu}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            >
              <div className={styles.mobileMenuInner}>
                <div className={styles.mobileHeader}>
                  <span className={styles.mobileLogo}>BLENDIFY</span>
                  <button className={styles.mobileClose} onClick={() => setMobileOpen(false)} aria-label="Close menu">
                    <X size={20} />
                  </button>
                </div>
                <nav>
                  {NAV_LINKS.map((link, i) => (
                    <motion.div
                      key={link.label}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                    >
                      <Link
                        href={link.href}
                        className={`${styles.mobileNavLink} ${isActive(link.href) ? styles.mobileNavLinkActive : ''}`}
                        onClick={() => setMobileOpen(false)}
                      >
                        {link.label}
                      </Link>
                      {link.children && (
                        <div className={styles.mobileSubLinks}>
                          {link.children.map((child) => (
                            <Link
                              key={child.label}
                              href={child.href}
                              className={styles.mobileSubLink}
                              onClick={() => setMobileOpen(false)}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                  <div className={styles.mobileDivider} />
                  <Link href="/account" className={styles.mobileNavLink} onClick={() => setMobileOpen(false)}>My Account</Link>
                  <Link href="/wishlist" className={styles.mobileNavLink} onClick={() => setMobileOpen(false)}>Wishlist</Link>
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Backdrop for region panel */}
      {regionOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 'calc(var(--z-dropdown) - 1)' } as React.CSSProperties}
          onClick={() => setRegionOpen(false)}
        />
      )}
    </>
  );
}
