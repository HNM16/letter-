'use client';

import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { LETTER } from '@/lib/content';
import Heart from './Heart';
import styles from './LoveLetter.module.css';

// How the letter writes itself (ms)
const HEADING_MS = 1600;
const HEADING_DONE_MS = 2700; // the heading, its heart and the flourish are all in place
const PAUSE_BEFORE_PARAGRAPH = 380;
const WORD_STEP = 42;
const SLOW_STEP = 88; // the sentence that is set apart is written more slowly
const LAST_STEP = 58;
const WORD_MS = 520;
const CLOSING_MS = 2200;

const ITEM_COUNT = LETTER.paragraphs.length + 2; // heading, paragraphs, closing heart

const wordsOf = (text) => text.split(' ').filter(Boolean);

// Splits a paragraph into the timed words it is made of.
function buildParagraph(text, isLast) {
  const lead = isLast && text.startsWith(LETTER.emphasisSentence) ? LETTER.emphasisSentence : '';
  const rest = text.slice(lead.length).trim();
  let clock = 0;

  const lay = (sentence, step) =>
    wordsOf(sentence).map((word) => {
      const item = { word, delay: clock };
      clock += step;
      return item;
    });

  const emphasis = lead ? lay(lead, SLOW_STEP) : [];
  const emphasisEnd = clock;
  const body = lay(rest, isLast ? LAST_STEP : WORD_STEP);
  return { emphasis, emphasisEnd, body, duration: clock + WORD_MS + 500 };
}

// Reports where the element is once its turn has come:
//   "visible" it is on screen now,
//   "past"    it was scrolled past already (above the screen), so nobody would see it being written,
//   null      it is further down, and we keep waiting.
function useSeen(ref, enabled) {
  const [seen, setSeen] = useState(null);
  useEffect(() => {
    if (!enabled || seen) return undefined;
    const element = ref.current;
    if (!element) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setSeen('visible');
      return undefined;
    }
    // Two thresholds: 0 tells us when the element has fully left the screen, 0.12 when enough of it is in.
    const observer = new IntersectionObserver(
      ([entry]) => {
        const top = entry.rootBounds ? entry.rootBounds.top : 0;
        if (entry.intersectionRatio >= 0.12) setSeen('visible');
        else if (entry.boundingClientRect.bottom <= top) setSeen('past');
        else return;
        observer.disconnect();
      },
      { rootMargin: '0px 0px -12% 0px', threshold: [0, 0.12] },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled, seen, ref]);
  return seen;
}

// Starts once it may (the previous part is finished) and has been scrolled into view, then reports back when done.
function useTurn({ index, writing, instant, done, onDone, duration }) {
  const ref = useRef(null);
  const turn = writing && !instant && done >= index;
  const seen = useSeen(ref, turn);
  const [started, setStarted] = useState(false);
  const [leftBehind, setLeftBehind] = useState(false);
  const passed = seen === 'past' || leftBehind;

  useEffect(() => {
    if (!turn || seen !== 'visible' || started) return undefined;
    const id = setTimeout(() => setStarted(true), PAUSE_BEFORE_PARAGRAPH);
    return () => clearTimeout(id);
  }, [turn, seen, started]);

  useEffect(() => {
    if (!started) return undefined;
    const id = setTimeout(() => onDone(index), duration);
    return () => clearTimeout(id);
  }, [started, index, duration, onDone]);

  // scrolled away (above the screen) while it was being written: no one is watching, finish it at once
  useEffect(() => {
    if (!started || leftBehind) return undefined;
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting && entry.boundingClientRect.bottom <= 0) setLeftBehind(true);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [started, leftBehind]);

  // scrolled past before its turn: show it as it is and let the next one go
  useEffect(() => {
    if (passed) onDone(index);
  }, [passed, index, onDone]);

  return { ref, state: instant || passed ? 'instant' : started ? 'started' : 'waiting' };
}

