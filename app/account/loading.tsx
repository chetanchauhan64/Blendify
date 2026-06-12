import styles from './loading.module.css';

export default function AccountLoading() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={`${styles.skeleton} ${styles.label}`} />
        <div className={`${styles.skeleton} ${styles.title}`} />
        <div className={`${styles.skeleton} ${styles.subtitle}`} />
      </div>
      <div className={styles.statsGrid}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={styles.statCard}>
            <div className={`${styles.skeleton} ${styles.icon}`} />
            <div className={styles.statLines}>
              <div className={`${styles.skeleton} ${styles.lineShort}`} />
              <div className={`${styles.skeleton} ${styles.lineLong}`} />
            </div>
          </div>
        ))}
      </div>
      <div className={styles.actionsGrid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`${styles.skeleton} ${styles.actionCard}`} />
        ))}
      </div>
    </div>
  );
}
