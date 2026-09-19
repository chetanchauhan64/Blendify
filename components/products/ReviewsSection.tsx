'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './ReviewsSection.module.css';
import type { ReviewData, ReviewItem } from '@/lib/data/iced-tea-profiles';

// ── Helper: star row ──────────────────────────────────────────
function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className={styles.stars} aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i < Math.floor(rating);
        const half = !filled && i < rating;
        return (
          <svg
            key={i}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={filled ? '#f59e0b' : half ? 'url(#rh)' : 'none'}
            stroke="#f59e0b"
            strokeWidth={2}
            aria-hidden="true"
          >
            {half && (
              <defs>
                <linearGradient id="rh">
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="transparent" />
                </linearGradient>
              </defs>
            )}
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
        );
      })}
    </span>
  );
}

// ── Single review card ─────────────────────────────────────────
function ReviewCard({ review }: { review: ReviewItem }) {
  const [expanded, setExpanded] = useState(false);
  const TRUNCATE_AT = 180;
  const isLong = review.body.length > TRUNCATE_AT;
  const bodyToShow = !expanded && isLong
    ? `${review.body.slice(0, TRUNCATE_AT).trimEnd()}…`
    : review.body;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.avatar} aria-hidden="true">
          {review.initials}
        </div>
        <div className={styles.cardMeta}>
          <div className={styles.cardAuthorRow}>
            <span className={styles.cardAuthor}>{review.author}</span>
            {review.verified && (
              <span className={styles.verified} aria-label="Verified purchase">
                ✓ Verified
              </span>
            )}
          </div>
          <div className={styles.cardRatingRow}>
            <StarRow rating={review.rating} size={12} />
            <span className={styles.cardDate}>{review.date}</span>
          </div>
        </div>
      </div>

      <p className={styles.cardTitle}>{review.title}</p>
      <p className={styles.cardBody}>
        {bodyToShow}
        {isLong && (
          <button
            type="button"
            className={styles.readMore}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? ' Read less' : ' Read more'}
          </button>
        )}
      </p>
    </div>
  );
}

// ── Write a Review modal ──────────────────────────────────────
function WriteReviewModal({ onClose }: { onClose: () => void }) {
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <motion.div
      className={styles.modalOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Write a review"
    >
      <motion.div
        className={styles.modalBox}
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <button
          type="button"
          className={styles.modalClose}
          onClick={onClose}
          aria-label="Close review form"
        >
          <X size={18} />
        </button>

        {submitted ? (
          <div className={styles.successState}>
            <div className={styles.successIcon} aria-hidden="true">✓</div>
            <h3>Thank you for your review!</h3>
            <p>Your review has been submitted and will appear after moderation.</p>
            <button type="button" className={styles.submitBtn} onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <>
            <h3 className={styles.modalTitle}>Write a Review</h3>
            <p className={styles.modalSubtitle}>Share your honest experience to help other customers.</p>

            <form onSubmit={handleSubmit} className={styles.reviewForm}>
              {/* Star selector */}
              <fieldset className={styles.starField}>
                <legend className={styles.fieldLabel}>Overall Rating *</legend>
                <div className={styles.starSelector} role="radiogroup">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`${styles.starBtn} ${s <= (hoverRating || selectedRating) ? styles.starActive : ''}`}
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setSelectedRating(s)}
                      aria-label={`${s} star${s !== 1 ? 's' : ''}`}
                      aria-pressed={selectedRating === s}
                    >
                      <Star size={24} />
                    </button>
                  ))}
                </div>
              </fieldset>

              <label className={styles.fieldLabel} htmlFor="rev-name">
                Your Name *
              </label>
              <input
                ref={firstInputRef}
                id="rev-name"
                type="text"
                className={styles.fieldInput}
                placeholder="e.g. Priya S."
                required
              />

              <label className={styles.fieldLabel} htmlFor="rev-title">
                Review Title *
              </label>
              <input
                id="rev-title"
                type="text"
                className={styles.fieldInput}
                placeholder="Summarise your experience"
                required
              />

              <label className={styles.fieldLabel} htmlFor="rev-body">
                Your Review *
              </label>
              <textarea
                id="rev-body"
                className={styles.fieldTextarea}
                placeholder="Tell us what you liked (or didn't like)..."
                rows={4}
                required
              />

              <label className={styles.fieldLabel} htmlFor="rev-photo">
                Photo (optional)
              </label>
              <input
                id="rev-photo"
                type="file"
                className={styles.fileInput}
                accept="image/*"
              />

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={selectedRating === 0}
              >
                Submit Review
              </button>
            </form>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Main ReviewsSection ───────────────────────────────────────
