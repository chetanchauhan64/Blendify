import Link from 'next/link';
import { Share2, Link2, Rss, Play, Mail, MapPin, Phone, ArrowUpRight } from 'lucide-react';
import styles from './Footer.module.css';

const SHOP_LINKS = [
  { label: 'All Coffee',       href: '/shop' },
  { label: 'Instant Coffee',   href: '/collections/instant' },
  { label: 'Flavoured Coffee', href: '/collections/flavoured' },
  { label: 'Bundles',          href: '/collections/bundles' },
  { label: 'Gift Packs',       href: '/collections/gifts' },
  { label: 'Dark Roast',       href: '/collections/dark-roast' },
];

const SUPPORT_LINKS = [
  { label: 'Track Order',      href: '/track-order' },
  { label: 'FAQ',              href: '/faq' },
  { label: 'Shipping Policy',  href: '/shipping-policy' },
  { label: 'Refund Policy',    href: '/refund-policy' },
  { label: 'Contact Us',       href: '/contact' },
];

const COMPANY_LINKS = [
  { label: 'About Us',          href: '/about' },
  { label: 'Blog',              href: '/blog' },
  { label: 'Wholesale',         href: '/wholesale' },
  { label: 'Careers',           href: '/careers' },
  { label: 'Privacy Policy',    href: '/privacy-policy' },
  { label: 'Terms & Conditions', href: '/terms' },
];

const SOCIAL = [
  { icon: Share2, href: 'https://instagram.com', label: 'Instagram' },
  { icon: Link2,  href: 'https://twitter.com',   label: 'Twitter' },
  { icon: Rss,    href: 'https://facebook.com',  label: 'Facebook' },
  { icon: Play,   href: 'https://youtube.com',   label: 'YouTube' },
];

export function Footer() {
  return (
    <footer className={styles.footer} role="contentinfo">

      {/* Maroon divider line */}
      <div className={styles.topLine} />

      {/* Main grid */}
      <div className={styles.main}>
        <div className={`container ${styles.grid}`}>

          {/* Brand column */}
          <div className={styles.brand}>
            <Link href="/" className={styles.logo}>
              <span className={styles.logoIcon}>☕</span>
              <div>
                <div className={styles.logoText}>BLENDIFY</div>
                <div className={styles.logoTagline}>The Art of Coffee</div>
              </div>
            </Link>

            <p className={styles.brandDesc}>
              Premium specialty coffee, sourced from the world's finest farms and roasted with obsessive care. From a single farm to your cup.
            </p>

            <div className={styles.contact}>
              <a href="mailto:hello@blendify.coffee" className={styles.contactItem}>
                <Mail size={13} />
                hello@blendify.coffee
              </a>
              <a href="tel:+919876543210" className={styles.contactItem}>
                <Phone size={13} />
                +91 98765 43210
              </a>
              <span className={styles.contactItem}>
                <MapPin size={13} />
                Bengaluru · Mumbai · Delhi
              </span>
            </div>

            {/* Social */}
            <div className={styles.social}>
              {SOCIAL.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                  aria-label={label}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div className={styles.linkGroup}>
            <h3 className={styles.linkGroupTitle}>Shop</h3>
            <ul className={styles.linkList}>
              {SHOP_LINKS.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className={styles.link}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className={styles.linkGroup}>
            <h3 className={styles.linkGroupTitle}>Support</h3>
            <ul className={styles.linkList}>
              {SUPPORT_LINKS.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className={styles.link}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className={styles.linkGroup}>
            <h3 className={styles.linkGroupTitle}>Company</h3>
            <ul className={styles.linkList}>
              {COMPANY_LINKS.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className={styles.link}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter mini */}
          <div className={styles.linkGroup}>
            <h3 className={styles.linkGroupTitle}>Stay in the Loop</h3>
            <p className={styles.nlDesc}>Early drops. Exclusive deals. Brewing tips.</p>
            <a href="#newsletter" className={styles.nlBtn}>
              Join the BLENDIFY Club <ArrowUpRight size={13} />
            </a>
            <div className={styles.badges}>
              <span className={styles.badge}>🌱 USDA Organic</span>
              <span className={styles.badge}>🇮🇳 Made in India</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className={styles.bottom}>
        <div className={`container ${styles.bottomInner}`}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} BLENDIFY. All rights reserved. The Art of Coffee.
          </p>
          <div className={styles.paymentIcons}>
            {['Razorpay', 'UPI', 'Visa', 'Mastercard', 'COD'].map((p) => (
              <span key={p} className={styles.payIcon}>{p}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
