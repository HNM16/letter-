'use client';

import { Fragment } from 'react';
import { motion } from 'framer-motion';
import { FINALE } from '@/lib/content';
import Heart from './Heart';
import styles from './Finale.module.css';

const ease = [0.22, 1, 0.36, 1];

const title = FINALE.title.replace(' {heart}', '').split(' ');

/** The last screen: a big heart rising out of the glow, the dedication and the thank-you. */
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
          initial={{ scale: 0.15, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 12, delay: 0.5 }}
        >
          <span className={styles.glow} aria-hidden="true" />
          <span className={styles.ring} aria-hidden="true" />
          <span className={`${styles.ring} ${styles.ring2}`} aria-hidden="true" />
          <Heart className={styles.heart} gradient />
        </motion.div>

        <div className={styles.words} data-reading-zone>
          <h2 className={styles.title}>
            {title.map((word, i) => (
              <Fragment key={word}>
                {i > 0 && ' '}
                <motion.span
                  className={styles.word}
                  initial={{ opacity: 0, y: 24, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 1.1, ease, delay: 1.3 + i * 0.26 }}
                >
                  {word}
                </motion.span>
              </Fragment>
            ))}
            {' '}
            <motion.span
              className={styles.titleHeart}
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 2.2 }}
            >
              <Heart className={styles.smallHeart} gradient />
            </motion.span>
          </h2>

          <motion.p
            className={`${styles.line} ${styles.lineSoft}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease, delay: 2.9 }}
          >
            {FINALE.line}
          </motion.p>
        </div>
      </div>
    </motion.section>
  );
}
