import fs from 'node:fs';
import path from 'node:path';
import LetterExperience from '@/components/LetterExperience';

// The page is built once, so this runs at build time: if public/music/music.mp3 exists the music is
// played from it; otherwise the page falls back to a quiet generated melody (see src/lib/audio.js).
const MUSIC_FILE = '/music/music.mp3';

export default function Home() {
  const hasMusicFile = fs.existsSync(path.join(process.cwd(), 'public', MUSIC_FILE));
  return <LetterExperience musicSrc={hasMusicFile ? MUSIC_FILE : null} />;
}
