'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { range, seededRandom } from '@/lib/random';
import ButterflyArt, { ButterflyDefs, PALETTES } from './ButterflyArt';
import styles from './Butterflies.module.css';

const MAX_BUTTERFLIES = 16;
const BASE_SIZE = 46;

const TAU = Math.PI * 2;
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const rand = (min, max) => min + Math.random() * (max - min);
const wrapAngle = (a) => {
  let r = a;
  while (r > Math.PI) r -= TAU;
  while (r < -Math.PI) r += TAU;
  return r;
};

function countFor({ festive, mobile, reduced }) {
  if (reduced) return 3;
  if (festive) return mobile ? 12 : 16;
  return mobile ? 5 : 7;
}

/**
 * Soft butterflies drifting across the screen.
 *
 * Each one is a small steering simulation: it wanders, sometimes drifts close to the letter,
 * sometimes leaves the screen and comes back from another side. The far ones fly *behind* the
 * paper, the near ones in front of it (and fade a little when they cross the text).
 * In the finale (`festive`) there are more of them, they are faster and circle the heart.
 */
export default function Butterflies({ festive = false }) {
  const reduced = useReducedMotion();
  const rootRef = useRef(null);
  const festiveRef = useRef(festive);
  const reducedRef = useRef(reduced);

  useEffect(() => {
    festiveRef.current = festive;
  }, [festive]);
  useEffect(() => {
    reducedRef.current = reduced;
  }, [reduced]);

  // Fixed, deterministic look for each slot: depth, palette, wing speed.
  const slots = useMemo(() => {
    const r = seededRandom(2024);
    return Array.from({ length: MAX_BUTTERFLIES }, (_, i) => {
      const depth = i % 3 === 0 ? range(r, 0.55, 0.8) : range(r, 0.9, 1.25);
      return {
        id: i,
        depth,
        palette: i % PALETTES.length,
        back: depth < 0.85,
        flap: range(r, 0.28, 0.5),
        flapPhase: -range(r, 0, 1),
      };
    });
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    // back and front layers are separate lists, so index the elements by their slot number
    const elements = [];
    root.querySelectorAll('[data-butterfly]').forEach((el) => {
      elements[Number(el.dataset.order)] = el;
    });

    let vw = document.documentElement.clientWidth;
    let vh = window.innerHeight;
    let mobile = vw < 640;
    let zone = null;
    let pointer = { x: 0, y: 0 };
    let pointerSmooth = { x: 0, y: 0 };
    let lastScroll = window.scrollY;
    let scrollSmooth = 0;
    let last = performance.now();
    let frame = 0;
    let zoneTimer = 0;

    const now0 = performance.now();
    const flies = slots.map((slot, i) => ({
      slot,
      el: elements[i],
      size: BASE_SIZE * slot.depth,
      x: -300,
      y: -300,
      heading: 0,
      baseSpeed: rand(34, 66) * (0.7 + slot.depth * 0.4),
      agility: rand(1.5, 3.1),
      flutterRate: rand(2.6, 5),
      wobbleRate: rand(1.2, 2.6),
      phase: rand(0, 10),
      mode: 'away',
      until: now0 + 400 + i * 380, // they arrive one after another
      active: false,
      target: { x: 0, y: 0 },
      retargetAt: 0,
      orbitAngle: rand(0, TAU),
      orbitRadius: rand(0.5, 1),
      orbitDir: Math.random() < 0.5 ? 1 : -1,
      opacity: 1,
    }));

    const readZone = () => {
      const el = document.querySelector('[data-reading-zone]');
      zone = el ? el.getBoundingClientRect() : null;
    };
    readZone();
    zoneTimer = window.setInterval(readZone, 250);

    const onResize = () => {
      vw = document.documentElement.clientWidth;
      vh = window.innerHeight;
      mobile = vw < 640;
    };
    const onPointer = (e) => {
      pointer = { x: (e.clientX / vw - 0.5) * 2, y: (e.clientY / vh - 0.5) * 2 };
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onPointer, { passive: true });

    const inside = (x, y, pad = 0) => x > pad && x < vw - pad && y > pad && y < vh - pad;

    const spawnOffscreen = (b) => {
      const edge = Math.floor(Math.random() * 4);
      const m = 90;
      if (edge === 0) [b.x, b.y] = [-m, rand(0, vh)];
      if (edge === 1) [b.x, b.y] = [vw + m, rand(0, vh)];
      if (edge === 2) [b.x, b.y] = [rand(0, vw), -m];
      if (edge === 3) [b.x, b.y] = [rand(0, vw), vh + m];
      b.heading = Math.atan2(vh / 2 - b.y, vw / 2 - b.x) + rand(-0.5, 0.5);
    };

    const pickWander = (b) => {
      const pad = 50;
      const angle = rand(0, TAU);
      const dist = rand(160, 420);
      b.target = {
        x: clamp(b.x + Math.cos(angle) * dist, pad, vw - pad),
        y: clamp(b.y + Math.sin(angle) * dist, pad, vh - pad),
      };
      b.retargetAt = performance.now() + rand(1800, 4200);
    };

    const pickVisit = (b) => {
      // Somewhere along the side of the paper, close enough to look at the words.
      const r = zone ?? { left: vw * 0.1, right: vw * 0.9, top: 0, bottom: vh };
      const top = clamp(Math.max(r.top, 0) + 60, 60, vh - 60);
      const bottom = clamp(Math.min(r.bottom, vh) - 60, top, vh - 60);
      const side = Math.random() < 0.5 ? r.left - 26 : r.right + 26;
      b.anchor = { x: clamp(side, 34, vw - 34), y: rand(top, bottom) };
      b.until = performance.now() + rand(3500, 6500);
    };

    const pickLeave = (b) => {
      const edge = Math.floor(Math.random() * 4);
      const m = 140;
      if (edge === 0) b.target = { x: -m, y: rand(0, vh) };
      if (edge === 1) b.target = { x: vw + m, y: rand(0, vh) };
      if (edge === 2) b.target = { x: rand(0, vw), y: -m };
      if (edge === 3) b.target = { x: rand(0, vw), y: vh + m };
      b.until = performance.now() + 14000;
    };

    const chooseMode = (b) => {
      const t = performance.now();
      const roll = Math.random();
      if (festiveRef.current) {
        if (roll < 0.62) b.mode = 'orbit';
        else if (roll < 0.94) b.mode = 'wander';
        else b.mode = 'leave';
        b.until = t + rand(4000, 9000);
      } else if (roll < 0.48) {
        b.mode = 'wander';
        b.until = t + rand(4000, 9000);
      } else if (roll < 0.78) {
        b.mode = 'visit';
        pickVisit(b);
      } else {
        b.mode = 'leave';
      }
      if (b.mode === 'wander') pickWander(b);
      if (b.mode === 'leave') pickLeave(b);
    };

    const tick = (nowMs) => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (nowMs - last) / 1000);
      last = nowMs;
      if (dt <= 0) return;
      const t = nowMs / 1000;

      const isFestive = festiveRef.current;
      const isReduced = reducedRef.current;
      const wanted = countFor({ festive: isFestive, mobile, reduced: isReduced });
      const speedMul = isReduced ? 0.3 : isFestive ? 1.55 : 1;

      pointerSmooth.x += (pointer.x - pointerSmooth.x) * Math.min(1, dt * 2);
      pointerSmooth.y += (pointer.y - pointerSmooth.y) * Math.min(1, dt * 2);
      const scrollNow = window.scrollY;
      const scrollSpeed = (scrollNow - lastScroll) / Math.max(dt, 0.001);
      lastScroll = scrollNow;
      scrollSmooth += (scrollSpeed - scrollSmooth) * Math.min(1, dt * 6);

      for (let i = 0; i < flies.length; i += 1) {
        const b = flies[i];
        if (!b.el) continue;

        // retire / bring in butterflies to match the wanted number
        if (i >= wanted) {
          if (b.active && b.mode !== 'retire') {
            b.mode = 'retire';
            pickLeave(b);
          }
        } else if (!b.active && b.mode !== 'away') {
          b.mode = 'away';
          b.until = nowMs + 200 + (i % 6) * 280;
        }

        if (b.mode === 'away') {
          b.active = false;
          if (i < wanted && nowMs >= b.until) {
            spawnOffscreen(b);
            b.active = true;
            b.mode = 'wander';
            b.until = nowMs + rand(3000, 6000);
            pickWander(b);
          } else {
            b.el.style.visibility = 'hidden';
            continue;
          }
        }

        const m = b.mode;
        const speedBoost = isFestive ? 1.2 : 1;

        if (m !== 'retire' && m !== 'leave' && nowMs >= b.until) chooseMode(b);

        let tx = b.target.x;
        let ty = b.target.y;
        let slow = 1;

        if (m === 'wander') {
          if (nowMs >= b.retargetAt || Math.hypot(tx - b.x, ty - b.y) < 36) pickWander(b);
          tx = b.target.x;
          ty = b.target.y;
        } else if (m === 'visit') {
          const a = b.anchor ?? { x: vw / 2, y: vh / 2 };
          // hover around the anchor: a slowly moving target on a small circle
          const ang = t * 1.3 + b.phase;
          tx = a.x + Math.cos(ang) * 46;
          ty = a.y + Math.sin(ang * 1.4) * 34;
          if (Math.hypot(a.x - b.x, a.y - b.y) < 120) slow = 0.55;
        } else if (m === 'orbit') {
          const radius = Math.min(vw, vh) * (mobile ? 0.3 : 0.34) * (0.55 + b.orbitRadius * 0.75);
          b.orbitAngle += b.orbitDir * dt * (0.5 + b.orbitRadius * 0.35);
          tx = vw / 2 + Math.cos(b.orbitAngle) * radius * 1.15;
          ty = vh * 0.42 + Math.sin(b.orbitAngle) * radius * 0.8;
        } else {
          // leave / retire
          tx = b.target.x;
          ty = b.target.y;
        }

        const desired = Math.atan2(ty - b.y, tx - b.x);
        const maxTurn = b.agility * dt * (isFestive ? 1.25 : 1);
        b.heading += clamp(wrapAngle(desired - b.heading), -maxTurn, maxTurn);
        b.heading += Math.sin(t * b.wobbleRate + b.phase) * 0.85 * dt;

        // butterflies do not fly evenly: they surge and glide
        const surge = 0.5 + 0.5 * Math.sin(t * b.flutterRate + b.phase);
        const speed = b.baseSpeed * speedMul * speedBoost * slow * (0.45 + 0.75 * surge);
        b.x += Math.cos(b.heading) * speed * dt;
        b.y += Math.sin(b.heading) * speed * dt + Math.sin(t * 2.4 + b.phase) * 7 * dt;

        // gone off the screen on purpose
        if ((m === 'leave' || m === 'retire') && !inside(b.x, b.y, -50)) {
          b.mode = 'away';
          b.active = false;
          b.until = nowMs + rand(1500, 6000);
          b.el.style.visibility = 'hidden';
          continue;
        }

        // keep wanderers from drifting away by accident
        if (m !== 'leave' && m !== 'retire' && !inside(b.x, b.y, -120)) {
          b.heading = Math.atan2(vh / 2 - b.y, vw / 2 - b.x);
        }

        // gentle parallax: pointer and scrolling move near butterflies more than far ones
        const depthFactor = b.slot.depth - 0.4;
        const px = pointerSmooth.x * 16 * depthFactor;
        const py = pointerSmooth.y * 10 * depthFactor - clamp(scrollSmooth * 0.035, -46, 46) * depthFactor;

        // let the words breathe: dim a butterfly while it is over the text
        let targetOpacity = b.slot.back ? 0.82 : 1;
        if (!b.slot.back && zone && b.x > zone.left + 10 && b.x < zone.right - 10 && b.y > zone.top && b.y < zone.bottom) {
          targetOpacity = 0.5;
        }
        b.opacity += (targetOpacity - b.opacity) * Math.min(1, dt * 5);

        const bank = Math.sin(t * 1.7 + b.phase) * 0.16;
        const rot = b.heading + Math.PI / 2 + bank;
        b.el.style.visibility = 'visible';
        b.el.style.opacity = b.opacity.toFixed(3);
        b.el.style.transform = `translate3d(${(b.x + px - b.size / 2).toFixed(1)}px, ${(b.y + py - b.size / 2).toFixed(1)}px, 0) rotate(${rot.toFixed(3)}rad)`;
        b.active = true;
      }
    };

    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(zoneTimer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointer);
    };
  }, [slots]);

  const renderLayer = (back) =>
    slots
      .filter((s) => s.back === back)
      .map((s) => (
        <div
          key={s.id}
          data-butterfly
          data-order={s.id}
          className={styles.butterfly}
          style={{
            width: BASE_SIZE * s.depth,
            height: BASE_SIZE * s.depth,
            '--flap': `${s.flap}s`,
            '--flap-phase': `${s.flapPhase * s.flap}s`,
          }}
        >
          <ButterflyArt palette={s.palette} />
        </div>
      ));

  return (
    <div ref={rootRef} className={styles.root} data-reduced={reduced ? 'true' : 'false'} aria-hidden="true">
      <ButterflyDefs />
      <div className={`${styles.layer} ${styles.back}`}>{renderLayer(true)}</div>
      <div className={`${styles.layer} ${styles.front}`}>{renderLayer(false)}</div>
    </div>
  );
}
