// All copy used by the experience lives here, so it is easy to read and edit in one place.
// "{heart}" is replaced with a drawn heart: no emoji characters are used anywhere.

// The code is compared in a forgiving way (trimmed, case-insensitive),
// because phone keyboards like to capitalise or autocorrect.
export const ACCEPTED_CODES = ['maryam', 'марьям'];

export const isCodeCorrect = (value) => ACCEPTED_CODES.includes(value.trim().toLowerCase());

export const GATE = {
  title: 'Для Марьям',
  prompt: 'У меня есть для тебя кое-что...',
  placeholder: 'код',
  error: 'Кажется, это не тот код',
};

export const ENVELOPE = {
  address: 'Для Марьям',
  open: 'Открыть письмо',
};

// The letter, word for word. The heart after the heading and the heart after the last
// paragraph are drawn by the page (see LoveLetter.js).
export const LETTER = {
  heading: 'Марьям, я люблю тебя больше всего!',
  paragraphs: [
    'Ты очень дорога мне, и я не хочу тебя терять. Ты — самое лучшее, что случилось со мной за всё это время. Все дни, когда мы с тобой не общались, ты всегда была у меня в голове и в мыслях. Ты — человек, который способен сделать меня счастливым даже в самые трудные моменты.',
    'Я вижу наше с тобой будущее и уверен, что у нас всё будет хорошо. Однажды мы будем вспоминать всё это и смеяться, радуясь тому, что смогли пройти через все трудности. Самое главное, что мы не сдались и смогли сохранить наши чувства.',
    'Твоё имя звучало в каждой моей молитве, и я всегда просил Аллаха о нашем счастье. Я хочу, чтобы в будущем мы были рядом, поддерживали друг друга и вместе преодолевали все трудности. Я хочу строить с тобой нашу собственную жизнь, в которой мы будем принимать решения вместе, с уважением относясь к нашим семьям.',
    'Марьям, ты действительно очень много для меня значишь. Я искренне хочу, чтобы у нас всё получилось, и надеюсь, что впереди нас ждёт много счастливых моментов.',
  ],
  // the first sentence of the last paragraph is the one that is set apart
  emphasisSentence: 'Марьям, ты действительно очень много для меня значишь.',
};

export const READ = {
  button: 'Я прочитала {heart}',
};

export const FINALE = {
  title: 'Для тебя, Марьям {heart}',
  line: 'Спасибо, что прочитала.',
};

export const SOUND = {
  on: 'Выключить звук',
  off: 'Включить звук',
};
