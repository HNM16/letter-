'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DODGE_MESSAGES, QUESTION } from '@/lib/content';
import { clampToScreen, pickSpot } from '@/lib/runaway';
import Button from './Button';
import Heart, { withHeart } from './Heart';
import styles from './ForgiveQuestion.module.css';

const DODGE_COOLDOWN_MS = 260;
const NEAR_CURSOR_PX = 36;

/**
 * "Ты меня простишь?" with two buttons.
 * "Да" works. "Нет" is a real button too, but it playfully runs away: it jumps to a random
 * spot that is always inside the screen, changes size a little and whispers a message.
 */
export default function ForgiveQuestion({ visible, onYes }) {
  const [answered, setAnswered] = useState(false);
  const [dodges, setDodges] = useState(0);
  const [escaped, setEscaped] = useState(false);
  const [inView, setInView] = useState(true);
  const [spot, setSpot] = useState({ x: 0, y: 0, scale: 1, instant: true });
  const [slotSize, setSlotSize] = useState(null);
  const [toast, setToast] = useState(null);

  const sectionRef = useRef(null);
  const yesRef = useRef(null);
  const slotButtonRef = useRef(null);
  const floatingRef = useRef(null);
  const pointerRef = useRef(null);
  const lastDodgeRef = useRef(0);
  const dodgeCountRef = useRef(0);
  const toastTimerRef = useRef(0);
  const refocusRef = useRef(false);

  const floating = escaped && inView && !answered;

  // The floating button only exists while the question is on screen; otherwise it goes home.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.12,
    });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => clearTimeout(toastTimerRef.current), []);

  const showToast = useCallback((text, y) => {
    clearTimeout(toastTimerRef.current);
    // The message appears on the opposite half of the screen, away from the button.
    const edge = y > window.innerHeight / 2 ? 'top' : 'bottom';
    setToast({ id: dodgeCountRef.current, text, edge });
    toastTimerRef.current = setTimeout(() => setToast(null), 2300);
  }, []);

  const dodge = useCallback(
    (from) => {
      if (answered || !visible) return;
      const now = performance.now();
      if (now - lastDodgeRef.current < DODGE_COOLDOWN_MS) return;
      lastDodgeRef.current = now;

      const button = floatingRef.current ?? slotButtonRef.current;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const size = slotSize ?? { width: rect.width, height: rect.height };
      if (!slotSize) setSlotSize(size);

      const next = pickSpot({
        size,
        from: from ?? pointerRef.current,
        current: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
        avoid: yesRef.current ? [yesRef.current.getBoundingClientRect()] : [],
      });

      dodgeCountRef.current += 1;
      setDodges(dodgeCountRef.current);
      showToast(DODGE_MESSAGES[(dodgeCountRef.current - 1) % DODGE_MESSAGES.length], next.y);

      if (!floating) {
        // First escape: appear exactly where the button was, then jump.
        refocusRef.current = document.activeElement === slotButtonRef.current;
        setSpot({ x: rect.left, y: rect.top, scale: 1, instant: true });
        setEscaped(true);
        requestAnimationFrame(() =>
          requestAnimationFrame(() => setSpot({ ...next, instant: false })),
        );
      } else {
        setSpot({ ...next, instant: false });
      }
    },
    [answered, visible, floating, slotSize, showToast],
  );

  // Keyboard focus follows the button when it leaves its place.
  useEffect(() => {
    if (floating && refocusRef.current) {
      refocusRef.current = false;
      floatingRef.current?.focus({ preventScroll: true });
    }
  }, [floating]);

  // With a mouse the button also steps aside when the cursor gets close.
  useEffect(() => {
    if (answered || !visible) return undefined;
    const onMove = (event) => {
      pointerRef.current = { x: event.clientX, y: event.clientY };
      if (event.pointerType !== 'mouse') return;
      const button = floatingRef.current ?? slotButtonRef.current;
      if (!button) return;
      const r = button.getBoundingClientRect();
      if (
        event.clientX > r.left - NEAR_CURSOR_PX &&
        event.clientX < r.right + NEAR_CURSOR_PX &&
        event.clientY > r.top - NEAR_CURSOR_PX &&
        event.clientY < r.bottom + NEAR_CURSOR_PX
      ) {
        dodge({ x: event.clientX, y: event.clientY });
      }
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [answered, visible, dodge]);

  // Rotation / resize: keep the floating button inside the screen.
  useEffect(() => {
    if (!floating || !slotSize) return undefined;
    const onResize = () =>
      setSpot((prev) => ({ ...clampToScreen(prev, slotSize), instant: true }));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [floating, slotSize]);

  const handlePointerDown = (event) => {
    pointerRef.current = { x: event.clientX, y: event.clientY };
    if (event.pointerType === 'mouse') return; // the mouse is handled by hover / proximity
    event.preventDefault();
    dodge({ x: event.clientX, y: event.clientY });
  };

  const handleYes = (event) => {
    if (answered) return;
    setAnswered(true);
    clearTimeout(toastTimerRef.current);
    setToast(null);
    const rect = event.currentTarget.getBoundingClientRect();
    onYes({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  };

  const noButtonProps = {
    variant: 'ghost',
    onPointerDown: handlePointerDown,
    onPointerEnter: (event) => event.pointerType === 'mouse' && dodge({ x: event.clientX, y: event.clientY }),
    onClick: () => dodge(),
  };

  const yesScale = 1 + Math.min(dodges, 6) * 0.04;

  return (
    <section
      ref={sectionRef}
      className={styles.block}
      data-visible={visible}
      aria-labelledby="forgive-question"
      aria-hidden={!visible}
    >
      <div className={styles.ornament} aria-hidden="true">
        <span />
        <Heart className={styles.ornamentHeart} />
        <span />
      </div>

      <h2 id="forgive-question" className={styles.title}>
        {QUESTION.title}
      </h2>

      <div className={styles.actions}>
        <div className={styles.yesWrap} style={{ transform: `scale(${yesScale})` }}>
          <Button ref={yesRef} size="lg" onClick={handleYes} disabled={!visible || answered}>
            {QUESTION.yes}
            <Heart className={styles.yesHeart} />
          </Button>
        </div>

        <div
          className={styles.slot}
          style={slotSize ? { width: slotSize.width, height: slotSize.height } : undefined}
        >
          {!floating && (
            <Button
              ref={slotButtonRef}
              size="lg"
              className={styles.no}
              disabled={!visible || answered}
              {...noButtonProps}
            >
              {QUESTION.no}
            </Button>
          )}
        </div>
      </div>

      {floating &&
        createPortal(
          <div
            className={styles.floating}
            data-instant={spot.instant}
            style={{ '--x': `${spot.x}px`, '--y': `${spot.y}px`, '--s': spot.scale }}
          >
            <Button
              key={dodges}
              ref={floatingRef}
              size="lg"
              className={`${styles.no} ${styles.wiggle}`}
              {...noButtonProps}
            >
              {QUESTION.no}
            </Button>
          </div>,
          document.body,
        )}

      {toast &&
        !answered &&
        createPortal(
          <p key={toast.id} className={styles.toast} data-edge={toast.edge} role="status">
            {withHeart(toast.text)}
          </p>,
          document.body,
        )}
    </section>
  );
}
