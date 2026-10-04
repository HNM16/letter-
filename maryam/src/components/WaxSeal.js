import { useId } from 'react';

const HEART =
  'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';

const TONES = {
  rose: {
    wax: ['#ecaab2', '#cf6f7c', '#99414f'],
    heart: '#e9959f',
    light: 'rgba(255,235,235,0.5)',
    dark: 'rgba(80,20,30,0.45)',
    ring: 'rgba(255,225,225,0.45)',
    rim: 'rgba(90,25,35,0.35)',
  },
  gold: {
    wax: ['#f6e5ad', '#d4a94d', '#8c6a24'],
    heart: '#f3dc93',
    light: 'rgba(255,248,220,0.6)',
    dark: 'rgba(80,52,8,0.45)',
    ring: 'rgba(255,244,205,0.55)',
    rim: 'rgba(80,52,8,0.35)',
  },
};

// Wax seal with an embossed heart. Drawn as SVG so it stays crisp at any size.
export default function WaxSeal({ className, tone = 'rose' }) {
  const id = useId();
  const t = TONES[tone];
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`${id}-wax`} cx="36%" cy="30%" r="80%">
          <stop offset="0" stopColor={t.wax[0]} />
          <stop offset="0.5" stopColor={t.wax[1]} />
          <stop offset="1" stopColor={t.wax[2]} />
        </radialGradient>
        <radialGradient id={`${id}-rim`} cx="50%" cy="50%" r="50%">
          <stop offset="0.78" stopColor="rgba(255,255,255,0)" />
          <stop offset="0.92" stopColor="rgba(255,255,255,0.32)" />
          <stop offset="1" stopColor={t.rim} />
        </radialGradient>
      </defs>
      {/* slightly irregular wax edge */}
      <path
        fill={`url(#${id}-wax)`}
        d="M50 3c6 0 9 5 15 6.5S80 9 85 15s2 12 4.5 18S99 41 97 50s-9 11-9.5 18S89 84 82 88s-13-1-19 3-10 8-13 8-8-5-14-8-14 1-19-3-5-12-6.5-19S3 59 3 50s6-11 8.5-17 .5-12 5.5-18S29 9 35 9.5 44 3 50 3z"
      />
      <circle cx="50" cy="50" r="46" fill={`url(#${id}-rim)`} />
      <circle cx="50" cy="50" r="31" fill="none" stroke={t.ring} strokeWidth="1.6" />
      <circle cx="50" cy="50" r="31" fill="none" stroke={t.dark} strokeWidth="1" transform="translate(1 1.4)" opacity="0.6" />
      {/* embossed heart: a dark edge below-right, a light edge above-left */}
      <g transform="translate(26 25) scale(2)">
        <path transform="translate(.5 .7)" fill={t.dark} d={HEART} />
        <path fill={t.heart} d={HEART} />
        <path
          fill={t.light}
          d="M7.5 4.4c-2.3 0-4.1 1.8-4.1 4.1 0 .9.2 1.7.6 2.5C4.6 8.3 6 5.6 9.2 5.4 8.9 4.8 8.3 4.4 7.5 4.4z"
        />
      </g>
      <ellipse cx="34" cy="26" rx="13" ry="7" fill="rgba(255,255,255,0.28)" transform="rotate(-30 34 26)" />
    </svg>
  );
}