const REVIEWS_PER_PAGE = 6;
const SORT_OPTIONS = ['Most Recent', 'Highest Rated', 'Lowest Rated'];

export function ReviewsSection({ data }: { data: ReviewData }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('Most Recent');

  // Sort reviews
  const sorted = [...data.items].sort((a, b) => {
    if (sort === 'Highest Rated') return b.rating - a.rating;
    if (sort === 'Lowest Rated') return a.rating - b.rating;
    return 0; // Most Recent: keep original order
  });

  const totalPages = Math.ceil(sorted.length / REVIEWS_PER_PAGE);
  const pageItems = sorted.slice((page - 1) * REVIEWS_PER_PAGE, page * REVIEWS_PER_PAGE);

  // Lock body scroll when modal open
  if (typeof document !== 'undefined') {
    document.body.style.overflow = modalOpen ? 'hidden' : '';
  }

  return (
    <section className={styles.section} aria-label="Customer reviews">
      <h2 className={styles.heading}>Customer Reviews</h2>

      {/* ── Rating summary ── */}
      <div className={styles.summary}>
        {/* Overall */}
        <div className={styles.overallCol}>
          <span className={styles.bigRating}>{data.average.toFixed(1)}</span>
          <StarRow rating={data.average} size={18} />
          <span className={styles.basedOn}>Based on {data.count.toLocaleString('en-IN')} reviews</span>
        </div>

        <div className={styles.summaryDivider} />

        {/* Distribution bars */}
        <div className={styles.distCol}>
          {data.distribution.map((d) => (
            <div key={d.stars} className={styles.distRow}>
              <span className={styles.distLabel}>{d.stars}★</span>
              <div className={styles.distBar}>
                <div
                  className={styles.distFill}
                  style={{ width: `${d.pct}%` }}
                  aria-hidden="true"
                />
              </div>
              <span className={styles.distPct}>{d.pct}%</span>
            </div>
          ))}
        </div>

        <div className={styles.summaryDivider} />

        {/* Write a review */}
        <div className={styles.writeCol}>
          <p className={styles.writePrompt}>Share your experience with the community.</p>
          <button
            type="button"
            className={styles.writeBtn}
            onClick={() => setModalOpen(true)}
          >
            Write a Review
          </button>
        </div>
      </div>

      {/* ── Sort control ── */}
      <div className={styles.sortRow}>
        <span className={styles.sortLabel}>Sort by:</span>
        <select
          className={styles.sortSelect}
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1); }}
          aria-label="Sort reviews"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {/* ── Review grid ── */}
      <div className={styles.grid}>
        {pageItems.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className={styles.pagination} role="navigation" aria-label="Review pages">
          <button
            type="button"
            className={styles.pageBtn}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              className={`${styles.pageBtn} ${p === page ? styles.activePage : ''}`}
              onClick={() => setPage(p)}
              aria-label={`Page ${p}`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          ))}

          <button
            type="button"
            className={styles.pageBtn}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* ── Write a review modal ── */}
      <AnimatePresence>
        {modalOpen && <WriteReviewModal onClose={() => setModalOpen(false)} />}
      </AnimatePresence>
    </section>
  );
}
