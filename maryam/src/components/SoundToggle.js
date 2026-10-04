import { SOUND } from '@/lib/content';
import styles from './SoundToggle.module.css';

/** A small round button in the corner: sound on / off. */
export default function SoundToggle({ on, onToggle }) {
  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={onToggle}
      aria-pressed={on}
      aria-label={on ? SOUND.on : SOUND.off}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path className={styles.speaker} d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" />
        {on ? (
          <path className={styles.waves} d="M15.2 9.2a4 4 0 010 5.6M17.6 6.9a7.3 7.3 0 010 10.2" />
        ) : (
          <path className={styles.waves} d="M16 9.5l5 5M21 9.5l-5 5" />
        )}
      </svg>
    </button>
  );
}
