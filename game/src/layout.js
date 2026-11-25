// layout.js — where everything stands in the 1280x720 kitchen. Render draws
// at these coordinates and input hit-tests against them, so the two never drift.

export const HUD_H = 56;
export const ORDER_Y = 66;
export const ORDER_W = 312;
export const ORDER_H = 128;
export const HINT_Y = 202;

export function orderCardRect(i) {
  return { x: 24 + i * 330, y: ORDER_Y, w: ORDER_W, h: ORDER_H };
}

export const RUSH_PANEL = { x: 1014, y: ORDER_Y, w: 242, h: ORDER_H };

export function binRect(i) {
  const col = i % 4;
  const row = Math.floor(i / 4);
  return { x: 28 + col * 84, y: 262 + row * 96, w: 76, h: 88 };
}

export const BOARD_RECT = { x: 462, y: 372, w: 196, h: 116 };
export const PAN_RECT = { x: 786, y: 352, w: 196, h: 136 };
export const PLATE_RECT = { x: 668, y: 492, w: 168, h: 104 };
export const TRASH_RECT = { x: 1128, y: 486, w: 112, h: 118 };

export const BOARD_CENTER = { x: 560, y: 430 };
export const PAN_CENTER = { x: 884, y: 420 };
export const PLATE_CENTER = { x: 752, y: 544 };
export const TRASH_CENTER = { x: 1184, y: 545 };

export const START_BUTTON = { x: 480, y: 486, w: 320, h: 62 };
export const NEXT_BUTTON = { x: 668, y: 512, w: 280, h: 56 };
export const REPLAY_BUTTON = { x: 332, y: 512, w: 280, h: 56 };

export function inside(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}
