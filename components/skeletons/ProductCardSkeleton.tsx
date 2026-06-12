import styles from './ProductCardSkeleton.module.css';

export function ProductCardSkeleton() {
  return (
    <div className={styles.card} aria-busy="true" aria-label="Loading product">
      <div className={`skeleton ${styles.image}`} />
      <div className={styles.info}>
        <div className={`skeleton ${styles.tag}`} />
        <div className={`skeleton ${styles.name}`} />
        <div className={`skeleton ${styles.nameShort}`} />
        <div className={`skeleton ${styles.rating}`} />
        <div className={`skeleton ${styles.price}`} />
        <div className={`skeleton ${styles.btn}`} />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className={styles.grid}>
      {[...Array(count)].map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
