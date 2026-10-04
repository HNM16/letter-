// Everything about sound lives here.
//
//  * Music: the file public/music/music.mp3 (see public/music/README.txt). If the file is missing or
//    cannot be played, a very quiet generative "music box" is used instead, so the page is never silent
//    by accident. Either way it fades in slowly.
//  * Effects (paper, seal, chime, shimmer): synthesised on the fly, no files needed, all of them quiet.
//
// Browsers (iOS especially) only allow sound after a tap, so `unlockAudio()` and `startMusic()` must be
// called synchronously from a click handler.

const MUSIC_FILE_LEVEL = 0.34;
const MUSIC_SYNTH_LEVEL = 0.5;
const FADE_IN_SECONDS = 4;

let ctx = null;
let master = null; // everything passes through here (mute)
let musicBus = null;
let sfxBus = null;
let reverb = null;
let noise = null;
let muted = false;
let musicStarted = false;
const stoppers = [];

const rand = (min, max) => min + Math.random() * (max - min);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

function makeImpulse(seconds, decay) {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * seconds);
  const buffer = ctx.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch += 1) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** decay;
    }
  }
  return buffer;
}

function makeNoise() {
  const length = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function fade(gainNode, to, seconds) {
  const t = ctx.currentTime;
  gainNode.gain.cancelScheduledValues(t);
  gainNode.gain.setValueAtTime(Math.max(gainNode.gain.value, 0.0001), t);
  gainNode.gain.linearRampToValueAtTime(Math.max(to, 0.0001), t + seconds);
}

/** Creates the audio engine. Call inside a click / tap handler. Returns false if audio is unavailable. */
export function unlockAudio() {
  if (typeof window === 'undefined') return false;
  if (!ctx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;
    ctx = new AudioContextClass();

    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ctx.destination);

    musicBus = ctx.createGain();
    musicBus.gain.value = 0.0001;
    musicBus.connect(master);

    sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.9;
    sfxBus.connect(master);

    reverb = ctx.createConvolver();
    reverb.buffer = makeImpulse(3.4, 3);
    const wet = ctx.createGain();
    wet.gain.value = 0.55;
    reverb.connect(wet);
    wet.connect(master);

    noise = makeNoise();

    // do not play (or burn battery) while the tab is hidden
    document.addEventListener('visibilitychange', () => {
      if (!ctx) return;
      if (document.hidden) ctx.suspend();
      else ctx.resume();
    });
  }

  if (ctx.state === 'suspended') ctx.resume();

  // iOS only starts the engine after a sound has been played inside the gesture
  const silent = ctx.createBufferSource();
  silent.buffer = ctx.createBuffer(1, 1, 22050);
  silent.connect(ctx.destination);
  silent.start(0);
  return true;
}

export function isAudioReady() {
  return Boolean(ctx);
}

export function setMuted(value) {
  muted = value;
  if (!ctx) return;
  const t = ctx.currentTime;
  master.gain.cancelScheduledValues(t);
  master.gain.setValueAtTime(master.gain.value, t);
  master.gain.linearRampToValueAtTime(value ? 0 : 1, t + 0.35);
}

// ---------- notes ----------

function bell(freq, when, { level = 0.06, length = 3.2, send = 0.7 } = {}) {
  const out = ctx.createGain();
  out.gain.setValueAtTime(0.0001, when);
  out.gain.exponentialRampToValueAtTime(level, when + 0.012);
  out.gain.exponentialRampToValueAtTime(0.0001, when + length);

  const partial = ctx.createGain();
  partial.gain.setValueAtTime(0.0001, when);
  partial.gain.exponentialRampToValueAtTime(level * 0.28, when + 0.01);
  partial.gain.exponentialRampToValueAtTime(0.0001, when + length * 0.4);

  const a = ctx.createOscillator();
  a.type = 'sine';
  a.frequency.value = freq;
  const b = ctx.createOscillator();
  b.type = 'sine';
  b.frequency.value = freq * 2.01;

  a.connect(out);
  b.connect(partial);
  partial.connect(out);
  return { out, oscillators: [a, b], end: when + length + 0.1, send };
}

function playBell(bus, freq, when, options) {
  const voice = bell(freq, when, options);
  voice.out.connect(bus);
  const sendGain = ctx.createGain();
  sendGain.gain.value = voice.send;
  voice.out.connect(sendGain);
  sendGain.connect(reverb);
  voice.oscillators.forEach((o) => {
    o.start(when);
    o.stop(voice.end);
  });
}

// ---------- effects ----------

function noiseBurst(when, length, level, freq, q = 0.8) {
  const source = ctx.createBufferSource();
  source.buffer = noise;
  source.loop = true;
  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = freq;
  band.Q.value = q;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(level, when + length * 0.3);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + length);
  source.connect(band);
  band.connect(gain);
  gain.connect(sfxBus);
  source.start(when, Math.random() * 0.5);
  source.stop(when + length + 0.05);
}

