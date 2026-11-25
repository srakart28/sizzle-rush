// render.js — every pixel of Sizzle Rush. All art is drawn with canvas paths
// (no image files): the kitchen, the order board, the stations, the food, the
// chef and the overlays. Read-only over world.js state, plus a hover point.

import { INGREDIENTS, PANTRY_ORDER, SHIFTS, COOK_TIME, BURN_TIME } from './config.js';
import { isReady, itemName, nextStation, plateMatches } from './world.js';
import {
  HUD_H, HINT_Y, RUSH_PANEL, orderCardRect, binRect,
  BOARD_RECT, PAN_RECT, PLATE_RECT, TRASH_RECT,
  BOARD_CENTER, PAN_CENTER, PLATE_CENTER, TRASH_CENTER,
  START_BUTTON, NEXT_BUTTON, REPLAY_BUTTON,
} from './layout.js';

const FONT = `'Trebuchet MS', 'Segoe UI', Verdana, sans-serif`;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function text(ctx, str, x, y, size, color, align = 'center', bold = true) {
  ctx.font = `${bold ? '700' : '400'} ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// ---------- food ----------
// One drawing per ingredient, varying with its prep stage: whole, chopped
// (pieces), cooked (browned / fried / melted), and burnt (charred).

export function drawIngredient(ctx, item, x, y, s = 1) {
  if (!item) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // soft shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(0, 15, 20, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();
  if (item.burnt) {
    ctx.fillStyle = '#2e2a26';
    ctx.beginPath();
    ctx.ellipse(0, 2, 19, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#45403a';
    ctx.beginPath();
    ctx.ellipse(-5, -2, 8, 5, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }
  const [main, dark] = INGREDIENTS[item.ing].colors;
  const stage = item.stage;
  switch (item.ing) {
    case 'bun': {
      ctx.fillStyle = main;
      ctx.beginPath(); ctx.ellipse(0, -4, 19, 11, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = dark;
      rr(ctx, -19, -3, 38, 6, 3); ctx.fill();
      ctx.fillStyle = '#fff3d6';
      for (const [sx, sy] of [[-8, -9], [2, -12], [9, -7]]) { ctx.beginPath(); ctx.ellipse(sx, sy, 2.4, 1.3, 0.4, 0, Math.PI * 2); ctx.fill(); }
      break;
    }
    case 'patty': {
      ctx.fillStyle = stage > 0 ? '#6e3a20' : main;
      ctx.beginPath(); ctx.ellipse(0, 2, 20, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 2;
      for (const off of [-8, 0, 8]) { ctx.beginPath(); ctx.moveTo(off - 4, -3); ctx.lineTo(off + 4, 7); ctx.stroke(); }
      break;
    }
    case 'chicken': {
      ctx.fillStyle = stage > 0 ? '#c47b33' : main;
      ctx.beginPath(); ctx.ellipse(-3, -1, 15, 11.5, -0.45, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(-9, -7, 7.5, 6, -0.45, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#f7ead2';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(7, 5); ctx.lineTo(16, 12); ctx.stroke();
      ctx.fillStyle = '#f7ead2';
      ctx.beginPath(); ctx.arc(17.5, 13, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(14.5, 15.5, 3.2, 0, Math.PI * 2); ctx.fill();
      if (stage > 0) { ctx.fillStyle = 'rgba(255,220,150,0.5)'; ctx.beginPath(); ctx.ellipse(-5, -4, 7, 4, -0.5, 0, Math.PI * 2); ctx.fill(); }
      break;
    }
    case 'egg': {
      ctx.fillStyle = '#fffdf4';
      ctx.beginPath();
      ctx.ellipse(0, 2, 19, 12, 0, 0, Math.PI * 2);
      ctx.ellipse(-8, -3, 10, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f5b921';
      ctx.beginPath(); ctx.arc(2, 1, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.beginPath(); ctx.arc(0, -1, 2.4, 0, Math.PI * 2); ctx.fill();
      if (stage > 0) { ctx.strokeStyle = '#e0a83c'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(0, 2, 19, 12, 0, 0, Math.PI * 2); ctx.stroke(); }
      break;
    }
    case 'potato': {
      if (stage === 0) {
        ctx.fillStyle = main;
        ctx.beginPath(); ctx.ellipse(0, 2, 17, 12, 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = dark;
        for (const [sx, sy] of [[-7, -2], [4, 4], [8, -4]]) { ctx.beginPath(); ctx.arc(sx, sy, 1.6, 0, Math.PI * 2); ctx.fill(); }
      } else {
        // cut sticks; golden once fried
        ctx.fillStyle = stage >= 2 ? '#f7b733' : '#eed9a4';
        ctx.strokeStyle = stage >= 2 ? '#d98a16' : '#cbb27a';
        ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
          const a = -0.5 + i * 0.22;
          ctx.save();
          ctx.rotate(a);
          rr(ctx, -3, -16, 6, 26, 2); ctx.fill(); ctx.stroke();
          ctx.restore();
        }
      }
      break;
    }
    case 'lettuce': {
      if (stage === 0) {
        ctx.fillStyle = main;
        for (const [lx, ly, r] of [[-9, 3, 10], [9, 3, 10], [0, -5, 11]]) { ctx.beginPath(); ctx.arc(lx, ly, r, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = dark;
        ctx.beginPath(); ctx.arc(0, -2, 6, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = main;
        for (let i = 0; i < 7; i++) {
          const lx = -14 + i * 4.6;
          ctx.save(); ctx.translate(lx, 4 - (i % 3) * 3); ctx.rotate((i % 2 ? -1 : 1) * 0.5);
          rr(ctx, -2, -9, 4, 18, 2); ctx.fill(); ctx.restore();
        }
      }
      break;
    }
    case 'tomato': {
      if (stage === 0) {
        ctx.fillStyle = main;
        ctx.beginPath(); ctx.arc(0, 3, 15, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#4f9e2f';
        ctx.beginPath();
        ctx.moveTo(0, -12); ctx.lineTo(3, -6); ctx.lineTo(8, -9); ctx.lineTo(4, -3); ctx.lineTo(10, -2); ctx.lineTo(3, 0); ctx.lineTo(0, 5); ctx.lineTo(-3, 0); ctx.lineTo(-10, -2); ctx.lineTo(-4, -3); ctx.lineTo(-8, -9); ctx.lineTo(-3, -6);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath(); ctx.ellipse(-5, -2, 4, 2.4, -0.6, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = main;
        for (const [cx, cy] of [[-9, 2], [0, -4], [9, 2], [-4, 7], [5, 8]]) { rr(ctx, cx - 5, cy - 5, 10, 10, 3); ctx.fill(); }
        ctx.fillStyle = '#ff8a80';
        for (const [cx, cy] of [[0, -4], [-4, 7]]) { rr(ctx, cx - 2.4, cy - 2.4, 4.8, 4.8, 1.6); ctx.fill(); }
      }
      break;
    }
    case 'cheese': {
      ctx.fillStyle = main;
      ctx.beginPath();
      ctx.moveTo(-17, 8); ctx.lineTo(17, 8); ctx.lineTo(17, -2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = dark;
      for (const [hx, hy, r] of [[6, 3, 2.6], [12, 5, 1.8], [-2, 6, 1.6]]) { ctx.beginPath(); ctx.arc(hx, hy, r, 0, Math.PI * 2); ctx.fill(); }
      break;
    }
  }
  ctx.restore();
}

function prepBadge(ctx, item, x, y) {
  const st = nextStation(item);
  if (!st || item.burnt) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = st === 'board' ? '#6d4c41' : '#e65100';
  ctx.beginPath(); ctx.arc(0, 0, 8.5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(0, 0, 8.5, 0, Math.PI * 2); ctx.stroke();
  if (st === 'board') {
    // a little knife, drawn so it reads at any size
    ctx.fillStyle = '#eceff1';
    ctx.beginPath();
    ctx.moveTo(-4.5, 3.5); ctx.lineTo(3.5, -4.5); ctx.lineTo(5, -1); ctx.lineTo(-1.5, 5);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#ffcc80'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-3.4, 3.4); ctx.lineTo(-5.4, 5.4); ctx.stroke();
  } else {
    // a little flame
    ctx.fillStyle = '#ffd54f';
    ctx.beginPath();
    ctx.moveTo(0, -5.5);
    ctx.bezierCurveTo(3.6, -1.5, 4.4, 0.8, 4.4, 2.4);
    ctx.bezierCurveTo(4.4, 5, 2.4, 6.2, 0, 6.2);
    ctx.bezierCurveTo(-2.4, 6.2, -4.4, 5, -4.4, 2.4);
    ctx.bezierCurveTo(-4.4, 0.6, -2.8, -1.2, 0, -5.5);
    ctx.fill();
    ctx.fillStyle = '#ff8f00';
    ctx.beginPath(); ctx.ellipse(0, 3.2, 1.9, 2.4, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// ---------- room ----------

function drawRoom(ctx, t) {
  // wall
  const wall = ctx.createLinearGradient(0, HUD_H, 0, 470);
  wall.addColorStop(0, '#f7e3c3');
  wall.addColorStop(1, '#eecfa1');
  ctx.fillStyle = wall;
  ctx.fillRect(0, HUD_H, 1280, 414);
  // tile band
  ctx.fillStyle = '#b7dcd1';
  ctx.fillRect(0, 396, 1280, 74);
  ctx.strokeStyle = 'rgba(70,120,110,0.35)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= 1280; x += 46) { ctx.beginPath(); ctx.moveTo(x, 396); ctx.lineTo(x, 470); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(0, 433); ctx.lineTo(1280, 433); ctx.stroke();
  // floor
  const floor = ctx.createLinearGradient(0, 470, 0, 720);
  floor.addColorStop(0, '#a9713d');
  floor.addColorStop(1, '#8a5527');
  ctx.fillStyle = floor;
  ctx.fillRect(0, 470, 1280, 250);
  ctx.strokeStyle = 'rgba(60,35,10,0.25)';
  for (let x = -200; x < 1400; x += 92) { ctx.beginPath(); ctx.moveTo(x, 470); ctx.lineTo(x - 60, 720); ctx.stroke(); }
  // window with a little daylight, on the right-hand wall
  rr(ctx, 1030, 252, 200, 118, 10);
  const sky = ctx.createLinearGradient(0, 252, 0, 370);
  sky.addColorStop(0, '#aee3f5'); sky.addColorStop(1, '#e8f9ff');
  ctx.fillStyle = sky; ctx.fill();
  ctx.fillStyle = '#fff7ae';
  ctx.beginPath(); ctx.arc(1074, 284, 17, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8fce6e';
  ctx.beginPath(); ctx.ellipse(1130, 364, 112, 22, 0, Math.PI, 0); ctx.fill();
  ctx.strokeStyle = '#7a4a21'; ctx.lineWidth = 7; rr(ctx, 1030, 252, 200, 118, 10); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(1130, 252); ctx.lineTo(1130, 370); ctx.stroke();
  // shelf with jars, below the hint strip and above the chopping board
  ctx.fillStyle = '#8a5527';
  rr(ctx, 392, 312, 300, 12, 5); ctx.fill();
  const jarCols = ['#ef5350', '#ffd54f', '#7ec850', '#ff9f43', '#ab7be8'];
  jarCols.forEach((c, i) => {
    const jx = 420 + i * 56;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    rr(ctx, jx, 274, 34, 38, 5); ctx.fill();
    ctx.fillStyle = c;
    rr(ctx, jx + 4, 288, 26, 20, 4); ctx.fill();
    ctx.fillStyle = '#6d4c41';
    rr(ctx, jx + 2, 268, 30, 8, 3); ctx.fill();
  });
  // string lights
  ctx.strokeStyle = 'rgba(90,60,20,0.5)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 66); ctx.quadraticCurveTo(320, 104, 640, 70); ctx.quadraticCurveTo(960, 40, 1280, 78); ctx.stroke();
  for (let i = 0; i <= 16; i++) {
    const lx = i * 80;
    const ly = 74 + Math.sin(i * 1.7) * 9 + (t % 2 < 1 ? 0 : 0);
    ctx.fillStyle = i % 2 ? '#ffd54f' : '#ff9f43';
    ctx.beginPath(); ctx.arc(lx + 12, ly + 12, 4.4, 0, Math.PI * 2); ctx.fill();
  }
}

// ---------- stations ----------

function stationSign(ctx, x, y, label, color) {
  ctx.fillStyle = color;
  rr(ctx, x - 52, y - 13, 104, 26, 8); ctx.fill();
  text(ctx, label, x, y + 1, 14, '#fff');
}

function drawPantry(ctx, k, hover) {
  ctx.fillStyle = '#7a4a21';
  rr(ctx, 16, 246, 360, 218, 12); ctx.fill();
  ctx.fillStyle = '#96622e';
  rr(ctx, 22, 252, 348, 206, 9); ctx.fill();
  stationSign(ctx, 196, 246 + 6, 'PANTRY', '#5d4037');
  PANTRY_ORDER.forEach((ing, i) => {
    const r = binRect(i);
    const isHover = hover && hover.kind === 'bin' && hover.index === i;
    ctx.fillStyle = isHover ? '#ffecb3' : '#fdf3dd';
    rr(ctx, r.x, r.y + 14, r.w, r.h - 14, 8); ctx.fill();
    ctx.strokeStyle = '#7a4a21'; ctx.lineWidth = 2; rr(ctx, r.x, r.y + 14, r.w, r.h - 14, 8); ctx.stroke();
    drawIngredient(ctx, { ing, stage: 0, burnt: false }, r.x + r.w / 2, r.y + 48, 0.82);
    text(ctx, INGREDIENTS[ing].label, r.x + r.w / 2, r.y + r.h - 8, 12.5, '#5d4037');
    text(ctx, String(i + 1), r.x + 11, r.y + 25, 11, '#a9713d');
  });
}

function drawBoard(ctx, k, hover) {
  const r = BOARD_RECT;
  const hot = hover && hover.kind === 'board';
  ctx.fillStyle = '#7a4a21';
  rr(ctx, r.x - 8, r.y + 66, r.w + 16, 58, 10); ctx.fill(); // counter block
  ctx.fillStyle = hot ? '#e8b06a' : '#d99a4e';
  rr(ctx, r.x, r.y + 22, r.w, 52, 8); ctx.fill(); // board slab
  ctx.strokeStyle = '#8a5527'; ctx.lineWidth = 2; rr(ctx, r.x, r.y + 22, r.w, 52, 8); ctx.stroke();
  stationSign(ctx, BOARD_CENTER.x, r.y - 2, 'CHOPPING', '#6d4c41');
  if (k.board) {
    drawIngredient(ctx, k.board.item, BOARD_CENTER.x - 18, r.y + 48, 0.95);
    // knife, bouncing while chopping
    const lift = k.board.progress < 1 ? Math.abs(Math.sin(performance.now() / 90)) * 12 : 0;
    ctx.save();
    ctx.translate(BOARD_CENTER.x + 34, r.y + 30 - lift);
    ctx.rotate(0.5);
    ctx.fillStyle = '#cfd8dc';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(34, 6); ctx.lineTo(0, 14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5d4037';
    rr(ctx, -12, 2, 13, 9, 4); ctx.fill();
    ctx.restore();
    // progress bar
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    rr(ctx, r.x + 14, r.y + 84, r.w - 28, 10, 5); ctx.fill();
    ctx.fillStyle = k.board.progress >= 1 ? '#7ec850' : '#ffd54f';
    rr(ctx, r.x + 14, r.y + 84, (r.w - 28) * k.board.progress, 10, 5); ctx.fill();
    if (k.board.progress >= 1) text(ctx, 'READY', BOARD_CENTER.x, r.y + 108, 13, '#4f9e2f');
  } else {
    text(ctx, 'click with an item to chop', BOARD_CENTER.x, r.y + 48, 12, 'rgba(93,64,55,0.65)');
  }
}

function drawStove(ctx, k, t, hover) {
  const r = PAN_RECT;
  const hot = hover && hover.kind === 'pan';
  ctx.fillStyle = '#37474f';
  rr(ctx, r.x - 6, r.y + 40, r.w + 12, 96, 12); ctx.fill();
  ctx.fillStyle = '#546e7a';
  rr(ctx, r.x - 6, r.y + 40, r.w + 12, 18, 9); ctx.fill();
  stationSign(ctx, PAN_CENTER.x, r.y + 12, 'STOVE', '#37474f');
  // burner glow
  const cooking = !!k.pan;
  const flicker = cooking ? 0.75 + Math.sin(t * 31) * 0.25 : 0.25;
  const grad = ctx.createRadialGradient(PAN_CENTER.x, 452, 6, PAN_CENTER.x, 452, 62);
  grad.addColorStop(0, `rgba(255,${cooking ? 120 : 170},40,${0.85 * flicker})`);
  grad.addColorStop(1, 'rgba(255,80,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.ellipse(PAN_CENTER.x, 452, 62, 16, 0, 0, Math.PI * 2); ctx.fill();
  // the pan
  ctx.fillStyle = hot ? '#455a64' : '#263238';
  ctx.beginPath(); ctx.ellipse(PAN_CENTER.x, 438, 56, 17, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#37474f';
  ctx.beginPath(); ctx.ellipse(PAN_CENTER.x, 434, 50, 14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#263238';
  rr(ctx, PAN_CENTER.x + 48, 428, 42, 9, 4); ctx.fill();
  if (k.pan) {
    const jitter = k.pan.item.burnt ? 0 : Math.sin(t * 40) * 1.1;
    drawIngredient(ctx, k.pan.item, PAN_CENTER.x + jitter, 428, 1.0);
    // cook timer arc: gold while cooking, green when ready, red in the burn window
    const e = k.pan.elapsed;
    const total = COOK_TIME + BURN_TIME;
    const frac = Math.min(1, e / total);
    const color = k.pan.item.burnt ? '#ef5350' : e >= COOK_TIME ? '#7ec850' : '#ffd54f';
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 6.5;
    ctx.beginPath(); ctx.arc(PAN_CENTER.x, 436, 56, -Math.PI / 2, Math.PI * 1.5); ctx.stroke();
    ctx.strokeStyle = color;
    ctx.beginPath(); ctx.arc(PAN_CENTER.x, 436, 56, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
    const label = k.pan.item.burnt ? 'BURNT!' : e >= COOK_TIME ? 'READY!' : 'COOKING';
    text(ctx, label, PAN_CENTER.x, r.y + 158, 14.5, color);
  } else {
    text(ctx, 'click with an item to cook', PAN_CENTER.x, r.y + 96, 12, 'rgba(255,255,255,0.55)');
  }
}

function drawPlate(ctx, k, hover) {
  const r = PLATE_RECT;
  const hot = hover && hover.kind === 'plate';
  ctx.fillStyle = '#7a4a21';
  rr(ctx, r.x - 10, r.y + 30, r.w + 20, 76, 12); ctx.fill();
  stationSign(ctx, PLATE_CENTER.x, r.y + 6, 'PLATE', '#8a5527');
  ctx.fillStyle = hot ? '#ffffff' : '#f5f0e6';
  ctx.beginPath(); ctx.ellipse(PLATE_CENTER.x, PLATE_RECT.y + 66, 74, 24, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e3dcc8';
  ctx.beginPath(); ctx.ellipse(PLATE_CENTER.x, PLATE_RECT.y + 64, 56, 17, 0, 0, Math.PI * 2); ctx.fill();
  // plated items fan out across the plate
  k.plate.forEach((item, i) => {
    const n = k.plate.length;
    const off = (i - (n - 1) / 2) * 34;
    drawIngredient(ctx, item, PLATE_CENTER.x + off, PLATE_RECT.y + 58, 0.78);
  });
  if (!k.plate.length) text(ctx, 'plate ready items here', PLATE_CENTER.x, PLATE_RECT.y + 96, 11.5, 'rgba(255,255,255,0.75)');
}

function drawTrash(ctx, k, hover) {
  const r = TRASH_RECT;
  const hot = hover && hover.kind === 'trash';
  ctx.fillStyle = hot ? '#78909c' : '#607d8b';
  ctx.beginPath();
  ctx.moveTo(r.x + 14, r.y + 26); ctx.lineTo(r.x + r.w - 14, r.y + 26);
  ctx.lineTo(r.x + r.w - 24, r.y + r.h); ctx.lineTo(r.x + 24, r.y + r.h);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#455a64';
  rr(ctx, r.x + 6, r.y + 14, r.w - 12, 13, 5); ctx.fill();
  stationSign(ctx, TRASH_CENTER.x, r.y - 4, 'BIN', '#455a64');
}

// ---------- chef ----------

const SKIN = ['#ffcf9e', '#c68642', '#8d5524', '#ffe0bd'];
const HAIR = ['#3e2723', '#6d4c41', '#bcaaa4', '#ef6c00', '#263238'];

function drawFace(ctx, x, y, r, seed, patienceFrac) {
  const rnd = (n) => {
    const v = Math.sin(seed * 127.1 + n * 311.7) * 43758.5453;
    return v - Math.floor(v);
  };
  ctx.fillStyle = SKIN[Math.floor(rnd(1) * SKIN.length) % SKIN.length];
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = HAIR[Math.floor(rnd(2) * HAIR.length) % HAIR.length];
  ctx.beginPath(); ctx.arc(x, y - r * 0.28, r * 0.98, Math.PI * 1.02, Math.PI * 1.98); ctx.fill();
  ctx.fillStyle = '#263238';
  ctx.beginPath(); ctx.arc(x - r * 0.34, y + r * 0.05, r * 0.09, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + r * 0.34, y + r * 0.05, r * 0.09, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#263238'; ctx.lineWidth = Math.max(1.6, r * 0.07);
  ctx.beginPath();
  if (patienceFrac > 0.5) ctx.arc(x, y + r * 0.28, r * 0.42, 0.15 * Math.PI, 0.85 * Math.PI);
  else if (patienceFrac > 0.25) { ctx.moveTo(x - r * 0.3, y + r * 0.5); ctx.lineTo(x + r * 0.3, y + r * 0.5); }
  else ctx.arc(x, y + r * 0.78, r * 0.4, 1.15 * Math.PI, 1.85 * Math.PI);
  ctx.stroke();
  if (patienceFrac <= 0.25) {
    ctx.fillStyle = '#81d4fa';
    ctx.beginPath(); ctx.ellipse(x + r * 0.78, y + r * 0.3, 2.6, 4.2, 0.3, 0, Math.PI * 2); ctx.fill();
  }
}

function drawChef(ctx, k, t) {
  const chef = k.chef;
  const bob = Math.abs(Math.sin(chef.walkPhase)) * 3;
  const x = chef.x;
  const feetY = 668 - bob;
  ctx.save();
  ctx.translate(x, feetY);
  ctx.scale(chef.facing, 1);
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath(); ctx.ellipse(0, 4 + bob, 34, 7, 0, 0, Math.PI * 2); ctx.fill();
  // legs & shoes
  ctx.fillStyle = '#37474f';
  const legSwing = Math.sin(chef.walkPhase) * 7;
  rr(ctx, -15 + legSwing, -34, 11, 32, 5); ctx.fill();
  rr(ctx, 5 - legSwing, -34, 11, 32, 5); ctx.fill();
  ctx.fillStyle = '#263238';
  rr(ctx, -17 + legSwing, -6, 16, 7, 3); ctx.fill();
  rr(ctx, 3 - legSwing, -6, 16, 7, 3); ctx.fill();
  // body: white coat + apron
  ctx.fillStyle = '#fdfdf8';
  rr(ctx, -27, -104, 54, 74, 14); ctx.fill();
  ctx.fillStyle = '#e65100';
  rr(ctx, -19, -78, 38, 48, 8); ctx.fill();
  ctx.fillStyle = '#bf360c';
  rr(ctx, -19, -78, 38, 9, 4); ctx.fill();
  // neckerchief
  ctx.fillStyle = '#ef5350';
  ctx.beginPath(); ctx.moveTo(-10, -104); ctx.lineTo(10, -104); ctx.lineTo(0, -88); ctx.closePath(); ctx.fill();
  // arms
  ctx.strokeStyle = '#fdfdf8';
  ctx.lineWidth = 11;
  ctx.lineCap = 'round';
  const chop = chef.chopArm > 0;
  ctx.beginPath(); ctx.moveTo(-24, -92); ctx.lineTo(-38, -58 + (chop ? -16 : 0)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(24, -92); ctx.lineTo(38, -58); ctx.stroke();
  // head
  ctx.fillStyle = '#ffcf9e';
  ctx.beginPath(); ctx.arc(0, -126, 21, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#263238';
  ctx.beginPath(); ctx.arc(-7, -124, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(7, -124, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#263238'; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.arc(0, -118, 8, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
  // moustache
  ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 3.4;
  ctx.beginPath(); ctx.arc(-4.5, -114, 4.6, 0.1 * Math.PI, 0.95 * Math.PI); ctx.stroke();
  ctx.beginPath(); ctx.arc(4.5, -114, 4.6, 0.05 * Math.PI, 0.9 * Math.PI); ctx.stroke();
  // toque
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-11, -146, 10, 0, Math.PI * 2);
  ctx.arc(0, -152, 12, 0, Math.PI * 2);
  ctx.arc(11, -146, 10, 0, Math.PI * 2);
  ctx.fill();
  rr(ctx, -16, -146, 32, 9, 4); ctx.fill();
  ctx.restore();
  // whatever the chef is holding rides above the hands
  if (k.hands) {
    drawIngredient(ctx, k.hands, x + chef.facing * 40, feetY - 66 - bob, 0.9);
    prepBadge(ctx, k.hands, x + chef.facing * 40 + 16, feetY - 84 - bob);
  }
}

// ---------- order board & HUD ----------

function drawOrderCard(ctx, k, order, i, hover) {
  const r = orderCardRect(i);
  const shakeX = order.shake > 0 ? Math.sin(order.shake * 60) * 4 * order.shake : 0;
  const ready = plateMatches(k.plate, order.recipe);
  ctx.save();
  ctx.translate(shakeX, 0);
  ctx.shadowColor = ready ? 'rgba(124,200,80,0.9)' : 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = ready ? 22 : 8;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = '#fffdf4';
  rr(ctx, r.x, r.y, r.w, r.h, 12); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.strokeStyle = ready ? '#7ec850' : '#d7ccc8';
  ctx.lineWidth = ready ? 3.4 : 1.6;
  rr(ctx, r.x, r.y, r.w, r.h, 12); ctx.stroke();
  const frac = Math.max(0, order.patience / order.patienceMax);
  drawFace(ctx, r.x + 40, r.y + 44, 26, order.faceSeed, frac);
  text(ctx, order.recipe.name, r.x + 76, r.y + 26, 19, '#4e342e', 'left');
  text(ctx, `$${order.recipe.price}`, r.x + r.w - 14, r.y + 26, 19, '#4f9e2f', 'right');
  // needs row: ingredient icons with a green tick once that item sits ready on the plate
  const plateIngs = k.plate.filter((it) => isReady(it)).map((it) => it.ing);
  order.recipe.needs.forEach((ing, j) => {
    const ix = r.x + 84 + j * 52;
    const iy = r.y + 74;
    ctx.fillStyle = '#f7ead2';
    ctx.beginPath(); ctx.arc(ix, iy, 21, 0, Math.PI * 2); ctx.fill();
    // Leafy and round veg read better whole at this size; the badge beside
    // the icon still says what prep the finished item needs.
    const iconStage = ing === 'lettuce' || ing === 'tomato' ? 0 : INGREDIENTS[ing].prep.length;
    const full = { ing, stage: iconStage, burnt: false };
    drawIngredient(ctx, full, ix, iy, 0.62);
    prepBadge(ctx, { ing, stage: 0, burnt: false }, ix + 15, iy - 14);
    const gotIdx = plateIngs.indexOf(ing);
    if (gotIdx >= 0) {
      plateIngs.splice(gotIdx, 1);
      ctx.fillStyle = '#7ec850';
      ctx.beginPath(); ctx.arc(ix + 14, iy + 13, 9, 0, Math.PI * 2); ctx.fill();
      text(ctx, '✓', ix + 14, iy + 14, 12, '#fff');
    }
  });
  // patience bar
  ctx.fillStyle = '#e0d7c8';
  rr(ctx, r.x + 76, r.y + r.h - 18, r.w - 92, 9, 4.5); ctx.fill();
  ctx.fillStyle = frac > 0.5 ? '#7ec850' : frac > 0.25 ? '#ffb300' : '#ef5350';
  rr(ctx, r.x + 76, r.y + r.h - 18, (r.w - 92) * frac, 9, 4.5); ctx.fill();
  if (ready) {
    // a pill straddling the card's bottom edge: impossible to miss
    ctx.fillStyle = '#4f9e2f';
    rr(ctx, r.x + r.w / 2 - 74, r.y + r.h - 13, 148, 26, 13); ctx.fill();
    text(ctx, 'READY — SERVE!', r.x + r.w / 2, r.y + r.h + 1, 14, '#ffffff');
  }
  ctx.restore();
}

function drawBoardAndHud(ctx, k, t) {
  // order board backing
  ctx.fillStyle = '#5d4037';
  rr(ctx, 12, 60, 1256, 142, 14); ctx.fill();
  ctx.fillStyle = '#6d4c41';
  rr(ctx, 16, 64, 1248, 134, 11); ctx.fill();
  if (!k.orders.length && k.phase === 'playing') {
    text(ctx, '— order board —', 500, 130, 20, 'rgba(255,255,255,0.5)');
  }
  k.orders.forEach((order, i) => drawOrderCard(ctx, k, order, i));
  // rush panel
  const p = RUSH_PANEL;
  ctx.fillStyle = '#fffdf4';
  rr(ctx, p.x, p.y, p.w, p.h, 12); ctx.fill();
  text(ctx, 'RUSH METER', p.x + p.w / 2, p.y + 22, 13, '#a9713d');
  text(ctx, k.combo >= 2 ? `COMBO ×${k.combo}` : 'no combo yet', p.x + p.w / 2, p.y + 52, 23, k.combo >= 2 ? '#e65100' : '#9e8b78');
  text(ctx, `served ${k.served} · lost ${k.lost}`, p.x + p.w / 2, p.y + 84, 14.5, '#6d4c41');
  text(ctx, `best combo ×${Math.max(k.bestCombo, k.combo)}`, p.x + p.w / 2, p.y + 106, 13, '#9e8b78');
  // HUD bar
  ctx.fillStyle = '#33231a';
  ctx.fillRect(0, 0, 1280, HUD_H);
  text(ctx, 'SIZZLE RUSH', 18, 29, 24, '#ffd54f', 'left');
  const remain = Math.max(0, k.timeLeft);
  const mm = Math.floor(remain / 60);
  const ss = String(Math.floor(remain % 60)).padStart(2, '0');
  const urgent = remain <= 20 && k.phase === 'playing';
  text(ctx, `SHIFT ${k.shift} · ${mm}:${ss}`, 640, 24, 23, urgent ? '#ef9a9a' : '#ffffff');
  const len = SHIFTS[k.shift].length;
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  rr(ctx, 520, 42, 240, 7, 3.5); ctx.fill();
  ctx.fillStyle = urgent ? '#ef5350' : '#7ec850';
  rr(ctx, 520, 42, 240 * (remain / len), 7, 3.5); ctx.fill();
  text(ctx, `$${k.score}`, 1010, 29, 24, '#aeea7a', 'right');
  // hearts
  for (let i = 0; i < 3; i++) {
    const hx = 1062 + i * 38;
    ctx.fillStyle = i < k.hearts ? '#ef5350' : 'rgba(255,255,255,0.22)';
    ctx.beginPath();
    ctx.moveTo(hx, 40);
    ctx.bezierCurveTo(hx - 15, 24, hx - 7, 10, hx, 20);
    ctx.bezierCurveTo(hx + 7, 10, hx + 15, 24, hx, 40);
    ctx.fill();
  }
  // hint strip
  ctx.fillStyle = 'rgba(51,35,26,0.88)';
  rr(ctx, 330, HINT_Y, 620, 30, 15); ctx.fill();
  text(ctx, k.hint(), 640, HINT_Y + 16, 15.5, '#ffe9c4');
}

// ---------- overlays ----------

function drawButton(ctx, r, label, hot, color = '#e65100') {
  ctx.fillStyle = hot ? '#f57c00' : color;
  rr(ctx, r.x, r.y, r.w, r.h, 14); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2; rr(ctx, r.x, r.y, r.w, r.h, 14); ctx.stroke();
  text(ctx, label, r.x + r.w / 2, r.y + r.h / 2 + 1, 22, '#fff');
}

function drawTitle(ctx, k, hover) {
  ctx.fillStyle = 'rgba(38,22,12,0.72)';
  ctx.fillRect(0, 0, 1280, 720);
  text(ctx, 'SIZZLE RUSH', 640, 148, 74, '#ffd54f');
  text(ctx, 'e m b e r   k i t c h e n', 640, 196, 21, '#ffcc80');
  text(ctx, 'The dinner rush is coming. Read the orders, run the kitchen, plate it hot.', 640, 248, 19, '#fff3e0', 'center', false);
  ctx.fillStyle = 'rgba(255,253,244,0.95)';
  rr(ctx, 340, 282, 600, 168, 14); ctx.fill();
  const lines = [
    '1 · Click a pantry bin (or press 1–8) to grab an ingredient',
    '2 · Chop on the board, cook in the pan — but never let it burn',
    '3 · Plate each finished item, then click the order card to serve',
    '4 · Happy customers tip more. Three walk-outs end the shift!',
  ];
  lines.forEach((line, i) => text(ctx, line, 364, 318 + i * 34, 16.5, '#4e342e', 'left', false));
  drawButton(ctx, START_BUTTON, 'START SHIFT 1', hover && hover.kind === 'start');
  text(ctx, 'mouse or keyboard · sound on for the full sizzle', 640, 580, 14, '#d7ccc8', 'center', false);
}

function drawResults(ctx, k, hover) {
  ctx.fillStyle = 'rgba(38,22,12,0.78)';
  ctx.fillRect(0, 0, 1280, 720);
  text(ctx, `SHIFT ${k.shift} COMPLETE!`, 640, 132, 46, '#ffd54f');
  // stars
  for (let i = 0; i < 3; i++) {
    const sx = 640 + (i - 1) * 74;
    ctx.fillStyle = i < k.stars ? '#ffd54f' : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    for (let p = 0; p < 10; p++) {
      const ang = -Math.PI / 2 + (p * Math.PI) / 5;
      const rad = p % 2 === 0 ? 30 : 13;
      const px = sx + Math.cos(ang) * rad;
      const py = 196 + Math.sin(ang) * rad;
      if (p === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
  }
  const rows = [
    ['Dishes served', String(k.served)],
    ['Customers lost', String(k.lost)],
    ['Best combo', `×${k.bestCombo}`],
    ['Total earned', `$${k.earned}`],
  ];
  ctx.fillStyle = 'rgba(255,253,244,0.95)';
  rr(ctx, 440, 248, 400, 196, 14); ctx.fill();
  rows.forEach(([a, b], i) => {
    text(ctx, a, 468, 284 + i * 46, 18, '#6d4c41', 'left', false);
    text(ctx, b, 812, 284 + i * 46, 20, '#4e342e', 'right');
  });
  const hasNext = k.shift < 3;
  if (hasNext) drawButton(ctx, NEXT_BUTTON, `START SHIFT ${k.shift + 1} →`, hover && hover.kind === 'next');
  drawButton(ctx, REPLAY_BUTTON, 'REPLAY SHIFT', hover && hover.kind === 'replay', '#6d4c41');
  if (!hasNext) text(ctx, 'You beat the week — replay any shift from here!', 640, 620, 16, '#ffcc80', 'center', false);
}

// ---------- frame ----------

export function drawFrame(ctx, k, t, hover) {
  drawRoom(ctx, t);
  drawPantry(ctx, k, hover);
  drawBoard(ctx, k, hover);
  drawStove(ctx, k, t, hover);
  drawPlate(ctx, k, hover);
  drawTrash(ctx, k, hover);
  drawChef(ctx, k, t);
  drawBoardAndHud(ctx, k, t);
  // particles
  for (const p of k.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife) * (p.steam ? 0.55 : 1);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // floaters
  for (const f of k.floaters) {
    ctx.globalAlpha = Math.min(1, f.life);
    text(ctx, f.text, f.x, f.y, 17, f.color);
  }
  ctx.globalAlpha = 1;
  if (k.phase === 'title') drawTitle(ctx, k, hover);
  if (k.phase === 'results') drawResults(ctx, k, hover);
}
