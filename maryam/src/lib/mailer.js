// Sends the "she has read the letter" email. Runs on the server only: the API key never reaches the browser.
//
// The default provider is Resend (https://resend.com) through its plain HTTP API, so no SDK is needed.
// To use another service, only this file has to change.

const DEFAULT_TO = 'nekruzhakimov320@gmail.com';
const DEFAULT_FROM = 'Letter <onboarding@resend.dev>';
const DEFAULT_API_URL = 'https://api.resend.com/emails';

export class EmailConfigError extends Error {}

function formatTime(date) {
  const options = { dateStyle: 'long', timeStyle: 'long' }; // 'long' includes the time zone name
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      ...options,
      timeZone: process.env.EMAIL_TIMEZONE || 'UTC',
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat('ru-RU', { ...options, timeZone: 'UTC' }).format(date);
  }
}

function buildMessage(when) {
  const subject = 'Марьям открыла и прочитала письмо';
  const text = [
    'Марьям открыла и прочитала письмо.',
    '',
    'Она дошла до финала и нажала кнопку.',
    '',
    `Время: ${when}`,
  ].join('\n');

  const html = `<!doctype html>
<html lang="ru">
  <body style="margin:0;padding:32px 16px;background:#fbf6ee;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;margin:0 auto;">
      <tr>
        <td style="background:#fffdf8;border:1px solid #e6d3a8;border-radius:18px;padding:40px 32px;text-align:center;font-family:Georgia,'Times New Roman',serif;color:#4a3b38;">
          <div style="font-size:34px;line-height:1;color:#d98c93;">&#9829;</div>
          <h1 style="margin:18px 0 14px;font-size:28px;font-weight:normal;font-style:italic;color:#4a3b38;">Марьям открыла и прочитала письмо</h1>
          <p style="margin:0 0 22px;font-size:17px;line-height:1.6;color:#4a3b38;">
            Она дошла до финала и нажала кнопку.
          </p>
          <p style="margin:0;font-size:13px;color:#8a7770;">${when}</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}

export async function sendFinishedNotification() {
  const apiKey = process.env.EMAIL_SERVICE_API_KEY;
  if (!apiKey) {
    throw new EmailConfigError('EMAIL_SERVICE_API_KEY is not set');
  }

  const to = process.env.EMAIL_TO || DEFAULT_TO;
  const from = process.env.EMAIL_FROM || DEFAULT_FROM;
  const url = process.env.EMAIL_API_URL || DEFAULT_API_URL;
  const { subject, text, html } = buildMessage(formatTime(new Date()));

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], subject, text, html }),
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000), // do not leave the request hanging
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error(`Email service answered ${response.status}: ${details.slice(0, 300)}`);
  }
}
