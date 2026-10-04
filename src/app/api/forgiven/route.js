import { NextResponse } from 'next/server';
import { EmailConfigError, sendForgivenNotification } from '@/lib/mailer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// A second press within this window (a double tap, a reload) does not send a second email.
const COOLDOWN_MS = 30_000;
let lastAttemptAt = 0;

function isSameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  const now = Date.now();
  if (now - lastAttemptAt < COOLDOWN_MS) {
    return NextResponse.json({ ok: true, skipped: 'recently_sent' });
  }
  lastAttemptAt = now;

  try {
    await sendForgivenNotification();
    return NextResponse.json({ ok: true });
  } catch (error) {
    lastAttemptAt = 0; // let the next attempt through
    if (error instanceof EmailConfigError) {
      console.error(`[forgiven] Email is not configured: ${error.message}`);
      return NextResponse.json({ ok: false, error: 'email_not_configured' }, { status: 503 });
    }
    console.error(`[forgiven] Could not send the email: ${error.message}`);
    return NextResponse.json({ ok: false, error: 'email_failed' }, { status: 502 });
  }
}
