'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ENVELOPE } from '@/lib/content';
import Button from './Button';
import WaxSeal from './WaxSeal';
import styles from './EnvelopeScene.module.css';

// The opening is a short sequence. Every step adds a class, the CSS does the moving.
const STEPS = ['idle', 'seal', 'flap', 'rise', 'present', 'unfold', 'done'];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));

/**
 * A closed envelope. On "open": the seal pops, the flap lifts, a folded letter slides out,
 * flies to where the real letter lives and unfolds in three parts.
 *
 * `sheetRef` points at the real (still hidden) letter sheet, so the animated sheet lands
 * exactly on top of it, with exactly its size.
 */
export default function EnvelopeScene({ sheetRef, onOpened }) {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState('idle');
  const [geo, setGeo] = useState(null);

  const envRef = useRef(null);
  const anchorRef = useRef(null);
  const onOpenedRef = useRef(onOpened);
  const cancelled = useRef(false);

  useEffect(() => {
    onOpenedRef.current = onOpened;
  }, [onOpened]);

  useEffect(() => {
    cancelled.current = false;
    return () => {
      cancelled.current = true;
    };
  }, []);

  const measure = useCallback(() => {
    const sheet = sheetRef.current;
    const env = envRef.current;
    const anchor = anchorRef.current;
    if (!sheet || !env || !anchor) return null;

    const sheetRect = sheet.getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();
    const width = sheet.offsetWidth;
    const height = sheet.offsetHeight;
    if (!width || !height) return null;

    // The folded letter is the middle third of the sheet, shrunk to sit inside the envelope.
    const scale = Math.min(1, (env.offsetWidth * 0.88) / width);
    const foldedHeight = (height / 3) * scale;
    const rise = env.offsetHeight / 2 + foldedHeight / 2 + 16;

    return {
      width,
      height,
      scale,
      rise,
      dx: sheetRect.left + sheetRect.width / 2 - (anchorRect.left + anchorRect.width / 2),
      dy: sheetRect.top + sheetRect.height / 2 - (anchorRect.top + anchorRect.height / 2),
    };
  }, [sheetRef]);

  // Keep the geometry fresh until the opening starts.
  useEffect(() => {
    const update = () => {
      if (STEPS.indexOf(step) >= STEPS.indexOf('present')) return;
      const next = measure();
      if (next) setGeo(next);
    };
    update();
    window.addEventListener('resize', update);
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    if (observer && sheetRef.current) observer.observe(sheetRef.current);
    return () => {
      window.removeEventListener('resize', update);
      observer?.disconnect();
    };
  }, [measure, sheetRef, step]);

  useLayoutEffect(() => {
    // The page behind must be at the top so the sheet lands in the right place.
    window.scrollTo(0, 0);
  }, []);

  const open = async () => {
    if (step !== 'idle') return;

    if (reduceMotion) {
      setStep('done');
      await wait(450);
      if (!cancelled.current) onOpenedRef.current();
      return;
    }

    const run = async (name, ms) => {
      if (cancelled.current) return false;
      setStep(name);
      await wait(ms);
      return !cancelled.current;
    };

    if (!(await run('seal', 520))) return;
    if (!(await run('flap', 1100))) return;
    if (!(await run('rise', 1500))) return;

    // Re-measure right before the flight: fonts may have changed the height of the sheet.
    const latest = measure();
    if (latest) setGeo(latest);
    await nextFrame();
    if (cancelled.current) return;

    if (!(await run('present', 750))) return;
    if (!(await run('unfold', 1800))) return;

    setStep('done');
    onOpenedRef.current();
  };

  const reached = (name) => STEPS.indexOf(step) >= STEPS.indexOf(name);
  const cls = [
    styles.scene,
    reached('seal') && styles.isSeal,
    reached('flap') && styles.isFlap,
    reached('rise') && styles.isRise,
    reached('present') && styles.isPresent,
    reached('unfold') && styles.isUnfold,
  ]
    .filter(Boolean)
    .join(' ');

  const vars = geo
    ? {
        '--s0': geo.scale,
        '--dx': `${geo.dx}px`,
        '--dy': `${geo.dy}px`,
        '--rise': `${geo.rise}px`,
      }
    : undefined;

  return (
    <motion.div
      className={cls}
      style={vars}
      initial={{ opacity: 0, y: 28, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.45 } }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={styles.halo} aria-hidden="true" />

      <div className={styles.stage}>
        <div className={styles.envelope} ref={envRef}>
          <div className={styles.shadow} aria-hidden="true" />
          <div className={styles.back} aria-hidden="true" />

          <div className={styles.anchor} ref={anchorRef} aria-hidden="true" />

          {/* the letter, folded in three, between the back and the front of the envelope */}
          {geo && (
            <div
              className={styles.paper}
              aria-hidden="true"
              style={{
                width: geo.width,
                height: geo.height,
                marginLeft: -geo.width / 2,
                marginTop: -geo.height / 2,
              }}
            >
              <div className={styles.paperShadow} />
              <div className={`${styles.panel} ${styles.panelTop}`}>
                <div className={`${styles.face} ${styles.faceFront}`} />
                <div className={`${styles.face} ${styles.faceBack}`} />
              </div>
              <div className={`${styles.panel} ${styles.panelMid}`}>
                <div className={`${styles.face} ${styles.faceFront}`} />
              </div>
              <div className={`${styles.panel} ${styles.panelBot}`}>
                <div className={`${styles.face} ${styles.faceFront}`} />
                <div className={`${styles.face} ${styles.faceBack}`} />
              </div>
            </div>
          )}

          <div className={styles.front}>
            <div className={`${styles.pocketWrap} ${styles.pocketWrapSide}`}>
              <div className={`${styles.pocket} ${styles.pocketLeft}`} />
            </div>
            <div className={`${styles.pocketWrap} ${styles.pocketWrapSide}`}>
              <div className={`${styles.pocket} ${styles.pocketRight}`} />
            </div>
            <div className={`${styles.pocketWrap} ${styles.pocketWrapBottom}`}>
              <div className={`${styles.pocket} ${styles.pocketBottom}`} />
            </div>
            <svg className={styles.seams} viewBox="0 0 100 68" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 0 L50 36.7 L100 0 M0 68 L50 36.7 L100 68" className={styles.seamShade} />
              <path d="M0 0 L50 36.7 L100 0 M0 68 L50 36.7 L100 68" className={styles.seamLight} />
            </svg>
            <div className={styles.address}>
              <span>{ENVELOPE.address}</span>
              <svg viewBox="0 0 120 12" aria-hidden="true">
                <path d="M2 7c14-7 22 5 36 0s20-6 30 0 22 5 50-1" />
              </svg>
            </div>
          </div>

          <div className={styles.flapHolder} aria-hidden="true">
            <div className={styles.flapShadow} />
            <div className={styles.flap}>
              <div className={styles.flapOuter}>
                <svg className={styles.flapEdge} viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M0 0 L46 96 L50 100 L54 96 L100 0" className={styles.seamShade} />
                  <path d="M0 0 L46 96 L50 100 L54 96 L100 0" className={styles.seamLight} />
                </svg>
                <span className={styles.seal}>
                  <WaxSeal className={styles.sealSvg} />
                  <i className={styles.sealRing} />
                </span>
              </div>
              <div className={styles.flapInner} />
            </div>
          </div>
        </div>

        <div className={styles.cta}>
          <Button size="lg" onClick={open} disabled={step !== 'idle'}>
            {ENVELOPE.open}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
