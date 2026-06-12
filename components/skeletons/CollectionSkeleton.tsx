import styles from './CollectionSkeleton.module.css';

export function CollectionSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={styles.grid} aria-busy="true" aria-label="Loading collections">
      {[...Array(count)].map((_, i) => (
        <div key={i} className={`skeleton ${styles.card}`} />
      ))}
    </div>
  );
}
