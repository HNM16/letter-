'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  playChime,
  playPaper,
  playSeal,
  playShimmer,
  setMuted,
  startMusic,
  unlockAudio,
} from '@/lib/audio';
import { flushPendingNotification, notifyFinished } from '@/lib/notify';
import Atmosphere from './Atmosphere';
import Butterflies from './Butterflies';
import CodeGate from './CodeGate';
import EffectsCanvas from './EffectsCanvas';
import EnvelopeScene from './EnvelopeScene';
import Finale from './Finale';
import LoveLetter from './LoveLetter';
import ReadAction from './ReadAction';
import SoundToggle from './SoundToggle';
import styles from './LetterExperience.module.css';

// gate (code) -> envelope (opening) -> letter (reading) -> finale
const LEVEL = { gate: 'calm', envelope: 'calm', letter: 'full', finale: 'festive' };

export default function LetterExperience({ musicSrc = null }) {
  const reduceMotion = useReducedMotion();
  const [stage, setStage] = useState('gate');
  const [finished, setFinished] = useState(false); // the letter has been written to its last heart
  const [origin, setOrigin] = useState(null);
  const [pageGone, setPageGone] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
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

  // After the finale has faded the letter out, the letter page can go.
  useEffect(() => {
    if (stage !== 'finale') return undefined;
    const id = setTimeout(() => setPageGone(true), 1400);
    return () => clearTimeout(id);
  }, [stage]);

  // If an earlier "I have read it" could not be delivered (no connection), try again now.
  useEffect(() => {
    flushPendingNotification();
  }, []);

  const handleUnlocked = useCallback(() => setStage('envelope'), []);

  // The tap on "Открыть письмо": browsers allow sound only from here on.
  const handleBeforeOpen = useCallback(() => {
    if (unlockAudio()) {
      startMusic(musicSrc);
      setAudioReady(true);
    }
  }, [musicSrc]);

  const handleStep = useCallback((step) => {
    if (step === 'seal') playSeal();
    if (step === 'rise') playPaper();
    if (step === 'done') playChime();
  }, []);

  const handleOpened = useCallback(() => setStage('letter'), []);
  const handleFinished = useCallback(() => setFinished(true), []);

  const handleRead = useCallback(
    (point) => {
      setOrigin(point);
      setStage('finale');
      effectsRef.current?.celebrate({
        origin: point,
        reduced: Boolean(reduceMotion),
        intensity: 'gentle',
      });
      playShimmer();
      notifyFinished();
    },
    [reduceMotion],
  );

  const toggleSound = useCallback(() => {
    const next = !soundOn;
    setSoundOn(next);
    setMuted(!next);
  }, [soundOn]);

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
        {stage === 'gate' && <CodeGate key="gate" onUnlocked={handleUnlocked} />}
      </AnimatePresence>

      {/* mounted while the envelope opens (hidden), so the real sheet can be measured */}
      {stage !== 'gate' && !pageGone && (
        <div className={pageClass}>
          <main className={styles.main}>
            <LoveLetter ref={sheetRef} writing={stage === 'letter'} onFinished={handleFinished} />
            <ReadAction visible={finished && stage === 'letter'} onRead={handleRead} />
          </main>
        </div>
      )}

      <AnimatePresence>
        {stage === 'envelope' && (
          <EnvelopeScene
            key="envelope"
            sheetRef={sheetRef}
            onBeforeOpen={handleBeforeOpen}
            onStep={handleStep}
            onOpened={handleOpened}
          />
        )}
      </AnimatePresence>

      {stage === 'finale' && <Finale origin={origin} />}

      <EffectsCanvas ref={effectsRef} />

      {audioReady && <SoundToggle on={soundOn} onToggle={toggleSound} />}
    </div>
  );
}
