import styles from './HeroSkeleton.module.css';

export function HeroSkeleton() {
  return (
    <section className={styles.hero} aria-busy="true" aria-label="Loading hero">
      <div className={styles.content}>
        <div className={`skeleton ${styles.eyebrow}`} />
        <div className={`skeleton ${styles.h1a}`} />
        <div className={`skeleton ${styles.h1b}`} />
        <div className={`skeleton ${styles.sub}`} />
        <div className={styles.actions}>
          <div className={`skeleton ${styles.btn}`} />
          <div className={`skeleton ${styles.btn}`} />
        </div>
        <div className={styles.stats}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className={styles.stat}>
              <div className={`skeleton ${styles.statNum}`} />
              <div className={`skeleton ${styles.statLabel}`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
