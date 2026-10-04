// Geometry for the button that runs away. Everything here is plain functions, easy to reason about.

const EDGE_MARGIN = 18;

const clamp = (value, min, max) => Math.min(Math.max(value, min), Math.max(min, max));

const intersects = (a, b) =>
  a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

const inflate = (rect, by) => ({
  left: rect.left - by,
  top: rect.top - by,
  right: rect.right + by,
  bottom: rect.bottom + by,
});

// Space taken by notches / home indicator, so the button is never tucked under them.
let probe = null;
function readSafeInsets() {
  if (!probe) {
    probe = document.createElement('div');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText =
      'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;' +
      'padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
    document.body.appendChild(probe);
  }
  const style = getComputedStyle(probe);
  return {
    top: parseFloat(style.paddingTop) || 0,
    right: parseFloat(style.paddingRight) || 0,
    bottom: parseFloat(style.paddingBottom) || 0,
    left: parseFloat(style.paddingLeft) || 0,
  };
}

/** The area, in viewport coordinates, in which a box of the given size may be placed. */
export function getBounds(width, height) {
  const insets = readSafeInsets();
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = window.innerHeight;
  return {
    viewportWidth,
    viewportHeight,
    minX: EDGE_MARGIN + insets.left,
    maxX: viewportWidth - width - EDGE_MARGIN - insets.right,
    minY: EDGE_MARGIN + insets.top,
    maxY: viewportHeight - height - EDGE_MARGIN - insets.bottom,
  };
}

/** Pulls a position back inside the screen (used after a resize or rotation). */
export function clampToScreen({ x, y, scale }, size) {
  const bounds = getBounds(size.width * scale, size.height * scale);
  return {
    x: clamp(x, bounds.minX, bounds.maxX),
    y: clamp(y, bounds.minY, bounds.maxY),
    scale,
  };
}

/**
 * Chooses where the button jumps to next.
 *  - always fully inside the screen,
 *  - far from the finger / cursor and from where it was,
 *  - never on top of the "Yes" button,
 *  - with a random size between 85% and 115% of the normal one.
 */
export function pickSpot({ size, from, current, avoid }) {
  const scale = 0.85 + Math.random() * 0.3;
  const width = size.width * scale;
  const height = size.height * scale;
  const bounds = getBounds(width, height);
  const blocked = avoid.map((rect) => inflate(rect, 18));
  const wanted = Math.min(260, Math.min(bounds.viewportWidth, bounds.viewportHeight) * 0.5);

  const candidates = [];
  for (let i = 0; i < 48; i += 1) {
    const x = bounds.minX + Math.random() * Math.max(0, bounds.maxX - bounds.minX);
    const y = bounds.minY + Math.random() * Math.max(0, bounds.maxY - bounds.minY);
    const box = { left: x, top: y, right: x + width, bottom: y + height };
    if (blocked.some((rect) => intersects(box, rect))) continue;

    const cx = x + width / 2;
    const cy = y + height / 2;
    const away = Math.min(
      from ? Math.hypot(cx - from.x, cy - from.y) : Infinity,
      current ? Math.hypot(cx - current.x, cy - current.y) : Infinity,
    );
    candidates.push({ x, y, scale, away });
  }

  if (candidates.length === 0) {
    // Tiny or very crowded screen: stay safe in a corner.
    return { x: bounds.minX, y: bounds.minY, scale: 0.9 };
  }

  candidates.sort((a, b) => b.away - a.away);
  const far = candidates.filter((c) => c.away >= wanted);
  const pool = (far.length ? far : candidates).slice(0, 6);
  const { x, y } = pool[Math.floor(Math.random() * pool.length)];
  return { x: clamp(x, bounds.minX, bounds.maxX), y: clamp(y, bounds.minY, bounds.maxY), scale };
}
