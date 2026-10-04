'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { GATE, isCodeCorrect } from '@/lib/content';
import Heart, { withHeart } from './Heart';
import styles from './CodeGate.module.css';

const rise = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
};

// idle -> error (wrong code)
// idle -> success (right code: the field glows) -> hidden (the field fades away) -> onUnlocked()
export default function CodeGate({ onUnlocked }) {
  const [value, setValue] = useState('');
  const [status, setStatus] = useState('idle');
  const inputRef = useRef(null);
  const shake = useAnimationControls();

  useEffect(() => {
    // Focus on desktop only: on phones it would push the keyboard up before she sees anything.
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      inputRef.current?.focus({ preventScroll: true });
    }
  }, []);

  const unlocking = status === 'success' || status === 'hidden';

  // right code: the field glows for a moment, fades away, then the envelope takes over
  useEffect(() => {
    if (!unlocking) return undefined;
    const hide = setTimeout(() => setStatus('hidden'), 650);
    const done = setTimeout(() => onUnlocked(), 1500);
    return () => {
      clearTimeout(hide);
      clearTimeout(done);
    };
  }, [unlocking, onUnlocked]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (unlocking) return;

    if (isCodeCorrect(value)) {
      inputRef.current?.blur();
      setStatus('success');
      return;
    }

    setStatus('error');
    navigator.vibrate?.(60);
    shake.start({
      x: [0, -14, 12, -10, 8, -4, 0],
      transition: { duration: 0.55, ease: 'easeInOut' },
    });
    inputRef.current?.focus({ preventScroll: true });
    inputRef.current?.select();
  };

  const handleChange = (event) => {
    setValue(event.target.value);
    if (status === 'error') setStatus('idle');
  };

  return (
    <motion.section
      className={styles.gate}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, y: -14, scale: 0.98, filter: 'blur(8px)', transition: { duration: 0.7 } }}
      variants={{ show: { transition: { staggerChildren: 0.16, delayChildren: 0.1 } } }}
    >
      <motion.div className={styles.ornament} variants={rise} aria-hidden="true">
        <span />
        <i />
        <span />
      </motion.div>

      <motion.h1 className={styles.title} variants={rise}>
        {GATE.title}
        <Heart className={styles.titleHeart} gradient />
      </motion.h1>

      <motion.form
        className={styles.stack}
        variants={rise}
        onSubmit={handleSubmit}
        noValidate
        aria-label="Код"
      >
        <p className={styles.prompt}>{GATE.prompt}</p>

        <motion.div className={styles.shakeWrap} animate={shake}>
          <div className={styles.fadeWrap} data-hidden={status === 'hidden'}>
            <div className={styles.field} data-state={unlocking ? 'success' : status}>
              <input
                ref={inputRef}
                className={styles.input}
                name="letter-code"
                type="text"
                value={value}
                onChange={handleChange}
                placeholder={GATE.placeholder}
                aria-label="Код"
                aria-invalid={status === 'error'}
                aria-describedby="gate-error"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                enterKeyHint="go"
                maxLength={24}
                data-1p-ignore
                data-lpignore="true"
                disabled={unlocking}
              />
              <button type="submit" className={styles.submit} aria-label="Открыть">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  {unlocking ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : <path d="M5 12h13M13 6l6 6-6 6" />}
                </svg>
              </button>
              <span className={styles.ring} aria-hidden="true" />
            </div>
          </div>
        </motion.div>

        <p id="gate-error" className={styles.error} role="alert">
          {status === 'error' && <span key={value}>{withHeart(`${GATE.error} {heart}`)}</span>}
        </p>
      </motion.form>
    </motion.section>
  );
}
