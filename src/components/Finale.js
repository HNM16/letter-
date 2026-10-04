'use client';

import { motion } from 'framer-motion';
import { FINALE } from '@/lib/content';
import Heart from './Heart';
import styles from './Finale.module.css';

const ease = [0.22, 1, 0.36, 1];

const title = FINALE.title.replace(' {heart}', '').split(' ');

/** The last screen: a big heart, the thank-you and two quiet lines. Confetti is drawn on the canvas above. */
export default function Finale({ origin }) {
  return (
    <motion.section
      className={styles.finale}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.9, delay: 0.25 }}
    >
      {origin && (
        <span className={styles.burst} style={{ left: origin.x, top: origin.y }} aria-hidden="true" />
      )}

      <div className={styles.inner}>
        <motion.div
          className={styles.heartWrap}
          initial={{ scale: 0.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 130, damping: 11, delay: 0.45 }}
        >
          <span className={styles.glow} aria-hidden="true" />
          <span className={styles.ring} aria-hidden="true" />
          <span className={`${styles.ring} ${styles.ring2}`} aria-hidden="true" />
          <Heart className={styles.heart} gradient />
        </motion.div>

        <div className={styles.words} data-reading-zone>
          <h2 className={styles.title}>
            {title.map((word, i) => (
              <motion.span
                key={word}
                className={styles.word}
                initial={{ opacity: 0, y: 24, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 1.1, ease, delay: 1.1 + i * 0.28 }}
              >
                {word}
                {i < title.length - 1 ? ' ' : ''}
              </motion.span>
            ))}
            <motion.span
              className={styles.titleHeart}
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 1.8 }}
            >
              <Heart className={styles.smallHeart} gradient />
            </motion.span>
          </h2>

          {FINALE.lines.map((line, i) => (
            <motion.p
              key={line}
              className={i === 0 ? styles.line : `${styles.line} ${styles.lineSoft}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1, ease, delay: 2.3 + i * 0.9 }}
            >
              {line}
            </motion.p>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
