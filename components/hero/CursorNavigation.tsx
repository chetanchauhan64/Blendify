'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { CursorSide } from '@/lib/hooks/useCursorEffect';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './HeroSlider.module.css';

interface CursorNavigationProps {
  side: CursorSide;
  pos: { x: number; y: number };
  visible: boolean;
}

export function CursorNavigation({ side, pos, visible }: CursorNavigationProps) {
  if (!visible || side === 'center') return null;

  return (
    <AnimatePresence>
      <motion.div
        className={styles.customCursor}
        style={{ left: pos.x, top: pos.y }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        aria-hidden="true"
      >
        <motion.div
          className={styles.cursorInner}
          animate={{ x: side === 'left' ? -4 : 4 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          {side === 'left' ? (
            <ChevronLeft size={22} strokeWidth={2.5} />
          ) : (
            <ChevronRight size={22} strokeWidth={2.5} />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
