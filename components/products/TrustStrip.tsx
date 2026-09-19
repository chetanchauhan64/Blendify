import styles from './TrustStrip.module.css';

const TRUST_ITEMS = [
  {
    icon: '🚚',
    title: 'Free Shipping',
    desc: 'On orders above ₹499',
  },
  {
    icon: '💳',
    title: 'Cash on Delivery',
    desc: 'Available pan-India',
  },
  {
    icon: '🔒',
    title: 'Secure Payments',
    desc: 'UPI, cards & wallets',
  },
  {
    icon: '↩️',
    title: '7-Day Returns',
    desc: 'Hassle-free policy',
  },
  {
    icon: '🛡️',
    title: 'FSSAI Certified',
    desc: 'Lab-tested quality',
  },
];

export function TrustStrip() {
  return (
    <div className={styles.strip} role="list" aria-label="Service guarantees">
      {TRUST_ITEMS.map((item) => (
        <div key={item.title} className={styles.item} role="listitem">
          <span className={styles.icon} aria-hidden="true">{item.icon}</span>
          <div>
            <div className={styles.title}>{item.title}</div>
            <div className={styles.desc}>{item.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
