'use client';

import { useState } from 'react';
import { READ } from '@/lib/content';
import Button from './Button';
import { withHeart } from './Heart';
import styles from './ReadAction.module.css';

/** The button under the letter: "Я прочитала". It fades in once the whole letter has been written. */
export default function ReadAction({ visible, onRead }) {
  const [pressed, setPressed] = useState(false);

  const handleClick = (event) => {
    if (pressed) return;
    setPressed(true);
    const rect = event.currentTarget.getBoundingClientRect();
    onRead({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  };

  return (
    <div className={styles.action} data-visible={visible}>
      <Button size="lg" className={styles.button} onClick={handleClick} disabled={!visible || pressed}>
        {withHeart(READ.button)}
      </Button>
    </div>
  );
}
