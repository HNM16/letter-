// Tells the server that the "Yes" button was pressed; the server sends the email.
// If the network fails the request is kept in localStorage and retried on the next visit.

const ENDPOINT = '/api/forgiven';
const PENDING_KEY = 'letter:forgiven-pending';
const ATTEMPTS = 3;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const remember = (value) => {
  try {
    if (value) localStorage.setItem(PENDING_KEY, String(Date.now()));
    else localStorage.removeItem(PENDING_KEY);
  } catch {
    // private mode / storage disabled: nothing else to do
  }
};

const hasPending = () => {
  try {
    return Boolean(localStorage.getItem(PENDING_KEY));
  } catch {
    return false;
  }
};

async function post() {
  for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ at: new Date().toISOString() }),
        keepalive: true,
      });
      if (response.ok) return true;
      // 4xx and "email is not configured" will not get better by retrying
      if (response.status < 500 || response.status === 503) return false;
    } catch {
      // offline or interrupted: try again
    }
    await wait(1500 * (attempt + 1));
  }
  return false;
}

export async function notifyForgiven() {
  remember(true);
  const ok = await post();
  if (ok) remember(false);
  return ok;
}

/** Called once when the page opens: delivers a notification that could not be sent earlier. */
export async function flushPendingNotification() {
  if (!hasPending()) return;
  if (await post()) remember(false);
}