/** Paper sliding: a handful of soft, overlapping rustles. */
export function playPaper() {
  if (!ctx) return;
  const t = ctx.currentTime;
  for (let i = 0; i < 7; i += 1) {
    noiseBurst(t + i * 0.16 + rand(0, 0.05), rand(0.18, 0.3), rand(0.03, 0.06), rand(2200, 4800));
  }
}

/** A tiny tick, the wax seal giving way. */
export function playSeal() {
  if (!ctx) return;
  const t = ctx.currentTime;
  noiseBurst(t, 0.07, 0.07, 1800, 1.2);
  playBell(sfxBus, 1244.5, t, { level: 0.03, length: 0.7, send: 0.4 });
}

/** The letter appears: two soft chime notes. */
export function playChime() {
  if (!ctx) return;
  const t = ctx.currentTime;
  playBell(sfxBus, 659.25, t, { level: 0.05, length: 2.8 });
  playBell(sfxBus, 987.77, t + 0.14, { level: 0.04, length: 3 });
  playBell(sfxBus, 1318.5, t + 0.3, { level: 0.028, length: 3.2 });
}

/** The finale: a rising shimmer. */
export function playShimmer() {
  if (!ctx) return;
  const t = ctx.currentTime;
  [587.33, 739.99, 880, 1174.66, 1479.98, 1760].forEach((freq, i) => {
    playBell(sfxBus, freq, t + i * 0.13, { level: 0.034, length: 3.4, send: 0.9 });
  });
}

// ---------- music ----------

// D major pentatonic: every combination of these notes sounds calm.
const SCALE = [293.66, 329.63, 369.99, 440, 493.88, 587.33, 659.25, 739.99, 880];
const CHORDS = [
  [146.83, 220, 369.99],
  [123.47, 185, 293.66],
  [98, 146.83, 246.94],
  [110, 164.81, 277.18],
];

function startGenerativeMusic() {
  let nextNote = ctx.currentTime + 0.6;
  let nextChord = ctx.currentTime + 0.2;
  let chordIndex = 0;
  let noteIndex = 3;

  const pad = (when, notes) => {
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, when);
    out.gain.linearRampToValueAtTime(0.05, when + 2.6);
    out.gain.linearRampToValueAtTime(0.0001, when + 9);
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 800;
    tone.connect(out);
    out.connect(musicBus);
    const send = ctx.createGain();
    send.gain.value = 0.5;
    out.connect(send);
    send.connect(reverb);
    notes.forEach((freq) => {
      [-3, 3].forEach((cents) => {
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.value = freq;
        o.detune.value = cents;
        o.connect(tone);
        o.start(when);
        o.stop(when + 9.2);
      });
    });
  };

  const tick = () => {
    while (nextChord < ctx.currentTime + 2) {
      pad(nextChord, CHORDS[chordIndex % CHORDS.length]);
      chordIndex += 1;
      nextChord += 8;
    }
    while (nextNote < ctx.currentTime + 1.5) {
      if (Math.random() > 0.18) {
        noteIndex = Math.min(SCALE.length - 1, Math.max(0, noteIndex + pick([-2, -1, -1, 0, 1, 1, 2])));
        playBell(musicBus, SCALE[noteIndex], nextNote, { level: rand(0.045, 0.075) });
      }
      nextNote += rand(0.9, 2.2);
    }
  };

  tick();
  const timer = setInterval(tick, 400);
  fade(musicBus, MUSIC_SYNTH_LEVEL, FADE_IN_SECONDS * 1.5);
  return () => clearInterval(timer);
}

function startFileMusic(src, onFail) {
  const element = new Audio();
  element.loop = true;
  element.preload = 'auto';
  element.src = src;

  // Going through the audio graph gives a real fade-in on iOS too (it ignores element.volume).
  try {
    ctx.createMediaElementSource(element).connect(musicBus);
  } catch {
    onFail();
    return () => {};
  }

  let failed = false;
  const fail = () => {
    if (failed) return;
    failed = true;
    element.pause();
    onFail();
  };
  element.addEventListener('error', fail, { once: true });
  const attempt = element.play();
  if (attempt) {
    attempt.then(() => fade(musicBus, MUSIC_FILE_LEVEL, FADE_IN_SECONDS)).catch(fail);
  }
  return () => {
    failed = true;
    element.pause();
  };
}

/**
 * Starts the background music with a slow fade-in. Call from the same click as `unlockAudio()`.
 * `src` is the music file, or null when there is none.
 */
export function startMusic(src) {
  if (!ctx || musicStarted) return;
  musicStarted = true;

  const useGenerative = () => stoppers.push(startGenerativeMusic());
  if (src) stoppers.push(startFileMusic(src, useGenerative));
  else useGenerative();
}

export function stopAllMusic() {
  stoppers.splice(0).forEach((stop) => stop());
  musicStarted = false;
}