function Paragraph({ index, text, isLast, writing, instant, done, onDone }) {
  const layout = useMemo(() => buildParagraph(text, isLast), [text, isLast]);
  const { ref, state } = useTurn({ index, writing, instant, done, onDone, duration: layout.duration });

  const renderWords = (items) =>
    items.map(({ word, delay }, i) => (
      <span key={i}>
        <span className={styles.word} style={{ '--delay': `${delay}ms` }}>
          {word}
        </span>{' '}
      </span>
    ));

  return (
    <p ref={ref} className={`${styles.paragraph} ${isLast ? styles.last : ''}`} data-state={state}>
      {layout.emphasis.length > 0 && (
        <span className={styles.emphasis} style={{ '--end': `${layout.emphasisEnd}ms` }}>
          {renderWords(layout.emphasis)}
        </span>
      )}
      {renderWords(layout.body)}
    </p>
  );
}

/**
 * The sheet of paper with the love letter on it.
 *
 * The heading writes itself first; then each paragraph follows, but only once the one before it is
 * finished AND it has been scrolled into view, so nothing is written where nobody can see it.
 * The last paragraph is the slowest; the closing heart beats.
 * Tapping the sheet while it is being written shows everything at once.
 */
const LoveLetter = forwardRef(function LoveLetter({ writing, onFinished }, ref) {
  const reduceMotion = useReducedMotion();
  const [skipped, setSkipped] = useState(false);
  const [done, setDone] = useState(0);
  const finishedRef = useRef(false);

  const instant = skipped || Boolean(reduceMotion);

  const markDone = useCallback((index) => setDone((d) => Math.max(d, index + 1)), []);

  // the heading is not scrolled to: it simply goes first
  useEffect(() => {
    if (!writing || instant) return undefined;
    const id = setTimeout(() => markDone(0), HEADING_DONE_MS);
    return () => clearTimeout(id);
  }, [writing, instant, markDone]);

  // everything at once (skipped or reduced motion)
  useEffect(() => {
    if (writing && instant) setDone(ITEM_COUNT);
  }, [writing, instant]);

  useEffect(() => {
    if (!writing || done < ITEM_COUNT || finishedRef.current) return undefined;
    const id = setTimeout(
      () => {
        finishedRef.current = true;
        onFinished?.();
      },
      instant ? 500 : 1400,
    );
    return () => clearTimeout(id);
  }, [writing, done, instant, onFinished]);

  const state = !writing ? 'waiting' : instant ? 'instant' : 'writing';

  const closing = useTurn({
    index: ITEM_COUNT - 1,
    writing,
    instant,
    done,
    onDone: markDone,
    duration: CLOSING_MS,
  });

  const lastIndex = LETTER.paragraphs.length - 1;

  return (
    <article
      ref={ref}
      className={styles.sheet}
      data-state={state}
      data-reading-zone
      onClick={() => writing && !instant && setSkipped(true)}
    >
      <div className={styles.frame} aria-hidden="true" />

      <header className={styles.header}>
        <h2 className={styles.heading} style={{ '--dur': `${HEADING_MS}ms` }}>
          <span className={styles.ink}>
            {LETTER.heading} <Heart className={styles.headingHeart} gradient />
          </span>
        </h2>
        <svg className={styles.flourish} viewBox="0 0 200 14" aria-hidden="true">
          <path pathLength="1" d="M3 8c26-9 44 6 70 0s40-7 62 0 36 5 62-2" />
        </svg>
      </header>

      <div className={styles.body}>
        {LETTER.paragraphs.map((text, i) => (
          <Paragraph
            key={i}
            index={i + 1}
            text={text}
            isLast={i === lastIndex}
            writing={writing}
            instant={instant}
            done={done}
            onDone={markDone}
          />
        ))}
      </div>

      <footer ref={closing.ref} className={styles.closing} data-state={closing.state}>
        <div className={styles.divider} aria-hidden="true">
          <span />
          <i />
          <span />
        </div>
        <span className={styles.closingHeartWrap}>
          <span className={styles.closingGlow} aria-hidden="true" />
          <Heart className={styles.closingHeart} gradient />
        </span>
      </footer>
    </article>
  );
});

export default LoveLetter;
