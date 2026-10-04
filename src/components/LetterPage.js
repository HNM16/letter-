'use client';

import ForgiveQuestion from './ForgiveQuestion';
import LetterSheet from './LetterSheet';
import styles from './LetterPage.module.css';

/** The scrolling page: the letter, and underneath it the question. */
export default function LetterPage({ sheetRef, writing, questionVisible, onWritten, onYes }) {
  return (
    <main className={styles.page}>
      <LetterSheet ref={sheetRef} writing={writing} onWritten={onWritten} />
      <ForgiveQuestion visible={questionVisible} onYes={onYes} />
    </main>
  );
}
