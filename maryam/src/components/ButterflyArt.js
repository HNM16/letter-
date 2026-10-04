// A single butterfly, seen from above. The two wings flap with a CSS animation (see Butterflies.module.css).
// Gradients live in <ButterflyDefs/> and are referenced by palette index.

export const PALETTES = [
  { base: '#fbe3e6', tip: '#e79aa7', edge: '#b9606c' }, // rose
  { base: '#fff3d8', tip: '#e6c06f', edge: '#a8812f' }, // gold
  { base: '#fffaf3', tip: '#efd2c0', edge: '#b98f78' }, // cream
  { base: '#f7e0d4', tip: '#eeaa90', edge: '#b9694e' }, // peach
  { base: '#efe3f2', tip: '#c9a6d3', edge: '#8a6396' }, // soft lilac
];

export function ButterflyDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        {PALETTES.map((p, i) => (
          <linearGradient key={i} id={`butterfly-wing-${i}`} x1="0" y1="0.5" x2="1" y2="0.2">
            <stop offset="0" stopColor={p.base} />
            <stop offset="0.55" stopColor={p.base} stopOpacity="0.96" />
            <stop offset="1" stopColor={p.tip} />
          </linearGradient>
        ))}
      </defs>
    </svg>
  );
}

const FORE = 'M51 47C52 30 66 10 88 5C97 4 100 12 97 22C94 34 78 47 61 52C56 53 52 51 51 47Z';
const HIND = 'M51 53C67 52 88 57 91 70C93 82 80 90 70 84C60 78 53 66 51 53Z';

function Wing({ palette, flapStyle }) {
  const { edge } = PALETTES[palette];
  const fill = `url(#butterfly-wing-${palette})`;
  return (
    <g className="bf-wing" style={flapStyle}>
      <path d={HIND} fill={fill} stroke={edge} strokeOpacity="0.55" strokeWidth="0.7" />
      <path d={FORE} fill={fill} stroke={edge} strokeOpacity="0.55" strokeWidth="0.7" />
      <path
        d="M52 48C66 33 80 20 94 10M52 49C68 41 84 33 96 24M52 54C66 60 80 70 88 80"
        fill="none"
        stroke={edge}
        strokeOpacity="0.28"
        strokeWidth="0.6"
        strokeLinecap="round"
      />
      <circle cx="86" cy="16" r="3.2" fill="#fff" fillOpacity="0.6" />
      <circle cx="92.5" cy="26" r="1.9" fill="#fff" fillOpacity="0.5" />
      <circle cx="80" cy="76" r="3" fill="#fff" fillOpacity="0.5" />
    </g>
  );
}

export default function ButterflyArt({ palette, flapStyle }) {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true" focusable="false">
      <g>
        <Wing palette={palette} flapStyle={flapStyle} />
      </g>
      <g transform="matrix(-1 0 0 1 100 0)">
        <Wing palette={palette} flapStyle={flapStyle} />
      </g>
      <path
        d="M49 37C47 29 43 24 38 22M51 37C53 29 57 24 62 22"
        fill="none"
        stroke="#5c4440"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <ellipse cx="50" cy="54" rx="2.1" ry="14" fill="#5c4440" />
      <circle cx="50" cy="38.5" r="2.7" fill="#5c4440" />
    </svg>
  );
}
