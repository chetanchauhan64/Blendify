'use client';

/**
 * BLENDIFY — VisualStoryGrid
 * Masonry-style editorial layout:
 *   Left column: Coffee collection (top) + Video (bottom)
 *   Right column: Frother product (top) + Lifestyle image (bottom)
 * Real video with custom controls.
 */

import { useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, ArrowRight } from 'lucide-react';
import { viewportConfig } from '@/lib/animations';
import styles from './VisualStoryGrid.module.css';

function VideoTile() {
  const videoRef     = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying]   = useState(true);
  const [muted, setMuted]       = useState(true);
  const [progress, setProgress] = useState(0);
  const [showCtrl, setShowCtrl] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent]   = useState(0);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else          { v.pause(); setPlaying(false); }
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, []);

  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    const pct = v.duration ? (v.currentTime / v.duration) * 100 : 0;
    setProgress(pct);
    setCurrent(v.currentTime);
  };

  const onLoadedMetadata = () => {
    setDuration(videoRef.current?.duration ?? 0);
  };

  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct  = (e.clientX - rect.left) / rect.width;
    v.currentTime = pct * v.duration;
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={styles.videoTile}
      onMouseEnter={() => setShowCtrl(true)}
      onMouseLeave={() => setShowCtrl(false)}
      onClick={togglePlay}
    >
      {/* Actual video — using an SVG-based canvas animation as placeholder for a "promotional video" */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        className={styles.video}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        src="/story/coffee-pour.mp4"
        poster="/story/coffee-collection.png"
      />

      {/* Overlay controls */}
      <div className={`${styles.videoControls} ${showCtrl ? styles.showControls : ''}`}>
        {/* Play/pause */}
        <button
          className={styles.playBtn}
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </button>

        {/* Time */}
        <span className={styles.timeDisplay}>{fmt(current)} / {fmt(duration)}</span>

        {/* Progress bar */}
        <div className={styles.progressBar} onClick={(e) => { e.stopPropagation(); seekTo(e); }}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>

        {/* Mute */}
        <button
          className={styles.muteBtn}
          onClick={(e) => { e.stopPropagation(); toggleMute(); }}
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>

      {/* "COFFEE POURING" label overlay */}
      <div className={styles.videoLabel}>
        <span>Blendify Experience</span>
      </div>
    </div>
  );
}

export function VisualStoryGrid() {
  return (
    <section className={styles.section}>
      <div className={styles.grid}>
        {/* LEFT COLUMN */}
        <div className={styles.col}>
          {/* Top: Coffee collection */}
          <motion.div
            className={styles.tile}
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewportConfig}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link href="/shop" className={styles.tileLink}>
              <Image
                src="/story/coffee-collection.png"
                alt="BLENDIFY Gourmet Flavoured Instant Coffee Collection"
                fill
                sizes="50vw"
                className={styles.tileImg}
              />
              <div className={styles.tileOverlay}>
                <span className={styles.tileLabel}>Gourmet Flavoured Instant Coffees</span>
                <span className={styles.tileLink2}>
                  Shop Collection <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          </motion.div>

          {/* Bottom: Video */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewportConfig}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <VideoTile />
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
              <Image
                src="/story/frother.png"
                alt="Blendify Frother Pro — The Whip Rechargeable Milk Frother"
                fill
                sizes="50vw"
                className={styles.tileImg}
              />
              <div className={styles.tileOverlay}>
                <span className={styles.tileLabel}>Blendify Frother Pro</span>
                <span className={styles.tileLink2}>
                  Shop Now <ArrowRight size={14} />
                </span>
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
              <Image
                src="/story/lifestyle.png"
                alt="Blendify Premium Coffee Lifestyle"
                fill
                sizes="50vw"
                className={styles.tileImg}
              />
              <div className={styles.tileOverlay}>
                <span className={styles.tileLabel}>Premium Collection</span>
                <span className={styles.tileLink2}>
                  Explore <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
