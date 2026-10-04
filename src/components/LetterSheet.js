'use client';

import { forwardRef, useEffect, useMemo, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { LETTER } from '@/lib/content';
import Heart from './Heart';
import styles from './LetterSheet.module.css';

// Timing of the "handwriting" (ms)
const SALUTATION_START = 250;
const SALUTATION_MS = 1500;
const BODY_START = 2000;
const WORD_STEP = 72;
const PARAGRAPH_PAUSE = 420;
const SIGNATURE_PAUSE = 520;
const SIGNATURE_MS = 1300;

// Lay the text out once: every word gets its own delay, so the letter "writes itself" word by word.
function buildTimeline() {
  let clock = BODY_START;
  const paragraphs = LETTER.paragraphs.map((lines) => {
    const built = lines.map((line) =>
      line.split(' ').map((word) => {
        const item = { word, delay: clock };
        clock += WORD_STEP;
        return item;
      }),
    );
    clock += PARAGRAPH_PAUSE;
    return built;
  });
  const signatureStart = clock - PARAGRAPH_PAUSE + SIGNATURE_PAUSE;
  return { paragraphs, signatureStart, total: signatureStart + SIGNATURE_MS + 500 };
}

/**
 * The sheet of paper with the letter on it.
 * While `writing` is false the text is invisible but still takes its place (so the layout is final).
 * Tapping the sheet while it is being written shows everything at once.
 */
const LetterSheet = forwardRef(function LetterSheet({ writing, onWritten }, ref) {
  const reduceMotion = useReducedMotion();
  const [skipped, setSkipped] = useState(false);
  const timeline = useMemo(buildTimeline, []);

  const instant = skipped || reduceMotion;
  const done = writing && instant;

  useEffect(() => {
    if (!writing) return undefined;
    const delay = instant ? (skipped ? 0 : 700) : timeline.total;
    const id = setTimeout(() => onWritten?.(), delay);
    return () => clearTimeout(id);
  }, [writing, instant, skipped, timeline.total, onWritten]);

  const state = !writing ? styles.waiting : done ? styles.instant : styles.writing;

  return (
    <article
      ref={ref}
      className={`${styles.sheet} ${state}`}
      data-reading-zone
      onClick={() => writing && setSkipped(true)}
    >
      <div className={styles.creases} aria-hidden="true" />
      <div className={styles.frame} aria-hidden="true" />

      <header className={styles.header}>
        <h2
          className={styles.salutation}
          style={{ '--delay': `${SALUTATION_START}ms`, '--dur': `${SALUTATION_MS}ms` }}
        >
          <span className={styles.ink}>{LETTER.salutation}</span>
        </h2>
        <svg className={styles.flourish} viewBox="0 0 200 14" aria-hidden="true">
          <path pathLength="1" d="M3 8c26-9 44 6 70 0s40-7 62 0 36 5 62-2" />
        </svg>
      </header>

      <div className={styles.body}>
        {timeline.paragraphs.map((lines, p) => (
          <p key={p} className={styles.paragraph}>
            {lines.map((words, l) => (
              <span key={l} className={styles.line}>
                {words.map(({ word, delay }, w) => (
                  <span key={w}>
                    <span className={styles.word} style={{ '--delay': `${delay}ms` }}>
                      {word}
                    </span>{' '}
                  </span>
                ))}
              </span>
            ))}
          </p>
        ))}
      </div>

      <footer className={styles.signature} style={{ '--delay': `${timeline.signatureStart}ms` }}>
        <div className={styles.divider} aria-hidden="true">
          <span />
          <i />
          <span />
        </div>
        <p className={styles.farewell}>
          <span className={styles.farewellText}>{LETTER.signature}</span>
          <Heart className={styles.farewellHeart} gradient />
        </p>
      </footer>
    </article>
  );
});

export default LetterSheet;
