import styles from '../loading.module.css';

export default function AddressesLoading() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={`${styles.skeleton} ${styles.label}`} />
        <div className={`${styles.skeleton} ${styles.title}`} />
        <div className={`${styles.skeleton} ${styles.subtitle}`} />
      </div>
      <div className={styles.addrGrid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`${styles.skeleton} ${styles.addrCard}`} />
        ))}
      </div>
    </div>
  );
}
