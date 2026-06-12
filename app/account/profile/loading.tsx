import styles from '../loading.module.css';

export default function ProfileLoading() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={`${styles.skeleton} ${styles.label}`} />
        <div className={`${styles.skeleton} ${styles.title}`} />
        <div className={`${styles.skeleton} ${styles.subtitle}`} />
      </div>
      <div className={styles.formCard}>
        <div className={styles.row}>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className={styles.field}>
              <div className={`${styles.skeleton} ${styles.fieldLabel}`} />
              <div className={`${styles.skeleton} ${styles.fieldInput}`} />
            </div>
          ))}
        </div>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className={styles.field}>
            <div className={`${styles.skeleton} ${styles.fieldLabel}`} />
            <div className={`${styles.skeleton} ${styles.fieldInput}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
