// input.js — mouse and keyboard for Sizzle Rush. Translates pointer points
// and keys into world.js actions, and tracks what the pointer hovers so the
// renderer can highlight the station under it.

import { PANTRY_ORDER } from './config.js';
import { plateMatches } from './world.js';
import {
  orderCardRect, binRect, inside,
  BOARD_RECT, PAN_RECT, PLATE_RECT, TRASH_RECT,
  BOARD_CENTER, PAN_CENTER, PLATE_CENTER, TRASH_CENTER,
  START_BUTTON, NEXT_BUTTON, REPLAY_BUTTON,
} from './layout.js';

export function hitTest(k, x, y) {
  if (k.phase === 'title') {
    return inside(x, y, START_BUTTON) ? { kind: 'start' } : null;
  }
  if (k.phase === 'results') {
    if (k.shift < 3 && inside(x, y, NEXT_BUTTON)) return { kind: 'next' };
    if (inside(x, y, REPLAY_BUTTON)) return { kind: 'replay' };
    return null;
  }
  for (let i = 0; i < k.orders.length; i++) {
    if (inside(x, y, orderCardRect(i))) return { kind: 'order', index: i };
  }
  for (let i = 0; i < PANTRY_ORDER.length; i++) {
    const r = binRect(i);
    if (inside(x, y, { x: r.x, y: r.y + 14, w: r.w, h: r.h - 14 })) return { kind: 'bin', index: i };
  }
  if (inside(x, y, BOARD_RECT)) return { kind: 'board' };
  if (inside(x, y, PAN_RECT)) return { kind: 'pan' };
  if (inside(x, y, PLATE_RECT)) return { kind: 'plate' };
  if (inside(x, y, TRASH_RECT)) return { kind: 'trash' };
  return null;
}

export function dispatch(k, hit) {
  if (!hit) return;
  switch (hit.kind) {
    case 'start': k.startShift(1); break;
    case 'next': k.startShift(k.shift + 1); break;
    case 'replay': k.startShift(k.shift); break;
    case 'bin': {
      const r = binRect(hit.index);
      k.takeFromPantry(PANTRY_ORDER[hit.index], r.x + r.w / 2);
      break;
    }
    case 'board': k.clickBoard(BOARD_CENTER.x); break;
    case 'pan': k.clickPan(PAN_CENTER.x); break;
    case 'plate': k.clickPlate(PLATE_CENTER.x); break;
    case 'trash': k.clickTrash(TRASH_CENTER.x); break;
    case 'order': {
      const r = orderCardRect(hit.index);
      k.clickOrder(hit.index, r.x + r.w / 2, r.y + r.h);
      break;
    }
  }
}

function serveFirstReady(k) {
  const i = k.orders.findIndex((o) => plateMatches(k.plate, o.recipe));
  if (i >= 0) dispatch(k, { kind: 'order', index: i });
}

const KEY_ACTIONS = {
  KeyQ: { kind: 'board' },
  KeyW: { kind: 'pan' },
  KeyE: { kind: 'plate' },
  KeyT: { kind: 'trash' },
};

export function attachInput(canvas, k, sound) {
  const hover = { current: null };
  const toGame = (ev) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((ev.clientX - rect.left) / rect.width) * 1280,
      y: ((ev.clientY - rect.top) / rect.height) * 720,
    };
  };
  canvas.addEventListener('pointermove', (ev) => {
    const p = toGame(ev);
    hover.current = hitTest(k, p.x, p.y);
    canvas.style.cursor = hover.current ? 'pointer' : 'default';
  });
  canvas.addEventListener('pointerdown', (ev) => {
    sound.unlock();
    const p = toGame(ev);
    dispatch(k, hitTest(k, p.x, p.y));
  });
  window.addEventListener('keydown', (ev) => {
    sound.unlock();
    if (ev.code.startsWith('Digit')) {
      const n = Number(ev.code.slice(5));
      if (n >= 1 && n <= PANTRY_ORDER.length && k.phase === 'playing') {
        dispatch(k, { kind: 'bin', index: n - 1 });
      }
      return;
    }
    if (ev.code === 'Space' || ev.code === 'Enter') {
      ev.preventDefault();
      if (k.phase === 'title') dispatch(k, { kind: 'start' });
      else if (k.phase === 'results') dispatch(k, { kind: k.shift < 3 ? 'next' : 'replay' });
      else serveFirstReady(k);
      return;
    }
    const action = KEY_ACTIONS[ev.code];
    if (action && k.phase === 'playing') dispatch(k, action);
  });
  return hover;
}
