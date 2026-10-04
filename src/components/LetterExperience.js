'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, useReducedMotion } from 'framer-motion';
import { flushPendingNotification, notifyForgiven } from '@/lib/notify';
import Atmosphere from './Atmosphere';
import Butterflies from './Butterflies';
import CodeGate from './CodeGate';
import EffectsCanvas from './EffectsCanvas';
import EnvelopeScene from './EnvelopeScene';
import Finale from './Finale';
import LetterPage from './LetterPage';
import styles from './LetterExperience.module.css';

// gate (code) -> envelope (opening) -> letter (reading + the question) -> finale
const LEVEL = { gate: 'calm', envelope: 'calm', letter: 'full', finale: 'festive' };

export default function LetterExperience() {
  const reduceMotion = useReducedMotion();
  const [stage, setStage] = useState('gate');
  const [written, setWritten] = useState(false);
  const [origin, setOrigin] = useState(null);
  const [pageGone, setPageGone] = useState(false);
  const sheetRef = useRef(null);
  const effectsRef = useRef(null);

  // Only the letter itself scrolls; the code, the envelope and the finale stay put.
  useEffect(() => {
    const root = document.documentElement;
    root.style.overflow = stage === 'letter' ? '' : 'hidden';
    if (stage === 'letter') window.scrollTo(0, 0);
    return () => {
      root.style.overflow = '';
    };
  }, [stage]);

  // After the finale has faded the letter in, the letter page can go.
  useEffect(() => {
    if (stage !== 'finale') return undefined;
    const id = setTimeout(() => setPageGone(true), 1400);
    return () => clearTimeout(id);
  }, [stage]);

  // If an earlier "Yes" could not be delivered (no connection), try again now.
  useEffect(() => {
    flushPendingNotification();
  }, []);

  const handleOpened = useCallback(() => setStage('letter'), []);
  const handleWritten = useCallback(() => setWritten(true), []);

  const handleYes = useCallback(
    (point) => {
      setOrigin(point);
      setStage('finale');
      effectsRef.current?.celebrate({ origin: point, reduced: Boolean(reduceMotion) });
      notifyForgiven();
    },
    [reduceMotion],
  );

  const pageClass = [
    styles.page,
    stage === 'envelope' && styles.pageHidden,
    stage === 'finale' && styles.pageGone,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.app} data-stage={stage}>
      <Atmosphere level={LEVEL[stage]} />

      {(stage === 'letter' || stage === 'finale') && <Butterflies festive={stage === 'finale'} />}

      <AnimatePresence>
        {stage === 'gate' && <CodeGate key="gate" onOpen={() => setStage('envelope')} />}
      </AnimatePresence>

      {/* mounted while the envelope opens (hidden), so the real sheet can be measured */}
      {stage !== 'gate' && !pageGone && (
        <div className={pageClass}>
          <LetterPage
            sheetRef={sheetRef}
            writing={stage === 'letter'}
            questionVisible={written}
            onWritten={handleWritten}
            onYes={handleYes}
          />
        </div>
      )}

      <AnimatePresence>
        {stage === 'envelope' && (
          <EnvelopeScene key="envelope" sheetRef={sheetRef} onOpened={handleOpened} />
        )}
      </AnimatePresence>

      {stage === 'finale' && <Finale origin={origin} />}

      <EffectsCanvas ref={effectsRef} />
    </div>
  );
}
