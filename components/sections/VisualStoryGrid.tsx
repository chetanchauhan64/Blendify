'use client';

/**
 * BLENDIFY — VisualStoryGrid
 * Brand palette: #581312 (maroon) · #FDE0C1 (cream) · #FFFFFF (white)
 *
 * Top-left:  ExperienceTile — hover-play video with full branded controls
 *            (Play/Pause · progress bar · duration · mute · download)
 * Bot-left:  VideoTile — auto-playing video (existing)
 * Right col: Frother + Lifestyle images (unchanged)
 */

import { useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, ArrowRight, Download } from 'lucide-react';
import { viewportConfig } from '@/lib/animations';
import styles from './VisualStoryGrid.module.css';

/* ─── Shared time formatter ──────────────────────────────────────── */
function fmt(s: number) {
  if (!isFinite(s) || isNaN(s)) return '0:00';
  const m   = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

/* ─── Static Image Tile (bottom-left) ────────────────────────────── */
function ImageTile() {
  return (
    <Link href="/shop/blendify-mocha" className={styles.videoTileLink}>
      <div className={styles.videoTile}>
        <Image
          src="/products/mocha-combo.png"
          alt="Blendify Mocha Combo — Premium Coffee + Chocolate Blend"
          fill
          sizes="50vw"
          className={styles.video}
          priority
        />
        <div className={styles.tileOverlay}>
          <span className={styles.tileLabel}>Mocha Combo</span>
          <span className={styles.tileLink2}>Shop Now <ArrowRight size={14} /></span>
        </div>
      </div>
    </Link>
  );
}

/* ─── Experience Tile (top-left) — hover-play with branded controls ─ */
/**
 * At rest: shows the static coffee-collection poster image.
 * On hover: video plays + full branded control bar appears.
 * Controls: Play/Pause · current time · seekable progress bar ·
 *           duration · mute · download.
 * Brand palette: maroon #581312, cream #FDE0C1, white #FFFFFF.
 */
function ExperienceTile() {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [hovered,  setHovered]  = useState(false);
  const [playing,  setPlaying]  = useState(false);
  const [muted,    setMuted]    = useState(true);
  const [progress, setProgress] = useState(0);
  const [current,  setCurrent]  = useState(0);
  const [duration, setDuration] = useState(0);

  const onTimeUpdate = useCallback(() => {
    const v = videoRef.current; if (!v || !v.duration) return;
    setProgress((v.currentTime / v.duration) * 100);
    setCurrent(v.currentTime);
  }, []);

  const onLoadedMetadata = useCallback(() => {
    const v = videoRef.current; if (!v) return;
    setDuration(v.duration);
  }, []);

  const togglePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current; if (!v) return;
    if (v.paused) { v.play().then(() => setPlaying(true)).catch(() => {}); }
    else          { v.pause(); setPlaying(false); }
  }, []);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current; if (!v) return;
    v.muted = !v.muted; setMuted(v.muted);
  }, []);

  const seekTo = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const v = videoRef.current; if (!v || !v.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    v.currentTime = Math.max(0, Math.min(((e.clientX - rect.left) / rect.width) * v.duration, v.duration));
  }, []);

  const handleMouseEnter = useCallback(() => {
    setHovered(true);
    const v = videoRef.current; if (!v) return;
    v.currentTime = 0;
    v.play().then(() => setPlaying(true)).catch(() => {});
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    const v = videoRef.current; if (!v) return;
    v.pause();
    setPlaying(false);
    setTimeout(() => { if (videoRef.current) videoRef.current.currentTime = 0; }, 400);
  }, []);

  const handleDownload = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const a = document.createElement('a');
    a.href     = '/videos/blendify-experience.mp4';
    a.download = 'blendify-experience.mp4';
    a.click();
  }, []);

  return (
    <div
      className={styles.experienceTile}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* ── Video ── */}
      <video
        ref={videoRef}
        muted loop playsInline preload="auto"
        className={`${styles.experienceVideo} ${hovered ? styles.experienceVideoVisible : ''}`}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
      >
        <source src="/videos/blendify-experience.mp4" type="video/mp4" />
      </video>

      {/* ── Static poster ── */}
      <div className={`${styles.experiencePoster} ${hovered ? styles.experiencePosterHidden : ''}`}>
        <Image
          src="/story/coffee-collection.png"
          alt="BLENDIFY Gourmet Flavoured Instant Coffee Collection"
          fill sizes="50vw" className={styles.tileImg} priority
        />
      </div>

      {/* ── Center play icon at rest ── */}
      {!hovered && (
        <div className={styles.expCenterPlay}>
          <Play size={28} />
        </div>
      )}

      {/* ── Branded controls bar — appears on hover ── */}
      <div className={`${styles.expControls} ${hovered ? styles.expControlsVisible : ''}`} data-controls>

        {/* Top row: label */}
        <div className={styles.expLabel}>
          <span className={styles.expLabelBadge}>BLENDIFY EXPERIENCE</span>
        </div>

        {/* Bottom row: full controls */}
        <div className={styles.expCtrlRow}>
          {/* Play / Pause */}
          <button className={styles.expBtn} onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? <Pause size={17} /> : <Play size={17} />}
          </button>

          {/* Current time */}
          <span className={styles.expTime}>{fmt(current)}</span>

          {/* Progress bar */}
          <div
            className={styles.expProgress}
            ref={progressRef}
            onClick={seekTo}
            role="slider"
            aria-label="Seek"
            aria-valuenow={Math.round(progress)}
          >
            <div className={styles.expProgressFill} style={{ width: `${progress}%` }} />
            <div className={styles.expProgressThumb} style={{ left: `${progress}%` }} />
          </div>

          {/* Duration */}
          <span className={styles.expTime}>{fmt(duration)}</span>

          {/* Mute */}
          <button className={styles.expBtn} onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>
            {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>

          {/* Download */}
          <button className={styles.expBtn} onClick={handleDownload} aria-label="Download video">
            <Download size={17} />
          </button>
        </div>
      </div>

      {/* ── "Hover to play" pill at rest ── */}
      <div className={`${styles.hoverPlayBadge} ${hovered ? styles.hoverPlayBadgeHidden : ''}`}>
        <Play size={11} />
        <span>Hover to play</span>
      </div>
    </div>
  );
}

