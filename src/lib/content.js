// All copy used by the experience lives here, so it is easy to read and edit in one place.

// The code is compared in a forgiving way (trimmed, case-insensitive),
// because phone keyboards like to capitalise or autocorrect.
export const ACCEPTED_CODES = ['sabina', 'сабина'];

export const isCodeCorrect = (value) => ACCEPTED_CODES.includes(value.trim().toLowerCase());

export const GATE = {
  title: 'Для Саби',
  prompt: 'Введи код, чтобы открыть письмо',
  accepted: 'Код принят',
  placeholder: 'код',
  error: 'Попробуй ещё раз',
  open: 'Открыть',
};

export const ENVELOPE = {
  address: 'Для Саби',
  open: 'Открыть письмо',
};

export const LETTER = {
  salutation: 'Прости меня, Сабина.',
  paragraphs: [
    ['Я написал, не подумав.', 'Мне было обидно, и поэтому я написал ерунду.'],
    [
      'Клянусь, я люблю тебя больше жизни.',
      'Я готов на всё ради тебя, и в дальнейшем я это сделаю — и ты убедишься.',
    ],
    ['Я не хочу терять тебя.', 'Я хочу, чтобы ты всегда была в моей жизни.'],
  ],
  signature: 'Люблю тебя',
};

export const QUESTION = {
  title: 'Ты меня простишь?',
  yes: 'Да',
  no: 'Нет',
};

// Shown, one after another, every time the "No" button runs away.
// "{heart}" is replaced with a drawn heart (no emoji characters are used anywhere).
export const DODGE_MESSAGES = [
  'Ну пожалуйста',
  'Подумай ещё раз {heart}',
  'Не нажимай сюда...',
  'Я правда хочу всё исправить {heart}',
  'Пожалуйста, Саби',
  'Дай мне шанс {heart}',
];

export const FINALE = {
  title: 'Спасибо, Сабина {heart}',
  lines: ['Я очень рад, что ты меня простила.', 'Я постараюсь доказать это не словами, а поступками.'],
};
