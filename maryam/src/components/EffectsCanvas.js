'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Effects } from '@/lib/effects';
import styles from './EffectsCanvas.module.css';

/** Full-screen canvas for confetti, fireworks and hearts. Call `celebrate()` through the ref. */
const EffectsCanvas = forwardRef(function EffectsCanvas(_, ref) {
  const canvasRef = useRef(null);
  const effectsRef = useRef(null);

  useEffect(() => {
    effectsRef.current = new Effects(canvasRef.current);
    return () => {
      effectsRef.current?.destroy();
      effectsRef.current = null;
    };
  }, []);

  useImperativeHandle(ref, () => ({
    celebrate: (options) => effectsRef.current?.celebrate(options),
  }));

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
});

export default EffectsCanvas;