/* ─── Main Section ────────────────────────────────────────────────── */
export function VisualStoryGrid() {
  return (
    <section className={styles.section}>
      <div className={styles.grid}>

        {/* LEFT COLUMN */}
        <div className={styles.col}>

          {/* Top: Blendify Experience — hover-play with controls */}
          <motion.div
            className={styles.tile}
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewportConfig}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <ExperienceTile />
          </motion.div>

          {/* Bottom: Static image tile */}
          <motion.div
            className={styles.tile}
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewportConfig}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <ImageTile />
          </motion.div>

        </div>

        {/* RIGHT COLUMN */}
        <div className={styles.col}>

          {/* Top: Frother */}
          <motion.div
            className={`${styles.tile} ${styles.tileTall}`}
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewportConfig}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link href="/shop/frother" className={styles.tileLink}>
              <Image src="/story/frother.png" alt="Blendify Frother Pro — The Whip Rechargeable Milk Frother" fill sizes="50vw" className={styles.tileImg} />
              <div className={styles.tileOverlay}>
                <span className={styles.tileLabel}>Blendify Frother Pro</span>
                <span className={styles.tileLink2}>Shop Now <ArrowRight size={14} /></span>
              </div>
            </Link>
          </motion.div>

          {/* Bottom: Lifestyle */}
          <motion.div
            className={styles.tile}
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewportConfig}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link href="/shop" className={styles.tileLink}>
              <Image src="/story/lifestyle.png" alt="Blendify Premium Coffee Lifestyle" fill sizes="50vw" className={styles.tileImg} />
              <div className={styles.tileOverlay}>
                <span className={styles.tileLabel}>Premium Collection</span>
                <span className={styles.tileLink2}>Explore <ArrowRight size={14} /></span>
              </div>
            </Link>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
