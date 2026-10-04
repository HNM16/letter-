'use client';

import { useMemo } from 'react';
import { range, seededRandom } from '@/lib/random';
import styles from './Atmosphere.module.css';

const GOLD = ['#e2c887', '#d7b36a', '#f1dca4'];
const PINK = ['#f0b9bf', '#e6a3ab', '#f6d3d0'];

function makeDust(count, seed, goldShare) {
  const rand = seededRandom(seed);
  return Array.from({ length: count }, (_, i) => {
    const palette = rand() < goldShare ? GOLD : PINK;
    const duration = range(rand, 16, 34);
    return {
      id: i,
      left: `${range(rand, 2, 98).toFixed(2)}%`,
      size: `${range(rand, 2, 6.5).toFixed(1)}px`,
      color: palette[Math.floor(rand() * palette.length)],
      duration: `${duration.toFixed(1)}s`,
      delay: `${(-rand() * duration).toFixed(1)}s`,
      sway: `${range(rand, -60, 60).toFixed(0)}px`,
    };
  });
}

function makeHearts(count, seed) {
  const rand = seededRandom(seed);
  return Array.from({ length: count }, (_, i) => {
    const duration = range(rand, 22, 40);
    return {
      id: i,
      left: `${range(rand, 4, 96).toFixed(2)}%`,
      size: `${range(rand, 11, 24).toFixed(0)}px`,
      opacity: range(rand, 0.18, 0.38).toFixed(2),
      color: i % 3 === 0 ? '#d7b36a' : '#e29aa4',
      duration: `${duration.toFixed(1)}s`,
      delay: `${(-rand() * duration).toFixed(1)}s`,
      sway: `${range(rand, -50, 50).toFixed(0)}px`,
    };
  });
}

function Dust({ items }) {
  return (
    <div className={styles.group} aria-hidden="true">
      {items.map((p) => (
        <i
          key={p.id}
          className={styles.dust}
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 ${parseFloat(p.size) * 2.6}px ${p.color}`,
            animationDuration: p.duration,
            animationDelay: p.delay,
            '--sway': p.sway,
          }}
        />
      ))}
    </div>
  );
}

/**
 * The living background.
 * level: "calm" (code + envelope), "full" (the letter), "festive" (the finale).
 */
export default function Atmosphere({ level = 'calm' }) {
  const calmDust = useMemo(() => makeDust(10, 11, 0.55), []);
  const fullDust = useMemo(() => makeDust(18, 23, 0.5), []);
  const festiveDust = useMemo(() => makeDust(22, 37, 0.75), []);
  const hearts = useMemo(() => makeHearts(9, 5), []);

  const isFull = level === 'full' || level === 'festive';
  const isFestive = level === 'festive';

  return (
    <div className={styles.atmosphere} data-level={level} aria-hidden="true">
      <div className={styles.base} />
      <div className={`${styles.glow} ${styles.glowRose}`} />
      <div className={`${styles.glow} ${styles.glowGold}`} />

      <Dust items={calmDust} />

      {isFull && (
        <>
          <div className={`${styles.glow} ${styles.glowCream}`} />
          <div className={styles.rays} />
          <Dust items={fullDust} />
          <div className={styles.group}>
            {hearts.map((h) => (
              <svg
                key={h.id}
                className={styles.heart}
                viewBox="0 0 24 24"
                style={{
                  left: h.left,
                  width: h.size,
                  height: h.size,
                  color: h.color,
                  '--peak': h.opacity,
                  animationDuration: h.duration,
                  animationDelay: h.delay,
                  '--sway': h.sway,
                }}
              >
                <path
                  fill="currentColor"
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                />
              </svg>
            ))}
          </div>
        </>
      )}

      {isFestive && (
        <>
          <div className={`${styles.glow} ${styles.glowHalo}`} />
          <Dust items={festiveDust} />
        </>
      )}

      <div className={styles.grain} />
      <div className={styles.vignette} />
    </div>
  );
}
