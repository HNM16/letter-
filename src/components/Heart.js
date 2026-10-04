import { Fragment, useId } from 'react';

// One drawn heart used everywhere instead of an emoji character,
// so it looks identical on every device and picks up the surrounding colour.
const PATH =
  'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';

export default function Heart({ className, style, gradient = false, title }) {
  const gradientId = useId();

  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 24 24"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {gradient && (
        <defs>
          <linearGradient id={gradientId} x1="0.1" y1="0" x2="0.9" y2="1">
            <stop offset="0" stopColor="#f0b4bb" />
            <stop offset="0.55" stopColor="#d87a86" />
            <stop offset="1" stopColor="#b9606c" />
          </linearGradient>
        </defs>
      )}
      <path d={PATH} fill={gradient ? `url(#${gradientId})` : 'currentColor'} />
    </svg>
  );
}

// Turns "Текст {heart}" into text followed by a heart icon.
export function withHeart(text, heartProps = {}) {
  return text.split('{heart}').map((part, i, all) => (
    <Fragment key={i}>
      {part}
      {i < all.length - 1 && <Heart className="inline-heart" {...heartProps} />}
    </Fragment>
  ));
}
