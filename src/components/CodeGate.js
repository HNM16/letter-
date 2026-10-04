'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { GATE, isCodeCorrect } from '@/lib/content';
import Button from './Button';
import Heart, { withHeart } from './Heart';
import styles from './CodeGate.module.css';

const rise = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
};

// idle -> error (wrong code) -> success (right code, ring pulses) -> accepted ("Открыть" appears)
export default function CodeGate({ onOpen }) {
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

  useEffect(() => {
    if (status !== 'success') return undefined;
    const id = setTimeout(() => setStatus('accepted'), 900);
    return () => clearTimeout(id);
  }, [status]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (status === 'success') return;

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
      exit={{ opacity: 0, y: -14, scale: 0.98, filter: 'blur(8px)', transition: { duration: 0.6 } }}
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

      <AnimatePresence mode="wait" initial={false}>
        {status === 'accepted' ? (
          <motion.div
            key="accepted"
            className={styles.stack}
            initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className={styles.prompt}>{GATE.accepted}</p>
            <motion.div
              initial={{ scale: 0.86 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.1 }}
            >
              <Button size="lg" onClick={onOpen} autoFocus>
                {GATE.open}
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            className={styles.stack}
            variants={rise}
            exit={{ opacity: 0, scale: 0.94, filter: 'blur(6px)', transition: { duration: 0.45 } }}
            onSubmit={handleSubmit}
            noValidate
          >
            <p className={styles.prompt}>{GATE.prompt}</p>

            <motion.div className={styles.shakeWrap} animate={shake}>
              <div className={styles.field} data-state={status}>
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
                  disabled={status === 'success'}
                />
                <button type="submit" className={styles.submit} aria-label="Открыть письмо кодом">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    {status === 'success' ? (
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    ) : (
                      <path d="M5 12h13M13 6l6 6-6 6" />
                    )}
                  </svg>
                </button>
                <span className={styles.ring} aria-hidden="true" />
              </div>
            </motion.div>

            <p id="gate-error" className={styles.error} role="alert">
              {status === 'error' && <span key={value + status}>{withHeart(`${GATE.error} {heart}`)}</span>}
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
